import {
  AccessDeniedError,
  LastAdminError,
  ValidationError,
  DuplicateError,
  SamePasswordError,
} from '../helpers/errors';
import { status } from '../helpers/constants';

export default async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    const { message } = e;
    if (e instanceof AccessDeniedError) {
      ctx.status = 403;
      ctx.body = { status: status.error, message };
    } else if (e instanceof LastAdminError) {
      ctx.status = 403;
      ctx.body = { status: status.error, message };
    } else if (e instanceof ValidationError) {
      ctx.status = 403;
      ctx.body = { status: status.error, message };
    } else if (e instanceof DuplicateError) {
      ctx.status = 409;
      ctx.body = { status: status.error, message };
    } else if (e instanceof SamePasswordError) {
      ctx.status = 403;
      ctx.body = { status: status.error, message };
    } else {
      throw e;
    }
  }
};
