const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');
const User = require('../models/user');
const { nonexistentId, getAllBlogs } = require('./test_helper');

beforeEach(async () => {
  await Blog.deleteMany({});

  await User.deleteMany({});
  await api
    .post('/api/users')
    .send({ username: 'reservecrate', name: 'Aldi', password: 'kennwort' });
  await api
    .post('/api/users')
    .send({ username: 'breezehash', name: 'Joel', password: 'niemals' });

  const { body: loginData1 } = await api
    .post('/api/login')
    .send({ username: 'reservecrate', password: 'kennwort' });
  const { body: loginData2 } = await api
    .post('/api/login')
    .send({ username: 'breezehash', password: 'niemals' });
  const { token: token1 } = loginData1;
  const { token: token2 } = loginData2;
  await api.post('/api/blogs').set('Authorization', `Bearer ${token1}`).send({
    title: 'Python bad',
    url: 'python.org',
    author: 'Guido van Rossum'
  });
  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token2}`)
    .send({ title: 'Ruby good', url: 'ruby.org', author: 'Matz' });
  await api.post('/api/blogs').set('Authorization', `Bearer ${token1}`).send({
    title: 'JavaScript rules',
    url: 'ecmascript.org',
    author: 'Brendan Eich'
  });
  await api.post('/api/blogs').set('Authorization', `Bearer ${token2}`).send({
    title: 'TypeScript > Java',
    url: 'typescriptlang.org',
    author: 'Bill Gates'
  });
}, 50000);

describe('fetching all blogs', () => {
  test('returns the blogs as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('returns the correct amount of blogs', async () => {
    const { body } = await api.get('/api/blogs');
    const blogs = await getAllBlogs();
    expect(body).toHaveLength(blogs.length);
  });

  test('blogs are returned in the correct order', async () => {
    const res = await api.get('/api/blogs');
    expect(res.body[0].title).toBe('Python bad');
    expect(res.body[1].author).toBe('Matz');
  });

  test('blogs have the id property', async () => {
    const res = await api.get('/api/blogs');
    expect(res.body[0].id).toBeDefined();
  });
});

describe('fetching a single blog', () => {
  test('succeeds with a valid id', async () => {
    const blogs = await getAllBlogs();
    const blogToFetch = blogs[0];
    const { body: fetchedBlog } = await api
      .get(`/api/blogs/${blogToFetch.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    blogToFetch.user = blogToFetch.user.toString();
    expect(blogToFetch).toEqual(fetchedBlog);
  });
  test('fails with status code 400 if id is invalid', async () => {
    const invalidId = 'invalidId';
    await api.get(`/api/blogs/${invalidId}`).expect(400);
  });
});

describe('adding a new blog', () => {
  test('a valid new blog can be added', async () => {
    const blogsBefore = await getAllBlogs();
    const newBlog = {
      title: 'TypeScript #1',
      author: 'reservecrate',
      url: 'https://typescriptlang.org/',
      likes: 420
    };
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'reservecrate', password: 'kennwort' });
    const { token } = loginData;

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    const blogsAfter = await getAllBlogs();
    const blogTitles = blogsAfter.map(blog => blog.title);
    expect(blogsAfter).toHaveLength(blogsBefore.length + 1);
    expect(blogTitles).toContain(newBlog.title);
  });

  test('blog with no .likes property will default to 0', async () => {
    const newBlog = {
      title: 'Python #2',
      author: 'reservecrate',
      url: 'https://python.org/'
    };
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'reservecrate', password: 'kennwort' });
    const { token } = loginData;

    const { body: createdBlog } = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    expect(createdBlog.likes).toBe(0);
  });

  test('fails with status code 400 if the .likes property is invalid', async () => {
    const invalidBlog = {
      title: 'Python #2',
      author: 'reservecrate',
      url: 'https://python.org/',
      likes: -1
    };
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'reservecrate', password: 'kennwort' });
    const { token } = loginData;

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidBlog)
      .expect(400);
  });

  test('fails with status code 400 if either the .title or the .url property is missing', async () => {
    const invalidBlog = {
      title: 'etwas',
      author: 'reservecrate',
      likes: 420
    };
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'reservecrate', password: 'kennwort' });
    const { token } = loginData;

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidBlog)
      .expect(400);
  });
  test('fails with 401 if anonymous (unauthorised) user attemps to create a resource', async () => {
    const validBlog = {
      title: 'C++ is easy',
      url: 'cpp.org',
      author: 'Bjarne Stroustrup'
    };
    await api.post('/api/blogs').send(validBlog).expect(401);
  });
});

