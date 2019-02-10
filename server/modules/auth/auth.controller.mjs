/* eslint-disable class-methods-use-this */
import jwt from 'jsonwebtoken';

import config from '../../config';
import { status } from '../../helpers/constants';
import userService from '../../services/user';

class AuthCtrl {
  async login(ctx) {
    const data = ctx.request.body;
    const user = await userService.findByCredentials(data);
    if (user) {
      const token = jwt.sign({ id: user.id, role: user.role }, config.app.secret, {
        expiresIn: 60 * 60 * 24 * 7,
      });
      ctx.body = {
        status: status.success,
        message: 'OK',
        user,
        token,
      };
    } else {
      ctx.status = 400;
      ctx.body = {
        status: status.error,
        message: 'Login Fail',
      };
    }
  }

  async recoverPassword(ctx) {
    const { email } = ctx.request.body;
    if (!email) {
      ctx.status = 403;
      ctx.body = {
        status: status.error,
        message: 'No email',
      };
      return;
    }
    const user = await userService.findByEmail(email);
    if (user) {
      const token = jwt.sign({ id: user.id, role: user.role }, config.app.secret, {
        expiresIn: 60 * 15,
      });
      const recoverUrl = `${ctx.href}/${token}`;
      ctx.body = {
        status: status.success,
        message: 'OK',
        recoverUrl,
      };
    } else {
      ctx.status = 200;
      ctx.body = {
        status: status.success,
        message: 'Check your email',
      };
    }
  }

  async recoverPasswordByToken(ctx) {
    const { password } = ctx.request.body;
    if (!password) {
      ctx.status = 403;
      ctx.body = {
        status: status.error,
        message: 'No password',
      };
      return;
    }
    const { id } = ctx.state.user;
    const data = { id, password };
    const result = await userService.update(data, ctx.state.user);
    if (result) {
      ctx.body = {
        status: status.success,
        message: 'Password successfully changed',
      };
    } else {
      ctx.status = 403;
      ctx.body = {
        status: status.error,
        message: 'Password not changed',
      };
    }
  }
}

export default new AuthCtrl();
