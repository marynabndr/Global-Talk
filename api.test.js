const request = require('supertest');
const app = require('./server'); 
const sequelize = require('./config/database'); // Додаємо імпорт налаштувань бази

describe('Автоматизоване тестування API (Лабораторна №5)', () => {

  // Перед тестами синхронізуємо БД
  beforeAll(async () => {
    await sequelize.sync();
  });

  // Після тестів закриваємо з'єднання
  afterAll(async () => {
    await sequelize.close();
  });

  it('GET /api/courses має повертати статус 200 та масив даних', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.statusCode).toBe(200);
    // Перевіряємо чи є поле source або data
    expect(res.body).toHaveProperty('data'); 
  });

  it('POST /api/register має повертати 400 при некоректних даних', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        email: "not-an-email",
        password: "123",
        name: ""
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

});