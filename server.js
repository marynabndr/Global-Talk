const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const { User, Course, Teacher, Application, Review } = require('./models/index'); 

const app = express();
const PORT = 3000;

// Мідлвари 
app.use(cors());
app.use(express.json()); // Дозволяє читати JSON, який надсилає JS
app.use(express.static(__dirname)); // Дозволяє браузеру бачити CSS та JS файли

// Головна сторінка
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- API МАРШРУТИ ---
// курси
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.findAll({ include: [Teacher] });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Помилка курсів", error });
  }
});

// викладачі
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.findAll();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Помилка викладачів", error });
  }
});

// відгуки
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.findAll();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Помилка відгуків", error });
  }
});

// вхід 
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email, password } });
    if (user) {
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: "Невірний email або пароль" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// реєстарція
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const candidate = await User.findOne({ where: { email } });
    if (candidate) {
      return res.status(400).json({ success: false, message: "Цей email вже зайнятий" });
    }

    // створення нового користувача
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'client'
    });

    res.status(201).json({ 
      success: true, 
      user: { id: newUser.id, name: newUser.name, role: newUser.role } 
    });
  } catch (error) {
    console.error("Error during registration:", error); // Побачите помилку в терміналі
    res.status(500).json({ success: false, message: "Помилка на сервері при реєстрації", error: error.message });
  }
});

// заявка
app.post('/api/apply', async (req, res) => {
  const { userId, courseId, phone } = req.body;
  try {
    const newApp = await Application.create({ userId, courseId, phone, status: 'Нова' });
    res.status(201).json({ message: "Успішно!", data: newApp });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// старт сервера
async function startServer() {
  try {
    await sequelize.sync({ alter: true }); 
    console.log("Базу даних синхронізовано.");
    app.listen(PORT, () => console.log(`Сервер: http://localhost:${PORT}`));
  } catch (error) {
    console.error("Помилка старту:", error);
  }
}

startServer();