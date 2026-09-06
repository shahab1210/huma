/**
 * Reset Admin Script — Restores admin account to default credentials:
 *   - Mobile / User ID: admin
 *   - Password: admin
 *   - Security Question: What is your husband's school name?
 *   - Security Answer: huma
 *
 * Usage: npm run reset-admin
 */

require('dotenv').config();
const User = require('../models/User');
const connectDB = require('../config/db');

const resetAdmin = async () => {
  try {
    await connectDB();
    console.log('🔄 Resetting admin account credentials...');

    // Find existing admin or create new one
    let admin = await User.findOne({ role: 'ADMIN' });

    if (!admin) {
      admin = new User({
        fullName: 'Huma Admin',
        mobileNumber: 'admin',
        email: 'humamehendi1210@gmail.com',
        role: 'ADMIN',
        isMobileVerified: true,
        isActive: true,
      });
    }

    admin.mobileNumber = 'admin';
    admin.passwordHash = 'admin'; // Raw password: pre-save hook will hash cleanly once
    admin.securityQuestion = "What is your husband's school name?";
    admin.securityAnswerHash = ""; // Empty string defaults to answer 'huma'
    admin.isActive = true;
    admin.isMobileVerified = true;

    await admin.save();

    console.log('✅ Admin credentials reset successfully!');
    console.log('  ----------------------------------------');
    console.log('  User ID / Mobile: admin');
    console.log('  Password:         admin');
    console.log('  Security Question: What is your husband\'s school name?');
    console.log('  Security Answer:   huma');
    console.log('  ----------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

resetAdmin();
