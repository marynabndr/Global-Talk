const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); 
const NodeCache = require('node-cache');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const winston = require('winston');

const myCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
const sequelize = require('./config/database');
const { User, Course, Teacher, Application, Review } = require('./models/index'); 
const authMiddleware = require('./middleware/auth'); // Middleware для перевірки токена (15)

const app = express();
app.use(morgan('dev'));  // 'dev' — це лаконічний кольоровий формат логів для розробки
const PORT = 3000;


// Логер
const logger = winston.createLogger({
    level: 'info', // Мінімальний рівень логування
    format: winston.format.combine(
        winston.format.timestamp(), // Додає час події
        winston.format.json()      // Формат запису — JSON (зручно для аналізу)
    ),
    transports: [
        // Записувати все у файл app.log
        new winston.transports.File({ filename: 'app.log' }),
        // Також дублювати вивід у консоль (опціонально, для зручності розробки)
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ],
});

// --- 1. HELMET (БЕЗПЕКА ЗАГОЛОВКІВ) ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "images.unsplash.com"],
            "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            "font-src": ["'self'", "fonts.gstatic.com"],
        },
    },
}));
app.use(cors());
app.use(express.json());

// --- 2. EXPRESS-RATE-LIMIT (ЗАХИСТ ВІД ПЕРЕВАНТАЖЕННЯ) ---
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, //5 хвилин
    max: 100, // Макс 5 запитів з однієї IP 
    standardHeaders: true, 
    legacyHeaders: false, 
    message: {
        status: 429,
        message: "Забагато запитів з вашої адреси. Спробуйте через 5 хвилин."
    }
});
// до всіх маршрутів API
app.use('/api/', apiLimiter);

// Обмеження спроб входу (14)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: { message: "Забагато невдалих спроб. Спробуйте через 15 хвилин." }
});

// Секретні ключі 
const ACCESS_SECRET = "global_talk_access_secret_2026";
const REFRESH_SECRET = "global_talk_refresh_secret_2026";

/**
 * @openapi
 * /api/register:
 *   post:
 *     tags: [Auth]
 *     summary: Реєстрація нового користувача
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Користувач успішно зареєстрований
 *       400:
 *         description: Помилка валідації
 */
app.post('/api/register', [
    body('email').isEmail().withMessage('Некоректний email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль закороткий'),
    body('name').notEmpty().withMessage("Ім'я обов'язкове")
], async (req, res) => { // Додали async
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { email, name, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'client'
        });
        // ----------------------------------------

        res.status(201).json({
            success: true,
            message: `Користувач ${newUser.name} успішно доданий у базу даних!`,
            user: { id: newUser.id, email: newUser.email }
        });

    } catch (error) {
        console.error("Помилка БД:", error);
        res.status(400).json({ success: false, message: "Email вже зайнятий або помилка БД" });
    }
});

// Мідлвари
app.use(cors());
app.use(express.json()); 
app.use(express.static(__dirname)); 

