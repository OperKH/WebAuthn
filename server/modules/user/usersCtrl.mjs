/* eslint-disable class-methods-use-this */
import userService from '../../services/user';
import { status } from '../../helpers/constants';

class UsersCtrl {
  async createUser(ctx) {
    const data = ctx.request.body;
    const user = await userService.create(data, ctx.state.user);
    if (user) {
      ctx.body = {
        status: status.success,
        message: 'OK',
        user,
      };
    } else {
      ctx.status = 403;
      ctx.body = {
        status: status.error,
        message: 'User not created',
      };
    }
  }

  async deleteUser(ctx, param) {
    const id = parseInt(param, 10);
    const data = { id: parseInt(id, 10) };
    const result = await userService.delete(data, ctx.state.user);
    if (result) {
      ctx.body = {
        status: status.success,
        message: 'OK',
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: status.error,
        message: 'User not deleted',
      };
    }
  }

  async getAllUsers(ctx) {
    const users = await userService.findAll();
    if (users && users.length) {
      ctx.body = {
        status: status.success,
        message: 'OK',
        users,
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: status.error,
        message: 'Users not found',
      };
    }
  }

  async getUser(ctx, param) {
    const id = parseInt(param, 10);
    const user = await userService.findById(id);
    if (user) {
      ctx.body = {
        status: status.success,
        message: 'OK',
        user,
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: status.error,
        message: 'User not found',
      };
    }
  }

  async updateUser(ctx, param) {
    const id = parseInt(param, 10);
    const data = {
      ...ctx.request.body,
      id,
    };
    const result = await userService.update(data, ctx.state.user);
    if (result) {
      ctx.body = {
        status: status.success,
        message: 'OK',
      };
    } else {
      ctx.status = 403;
      ctx.body = {
        status: status.error,
        message: 'User not updated',
      };
    }
  }
}

export default new UsersCtrl(userService, status);
