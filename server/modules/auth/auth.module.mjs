import Koa from 'koa';
import route from 'koa-route';
import koaJWT from 'koa-jwt';

import config from '../../config';
import isRevokedToken from '../../helpers/isRevokedToken';
import authCtrl from './auth.controller';

const app = new Koa();

async function addParamToCtx(ctx, param, next) {
  ctx.param = param;
  await next();
}

app.use(route.post('/login', authCtrl.login));
app.use(route.post('/recover-password', authCtrl.recoverPassword));
app.use(route.post('/recover-password/:token', addParamToCtx));
app.use(
  koaJWT({
    secret: config.app.secret,
    isRevoked: isRevokedToken,
    getToken: ctx => ctx.param,
  }),
);
app.use(route.post('/recover-password/:token', authCtrl.recoverPasswordByToken));

export default app;
