const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');

usersRouter.get('/', async (req, res) => {
  const users = await User.find({}).populate('blogs', {
    title: 1,
    url: 1,
    likes: 1
  });
  res.status(200).json(users);
});

usersRouter.post('/', async (req, res) => {
  const name = req.body.name || 'John Doe';
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username/password not given' });
  } else if (username.length < 4 || password.length < 4) {
    return res
      .status(400)
      .json({ error: 'username/password must be at least 4 characters long' });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash
  });

  const savedUser = await user.save();

  res.status(201).json(savedUser);
});

module.exports = usersRouter;
