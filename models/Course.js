const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  title: { type: DataTypes.STRING, allowNull: false },
  language: { type: DataTypes.STRING, allowNull: false },
  level: { type: DataTypes.STRING },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration: { type: DataTypes.STRING }
}, { timestamps: false });

module.exports = Course;