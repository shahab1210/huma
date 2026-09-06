require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');

// Route imports
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cronRoutes = require('./routes/cronRoutes');
const locationRoutes = require('./routes/locationRoutes');
const serviceGroupRoutes = require('./routes/serviceGroupRoutes');
const whatsappRoutes = require("./routes/whatsappRoutes");

const app = express();

/* ── Trust Proxy ── */
app.set('trust proxy', 1);
app.use(cookieParser());

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
app.use('/api', locationRoutes);
app.use('/api', serviceGroupRoutes);
app.use("/api/whatsapp", whatsappRoutes);

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

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Huma Mehendi & Beauty Artist — API Server       ║
║   Port: ${PORT}                                      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   Frontend: ${allowedOrigins.join(', ')}           ║
╚═══════════════════════════════════════════════════╝
  `);
});

const initDB = async () => {
  try {
    await connectDB();

    // Auto-seed admin and settings on startup if database is fresh/empty
    const User = require('./models/User');
    const BusinessSettings = require('./models/BusinessSettings');
    const Location = require('./models/Location');
    const ServiceGroup = require('./models/ServiceGroup');

    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (!existingAdmin) {
      console.log('🌱 No admin user found. Auto-seeding admin account...');
      await User.create({
        fullName: 'Huma Admin',
        mobileNumber: 'admin',
        email: 'humamehendi1210@gmail.com',
        passwordHash: 'admin', // pre-save hook will hash it automatically
        role: 'ADMIN',
        isMobileVerified: true,
        isActive: true,
        authProviders: ['PASSWORD'],
      });
      console.log('✓ Admin user seeded successfully (admin / admin)');
    }

    const existingSettings = await BusinessSettings.findOne();
    if (!existingSettings) {
      console.log('🌱 No business settings found. Auto-seeding defaults...');
      await BusinessSettings.create({
        bookingAmount: 1500,
        upiId: 'demo@upi',
        upiQrImage: '',
        paymentWhatsApp: '+918960600371',
      });
      console.log('✓ Default business settings seeded');
    }

    // Auto-seed default service groups if none exist
    const existingGroups = await ServiceGroup.countDocuments();
    if (existingGroups === 0) {
      console.log('🌱 No service groups found. Auto-seeding defaults...');
      const defaultGroups = [
        { name: 'Bridal Mehendi', slug: 'bridal-mehendi', parentType: 'MEHENDI', shortDescription: 'Exquisite bridal henna designs for your special day', displayOrder: 1, isFeatured: true },
        { name: 'Arabic Mehendi', slug: 'arabic-mehendi', parentType: 'MEHENDI', shortDescription: 'Bold floral and geometric Arabic patterns', displayOrder: 2, isFeatured: true },
        { name: 'Traditional Mehendi', slug: 'traditional-mehendi', parentType: 'MEHENDI', shortDescription: 'Classic Indian henna with intricate traditional motifs', displayOrder: 3 },
        { name: 'Bridal Makeup', slug: 'bridal-makeup', parentType: 'MAKEUP', shortDescription: 'Complete bridal makeup and styling packages', displayOrder: 1, isFeatured: true },
        { name: 'Party Makeup', slug: 'party-makeup', parentType: 'MAKEUP', shortDescription: 'Glamorous makeup for occasions and celebrations', displayOrder: 2 },
        { name: 'Skin Care', slug: 'skin-care', parentType: 'PARLOUR', shortDescription: 'Professional skin treatments and facials', displayOrder: 1 },
        { name: 'Hair Care', slug: 'hair-care', parentType: 'PARLOUR', shortDescription: 'Hair styling, treatment and grooming services', displayOrder: 2 },
      ];
      await ServiceGroup.insertMany(defaultGroups);
      console.log('✓ Default service groups seeded');
    }

    // Auto-seed default locations if none exist
    const existingLocations = await Location.countDocuments();
    if (existingLocations === 0) {
      console.log('🌱 No locations found. Auto-seeding defaults...');
      // Get all service group IDs for linking
      const allGroups = await ServiceGroup.find({}, '_id');
      const groupIds = allGroups.map(g => g._id);

      const defaultLocations = [
        { name: 'Lucknow', slug: 'lucknow', shortDescription: 'Premium mehendi & beauty services in Lucknow', seoTitle: 'Best Mehendi Artist in Lucknow | Huma Mehendi', seoDescription: 'Looking for the best mehendi artist in Lucknow? Huma Mehendi offers professional bridal mehendi, Arabic henna, makeup & beauty services in Gomti Nagar, Hazratganj, Aminabad & across Lucknow.', seoKeywords: 'mehendi artist lucknow, best mehendi lucknow, bridal mehendi lucknow, wedding mehendi lucknow, henna artist lucknow', nearbyAreas: ['Gomti Nagar', 'Hazratganj', 'Aminabad', 'Alambagh', 'Indira Nagar', 'Aliganj'], availableServiceGroups: groupIds, displayOrder: 1 },
        { name: 'Kanpur', slug: 'kanpur', shortDescription: 'Professional mehendi & beauty services in Kanpur', seoTitle: 'Best Mehendi Artist in Kanpur | Huma Mehendi', seoDescription: 'Professional mehendi artist in Kanpur offering bridal mehendi, Arabic designs, makeup & beauty services in Civil Lines, Swaroop Nagar & across Kanpur.', seoKeywords: 'mehendi artist kanpur, best mehendi kanpur, bridal mehendi kanpur, henna artist kanpur', nearbyAreas: ['Civil Lines', 'Swaroop Nagar', 'Kidwai Nagar', 'Kakadeo'], availableServiceGroups: groupIds, displayOrder: 2 },
        { name: 'Raebareli', slug: 'raebareli', shortDescription: 'Expert mehendi & beauty artistry in Raebareli', seoTitle: 'Best Mehendi Artist in Raebareli | Huma Mehendi', seoDescription: 'Top mehendi artist in Raebareli providing bridal henna, Arabic mehendi, makeup & parlour services. Serving Raebareli city and nearby areas.', seoKeywords: 'mehendi artist raebareli, best mehendi raebareli, bridal mehendi raebareli, henna artist raebareli', nearbyAreas: ['City Center', 'Station Road', 'Civil Lines'], availableServiceGroups: groupIds, displayOrder: 3 },
        { name: 'Bachhrawan', slug: 'bachhrawan', shortDescription: 'Mehendi & beauty services in Bachhrawan, Raebareli', seoTitle: 'Mehendi Artist in Bachhrawan | Huma Mehendi', seoDescription: 'Professional mehendi and beauty services in Bachhrawan, Raebareli. Bridal mehendi, Arabic henna designs, makeup & parlour services available.', seoKeywords: 'mehendi artist bachhrawan, mehendi bachhrawan raebareli, bridal mehendi bachhrawan', nearbyAreas: ['Raebareli', 'Lalganj'], availableServiceGroups: groupIds, displayOrder: 4 },
        { name: 'Lalganj', slug: 'lalganj', shortDescription: 'Beautiful mehendi artistry in Lalganj, Raebareli', seoTitle: 'Mehendi Artist in Lalganj | Huma Mehendi', seoDescription: 'Expert mehendi artist in Lalganj, Raebareli offering bridal henna, Arabic designs, makeup & beauty services for weddings and occasions.', seoKeywords: 'mehendi artist lalganj, mehendi lalganj raebareli, bridal mehendi lalganj', nearbyAreas: ['Raebareli', 'Bachhrawan'], availableServiceGroups: groupIds, displayOrder: 5 },
        { name: 'Fatehpur', slug: 'fatehpur', shortDescription: 'Professional mehendi & beauty services in Fatehpur', seoTitle: 'Best Mehendi Artist in Fatehpur | Huma Mehendi', seoDescription: 'Professional mehendi artist in Fatehpur, Uttar Pradesh. Bridal mehendi, Arabic henna, makeup & beauty services for weddings and special occasions.', seoKeywords: 'mehendi artist fatehpur, best mehendi fatehpur, bridal mehendi fatehpur, henna artist fatehpur', nearbyAreas: ['Bindki', 'Khaga'], availableServiceGroups: groupIds, displayOrder: 6 },
        { name: 'Sandila, Hardoi', slug: 'sandila', shortDescription: 'Mehendi & beauty services in Sandila, Hardoi (near Lucknow)', seoTitle: 'Mehendi Artist in Sandila, Hardoi | Huma Mehendi', seoDescription: 'Expert mehendi artist in Sandila, Hardoi district near Lucknow. Professional bridal mehendi, Arabic henna designs, makeup & beauty services available.', seoKeywords: 'mehendi artist sandila, mehendi sandila hardoi, bridal mehendi sandila, henna artist sandila near lucknow', nearbyAreas: ['Hardoi', 'Lucknow', 'Shahjahanpur'], availableServiceGroups: groupIds, displayOrder: 7 },
      ];
      await Location.insertMany(defaultLocations);
      console.log('✓ Default locations seeded');
    }
  } catch (err) {
    console.error('✕ Failed to auto-seed database on start:', err.message);
  }
};

initDB();

module.exports = app;
