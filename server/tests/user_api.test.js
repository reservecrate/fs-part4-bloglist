const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const api = supertest(app);
const User = require('../models/user');
const { getAllUsers } = require('./test_helper');

describe("when there's one user in the db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root', passwordHash });

    await user.save();
  });
  test('creation succeeds with a fresh username', async () => {
    const usersBefore = await getAllUsers();

    const newUser = {
      username: 'breezehash',
      name: 'Joel',
      password: 'nie'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAfter = await getAllUsers();
    expect(usersAfter).toHaveLength(usersBefore.length + 1);

    const usernames = usersAfter.map(user => user.username);
    expect(usernames).toContain(newUser.username);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
