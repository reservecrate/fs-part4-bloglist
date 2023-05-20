const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const api = supertest(app);
const User = require('../models/user');
const { getAllUsers } = require('./test_helper');

beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('sekret', 10);
  const user = new User({ username: 'root', name: 'admin', passwordHash });

  await user.save();
}, 50000);

describe('valid data', () => {
  test('succeeds with 201 with a valid username + password', async () => {
    const usersBefore = await getAllUsers();

    const newUser = {
      username: 'breezehash',
      name: 'Joel',
      password: 'niemals'
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

  test('if name not given, assigns a default one (John Doe); succeeds with 201', async () => {
    const usersBefore = await getAllUsers();

    const newUser = {
      username: 'breezehash',
      password: 'niemals'
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

    const names = usersAfter.map(user => user.name);
    expect(names).toContain('John Doe');
  });
});

describe('invalid data', () => {
  test('fails with 400 if the username is invalid (too short)', async () => {
    const usersBefore = await getAllUsers();

    const newUser = {
      username: 'bre',
      name: 'Joel',
      password: 'niemals'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAfter = await getAllUsers();
    expect(usersAfter).toHaveLength(usersBefore.length);

    const usernames = usersAfter.map(user => user.username);
    expect(usernames).not.toContain(newUser.username);
  });
  test('fails with 400 if the password is invalid (too short)', async () => {
    const usersBefore = await getAllUsers();

    const newUser = {
      username: 'breezehash',
      name: 'Joel',
      password: 'nie'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAfter = await getAllUsers();
    expect(usersAfter).toHaveLength(usersBefore.length);

    const usernames = usersAfter.map(user => user.username);
    expect(usernames).not.toContain(newUser.username);
  });
  test('fails with 400 if the username is already taken', async () => {
    const usersBefore = await getAllUsers();

    const newUser = {
      username: 'breezehash',
      name: 'Joel',
      password: 'niemals'
    };

    await api.post('/api/users').send(newUser);

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAfter = await getAllUsers();
    expect(usersAfter).toHaveLength(usersBefore.length + 1);

    const usernames = usersAfter.map(user => user.username);
    expect(usernames).toContain(newUser.username);
  });
});

describe('missing data', () => {
  test('fails with 400 if the username is missing', async () => {
    const usersBefore = await getAllUsers();

    const newUser = {
      name: 'Joel',
      password: 'niemals'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAfter = await getAllUsers();
    expect(usersAfter).toHaveLength(usersBefore.length);

    const usernames = usersAfter.map(user => user.username);
    expect(usernames).not.toContain(newUser.username);
  });
  test('fails with 400 if the password is missing', async () => {
    const usersBefore = await getAllUsers();

    const newUser = {
      username: 'breezehash',
      name: 'Joel'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAfter = await getAllUsers();
    expect(usersAfter).toHaveLength(usersBefore.length);

    const usernames = usersAfter.map(user => user.username);
    expect(usernames).not.toContain(newUser.username);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
