const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');
const { initialBlogs, nonexistentId, getAllBlogs } = require('./test_helper');

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(initialBlogs);
}, 50000);

describe('fetching all blogs', () => {
  test('returns the blogs as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('returns the correct amount of blogs', async () => {
    const res = await api.get('/api/blogs');
    expect(res.body).toHaveLength(initialBlogs.length);
  });

  test('blogs are returned in the correct order', async () => {
    const res = await api.get('/api/blogs');
    expect(res.body[0].title).toBe('React patterns');
    expect(res.body[1].author).toBe('Edsger W. Dijkstra');
  });

  test('blogs have the id property', async () => {
    const res = await api.get('/api/blogs');
    expect(res.body[0].id).toBeDefined();
  });
});

describe('fetching a single blog', () => {
  test('works with a valid id', async () => {
    const blogs = await getAllBlogs();
    const blogToFetch = blogs[0];
    const fetchedBlog = await api
      .get(`/api/blogs/${blogToFetch.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    expect(blogToFetch).toEqual(fetchedBlog.body);
  });
  // test('fails with status code 404 if the resource is nonexistent', async () => {
  //   const validNonexistentId = nonexistentId();
  //   await api.get(`/api/blogs/${validNonexistentId}`).expect(404);
  // });
  test('fails with status code 400 if id is invalid', async () => {
    const invalidId = 'invalidId';
    await api.get(`/api/blogs/${invalidId}`).expect(400);
  });
});

describe('adding a new blog', () => {
  test('a valid new blog can be added', async () => {
    const newBlog = {
      title: 'TypeScript #1',
      author: 'reservecrate',
      url: 'https://typescriptlang.org/',
      likes: 420
    };
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    const blogsAfter = await getAllBlogs();
    const blogTitles = blogsAfter.map(blog => blog.title);
    expect(blogsAfter).toHaveLength(initialBlogs.length + 1);
    expect(blogTitles).toContain(newBlog.title);
  });

  test('blog with no .likes property will default to 0', async () => {
    const newBlog = {
      title: 'Python #2',
      author: 'reservecrate',
      url: 'https://python.org/'
    };
    const res = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    expect(res.body.likes).toBe(0);
  });

  test('fails with status code 400 if the .likes property is invalid', async () => {
    const newBlog = {
      title: 'Python #2',
      author: 'reservecrate',
      url: 'https://python.org/',
      likes: -1
    };
    await api.post('/api/blogs').send(newBlog).expect(400);
  });

  test('fails with status code 400 if either the .title or the .url property is missing', async () => {
    const newBlog = {
      title: 'etwas',
      author: 'reservecrate',
      likes: 420
    };
    await api.post('/api/blogs').send(newBlog).expect(400);
  });
});

describe('deleting a single blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsBefore = await getAllBlogs();
    const blogToDelete = blogsBefore[0];
    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);
    const blogsAfter = await getAllBlogs();
    const blogTitles = blogsAfter.map(blog => blog.title);
    expect(blogsAfter).toHaveLength(initialBlogs.length - 1);
    expect(blogTitles).not.toContain(blogToDelete.title);
  });

  test('returns status code 204 if user attempts to delete the same resource twice (delete should be idempotent)', async () => {
    const blogs = await getAllBlogs();
    const blogToDelete = blogs[0];
    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);
    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);
  });

  test('returns status code 204 if user attempts to delete nonexistent resource (delete should be idempotent)', async () => {
    const validNonexistentId = await nonexistentId();
    await api.delete('/api/blogs/doesnotexist').expect(204);
    await api.delete(`/api/blogs/${validNonexistentId}`).expect(204);
  });
});

describe('updating a single blog', () => {
  test('returns status code 200 and successfully updates the blog if id is valid', async () => {
    const blogsBefore = await getAllBlogs();
    const updatedBlog = {
      ...blogsBefore[0],
      title: 'Ruby is the best programming language in the entire world',
      likes: 42069
    };
    await api
      .put(`/api/blogs/${updatedBlog.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    const blogsAfter = await getAllBlogs();
    expect(blogsAfter).toContainEqual(updatedBlog);
  });
  test('fails with status code 400 if id is invalid', async () => {
    const blogsBefore = await getAllBlogs();
    const updatedBlog = {
      ...blogsBefore[0],
      title: 'Ruby is the best programming language in the entire world',
      likes: 42069
    };
    await api.put('/api/blogs/nonexistentId').send(updatedBlog).expect(400);
    const blogsAfter = await getAllBlogs();
    expect(blogsAfter).not.toContainEqual(updatedBlog);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
