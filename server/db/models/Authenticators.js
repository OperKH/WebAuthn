module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Authenticators', {
    publicKey: {
      type: DataTypes.STRING,
    },
    aaguid: {
      type: DataTypes.STRING,
    },
    credId: {
      type: DataTypes.STRING,
    },
    prevCounter: {
      type: DataTypes.INTEGER,
    },
  });
};
