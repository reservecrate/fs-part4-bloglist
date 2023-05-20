const jwt = require('jsonwebtoken');
const logger = require('./logger');
const User = require('../models/user');

const requestLogger = (req, res, next) => {
  logger.info('Method:', req.method);
  logger.info('Path:  ', req.path);
  logger.info('Body:  ', req.body);
  logger.info('---');
  next();
};

const unknownEndpoint = (req, res) =>
  res.status(404).send({ error: 'unknown endpoint' });

const errorHandler = (err, req, res, next) => {
  logger.error(err.message);
  if (err.name === 'CastError') {
    return res
      .status(400)
      .send({ error: `${err.message} (wrong/malformatted id)` });
  } else if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  } else if (err.name === 'JsonWebTokenError') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

const userExtractor = async (req, res, next) => {
  const authorization = req.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    const decodedToken = jwt.verify(
      authorization.replace('Bearer ', ''),
      process.env.SECRET
    );
    if (!decodedToken.id)
      return res.status(401).json({ error: 'invalid token' });
    req.user = await User.findById(decodedToken.id);
  }
  next();
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  userExtractor
};
