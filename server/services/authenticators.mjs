import db from '../db';

class AuthenticatorsService {
  constructor() {
    this.Authenticators = db.Authenticators;
    this.sequelize = db.sequelize;
    this.authenticatorsPublicFields = ['id', 'publicKey', 'aaguid', 'credId', 'prevCounter'];
  }

  async updateCounter(id, prevCounter) {
    const { Authenticators, authenticatorsPublicFields } = this;
    try {
      const [affectedRows] = await Authenticators.update(
        { prevCounter },
        {
          where: { id },
          fields: authenticatorsPublicFields,
        },
      );
      return affectedRows > 0;
    } catch (e) {
      return null;
    }
  }
}

export default new AuthenticatorsService();
