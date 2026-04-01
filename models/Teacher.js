const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Teacher = sequelize.define('Teacher', {
  full_name: { type: DataTypes.STRING, allowNull: false },
  qualification: { type: DataTypes.STRING },
  experience: { type: DataTypes.STRING },
  imageUrl: { type: DataTypes.STRING }
}, { timestamps: false });

module.exports = Teacher; 