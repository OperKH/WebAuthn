import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import Sequelize from 'sequelize';

import config from '../config';

const { database, user, password, options } = config.db;

const sequelize = new Sequelize(database, user, password, options);
const models = 'models';
const db = {};

// eslint-disable-next-line no-underscore-dangle
const __dirname = fileURLToPath(import.meta.url).replace(/[/\\][^/\\]*?$/, '');

fs.readdirSync(path.join(__dirname, models))
  .filter(file => file.indexOf('.') !== 0 && /\.js$/.test(file) && file !== 'index.js')
  .forEach(file => {
    const model = sequelize.import(path.join(__dirname, models, file));
    db[model.name] = model;
  });

const { User, Authenticators } = db;

Authenticators.belongsTo(User, { onDelete: 'cascade' });
User.hasMany(Authenticators);

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
