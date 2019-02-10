module.exports = (sequelize, DataTypes) => {
  return sequelize.define('User', {
    login: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
    },
    passwordUpdatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
};
