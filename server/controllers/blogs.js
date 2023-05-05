const jwt = require('jsonwebtoken');
const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');

const getTokenFrom = req => {
  const authorization = req.get('authorization');
  return authorization && authorization.startsWith('Bearer ')
    ? authorization.replace('Bearer ', '')
    : null;
};

blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  res.status(200).json(blogs);
});

blogsRouter.get('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.status(200).json(blog);
});

blogsRouter.post('/', async (req, res) => {
  !req.body.likes ? (req.body.likes = 0) : null;

  const decodedToken = jwt.verify(getTokenFrom(req), process.env.SECRET);
  if (!decodedToken.id) return res.status(401).json({ error: 'invalid token' });
  const user = await User.findById(decodedToken.id);

  const savedBlog = await new Blog({ ...req.body, user: user.id }).save();
  user.blogs = [...user.blogs, savedBlog.id];
  await user.save();
  res.status(201).json(savedBlog);
});

blogsRouter.delete('/:id', async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

blogsRouter.put('/:id', async (req, res) => {
  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });
  res.status(200).json(updatedBlog);
});

module.exports = blogsRouter;