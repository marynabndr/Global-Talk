const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  courseId: { type: DataTypes.INTEGER, allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  status: { type: DataTypes.STRING(50), defaultValue: 'Нова' }
}, { timestamps: false, tableName: 'Applications' });

module.exports = Application;