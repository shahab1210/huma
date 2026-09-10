/**
 * Centralized error handler middleware.
 * Catches all errors and returns consistent JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    const label = field === 'mobileNumber' ? 'mobile number' : field === 'email' ? 'email address' : field === 'googleId' ? 'Google account' : field;
    message = `An account with this ${label} already exists. Please login.`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path || 'identifier'}.`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please login again.';
  }

  // Server-side logging
  if (statusCode >= 500) {
    console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err.stack || err.message);
    // Sanitize message for unhandled 500 server errors
    if (!err.statusCode) {
      message = 'Unable to process request. Please try again.';
    }
  } else {
    console.warn(`[WARN ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  // Safe client response (never leak stack trace, collection names, or DB internals)
  const isDev = process.env.NODE_ENV === 'development' && process.env.EXPOSE_STACK_TRACE === 'true';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

/**
 * Custom API error class
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, ApiError };
