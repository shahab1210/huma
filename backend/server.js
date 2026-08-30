require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cronRoutes = require('./routes/cronRoutes');

const app = express();

/* ── Security ── */
app.use(helmet());
// Setup CORS: Split comma-separated FRONTEND_URLs and strip trailing slashes
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''))
  : ['http://localhost:8443'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === normalizedOrigin) return true;
        // Allow dynamic Vercel previews if any Vercel domain is configured
        if (allowed.includes('.vercel.app') && normalizedOrigin.endsWith('.vercel.app')) return true;
        return false;
      });

      const isLocal = normalizedOrigin.startsWith('http://localhost') || normalizedOrigin.startsWith('http://127.0.0.1');

      if (isAllowed || isLocal) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin: ${origin} not matched in:`, allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

/* ── Rate limiting ── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // requests per window
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});
app.use('/api/auth', authLimiter);

// Stricter rate limit for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
});
app.use('/api/auth/send-whatsapp-otp', otpLimiter);
app.use('/api/auth/forgot-password/send-otp', otpLimiter);

/* ── Body parsing ── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Huma Mehendi API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/* ── API Routes ── */
app.use('/api/auth', authRoutes);
app.use('/api', serviceRoutes);
app.use('/api', bookingRoutes);
app.use('/api', paymentRoutes);
app.use('/api', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cron', cronRoutes);

/* ── 404 handler ── */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ── Error handler ── */
app.use(errorHandler);

/* ── Start server ── */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║   Huma Mehendi & Beauty Artist — API Server       ║
║   Port: ${PORT}                                      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   Frontend: ${process.env.FRONTEND_URL}           ║
╚═══════════════════════════════════════════════════╝
    `);
  });
};

startServer();

module.exports = app;
