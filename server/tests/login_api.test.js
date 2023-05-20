const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const User = require('../models/user');

beforeEach(async () => {
  await User.deleteMany({});

  await api
    .post('/api/users')
    .send({ username: 'reservecrate', name: 'Aldi', password: 'kennwort' });
  await api
    .post('/api/users')
    .send({ username: 'breezehash', name: 'Joel', password: 'niemals' });
}, 50000);

describe('valid login', () => {
  test('returns 200 + token when given valid login data', async () => {
    const validLogin = { username: 'reservecrate', password: 'kennwort' };
    const { body } = await api
      .post('/api/login')
      .send(validLogin)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    const { token } = body;
    expect(token).toBeTruthy();
  });
});

describe('invalid login', () => {
  test('returns 400 when given nonexistent username', async () => {
    const invalidLogin = { username: 'dinosaurrr', password: 'niemals' };

    await api
      .post('/api/login')
      .send(invalidLogin)
      .expect(400)
      .expect('Content-Type', /application\/json/);
  });
  test('returns 400 when given invalid password', async () => {
    const invalidLogin = { username: 'reservecrate', password: 'falsch' };

    await api
      .post('/api/login')
      .send(invalidLogin)
      .expect(400)
      .expect('Content-Type', /application\/json/);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
