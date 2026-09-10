const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getCookieOptions } = require('../config/cookieConfig');
const User = require('../models/User');
const Otp = require('../models/Otp');
const AdminSession = require('../models/AdminSession');
const generateToken = require('../utils/generateToken');
const { normalizeMobile } = require('../utils/phoneUtils');
const { sendWhatsAppOtp: deliverWhatsAppOtp } = require('../utils/whatsappService');
const { sendOTPEmail } = require('../utils/emailService');
const { sendSMSOTP } = require('../utils/smsService');
const { verifyGoogleToken, isGoogleConfigured } = require('../utils/googleAuthService');
const { ApiError } = require('../middleware/errorHandler');

/* ═══════════════════════════════════════════════════
   Feature flag helpers
   ═══════════════════════════════════════════════════ */

const isWhatsAppOtpEnabled = () => {
  const flag = process.env.WHATSAPP_OTP_ENABLED;
  return flag === 'true' || flag === '1';
};

/**
 * Normalize frontend purpose string to backend enums.
 */
const normalizePurpose = (purpose) => {
  if (!purpose || typeof purpose !== 'string') return purpose;
  const p = purpose.toUpperCase();
  if (p === 'REGISTER' || p === 'REGISTRATION' || p === 'GOOGLE-LINK') {
    return 'REGISTRATION';
  }
  if (p === 'FORGOT' || p === 'FORGOT-PASSWORD' || p === 'FORGOT_PASSWORD') {
    return 'FORGOT_PASSWORD';
  }
  if (p === 'CHANGE-MOBILE' || p === 'CHANGE_MOBILE') {
    return 'CHANGE_MOBILE';
  }
  return p;
};

/* ═══════════════════════════════════════════════════
   HELPER: Multi-channel OTP generation & delivery
   ═══════════════════════════════════════════════════ */

/**
 * Rate limit configuration per delivery method.
 */
const RATE_LIMITS = {
  EMAIL: {
    cooldownSeconds: 90,
    maxSends: 5,
    windowHours: 3,
    lockoutHours: 2,
  },
  SMS: {
    cooldownSeconds: 90,
    maxSends: 3,
    windowHours: 3,
    lockoutHours: 2,
  },
  WHATSAPP: {
    cooldownSeconds: 60,
    maxSends: 3,
    windowHours: 0.25, // 15 minutes
    lockoutHours: 0,
  },
};

/**
 * Generate a cryptographically secure 6-digit OTP, hash it, store it,
 * and send it via the specified channel.
 *
 * @param {string} identifier  Email or normalized phone number
 * @param {string} purpose     REGISTRATION | FORGOT_PASSWORD | CHANGE_MOBILE
 * @param {string} method      EMAIL | SMS | WHATSAPP
 * @returns {Promise<void>}
 */
const generateAndSendOtpMultiChannel = async (identifier, purpose, method) => {
  const limits = RATE_LIMITS[method] || RATE_LIMITS.WHATSAPP;
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;

  // ── Resend cooldown ──
  const latestOtp = await Otp.findOne({ identifier, purpose, method, isUsed: false })
    .sort({ createdAt: -1 });

  if (latestOtp && latestOtp.lastSentAt) {
    const elapsed = (Date.now() - latestOtp.lastSentAt.getTime()) / 1000;
    if (elapsed < limits.cooldownSeconds) {
      const remaining = Math.ceil(limits.cooldownSeconds - elapsed);
      throw new ApiError(429, `Please wait ${remaining} seconds before requesting another OTP.`);
    }
  }

  // ── Rate limit: max sends within rolling window ──
  const windowMs = limits.windowHours * 60 * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs);
  const recentCount = await Otp.countDocuments({
    identifier,
    purpose,
    method,
    createdAt: { $gte: windowStart },
  });

  if (recentCount >= limits.maxSends) {
    // Check if lockout period applies
    if (limits.lockoutHours > 0) {
      // Find the oldest OTP in the window to calculate lockout end
      const oldestInWindow = await Otp.findOne({
        identifier,
        purpose,
        method,
        createdAt: { $gte: windowStart },
      }).sort({ createdAt: 1 });

      if (oldestInWindow) {
        const lockoutEnd = new Date(oldestInWindow.createdAt.getTime() + windowMs + (limits.lockoutHours * 60 * 60 * 1000));
        const waitMinutes = Math.ceil((lockoutEnd.getTime() - Date.now()) / (60 * 1000));
        if (waitMinutes > 0) {
          throw new ApiError(429, `OTP limit reached. Please try again after ${waitMinutes > 60 ? Math.ceil(waitMinutes / 60) + ' hours' : waitMinutes + ' minutes'}.`);
        }
      }
    }
    throw new ApiError(429, 'Too many OTP requests. Please try again later.');
  }

  // ── Generate secure 6-digit code ──
  const otpCode = crypto.randomInt(100000, 999999).toString();

  // ── Hash the OTP ──
  const otpHash = await Otp.hashOtp(otpCode);

  // ── Invalidate any previous unused OTPs for this identifier+purpose+method ──
  await Otp.updateMany(
    { identifier, purpose, method, isUsed: false },
    { isUsed: true }
  );

  // ── Store new OTP ──
  const otpData = {
    identifier,
    otpHash,
    purpose,
    method,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    attempts: 0,
    isUsed: false,
    lastSentAt: new Date(),
  };

  // Also set mobileNumber for backward compatibility with admin queries
  if (method === 'WHATSAPP' || method === 'SMS') {
    otpData.mobileNumber = identifier;
  }

  await Otp.create(otpData);

  // ── Deliver via chosen channel ──
  try {
    switch (method) {
      case 'EMAIL':
        await sendOTPEmail(identifier, otpCode);
        break;
      case 'SMS':
        await sendSMSOTP(identifier, otpCode);
        break;
      case 'WHATSAPP':
        await deliverWhatsAppOtp(identifier, otpCode);
        break;
      default:
        throw new Error(`Unknown OTP delivery method: ${method}`);
    }
  } catch (err) {
    // Delivery failed → mark OTP as used so it can't be verified
    await Otp.updateMany(
      { identifier, purpose, method, isUsed: false },
      { isUsed: true }
    );
    const channelName = method === 'EMAIL' ? 'email' : method === 'SMS' ? 'SMS' : 'WhatsApp';
    const detail = err.message ? ` (${err.message})` : '';
    throw new ApiError(502, `Failed to send verification code via ${channelName}${detail}. Please try again.`);
  }
};

