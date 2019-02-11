/* eslint-disable class-methods-use-this */
import F2L from '@davedoesdev/fido2-lib';
import WebauthnSimpleApp from 'webauthn-simple-app';
import crypto from 'crypto';

import config from '../../config';
import { status } from '../../helpers/constants';
import userService from '../../services/user';

const domain = config.webauthn.origin.replace(/https?:\/\//, '').replace(/:.*$/, '');

const { Fido2Lib } = F2L;
const { CreateOptions, CredentialAttestation } = WebauthnSimpleApp;
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
    const clientAttestationResponse = CredentialAttestation.from(ctx.request.body);
    clientAttestationResponse.validate();
    clientAttestationResponse.decodeBinaryProperties();

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
        message: 'Register request timed out',
      };
      return;
    }

    // set expectations
    const attestationExpectations = {
      challenge: coerceToArrayBuffer(ctx.session.challenge, 'session.challenge'),
      origin: config.webauthn.origin,
      factor: 'either',
    };

    let result;
    if (clientAttestationResponse.response.attestationObject !== undefined) {
      try {
        result = await f2l.attestationResult(clientAttestationResponse.toObject(), attestationExpectations);
        const { email } = ctx.session;
        const newUser = {
          login: email,
          email,
          password: '',
        };
        await userService.create(newUser, { role: 'admin' });

        const userAuthenticator = {
          publicKey: result.authnrData.get('credentialPublicKeyPem'),
          aaguid: coerceToBase64(result.authnrData.get('aaguid')),
          credId: coerceToBase64(result.authnrData.get('credId')),
          prevCounter: result.authnrData.get('counter'),
        };
        // TODO: save authenticator
      } catch (e) {
        console.log(e);
      }
      ctx.session = null;
    } else if (clientAttestationResponse.response.authenticatorData !== undefined) {
      // TODO: verifyAuthenticatorAssertionResponse
    } else {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'Can not determine type of response!',
      };
      return;
    }

    if (result) {
      ctx.status = 200;
      ctx.body = {
        status: status.success,
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'Can not authenticate signature!',
      };
    }
  }

  async login(ctx) {
    ctx.status = 404;
    ctx.body = {
      status: status.error,
      message: 'Not implemented',
    };
  }
}

function coerceToArrayBuffer(inputBuf, name) {
  let buf = inputBuf;
  if (typeof buf === 'string') {
    // base64url to base64
    buf = buf.replace(/-/g, '+').replace(/_/g, '/');
    // base64 to Buffer
    buf = Buffer.from(buf, 'base64');
  }

  if (buf instanceof Buffer || Array.isArray(buf)) {
    buf = new Uint8Array(buf);
  }

  if (buf instanceof Uint8Array) {
    buf = buf.buffer;
  }

  if (!(buf instanceof ArrayBuffer)) {
    throw new TypeError(`could not coerce '${name}' to ArrayBuffer`);
  }

  return buf;
}

function coerceToBase64(inputThing, name) {
  let thing = inputThing;
  // Array to Uint8Array
  if (Array.isArray(thing)) {
    thing = Uint8Array.from(thing);
  }

  // Uint8Array, etc. to ArrayBuffer
  if (thing.buffer instanceof ArrayBuffer && !(thing instanceof Buffer)) {
    thing = thing.buffer;
  }

  // ArrayBuffer to Buffer
  if (thing instanceof ArrayBuffer && !(thing instanceof Buffer)) {
    thing = Buffer.from(thing);
  }

  // Buffer to base64 string
  if (thing instanceof Buffer) {
    thing = thing.toString('base64');
  }

  if (typeof thing !== 'string') {
    throw new Error(`couldn't coerce '${name}' to string`);
  }

  // base64 to base64url
  // NOTE: "=" at the end of challenge is optional, strip it off here so that it's compatible with client
  // thing = thing.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");

  return thing;
}

export default new WebauthnCtrl();
