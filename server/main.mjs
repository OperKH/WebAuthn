import Koa from 'koa';
import config from './config';
import koaConfig from './config/koa';
import db from './db';
import userService from './services/user';

const app = new Koa();

app.keys = [config.app.cookieSecret1, config.app.cookieSecret2, config.app.cookieSecret3];

app.init = async () => {
  const { sequelize } = db;
  await sequelize.sync();
  await userService.createDefaultAdminIfNoAdmins();
  koaConfig(app);
  app.server = app.listen(config.app.port, function() {
    const { address, port } = this.address();
    console.log(`Listening on: http://${address === '::' ? '[::1]' : address}:${port}`);
  });
};

app.init();
