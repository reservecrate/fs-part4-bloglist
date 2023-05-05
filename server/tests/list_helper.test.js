const listHelper = require('../utils/list_helper');
const blogs = require('./test_helper').initialBlogs;

describe('totalLikes()', () => {
  test('of empty list is 0', () => {
    const result = listHelper.totalLikes([]);
    expect(result).toBe(0);
  });
  test('of 1 blog', () => {
    const result = listHelper.totalLikes([blogs[0]]);
    expect(result).toBe(7);
  });
  test('of full list of blogs', () => {
    const result = listHelper.totalLikes(blogs);
    expect(result).toBe(37);
  });
});

describe('favoriteBlog()', () => {
  test('returns the blog with the most likes', () => {
    const result = listHelper.favoriteBlog(blogs);
    expect(result).toEqual({
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12
    });
  });
});

describe('mostBlogs()', () => {
  test('returns the author with the most blogs and their number of blogs', () => {
    const result = listHelper.mostBlogs(blogs);
    expect(result).toEqual({
      author: 'Robert C. Martin',
      blogs: 3
    });
  });
});

describe('mostLikes()', () => {
  test('returns the author with the most likes and their number of likes', () => {
    const result = listHelper.mostLikes(blogs);
    expect(result).toEqual({
      author: 'Edsger W. Dijkstra',
      likes: 17
    });
  });
});
