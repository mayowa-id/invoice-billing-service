import logger from '../lib/logger.js';

export default function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
    return res.status(statusCode).json({
      error: message,
      details: err.errors,
    });
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database Validation Error';
    return res.status(statusCode).json({
      error: message,
      details: err.message,
    });
  }

  // Handle duplicate key errors (MongoDB)
  if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate field: ${Object.keys(err.keyPattern)[0]}`;
    return res.status(statusCode).json({
      error: message,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Generic error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
