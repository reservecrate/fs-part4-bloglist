const _ = require('lodash');

const totalLikes = blogs => {
  return blogs.reduce((acc, blog) => acc + blog.likes, 0);
};

const favoriteBlog = blogs => {
  let mostLikedBlog = blogs[0];
  blogs.forEach(blog => {
    if (blog.likes > mostLikedBlog.likes) mostLikedBlog = blog;
  });
  return mostLikedBlog;
};

const mostBlogs = blogs => {
  const authors = blogs.map(blog => blog.author);
  const result = _.maxBy(_.toPairs(_.countBy(authors)), o => o[1]);
  return { author: result[0], blogs: result[1] };
};

const mostLikes = blogs => {
  const authorsAndLikes = {};
  blogs.forEach(blog => (authorsAndLikes[blog.author] = 0));
  blogs.forEach(blog => (authorsAndLikes[blog.author] += blog.likes));
  const result = _.maxBy(_.toPairs(authorsAndLikes), o => o[1]);
  return { author: result[0], likes: result[1] };
};

module.exports = { totalLikes, favoriteBlog, mostBlogs, mostLikes };
