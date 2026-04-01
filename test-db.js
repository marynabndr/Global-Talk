const { User, Course, Review } = require('./models/index');
const sequelize = require('./config/database');

async function demo() {
  try {
    console.log("--- ПОЧАТОК ДЕМОНСТРАЦІЇ CRUD ---");

    // INSERT 
    const user1 = await User.create({
      name: 'Іван Петренко',
      email: 'ivan@gmail.com',
      password: 'password123',
      role: 'client'
    });

    const user2 = await User.create({
      name: 'Марія Ковальчук',
      email: 'maria@gmail.com',
      password: 'securepass',
      role: 'client'
    });
    console.log("Створено двох користувачів: Іван та Марія.");


    const englishCourse = await Course.create({
      title: 'Англійська для початківців',
      language: 'English',
      level: 'A1',
      price: 1000.00,
      duration: '3 місяці'
    });
    console.log("Додано курс:", englishCourse.title);


    const newReview = await Review.create({
      client_name: 'Іван Петренко',
      text: 'Чудовий курс, все зрозуміло!',
      rating: 5
    });
    console.log("Додано відгук від:", newReview.client_name);

    // SELECT
    const allUsers = await User.findAll();
    console.log(`Всього користувачів у базі: ${allUsers.length}`);

    const allCourses = await Course.findAll();
    console.log(`Доступні курси: ${allCourses.map(c => c.title).join(', ')}`);

    // UPDATE
    await Course.update({ price: 1250.50 }, {
      where: { id: englishCourse.id }
    });
    console.log("Ціну курсу 'Англійська для початківців' оновлено до 1250.50.");

    // DELETE 
    //const firstReview = await Review.findOne();
    //if (firstReview) {
    //  await Review.destroy({ where: { id: firstReview.id } });
    //  console.log(`🗑️ Відгук від ${firstReview.client_name} видалено.`);
   // }

    console.log("--- ДЕМОНСТРАЦІЮ ЗАВЕРШЕНО ---");
    process.exit();
  } catch (error) {
    console.error("Помилка під час виконання запитів:", error);
    process.exit(1);
  }
}

demo();