describe('deleting a blog (can only be done by the creator)', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'reservecrate', password: 'kennwort' });
    const { token } = loginData;
    const blogsBefore = await getAllBlogs();
    const blogToDelete = blogsBefore[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    const blogsAfter = await getAllBlogs();
    expect(blogsAfter).toHaveLength(blogsBefore.length - 1);
    expect(blogsAfter).not.toContain(blogToDelete);
  });

  test('returns 404 if user attempts to delete the same resource twice', async () => {
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'reservecrate', password: 'kennwort' });
    const { token } = loginData;
    const { body: blogToDelete } = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'etwas',
        url: 'etwas.org',
        author: 'reservecrate',
        likes: 420
      });

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  test('returns 404 if user attempts to delete nonexistent resource', async () => {
    const validNonexistentId = await nonexistentId();
    await api.delete('/api/blogs/doesnotexist').expect(404);
    await api.delete(`/api/blogs/${validNonexistentId}`).expect(404);
  });
  test('returns 401 if user attempts to delete a resource not created by them', async () => {
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'breezehash', password: 'niemals' });
    const { token: invalidToken } = loginData;
    const blogToDelete = (await getAllBlogs())[0];
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);
  });
  test('returns 401 if anonymous (unauthorised) user attempts to delete an existing resource', async () => {
    const blogToDelete = (await getAllBlogs())[0];
    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(401);
  });
});

describe('updating a blog (can only be done by the creator)', () => {
  test('returns 200 and successfully updates the blog if id + token are valid', async () => {
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'reservecrate', password: 'kennwort' });
    const { token } = loginData;
    const blogToUpdate = (await getAllBlogs())[0];
    blogToUpdate.user = blogToUpdate.user.toString();

    const updatedBlog = {
      ...blogToUpdate,
      title: 'Ruby is the best programming language in the entire world'
    };
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    let blogsAfter = await getAllBlogs();
    blogsAfter = blogsAfter.map(blog => {
      blog.user = blog.user.toString();
      return blog;
    });
    expect(blogsAfter).toContainEqual(updatedBlog);
  });
  test('fails with 401 if user attempts to update a resource not created by them', async () => {
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'breezehash', password: 'niemals' });
    const { token } = loginData;
    const blogToUpdate = (await getAllBlogs())[0];
    blogToUpdate.user = blogToUpdate.user.toString();

    const updatedBlog = {
      ...blogToUpdate,
      title: 'Ruby is the best programming language in the entire world'
    };
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBlog)
      .expect(401);
    let blogsAfter = await getAllBlogs();
    blogsAfter = blogsAfter.map(blog => {
      blog.user = blog.user.toString();
      return blog;
    });
    expect(blogsAfter).not.toContainEqual(updatedBlog);
  });
  test('fails with 400 if blog id is invalid', async () => {
    const { body: loginData } = await api
      .post('/api/login')
      .send({ username: 'reservecrate', password: 'kennwort' });
    const { token } = loginData;
    const blogToUpdate = (await getAllBlogs())[0];
    const updatedBlog = {
      ...blogToUpdate,
      title: 'Ruby is the best programming language in the entire world',
      likes: 420
    };
    await api
      .put('/api/blogs/doesnotexist')
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBlog)
      .expect(400);
    const blogsAfter = await getAllBlogs();
    expect(blogsAfter).not.toContainEqual(updatedBlog);
  });
  test('fails with 401 if anonymous (unauthorised) user attempts to update an existing resource', async () => {
    const blogToUpdate = (await getAllBlogs())[0];
    const updatedBlog = {
      ...blogToUpdate,
      title: 'Python is terrific'
    };
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(401);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
