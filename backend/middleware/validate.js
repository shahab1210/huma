const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator results.
 * Returns 400 with error messages if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
      errors: errors.array(),
    });
  }
  next();
};

module.exports = { validate };