// Логування помилок (13)
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${new Date().toLocaleString()}: ${err.message}`);
    res.status(500).json({ success: false, message: "Внутрішня помилка сервера" });
});


/**
 * @openapi
 * /:
 *   get:
 *     summary: Головна сторінка
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Повертає файл index.html
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// 2, 3, 7, 11. РЕЄСТРАЦІЯ  
/* app.post('/api/register', [  // Валідація (3)
    body('email').isEmail().withMessage('Некоректний формат email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль має бути не менше 6 символів'),
    body('name').notEmpty().withMessage("Ім'я обов'язкове")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
        const { name, email, password, confirmPassword } = req.body;

        // Перевірка підтвердження пароля (7)
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Паролі не збігаються" });
        }

        const candidate = await User.findOne({ where: { email } });
        if (candidate) {
            return res.status(400).json({ success: false, message: "Цей email вже зайнятий" });
        }

        // Хешування пароля перед збереженням
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'client' // за замовчуванням
        });

        // підтвердження Email (19)
        console.log(`[EMAIL] Надіслано лист для підтвердження на ${email}`);

        res.status(201).json({ success: true, message: "Реєстрація успішна!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}); */

/**
 * @openapi
 * /api/login:
 *   post:
 *     tags: [Auth]
 *     summary: Вхід у систему (Авторизація)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Повертає JWT токени
 *       401:
 *         description: Невірні дані входу
 */
app.post('/api/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        
        if (!user) return res.status(401).json({ success: false, message: "Користувача не знайдено" });

        // Перевірка хешованого пароля
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Невірний пароль" });

        // Генерація токенів
        const accessToken = jwt.sign({ id: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' }); // Короткоживучий (15 хв). Потрібен для доступу до даних
        const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' }); // Довгоживучий (7 днів).

        // Зберігаємо refresh token в БД (12)
        user.refreshToken = refreshToken;
        await user.save();

        res.json({ 
            success: true, 
            accessToken, 
            refreshToken, 
            user: { id: user.id, name: user.name, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


/**
 * @openapi
 * /api/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Вихід із системи
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Вихід виконано успішно
 */
app.post('/api/logout', authMiddleware, async (req, res) => {
    try {
        await User.update({ refreshToken: null }, { where: { id: req.user.id } });
        res.json({ success: true, message: "Вихід виконано" });
    } catch (e) {
        res.status(500).json({ message: "Помилка при виході" });
    }
});


/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Отримати дані профілю поточного користувача
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Дані профілю успішно отримано
 */ 
app.get('/api/profile', authMiddleware, async (req, res) => {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email', 'role'] });
    res.json(user);
});

/**
 * @openapi
 * /api/profile:
 *   put:
 *     tags: [Profile]
 *     summary: Оновити дані профілю
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Профіль оновлено
 */
app.put('/api/profile', authMiddleware, async (req, res) => {
    const { name, newPassword } = req.body;
    try {
        const updateData = { name };
        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        }
        await User.update(updateData, { where: { id: req.user.id } });
        res.json({ success: true, message: "Дані оновлено" });
    } catch (e) {
        res.status(500).json({ message: "Помилка оновлення" });
    }
});

/**
 * @openapi
 * /api/profile:
 *   delete:
 *     tags: [Profile]
 *     summary: Видалити власний акаунт
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Акаунт видалено
 */
app.delete('/api/profile', authMiddleware, async (req, res) => {
    await User.destroy({ where: { id: req.user.id } });
    res.json({ success: true, message: "Акаунт видалено" });
});

// Завдання 9: Middleware для вимірювання часу відповіді
app.use((req, res, next) => {
    // Фіксуємо час початку запиту
    const start = Date.now();

    // Чекаємо, поки сервер повністю закінчить відправку відповіді клієнту
    res.on('finish', () => {
        // Обчислюємо різницю 
        const duration = Date.now() - start;
        const logMessage = `${req.method} ${req.originalUrl} - ${duration}ms`;

        // Записуємо результат у лог (використовуємо Winston logger)
        logger.info({
            type: 'performance',
            method: req.method,
            url: req.originalUrl,
            duration: `${duration}ms`
        });

        console.log(`[PERFORMANCE] ${logMessage}`);
    });

    next(); 
});


// Кешування

/**
 * @openapi
 * /api/courses:
 *   get:
 *     tags: [Public Data]
 *     summary: Отримання списку курсів з кешуванням
 *     responses:
 *       200:
 *         description: Список курсів
 */
app.get('/api/courses', async (req, res) => {
  try {
    const cacheKey = 'test_courses';
    const cached = myCache.get(cacheKey);

    // Якщо є в кеші — повертаємо ТІЛЬКИ МАСИВ (cached)
    if (cached) {
      return res.json(cached); 
    }

    const courses = await Course.findAll();

    // Зберігаємо в кеш
    myCache.set(cacheKey, courses);
    
    // Повертаємо ТІЛЬКИ МАСИВ (courses)
    res.json(courses); 

  } catch (error) {
    res.status(500).json({ message: "Помилка сервера", error: error.message });
  }
});

/**
 * @openapi
 * /api/teachers:
 *   get:
 *     tags: [Public Data]
 *     summary: Отримання списку викладачів
 *     responses:
 *       200:
 *         description: Список викладачів
 */
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.findAll();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Помилка викладачів" });
  }
});

/**
 * @openapi
 * /api/reviews:
 *   get:
 *     tags: [Public Data]
 *     summary: Отримання списку відгуків
 *     responses:
 *       200:
 *         description: Список відгуків
 */
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.findAll();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Помилка відгуків" });
  }
});

// Створення заявки (для авторизованих)

/**
 * @openapi
 * /api/apply:
 *   post:
 *     tags: [User Actions]
 *     summary: Подати заявку на курс
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId: { type: integer }
 *               phone: { type: string }
 *     responses:
 *       201:
 *         description: Заявку прийнято
 */
app.post('/api/apply', authMiddleware, async (req, res) => {
  const { courseId, phone } = req.body;
  try {
    const newApp = await Application.create({ 
        userId: req.user.id,
        courseId, 
        phone, 
        status: 'Нова' 
    });
    res.status(201).json({ success: true, data: newApp });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Відновлення пароля (18)
app.post('/api/recover-password', async (req, res) => {
    res.json({ message: "Посилання для відновлення надіслано..." });
});
// OAuth Google (20)
app.get('/api/auth/google', (req, res) => {
    res.redirect('https://accounts.google.com/o/oauth2/v2/auth...'); 
});

const upload = multer({ dest: 'uploads/' }); // файли потраплятимуть у папку uploads

// Завдання 5: Ендпоінт для завантаження одного файлу

/**
 * @openapi
 * /upload:
 *   post:
 *     tags: [Files]
 *     summary: Завантаження одного файлу
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Файл завантажено
 */
app.post('/upload', upload.single('file'), (req, res) => {
    // Перевірка чи файл дійсно прийшов
    if (!req.file) {
        return res.status(400).json({ message: "Будь ласка, оберіть файл для завантаження" });
    }

    // Відповідь користувачу з даними про файл
    res.json({
        message: "Файл завантажено успішно",
        fileInfo: {
            originalName: req.file.originalname,
            size: req.file.size,
            path: req.file.path
        }
    });
});

/**
 * @openapi
 * /api/test-error:
 *   get:
 *     tags: [General]
 *     summary: Тестова помилка для логів
 *     responses:
 *       500:
 *         description: Генерує помилку 500
 */
app.get('/api/test-error', (req, res) => {
    throw new Error("Тестова помилка для перевірки Winston!");
});

// Завдання 6: Завантаження кількох файлів (до 5 штук)
app.post('/upload-multiple', upload.array('files', 5), (req, res) => {
    // Перевірка, чи були надіслані файли
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Файли не завантажено" });
    }

    // Повертаємо список завантажених файлів
    res.json({
        message: `Успішно завантажено файлів: ${req.files.length}`,
        files: req.files.map(f => ({
            name: f.filename,
            size: f.size
        }))
    });
});


// ЗАВДАННЯ 7: Валідація 
//  об'єкт зберігання для валідації
const storageSecure = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'secure-' + Date.now() + '-' + file.originalname);
    }
});

// Функція фільтрації типів (JPG, PNG, PDF)
const fileFilterSecure = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); 
    } else {
        cb(new Error('Недопустимий тип файлу! Дозволено лише JPG, PNG та PDF.'), false);
    }
};

// створення об'єкта Multer
const uploadValidated = multer({ 
    storage: storageSecure, 
    limits: { 
        fileSize: 1 * 1024 * 1024 // Ліміт: 1 МБ
    },
    fileFilter: fileFilterSecure
});

/**
 * @openapi
 * /upload-secure:
 *   post:
 *     tags: [Files]
 *     summary: Завантаження файлу з валідацією типів
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Валідований файл завантажено
 */
app.post('/upload-secure', uploadValidated.single('file'), (req, res) => {
    res.json({
        message: "Файл пройшов валідацію і завантажений успішно",
        file: req.file
    });
});

/**
 * @openapi
 * /status:
 *   get:
 *     tags: [General]
 *     summary: Стан сервера
 *     responses:
 *       200:
 *         description: Технічні дані про стан системи
 */
app.get('/status', (req, res) => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime(); // Час роботи сервера в секундах
    
    res.json({
        status: "Server is healthy",
        uptime: `${Math.floor(uptime / 60)} minutes ${Math.floor(uptime % 60)} seconds`,
        memoryUsage: {
            rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`, // Загальна пам'ять
            heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`, // Виділено пам'яті
            heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,  // Використано пам'яті
        },
        nodeVersion: process.version,
        platform: process.platform
    });
});



// Мідлвара для обробки помилок 
app.use((err, req, res, next) => {
    // Логування помилки через Winston у файл app.log
    logger.error({
        message: err.message,
        stack: err.stack, // додає інформацію про те, в якому рядку коду сталася помилка
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    // Повернення користувачу JSON-відповіді
    const statusCode = err.status || 500; // якщо код не вказано, використовуємо 500 (Internal Server Error)
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: "На сервері сталася помилка",
        error: err.message
    });
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Global Talk API - Final Project',
      version: '1.0.0',
      description: 'Документація API для роботи з курсами, вчителями та профілем',
    },
    servers: [{ url: 'http://localhost:3000' }],
    // Додаємо можливість вводити JWT токен у Swagger
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./server.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
// console.log(JSON.stringify(swaggerDocs, null, 2));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


async function startServer() {
  try {
    await sequelize.sync(); 
    
    // Замість console.log використовуємо logger.info
    logger.info("Базу даних синхронізовано успішно");
    console.log("Базу даних синхронізовано"); 

    app.listen(PORT, () => {
        // Логуємо запуск сервера у файл
        logger.info(`Сервер запущено на http://localhost:${PORT}`);
        console.log(`Сервер: http://localhost:${PORT}`);
    });

  } catch (error) {
    // Замість console.error використовуємо logger.error
    logger.error(`Помилка старту сервера: ${error.message}`);
    console.error("Помилка старту:", error);
  }
}

module.exports = app; // Експортуємо додаток для тестів

startServer();