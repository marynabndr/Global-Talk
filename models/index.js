const User = require('./User');
const Teacher = require('./Teacher');
const Course = require('./Course');
const Application = require('./Application');
const Review = require('./Review');

//Один вчитель має багато курсів (One-to-Many) 
Teacher.hasMany(Course, { foreignKey: 'teacherId' });
Course.belongsTo(Teacher, { foreignKey: 'teacherId' }); 

// Користувач може мати багато заявок (One-to-Many) 
User.hasMany(Application, { foreignKey: 'userId' });
Application.belongsTo(User, { foreignKey: 'userId' });

// Курс може мати багато заявок (One-to-Many)
Course.hasMany(Application, { foreignKey: 'courseId' });
Application.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = {
  User,
  Teacher,
  Course,
  Application,
  Review
};