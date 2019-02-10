import path from 'path';
import logger from 'koa-logger';
import mount from 'koa-mount';
import bodyParser from 'koa-bodyparser';
import koaJWT from 'koa-jwt';
import serve from 'koa-static';
import spa from 'koa-spa';

import config from './index';
import handleErrors from '../middlewares/handleErrors';
import authApp from '../modules/auth/auth.module';
import usersApp from '../modules/user/users.module';
import isRevokedToken from '../helpers/isRevokedToken';

export default function(app) {
  if (config.app.env === 'development') {
    app.use(logger());
  }
  app.use(handleErrors);
  app.use(bodyParser());

  // Public API START
  app.use(mount('/api/v1/auth', authApp));
  // Public API END

  app.use(mount('/api/v1', koaJWT({ secret: config.app.secret, isRevoked: isRevokedToken })));
  // Valid JWT API START
  app.use(mount('/api/v1', usersApp));

  // Web pages
  if (config.app.env === 'development') {
    app.use(mount('/swagger', serve('./swagger-ui-dist')));
  }
  app.use(
    spa(path.resolve('client', 'dist'), {
      index: 'index.html',
      routeBase: '/',
      routes: {
        'not /api': /^((?!\/api).)*$/,
      },
    }),
  );
}
