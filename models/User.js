const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true }, // allowNull: true для Google OAuth
  role: { 
    type: DataTypes.ENUM('user', 'admin'), 
    defaultValue: 'user' 
  },
  isEmailConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  refreshToken: { type: DataTypes.TEXT, allowNull: true },
  resetPasswordToken: { type: DataTypes.STRING, allowNull: true }
}, { timestamps: true }); 

module.exports = User;