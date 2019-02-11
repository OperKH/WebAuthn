const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  app: {
    env,
    port: process.env.PORT || 3000,
    secret: process.env.SECRET_KEY || 'secret key',
    cookieSecret1: process.env.COOKIE_SECRET_KEY1 || 'cookie secret key 1',
    cookieSecret2: process.env.COOKIE_SECRET_KEY2 || 'cookie secret key 2',
    cookieSecret3: process.env.COOKIE_SECRET_KEY3 || 'cookie secret key 3',
  },
};

const platformConfig = {
  development: {
    db: {
      database: 'koa-demo',
      user: null,
      password: null,
      options: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
    },
    webauthn: {
      origin: `http://localhost:${baseConfig.app.port}`,
    },
  },
  test: {
    app: {
      port: 3001,
    },
    db: {
      database: 'koa-demo',
      user: null,
      password: null,
      options: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
    },
  },
  production: {
    db: {
      database: 'koa-demo',
      user: null,
      password: null,
      options: {
        dialect: 'sqlite',
        storage: 'db.sqlite',
      },
    },
    // db: {
    //   database: process.env.DB_NAME || 'koa-demo',
    //   user: process.env.DB_USER || 'root',
    //   password: process.env.DB_PASS || '',
    //   options: {
    //     dialect: 'mysql',
    //     host: process.env.DB_HOST || 'localhost',
    //     port: process.env.DB_PORT || 3306,
    //   },
    // },
    webauthn: {
      origin: `https://webauthn.operkh.com`,
    },
  },
};

export default {
  ...baseConfig,
  ...platformConfig[env],
};