// Legacy wrapper: existing WhatsApp OTP function for admin code
const generateAndSendOtp = async (mobileNumber, purpose) => {
  return generateAndSendOtpMultiChannel(mobileNumber, purpose, 'WHATSAPP');
};

/**
 * Verify an OTP against the stored hash.
 *
 * @param {string} identifier  Email or normalized phone number
 * @param {string} otpCode     6-digit code from the user
 * @param {string} purpose     REGISTRATION | FORGOT_PASSWORD | CHANGE_MOBILE
 * @param {string} method      EMAIL | SMS | WHATSAPP (optional, auto-detects if not provided)
 * @returns {Promise<void>}    Resolves on success, throws on failure
 */
const verifyOtpCode = async (identifier, otpCode, purpose, method) => {
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;

  const query = {
    identifier,
    purpose,
    isUsed: false,
  };
  if (method) {
    query.method = method;
  }

  const otpRecord = await Otp.findOne(query).sort({ createdAt: -1 });

  if (!otpRecord) {
    // Also try legacy mobileNumber field for backward compatibility
    const legacyRecord = await Otp.findOne({
      mobileNumber: identifier,
      purpose,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!legacyRecord) {
      throw new ApiError(400, 'No active verification code found. Please request a new one.');
    }
    // Use legacy record
    return verifyOtpRecord(legacyRecord, otpCode, maxAttempts);
  }

  return verifyOtpRecord(otpRecord, otpCode, maxAttempts);
};

/**
 * Internal: verify an OTP record.
 */
const verifyOtpRecord = async (otpRecord, otpCode, maxAttempts) => {
  // Check expiry
  if (new Date() > otpRecord.expiresAt) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    throw new ApiError(400, 'Verification code has expired. Please request a new one.');
  }

  // Check attempts
  if (otpRecord.attempts >= maxAttempts) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    throw new ApiError(400, 'Too many incorrect attempts. Please request a new verification code.');
  }

  // Increment attempts
  otpRecord.attempts += 1;

  // Compare hash
  const isValid = await otpRecord.compareOtp(otpCode);
  if (!isValid) {
    await otpRecord.save();
    const remaining = maxAttempts - otpRecord.attempts;
    throw new ApiError(400, `Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
  }

  // Success → mark used
  otpRecord.isUsed = true;
  await otpRecord.save();
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/register
   Customer registration — multi-method support
   ═══════════════════════════════════════════════════ */

const register = async (req, res, next) => {
  try {
    const { fullName, mobileNumber, email, password, method } = req.body;
    const registrationMethod = (method || 'whatsapp').toUpperCase(); // EMAIL or WHATSAPP (SMS disabled)

    if (!fullName || !password) {
      throw new ApiError(400, 'Full name and password are required.');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters.');
    }

    if (registrationMethod === 'EMAIL') {
      // Email-first registration
      if (!email) {
        throw new ApiError(400, 'Email address is required.');
      }

      const emailLower = email.toLowerCase().trim();

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        throw new ApiError(400, 'Please enter a valid email address.');
      }

      // Check for existing verified user with this email
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        if (existingUser.isEmailVerified && existingUser.isActive) {
          throw new ApiError(400, 'An account with this email already exists. Please login.');
        }
        // Unverified user exists — remove it so they can re-register
        await User.deleteOne({ _id: existingUser._id });
      }

      // Create user as inactive until OTP verification
      await User.create({
        fullName,
        email: emailLower,
        passwordHash: password, // pre-save hook will hash
        role: 'CUSTOMER',
        isEmailVerified: false,
        isMobileVerified: false,
        isActive: false,
        authProviders: ['PASSWORD'],
      });

      // Send Email OTP
      await generateAndSendOtpMultiChannel(emailLower, 'REGISTRATION', 'EMAIL');

      return res.status(201).json({
        success: true,
        message: 'Registration initiated. Please verify your email with the OTP sent.',
        data: {
          identifier: emailLower,
          method: 'EMAIL',
        },
      });

    } else {
      // SMS/Mobile-first registration (default)
      if (!mobileNumber) {
        throw new ApiError(400, 'Mobile number is required.');
      }

      const normalizedMobile = normalizeMobile(mobileNumber);

      // Check for existing active or verified user
      const existingUser = await User.findOne({ mobileNumber: normalizedMobile });
      if (existingUser) {
        if (existingUser.isMobileVerified) {
          throw new ApiError(400, 'An account with this mobile number already exists. Please login.');
        }
        // Unverified user exists — remove it so they can re-register
        await User.deleteOne({ _id: existingUser._id });
      }

      // Create user as inactive until OTP verification
      await User.create({
        fullName,
        mobileNumber: normalizedMobile,
        email: email ? email.toLowerCase().trim() : undefined,
        passwordHash: password, // pre-save hook will hash
        role: 'CUSTOMER',
        isMobileVerified: false,
        isActive: false,
        authProviders: ['PASSWORD'],
      });

      // Send WhatsApp OTP (SMS temporarily disabled)
      await generateAndSendOtpMultiChannel(normalizedMobile, 'REGISTRATION', 'WHATSAPP');

      return res.status(201).json({
        success: true,
        message: 'Registration initiated. Please verify your mobile number with the OTP sent to your WhatsApp.',
        data: {
          identifier: normalizedMobile,
          method: 'WHATSAPP',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/email/send-otp
   Send OTP via Email
   ═══════════════════════════════════════════════════ */

const sendEmailOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      throw new ApiError(400, 'Email and purpose are required.');
    }

    const emailLower = email.toLowerCase().trim();
    const normalizedPurposeVal = normalizePurpose(purpose);
    const validPurposes = ['REGISTRATION', 'FORGOT_PASSWORD'];
    if (!validPurposes.includes(normalizedPurposeVal)) {
      throw new ApiError(400, 'Invalid OTP purpose.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      throw new ApiError(400, 'Please enter a valid email address.');
    }

    // Purpose-specific validation
    if (normalizedPurposeVal === 'REGISTRATION') {
      const user = await User.findOne({ email: emailLower });
      if (user && user.isEmailVerified && user.isActive) {
        throw new ApiError(400, 'This email is already registered and verified.');
      }
      if (!user) {
        throw new ApiError(400, 'Please complete the registration form first.');
      }
    }

    if (normalizedPurposeVal === 'FORGOT_PASSWORD') {
      const user = await User.findOne({
        email: emailLower,
        isEmailVerified: true,
        isActive: true,
      });
      if (!user) {
        // Return success to prevent account enumeration
        return res.json({
          success: true,
          message: 'If this email is registered, a verification code has been sent.',
        });
      }
    }

    await generateAndSendOtpMultiChannel(emailLower, normalizedPurposeVal, 'EMAIL');

    res.json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/email/verify-otp
   Verify Email OTP
   ═══════════════════════════════════════════════════ */

const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      throw new ApiError(400, 'Email, OTP, and purpose are required.');
    }

    const emailLower = email.toLowerCase().trim();
    const normalizedPurposeVal = normalizePurpose(purpose);

    await verifyOtpCode(emailLower, otp, normalizedPurposeVal, 'EMAIL');

    if (normalizedPurposeVal === 'REGISTRATION') {
      const user = await User.findOne({ email: emailLower });
      if (!user) {
        throw new ApiError(404, 'Registration data not found. Please register again.');
      }

      user.isEmailVerified = true;
      user.isActive = true;
      await user.save();

      const token = generateToken(user._id, user.role);
      res.cookie('huma_token', token, getCookieOptions(24 * 60 * 60 * 1000));

      return res.json({
        success: true,
        message: 'Email verified. Account activated successfully!',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    }

    if (normalizedPurposeVal === 'FORGOT_PASSWORD') {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      const user = await User.findOne({
        email: emailLower,
        isEmailVerified: true,
        isActive: true,
      });

      if (!user) {
        throw new ApiError(404, 'Account not found.');
      }

      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      return res.json({
        success: true,
        message: 'OTP verified. You may now set a new password.',
        data: { resetToken },
      });
    }

    res.json({ success: true, message: 'Verification successful.' });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/sms/send-otp
   Send OTP via SMS
   ═══════════════════════════════════════════════════ */

const sendSmsOtp = async (req, res, next) => {
  try {
    const { mobileNumber, purpose } = req.body;

    if (!mobileNumber || !purpose) {
      throw new ApiError(400, 'Mobile number and purpose are required.');
    }

    const normalizedPurposeVal = normalizePurpose(purpose);
    const validPurposes = ['REGISTRATION', 'FORGOT_PASSWORD', 'CHANGE_MOBILE'];
    if (!validPurposes.includes(normalizedPurposeVal)) {
      throw new ApiError(400, 'Invalid OTP purpose.');
    }

    const normalizedMobile = normalizeMobile(mobileNumber);

    // Purpose-specific validation
    if (normalizedPurposeVal === 'REGISTRATION') {
      const user = await User.findOne({ mobileNumber: normalizedMobile });
      if (user && user.isMobileVerified) {
        throw new ApiError(400, 'This mobile number is already registered and verified.');
      }
      if (!user) {
        throw new ApiError(400, 'Please complete the registration form first.');
      }
    }

    if (normalizedPurposeVal === 'FORGOT_PASSWORD') {
      const user = await User.findOne({
        mobileNumber: normalizedMobile,
        isMobileVerified: true,
        isActive: true,
      });
      if (!user) {
        return res.json({
          success: true,
          message: 'If this number is registered, a verification code has been sent via SMS.',
        });
      }
    }

    await generateAndSendOtpMultiChannel(normalizedMobile, normalizedPurposeVal, 'SMS');

    res.json({
      success: true,
      message: 'Verification code sent via SMS.',
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/sms/verify-otp
   Verify SMS OTP
   ═══════════════════════════════════════════════════ */

const verifySmsOtp = async (req, res, next) => {
  try {
    const { mobileNumber, otp, purpose } = req.body;

    if (!mobileNumber || !otp || !purpose) {
      throw new ApiError(400, 'Mobile number, OTP, and purpose are required.');
    }

    const normalizedMobile = normalizeMobile(mobileNumber);
    const normalizedPurposeVal = normalizePurpose(purpose);

    await verifyOtpCode(normalizedMobile, otp, normalizedPurposeVal, 'SMS');

    if (normalizedPurposeVal === 'REGISTRATION') {
      const user = await User.findOne({ mobileNumber: normalizedMobile });
      if (!user) {
        throw new ApiError(404, 'Registration data not found. Please register again.');
      }

      user.isMobileVerified = true;
      user.isActive = true;
      await user.save();

      const token = generateToken(user._id, user.role);
      res.cookie('huma_token', token, getCookieOptions(24 * 60 * 60 * 1000));

      return res.json({
        success: true,
        message: 'Mobile number verified. Account activated successfully!',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    }

    if (normalizedPurposeVal === 'FORGOT_PASSWORD') {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      const user = await User.findOne({
        mobileNumber: normalizedMobile,
        isMobileVerified: true,
        isActive: true,
      });

      if (!user) {
        throw new ApiError(404, 'Account not found.');
      }

      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      return res.json({
        success: true,
        message: 'OTP verified. You may now set a new password.',
        data: { resetToken },
      });
    }

    res.json({ success: true, message: 'Verification successful.' });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/send-whatsapp-otp
   Send OTP via WhatsApp (preserved, gated by feature flag)
   ═══════════════════════════════════════════════════ */

const sendOtp = async (req, res, next) => {
  try {
    const { mobileNumber, purpose } = req.body;

    if (!mobileNumber || !purpose) {
      throw new ApiError(400, 'Mobile number and purpose are required.');
    }

    const normalizedPurposeVal = normalizePurpose(purpose);
    const validPurposes = ['REGISTRATION', 'FORGOT_PASSWORD', 'CHANGE_MOBILE'];
    if (!validPurposes.includes(normalizedPurposeVal)) {
      throw new ApiError(400, 'Invalid OTP purpose.');
    }

    const normalizedMobile = normalizeMobile(mobileNumber);

    if (normalizedPurposeVal === 'REGISTRATION') {
      const user = await User.findOne({ mobileNumber: normalizedMobile });
      if (user && user.isMobileVerified) {
        throw new ApiError(400, 'This mobile number is already registered and verified.');
      }
      if (!user) {
        throw new ApiError(400, 'Please complete the registration form first.');
      }
    }

    if (normalizedPurposeVal === 'FORGOT_PASSWORD') {
      const user = await User.findOne({
        mobileNumber: normalizedMobile,
        isMobileVerified: true,
        isActive: true,
      });
      if (!user) {
        return res.json({
          success: true,
          message: 'If this number is registered, a verification code has been sent to your WhatsApp.',
        });
      }
    }

    await generateAndSendOtpMultiChannel(normalizedMobile, normalizedPurposeVal, 'WHATSAPP');

    res.json({
      success: true,
      message: 'Verification code sent to your WhatsApp.',
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/verify-whatsapp-otp
   Verify WhatsApp OTP (preserved)
   ═══════════════════════════════════════════════════ */

const verifyOtp = async (req, res, next) => {
  try {
    const { mobileNumber, otp, purpose } = req.body;

    if (!mobileNumber || !otp || !purpose) {
      throw new ApiError(400, 'Mobile number, OTP, and purpose are required.');
    }

    const normalizedMobile = normalizeMobile(mobileNumber);
    const normalizedPurposeVal = normalizePurpose(purpose);

    await verifyOtpCode(normalizedMobile, otp, normalizedPurposeVal, 'WHATSAPP');

    if (normalizedPurposeVal === 'REGISTRATION') {
      const user = await User.findOne({ mobileNumber: normalizedMobile });
      if (!user) {
        throw new ApiError(404, 'Registration data not found. Please register again.');
      }

      user.isMobileVerified = true;
      user.isActive = true;
      await user.save();

      const token = generateToken(user._id, user.role);
      res.cookie('huma_token', token, getCookieOptions(24 * 60 * 60 * 1000));

      return res.json({
        success: true,
        message: 'Mobile number verified. Account activated successfully!',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    }

    if (normalizedPurposeVal === 'FORGOT_PASSWORD') {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      const user = await User.findOne({
        mobileNumber: normalizedMobile,
        isMobileVerified: true,
        isActive: true,
      });

      if (!user) {
        throw new ApiError(404, 'Account not found.');
      }

      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      return res.json({
        success: true,
        message: 'OTP verified. You may now set a new password.',
        data: { resetToken },
      });
    }

    res.json({ success: true, message: 'Verification successful.' });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/login
   Customer login — email/mobile + password → JWT
   ═══════════════════════════════════════════════════ */

const login = async (req, res, next) => {
  try {
    const { mobileNumber, email, identifier: rawIdentifier, password } = req.body;

    // Support multiple input field names
    const loginId = rawIdentifier || email || mobileNumber;

    if (!loginId || !password) {
      throw new ApiError(400, 'Email/mobile number and password are required.');
    }

    let user;

    // Detect if input is email (contains @) or mobile number
    if (loginId.includes('@')) {
      // Email login
      const emailLower = loginId.toLowerCase().trim();
      user = await User.findOne({ email: emailLower, role: 'CUSTOMER' });
    } else {
      // Mobile login
      const normalizedMobile = normalizeMobile(loginId);
      user = await User.findOne({ mobileNumber: normalizedMobile, role: 'CUSTOMER' });
    }

    if (!user) {
      throw new ApiError(401, 'Invalid credentials.');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Your account has been deactivated. Contact support.');
    }

    // Check that at least one verification is done
    if (!user.isMobileVerified && !user.isEmailVerified) {
      throw new ApiError(401, 'Please verify your account first.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials.');
    }

    const token = generateToken(user._id, user.role);
    res.cookie('huma_token', token, getCookieOptions(24 * 60 * 60 * 1000));

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/google
   Google authentication — verify token, login or
   request mobile verification
   ═══════════════════════════════════════════════════ */

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      throw new ApiError(400, 'Google ID token is required.');
    }

    if (!isGoogleConfigured()) {
      throw new ApiError(503, 'Google authentication is not available at this time.');
    }

    const googleProfile = await verifyGoogleToken(idToken);

    // 1. Check for existing user with this Google ID
    let user = await User.findOne({ googleId: googleProfile.googleId });

    if (user) {
      if (!user.isActive) {
        throw new ApiError(401, 'Your account has been deactivated. Contact support.');
      }

      const token = generateToken(user._id, user.role);
      res.cookie('huma_token', token, getCookieOptions(24 * 60 * 60 * 1000));

      return res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    }

    // 2. Check for existing user with matching email (safe linking)
    if (googleProfile.email) {
      const emailLower = googleProfile.email.toLowerCase().trim();
      user = await User.findOne({ email: emailLower, isActive: true });

      if (user) {
        user.googleId = googleProfile.googleId;
        if (!user.authProviders.includes('GOOGLE')) {
          user.authProviders.push('GOOGLE');
        }
        if (googleProfile.emailVerified) {
          user.isEmailVerified = true;
        }
        await user.save();

        const token = generateToken(user._id, user.role);
        res.cookie('huma_token', token, getCookieOptions(24 * 60 * 60 * 1000));

        return res.json({
          success: true,
          message: 'Google account linked and login successful.',
          data: {
            user: user.toJSON(),
            token,
          },
        });
      }
    }

    // 3. New Google user — create account directly without mobile requirement
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const emailLower = googleProfile.email ? googleProfile.email.toLowerCase().trim() : undefined;

    user = await User.create({
      fullName: googleProfile.name || 'Google User',
      email: emailLower,
      googleId: googleProfile.googleId,
      passwordHash: randomPassword,
      role: 'CUSTOMER',
      isEmailVerified: Boolean(googleProfile.emailVerified),
      isMobileVerified: false,
      isActive: true,
      authProviders: ['GOOGLE'],
    });

    const token = generateToken(user._id, user.role);
    res.cookie('huma_token', token, getCookieOptions(24 * 60 * 60 * 1000));

    return res.json({
      success: true,
      message: 'Google registration and login successful.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/google/complete-registration
   Complete Google registration with mobile + password
   ═══════════════════════════════════════════════════ */

const completeGoogleRegistration = async (req, res, next) => {
  try {
    const { idToken, mobileNumber, password, fullName } = req.body;

    if (!idToken || !mobileNumber || !password || !fullName) {
      throw new ApiError(400, 'Google token, full name, mobile number, and password are required.');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters.');
    }

    const googleProfile = await verifyGoogleToken(idToken);
    const normalizedMobile = normalizeMobile(mobileNumber);

    const existingUser = await User.findOne({ mobileNumber: normalizedMobile });
    if (existingUser && existingUser.isMobileVerified) {
      throw new ApiError(400, 'An account with this mobile number already exists. Please login and link Google from your profile.');
    }

    if (existingUser && !existingUser.isMobileVerified) {
      await User.deleteOne({ _id: existingUser._id });
    }

    const existingGoogleUser = await User.findOne({ googleId: googleProfile.googleId });
    if (existingGoogleUser) {
      throw new ApiError(400, 'This Google account is already linked to another Huma account.');
    }

    await User.create({
      fullName,
      mobileNumber: normalizedMobile,
      email: googleProfile.email ? googleProfile.email.toLowerCase().trim() : undefined,
      passwordHash: password,
      role: 'CUSTOMER',
      isMobileVerified: false,
      isEmailVerified: googleProfile.emailVerified || false,
      isActive: false,
      googleId: googleProfile.googleId,
      authProviders: ['PASSWORD', 'GOOGLE'],
    });

    // Send WhatsApp OTP for mobile verification (SMS temporarily disabled)
    await generateAndSendOtpMultiChannel(normalizedMobile, 'REGISTRATION', 'WHATSAPP');

    res.json({
      success: true,
      message: 'Verification code sent to your WhatsApp. Please verify to complete registration.',
      data: {
        mobileNumber: normalizedMobile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/google/link
   Link Google account to existing authenticated user
   ═══════════════════════════════════════════════════ */

const linkGoogleAccount = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      throw new ApiError(400, 'Google ID token is required.');
    }

    const googleProfile = await verifyGoogleToken(idToken);

    const existingGoogleUser = await User.findOne({ googleId: googleProfile.googleId });
    if (existingGoogleUser) {
      if (existingGoogleUser._id.toString() === req.user._id.toString()) {
        return res.json({
          success: true,
          message: 'This Google account is already linked to your profile.',
          data: { user: req.user },
        });
      }
      throw new ApiError(400, 'This Google account is already linked to another Huma account.');
    }

    const user = await User.findById(req.user._id);
    user.googleId = googleProfile.googleId;
    if (googleProfile.email && !user.email) {
      user.email = googleProfile.email;
    }
    if (googleProfile.emailVerified && googleProfile.email === user.email) {
      user.isEmailVerified = true;
    }
    if (!user.authProviders.includes('GOOGLE')) {
      user.authProviders.push('GOOGLE');
    }
    await user.save();

    res.json({
      success: true,
      message: 'Google account linked successfully!',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/forgot-password/send-otp
   Send OTP for password recovery (email or SMS)
   ═══════════════════════════════════════════════════ */

const forgotPasswordSendOtp = async (req, res, next) => {
  try {
    const { mobileNumber, email, method } = req.body;
    const otpMethod = (method || 'WHATSAPP').toUpperCase();

    if (otpMethod === 'EMAIL') {
      if (!email) {
        throw new ApiError(400, 'Email address is required.');
      }

      const emailLower = email.toLowerCase().trim();

      const user = await User.findOne({
        email: emailLower,
        isEmailVerified: true,
        isActive: true,
      });

      if (!user) {
        return res.json({
          success: true,
          message: 'If this email is registered, a verification code has been sent.',
        });
      }

      await generateAndSendOtpMultiChannel(emailLower, 'FORGOT_PASSWORD', 'EMAIL');

      return res.json({
        success: true,
        message: 'If this email is registered, a verification code has been sent.',
      });
    } else {
      // WhatsApp (default — SMS temporarily disabled)
      if (!mobileNumber) {
        throw new ApiError(400, 'Mobile number is required.');
      }

      const normalizedMobile = normalizeMobile(mobileNumber);

      const user = await User.findOne({
        mobileNumber: normalizedMobile,
        isMobileVerified: true,
        isActive: true,
      });

      if (!user) {
        return res.json({
          success: true,
          message: 'If this number is registered, a verification code has been sent to your WhatsApp.',
        });
      }

      await generateAndSendOtpMultiChannel(normalizedMobile, 'FORGOT_PASSWORD', 'WHATSAPP');

      return res.json({
        success: true,
        message: 'If this number is registered, a verification code has been sent to your WhatsApp.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/forgot-password/verify-otp
   Verify OTP for password recovery → return reset token
   ═══════════════════════════════════════════════════ */

const forgotPasswordVerifyOtp = async (req, res, next) => {
  try {
    const { mobileNumber, email, otp, method } = req.body;
    const otpMethod = (method || 'WHATSAPP').toUpperCase();

    let identifier, user;

    if (otpMethod === 'EMAIL') {
      if (!email || !otp) {
        throw new ApiError(400, 'Email and OTP are required.');
      }
      identifier = email.toLowerCase().trim();

      await verifyOtpCode(identifier, otp, 'FORGOT_PASSWORD', 'EMAIL');

      user = await User.findOne({
        email: identifier,
        isEmailVerified: true,
        isActive: true,
      });
    } else {
      if (!mobileNumber || !otp) {
        throw new ApiError(400, 'Mobile number and OTP are required.');
      }
      identifier = normalizeMobile(mobileNumber);

      await verifyOtpCode(identifier, otp, 'FORGOT_PASSWORD', 'WHATSAPP');

      user = await User.findOne({
        mobileNumber: identifier,
        isMobileVerified: true,
        isActive: true,
      });
    }

    if (!user) {
      throw new ApiError(404, 'Account not found.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified. You may now set a new password.',
      data: { resetToken },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/reset-password
   Set new password using reset token
   ═══════════════════════════════════════════════════ */

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      throw new ApiError(400, 'Reset token and new password are required.');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters.');
    }

    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true,
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset link. Please try again.');
    }

    user.passwordHash = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    if (!user.authProviders.includes('PASSWORD')) {
      user.authProviders.push('PASSWORD');
      await user.save();
    }

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   Admin Security & Device Fingerprint Utilities
   (PRESERVED — NO CHANGES)
   ═══════════════════════════════════════════════════ */

const getDeviceFingerprint = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const clientFingerprint = req.headers['x-device-fingerprint'] || '';
  return crypto.createHash('sha256').update(`${userAgent}::${clientFingerprint}`).digest('hex');
};

const generateAdminTokens = async (user, fingerprint, req) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await AdminSession.create({
    adminId: user._id,
    refreshTokenHash,
    deviceFingerprint: fingerprint,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    expiresAt,
    isValid: true,
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

/* ═══════════════════════════════════════════════════
   Admin Login, Security, Credentials — ALL PRESERVED
   ═══════════════════════════════════════════════════ */

const adminLogin = async (req, res, next) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      throw new ApiError(400, 'Credentials are required.');
    }

    const user = await User.findOne({ mobileNumber, role: 'ADMIN' });
    if (!user) {
      throw new ApiError(401, 'Invalid admin credentials.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid admin credentials.');
    }

    const tempToken = jwt.sign(
      { adminId: user._id, securityPending: true },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({
      success: true,
      message: 'Credentials valid. Please answer security challenge.',
      data: {
        awaitingSecurityAnswer: true,
        tempToken,
        question: user.securityQuestion || "What is your husband's school name?",
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminVerifySecurityAnswer = async (req, res, next) => {
  try {
    const { tempToken, securityAnswer } = req.body;
    if (!tempToken || !securityAnswer) {
      throw new ApiError(400, 'Verification parameters are required.');
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Verification window expired. Please log in again.');
    }

    if (!decoded.securityPending || !decoded.adminId) {
      throw new ApiError(400, 'Invalid verification token.');
    }

    const user = await User.findById(decoded.adminId);
    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(401, 'Invalid admin identity.');
    }

    const isMatch = await user.compareSecurityAnswer(securityAnswer);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid security answer.');
    }

    const fingerprint = getDeviceFingerprint(req);
    const { accessToken, refreshToken } = await generateAdminTokens(user, fingerprint, req);

    res.cookie('huma_admin_token', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('huma_admin_refresh', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.json({
      success: true,
      message: 'Admin verification successful.',
      data: {
        user: user.toJSON(),
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.huma_admin_refresh || req.body.refreshToken;
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required.');
    }

    const fingerprint = getDeviceFingerprint(req);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await AdminSession.findOne({
      refreshTokenHash: tokenHash,
      isValid: true,
      expiresAt: { $gt: new Date() },
    }).populate('adminId');

    if (!session) {
      throw new ApiError(401, 'Invalid or expired session. Please log in again.');
    }

    const adminId = session.adminId?._id || session.adminId;

    if (session.deviceFingerprint !== fingerprint) {
      if (adminId) {
        await AdminSession.updateMany({ adminId }, { isValid: false });
      }
      throw new ApiError(401, 'Security alert: device mismatch detected. All sessions revoked.');
    }

    session.isValid = false;
    await session.save();

    const { accessToken, refreshToken: newRefreshToken } = await generateAdminTokens(
      session.adminId,
      fingerprint,
      req
    );

    res.cookie('huma_admin_token', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('huma_admin_refresh', newRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ── Admin Credential Update (WhatsApp OTP to +918960600371) — PRESERVED ── */

const updateAdminCredentialsRequest = async (req, res, next) => {
  try {
    const { newMobileNumber, newPassword, newSecurityQuestion, newSecurityAnswer } = req.body;
    if (!newMobileNumber && !newPassword && !newSecurityQuestion && !newSecurityAnswer) {
      throw new ApiError(400, 'Please provide settings updates.');
    }

    const targetMobile = '+918960600371';
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = await Otp.hashOtp(otpCode);

    await Otp.updateMany(
      { identifier: targetMobile, purpose: 'ADMIN_UPDATE', isUsed: false },
      { isUsed: true }
    );
    // Also update legacy field queries
    await Otp.updateMany(
      { mobileNumber: targetMobile, purpose: 'ADMIN_UPDATE', isUsed: false },
      { isUsed: true }
    );

    await Otp.create({
      identifier: targetMobile,
      mobileNumber: targetMobile,
      otpHash,
      purpose: 'ADMIN_UPDATE',
      method: 'WHATSAPP',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      isUsed: false,
      lastSentAt: new Date(),
    });

    await deliverWhatsAppOtp(targetMobile, otpCode);

    const payload = {
      adminId: req.user._id,
      newMobileNumber,
      newSecurityQuestion,
      newPassword,
    };

    if (newSecurityAnswer) {
      const salt = await bcrypt.genSalt(12);
      payload.newSecurityAnswerHash = await bcrypt.hash(newSecurityAnswer.toLowerCase().trim(), salt);
    }

    const updateToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5m' });

    res.json({
      success: true,
      message: 'OTP sent to Huma\'s WhatsApp for verification.',
      data: { updateToken },
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminCredentialsVerify = async (req, res, next) => {
  try {
    const { updateToken, otpCode } = req.body;
    if (!updateToken || !otpCode) {
      throw new ApiError(400, 'Verification parameters are required.');
    }

    let decoded;
    try {
      decoded = jwt.verify(updateToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Update session expired. Please request credentials change again.');
    }

    const mobileNumber = '+918960600371';
    const purpose = 'ADMIN_UPDATE';

    // Try new identifier field first, fallback to legacy mobileNumber
    let otpRecord = await Otp.findOne({
      identifier: mobileNumber,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      otpRecord = await Otp.findOne({
        mobileNumber,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });
    }

    if (!otpRecord) {
      throw new ApiError(400, 'OTP expired or not found. Please request a new one.');
    }

    if (otpRecord.attempts >= 3) {
      otpRecord.isUsed = true;
      await otpRecord.save();
      throw new ApiError(400, 'Too many invalid attempts. This OTP is now locked.');
    }

    const isOtpValid = await otpRecord.compareOtp(otpCode);
    if (!isOtpValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new ApiError(400, `Invalid verification code. ${3 - otpRecord.attempts} attempts remaining.`);
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const admin = await User.findById(decoded.adminId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new ApiError(404, 'Admin record not found.');
    }

    if (decoded.newMobileNumber) {
      const exists = await User.findOne({ mobileNumber: decoded.newMobileNumber, _id: { $ne: admin._id } });
      if (exists) {
        throw new ApiError(400, 'Mobile number is already in use by another user.');
      }
      admin.mobileNumber = decoded.newMobileNumber;
    }

    if (decoded.newPassword) {
      admin.passwordHash = decoded.newPassword;
    } else if (decoded.newPasswordHash) {
      admin.passwordHash = decoded.newPasswordHash;
    }

    if (decoded.newSecurityQuestion) {
      admin.securityQuestion = decoded.newSecurityQuestion;
    }

    if (decoded.newSecurityAnswerHash) {
      admin.securityAnswerHash = decoded.newSecurityAnswerHash;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Admin credentials updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   Logout, GetMe, Admin PIN — ALL PRESERVED
   ═══════════════════════════════════════════════════ */

const logout = async (req, res) => {
  res.clearCookie('huma_token', { path: '/' });
  res.clearCookie('huma_admin_token', { path: '/' });
  res.clearCookie('huma_admin_refresh', { path: '/' });
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

const setAdminPin = async (req, res, next) => {
  try {
    const { pin, currentPin } = req.body;
    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      throw new ApiError(400, 'PIN must be 4-6 digits.');
    }
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(403, 'Unauthorized.');
    }
    if (user.securityPinHash) {
      if (!currentPin) {
        throw new ApiError(400, 'Current PIN is required to change PIN.');
      }
      const isMatch = await user.comparePin(currentPin);
      if (!isMatch) {
        throw new ApiError(401, 'Current PIN is incorrect.');
      }
    }
    const salt = await bcrypt.genSalt(10);
    user.securityPinHash = await bcrypt.hash(pin, salt);
    await user.save();
    res.json({ success: true, message: 'Security PIN updated successfully.' });
  } catch (error) {
    next(error);
  }
};

const verifyAdminPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      throw new ApiError(400, 'PIN is required.');
    }
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(403, 'Unauthorized.');
    }
    if (!user.securityPinHash) {
      throw new ApiError(400, 'Security PIN has not been set. Please set your PIN first.');
    }
    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      throw new ApiError(401, 'Incorrect PIN.');
    }
    res.json({ success: true, message: 'PIN verified.' });
  } catch (error) {
    next(error);
  }
};

const resetAdminPin = async (req, res, next) => {
  try {
    const { pin, updateToken, otp } = req.body;
    if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      throw new ApiError(400, 'New PIN must be 4-6 digits.');
    }
    if (!updateToken || !otp) {
      throw new ApiError(400, 'OTP verification is required to reset PIN.');
    }
    const targetMobile = '+918960600371';
    // Try new identifier field first, fallback to legacy
    let otpRecord = await Otp.findOne({
      identifier: targetMobile,
      purpose: 'ADMIN_UPDATE',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      otpRecord = await Otp.findOne({
        mobileNumber: targetMobile,
        purpose: 'ADMIN_UPDATE',
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });
    }

    if (!otpRecord) {
      throw new ApiError(401, 'OTP expired or invalid. Please request a new one.');
    }
    if (otpRecord.attempts >= 5) {
      throw new ApiError(429, 'Too many failed attempts. Request a new OTP.');
    }
    const isOtpMatch = await otpRecord.compareOtp(otp);
    if (!isOtpMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new ApiError(401, 'Incorrect OTP.');
    }
    otpRecord.isUsed = true;
    await otpRecord.save();
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(403, 'Unauthorized.');
    }
    const salt = await bcrypt.genSalt(10);
    user.securityPinHash = await bcrypt.hash(pin, salt);
    await user.save();
    res.json({ success: true, message: 'Security PIN has been reset successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  sendEmailOtp,
  verifyEmailOtp,
  sendSmsOtp,
  verifySmsOtp,
  sendOtp,
  verifyOtp,
  login,
  googleAuth,
  completeGoogleRegistration,
  linkGoogleAccount,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
  adminLogin,
  adminVerifySecurityAnswer,
  adminRefreshToken,
  updateAdminCredentialsRequest,
  updateAdminCredentialsVerify,
  logout,
  getMe,
  setAdminPin,
  verifyAdminPin,
  resetAdminPin,
};
