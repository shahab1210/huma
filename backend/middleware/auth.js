const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request.
 * Returns 401 if no token or invalid token.
 */
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Explicit Authorization header has top priority
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Otherwise check cookies based on route context
    if (!token && req.cookies) {
      const isUrlAdmin = req.originalUrl.includes('/admin') ||
                         req.originalUrl.includes('/payments/') ||
                         req.originalUrl.includes('/verify') ||
                         req.originalUrl.includes('/partial') ||
                         req.originalUrl.includes('/reject');

      if (isUrlAdmin && req.cookies.huma_admin_token) {
        token = req.cookies.huma_admin_token;
      } else {
        token = req.cookies.huma_token || req.cookies.huma_admin_token;
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login to continue.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

/**
 * Require ADMIN role. Must be used AFTER requireAuth.
 * Returns 403 if user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

/**
 * Optional auth — attaches user if token present, but does not block.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies) {
      token = req.cookies.huma_token || req.cookies.huma_admin_token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (e) {
    // Silently ignore — user just not authenticated
  }
  next();
};

module.exports = { requireAuth, requireAdmin, optionalAuth };
