const blogsRouter = require('express').Router();
const Blog = require('../models/blog');

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

  const { user } = req;
  if (!user) return res.status(401).json({ error: 'token not given' });

  const savedBlog = await new Blog({ ...req.body, user: user.id }).save();
  user.blogs = [...user.blogs, savedBlog.id];
  await user.save();
  res.status(201).json(savedBlog);
});

blogsRouter.delete('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(400).json({ error: 'invalid blog id' });

  const { user } = req;
  if (!user) return res.status(401).json({ error: 'token not given' });

  if (blog.user.toString() !== user.id.toString())
    return res
      .status(401)
      .json({ error: 'wrong/invalid token (not authorized)' });
  await Blog.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

blogsRouter.put('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(400).json({ error: 'invalid blog id' });

  const { user } = req;
  if (!user) return res.status(401).json({ error: 'token not given' });

  if (blog.user.toString() !== user.id.toString())
    return res
      .status(401)
      .json({ error: 'wrong/invalid token (not authorized)' });
  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });
  res.status(200).json(updatedBlog);
});

module.exports = blogsRouter;
