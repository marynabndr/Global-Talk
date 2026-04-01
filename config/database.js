const { Sequelize } = require('sequelize');

// Налаштування підключення до БД
const sequelize = new Sequelize('backend_globaltalk', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

// Перевірка підключення 
sequelize.authenticate()
  .then(() => console.log('З’єднання з БД встановлено успішно.'))
  .catch(err => console.error('Помилка підключення:', err));

module.exports = sequelize;

