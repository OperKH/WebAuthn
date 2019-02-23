/* eslint-disable class-methods-use-this */
import F2L from '@davedoesdev/fido2-lib';
import WebauthnSimpleApp from 'webauthn-simple-app';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import config from '../../config';
import { status } from '../../helpers/constants';
import userService from '../../services/user';
import authenticatorsService from '../../services/authenticators';
import { coerceToArrayBuffer, coerceToBase64 } from './utils';

const domain = config.webauthn.origin.replace(/https?:\/\//, '').replace(/:.*$/, '');

const { Fido2Lib } = F2L;
const { CreateOptions, CredentialAttestation, GetOptions, CredentialAssertion } = WebauthnSimpleApp;
const f2l = new Fido2Lib({
  rpId: domain,
  rpName: 'OperKH',
  challengeSize: 128,
  attestation: 'direct',
  cryptoParams: [-7, -257],
  authenticatorRequireResidentKey: false,
  authenticatorUserVerification: 'required',
});

class WebauthnCtrl {
  async register(ctx) {
    const { email } = ctx.request.body;

    if (!email) {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'No email',
      };
      return;
    }

    const user = await userService.findByEmail(email);

    if (user) {
      ctx.status = 409;
      ctx.body = {
        status: status.error,
        message: 'User already exist',
      };
      return;
    }

    const registrationOptions = await f2l.attestationOptions();
    registrationOptions.user.id = crypto.randomBytes(32);
    registrationOptions.user.name = email;
    registrationOptions.user.displayName = email.replace(/@.*$/, '');

    const registrationOptionsResponse = CreateOptions.from(registrationOptions);
    registrationOptionsResponse.status = 'ok';
    registrationOptionsResponse.encodeBinaryProperties();
    registrationOptionsResponse.validate();
    registrationOptionsResponse.status = status.success;

    ctx.session.email = email;
    ctx.session.userId = registrationOptionsResponse.user.id;
    ctx.session.challenge = registrationOptionsResponse.challenge;
    ctx.session.challengeTime = Date.now();

    ctx.status = 200;
    ctx.body = registrationOptionsResponse;
  }

  async response(ctx) {
    const webauthnResponse = ctx.request.body;

    if (
      !ctx.session ||
      typeof ctx.session.email !== 'string' ||
      typeof ctx.session.userId !== 'string' ||
      typeof ctx.session.challengeTime !== 'number' ||
      typeof ctx.session.challenge !== 'string'
    ) {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'Could not find session information. Are cookies disabled?',
      };
      return;
    }

    // check timeout
    if (Date.now() >= ctx.session.challengeTime + f2l.config.timeout) {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'Request timed out',
      };
      return;
    }

    const { email } = ctx.session;

    if (webauthnResponse.response.attestationObject) {
      const clientAttestationResponse = CredentialAttestation.from(webauthnResponse);
      clientAttestationResponse.validate();
      clientAttestationResponse.decodeBinaryProperties();

      // set expectations
      const attestationExpectations = {
        challenge: coerceToArrayBuffer(ctx.session.challenge, 'session.challenge'),
        origin: config.webauthn.origin,
        factor: 'either',
      };

      const result = await f2l.attestationResult(clientAttestationResponse.toObject(), attestationExpectations);

      const newUser = {
        login: email,
        email,
        password: '',
        authenticators: [
          {
            publicKey: result.authnrData.get('credentialPublicKeyPem'),
            aaguid: coerceToBase64(result.authnrData.get('aaguid')),
            credId: coerceToBase64(result.authnrData.get('credId')),
            prevCounter: result.authnrData.get('counter'),
          },
        ],
      };
      await userService.createWithAuthenticator(newUser);
      ctx.session = null;
      if (result) {
        ctx.status = 200;
        ctx.body = {
          status: status.success,
        };
        return;
      }
    } else if (webauthnResponse.response.authenticatorData) {
      const clientAssertionResponse = CredentialAssertion.from(webauthnResponse);
      clientAssertionResponse.validate();
      clientAssertionResponse.decodeBinaryProperties();

      const user = await userService.findByEmailWithAuthenticators(email);

      if (user && user.authenticators && user.authenticators.length) {
        const authenticator = user.authenticators.find(a => a.credId === webauthnResponse.rawId);
        if (!authenticator) {
          ctx.status = 400;
          ctx.body = {
            status: status.error,
            message: 'Login Fail',
          };
          return;
        }

        const assertionExpectations = {
          challenge: coerceToArrayBuffer(ctx.session.challenge, 'session.challenge'),
          origin: config.webauthn.origin,
          factor: 'either',
          publicKey: authenticator.publicKey,
          prevCounter: authenticator.prevCounter,
          userHandle: coerceToArrayBuffer(ctx.session.userId, 'session.userId'),
        };

        const result = await f2l.assertionResult(clientAssertionResponse.toObject(), assertionExpectations);

        if (result) {
          await authenticatorsService.updateCounter(authenticator.id, result.authnrData.get('counter'));

          const token = jwt.sign({ id: user.id, role: user.role }, config.app.secret, {
            expiresIn: 60 * 60 * 24 * 7,
          });

          ctx.session = null;
          ctx.status = 200;
          ctx.body = {
            status: status.success,
            message: 'OK',
            token,
          };
          return;
        }
      } else {
        ctx.status = 400;
        ctx.body = {
          status: status.error,
          message: 'Login Fail',
        };
        return;
      }
    } else {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'Can not determine type of response!',
      };
      return;
    }

    ctx.status = 400;
    ctx.body = {
      status: status.error,
      message: 'Can not authenticate signature!',
    };
  }

  async login(ctx) {
    const { email } = ctx.request.body;

    if (!email) {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'No email',
      };
      return;
    }

    const user = await userService.findByEmailWithAuthenticators(email);

    if (user && user.authenticators && user.authenticators.length) {
      const { challenge } = await f2l.assertionOptions();

      const response = new GetOptions();
      response.challenge = challenge;
      response.timeout = f2l.config.timeout;
      // send credIds available for login
      response.allowCredentials = user.authenticators.map(authenticator => ({
        id: authenticator.credId,
        type: 'public-key',
      }));
      response.status = 'ok';
      response.encodeBinaryProperties();
      response.validate();
      response.status = status.success;

      ctx.session.email = email;
      ctx.session.userId = coerceToBase64(crypto.randomBytes(32));
      ctx.session.challenge = response.challenge;
      ctx.session.challengeTime = Date.now();

      ctx.body = response.toString();
    } else {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'Login Fail',
      };
    }
  }
}

export default new WebauthnCtrl();
