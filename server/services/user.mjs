import bcrypt from 'bcrypt-nodejs';

// eslint-disable-next-line
import db from '../db';

import {
  AccessDeniedError,
  LastAdminError,
  DuplicateError,
  ValidationError,
  SamePasswordError,
} from '../helpers/errors';

class UserService {
  constructor() {
    this.User = db.User;
    this.Authenticators = db.Authenticators;
    this.sequelize = db.sequelize;
    this.userPublicFields = ['id', 'login', 'email', 'role'];
  }

  async findAll() {
    const { User, userPublicFields } = this;
    const users = await User.findAll({ attributes: userPublicFields });
    return users.map(u => u.dataValues);
  }

  async findById(id) {
    const { User, userPublicFields } = this;
    const user = await User.findOne({ where: { id }, attributes: userPublicFields });
    return user ? user.dataValues : null;
  }

  async findByEmail(email) {
    const { User, userPublicFields } = this;
    const user = await User.findOne({ where: { email }, attributes: userPublicFields });
    return user ? user.dataValues : null;
  }

  async findByCredentials(data) {
    const { User, userPublicFields } = this;
    const { login, password } = data;
    const user = await User.findOne({ where: { login } });
    if (!user) {
      return null;
    }
    const resultUser = userPublicFields.reduce((result, field) => ({ ...result, [field]: user[field] }), {});
    try {
      return bcrypt.compareSync(password, user.password) ? resultUser : null;
    } catch (e) {
      return null;
    }
  }

  async create(data, author) {
    const { User, userPublicFields } = this;
    if (author.role !== 'admin') {
      throw new AccessDeniedError();
    }
    const newUser = {
      role: 'user',
      ...data,
      password: bcrypt.hashSync(data.password),
    };
    try {
      const userInstance = await User.create(newUser);
      const user = userPublicFields.reduce(
        (result, key) => ({
          ...result,
          [key]: userInstance.dataValues[key],
        }),
        {},
      );
      return user;
    } catch (e) {
      this.handleErrorCreateUpdate(e);
    }
    return null;
  }

  async createWithAuthenticator(data) {
    const { User, Authenticators, sequelize } = this;
    const newUser = {
      role: 'user',
      ...data,
      password: bcrypt.hashSync(data.password),
    };
    try {
      const result = await sequelize.transaction(transaction => {
        return User.create(newUser, { include: Authenticators, transaction });
      });
      return result;
    } catch (e) {
      this.handleErrorCreateUpdate(e);
    }
    return null;
  }

  async update(data, author) {
    const { User } = this;
    const { id } = data;
    if (author.role !== 'admin' && author.id !== id) {
      throw new AccessDeniedError();
    }
    const updateData = { ...data };
    if (updateData.password) {
      const user = await User.findOne({ where: { id } });
      const isSamePassword = bcrypt.compareSync(updateData.password, user.password);
      if (isSamePassword) {
        throw new SamePasswordError();
      }
      updateData.passwordUpdatedAt = new Date();
      updateData.password = bcrypt.hashSync(updateData.password);
    }
    // Запретить юзеру менять роль.
    if (updateData.role && author.role !== 'admin') {
      delete updateData.role;
    }
    // Если Автор-Админ сам себе меняет роль на Юзера, и он последний админ, то запрещаем.
    if (updateData.role && updateData.role !== 'admin' && author.id === id && (await this.isLastAdmin())) {
      throw new LastAdminError();
    }
    try {
      const [affectedRows] = await User.update(updateData, {
        where: { id },
        fields: ['password', 'email', 'role', 'passwordUpdatedAt'],
      });
      return affectedRows > 0;
    } catch (e) {
      this.handleErrorCreateUpdate(e);
    }
    return null;
  }

  async delete(data, author) {
    const { User } = this;
    const { id } = data;
    if (author.role !== 'admin') {
      throw new AccessDeniedError();
    }
    if (User.role === 'admin' && (await this.isLastAdmin())) {
      throw new LastAdminError();
    }
    const destroedRows = await User.destroy({ where: { id } });
    return destroedRows > 0;
  }

  async createDefaultAdminIfNoAdmins() {
    const { User } = this;
    const isAnyAdmin = await User.findOne({ where: { role: 'admin' } });
    if (isAnyAdmin) return;
    const defaultAdmin = {
      login: 'admin',
      password: bcrypt.hashSync('admin'),
      email: 'admin@my.org',
      role: 'admin',
    };
    await User.create(defaultAdmin);
  }

  async isLastAdmin() {
    const { User } = this;
    const admins = await User.findAndCountAll({ where: { role: 'admin' }, limit: 2 });
    return admins.count === 1;
  }

  // eslint-disable-next-line class-methods-use-this
  handleErrorCreateUpdate(e) {
    if (/^Sequelize/.test(e.name)) {
      const duplicateError = e.errors.find(err => err.type === 'unique violation');
      if (duplicateError) {
        if (duplicateError.path === 'login') {
          throw new DuplicateError(`User ${duplicateError.value} already exist`);
        } else if (duplicateError.path === 'email') {
          throw new DuplicateError(`You can not use email: ${duplicateError.value}`);
        } else {
          throw new DuplicateError(`You can not use value: ${duplicateError.value}`);
        }
      } else {
        const { message } = e.errors[0];
        throw new ValidationError(message);
      }
    } else {
      throw new Error(e);
    }
  }
}

export default new UserService();
