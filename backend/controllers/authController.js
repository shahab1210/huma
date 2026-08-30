const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const AdminSession = require('../models/AdminSession');
const generateToken = require('../utils/generateToken');
const { normalizeMobile } = require('../utils/phoneUtils');
const { sendWhatsAppOtp: deliverWhatsAppOtp } = require('../utils/whatsappService');
const { verifyGoogleToken, isGoogleConfigured } = require('../utils/googleAuthService');
const { ApiError } = require('../middleware/errorHandler');

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
   HELPER: Generate & store a secure OTP
   ═══════════════════════════════════════════════════ */

/**
 * Generate a cryptographically secure 6-digit OTP, hash it, store it,
 * and send it via WhatsApp.
 *
 * Enforces:
 *  - resend cooldown  (default 60 s)
 *  - max requests per number per 15-min window
 *
 * @param {string} mobileNumber  Normalized +91XXXXXXXXXX
 * @param {string} purpose       REGISTRATION | FORGOT_PASSWORD | CHANGE_MOBILE
 * @returns {Promise<void>}
 */
const generateAndSendOtp = async (mobileNumber, purpose) => {
  const cooldownSeconds = 60; // Strict resend cooling period of 60 seconds
  const maxRequests = 3;      // Strict customer OTP request cap of 3 requests
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;

  // ── Resend cooldown ──
  const latestOtp = await Otp.findOne({ mobileNumber, purpose, isUsed: false })
    .sort({ createdAt: -1 });

  if (latestOtp && latestOtp.lastSentAt) {
    const elapsed = (Date.now() - latestOtp.lastSentAt.getTime()) / 1000;
    if (elapsed < cooldownSeconds) {
      const remaining = Math.ceil(cooldownSeconds - elapsed);
      throw new ApiError(429, `Please wait ${remaining} seconds before requesting another OTP.`);
    }
  }

  // ── Rate limit: max OTPs per number in 15-min window ──
  const windowStart = new Date(Date.now() - 15 * 60 * 1000);
  const recentCount = await Otp.countDocuments({
    mobileNumber,
    purpose,
    createdAt: { $gte: windowStart },
  });
  if (recentCount >= maxRequests) {
    throw new ApiError(429, 'Too many OTP requests. Please try again later.');
  }

  // ── Generate secure 6-digit code ──
  const otpCode = crypto.randomInt(100000, 999999).toString();

  // ── Hash the OTP ──
  const otpHash = await Otp.hashOtp(otpCode);

  // ── Invalidate any previous unused OTPs for this number+purpose ──
  await Otp.updateMany(
    { mobileNumber, purpose, isUsed: false },
    { isUsed: true }
  );

  // ── Store new OTP ──
  await Otp.create({
    mobileNumber,
    otpHash,
    purpose,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    attempts: 0,
    isUsed: false,
    lastSentAt: new Date(),
  });

  // ── Send via WhatsApp ──
  try {
    await deliverWhatsAppOtp(mobileNumber, otpCode);
  } catch (err) {
    // Delivery failed → mark OTP as used so it can't be verified
    await Otp.updateMany(
      { mobileNumber, purpose, isUsed: false },
      { isUsed: true }
    );
    throw new ApiError(502, 'Failed to send verification code via WhatsApp. Please try again.');
  }
};

/**
 * Verify an OTP against the stored hash.
 *
 * Enforces expiration, attempt limits, and single-use.
 *
 * @param {string} mobileNumber  Normalized +91XXXXXXXXXX
 * @param {string} otpCode       6-digit code from the user
 * @param {string} purpose       REGISTRATION | FORGOT_PASSWORD | CHANGE_MOBILE
 * @returns {Promise<void>}      Resolves on success, throws on failure
 */
const verifyOtpCode = async (mobileNumber, otpCode, purpose) => {
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;

  const otpRecord = await Otp.findOne({
    mobileNumber,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(400, 'No active verification code found. Please request a new one.');
  }

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
   Customer registration — creates inactive user
   ═══════════════════════════════════════════════════ */

const register = async (req, res, next) => {
  try {
    const { fullName, mobileNumber, password, email } = req.body;

    if (!fullName || !mobileNumber || !password) {
      throw new ApiError(400, 'Full name, mobile number, and password are required.');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters.');
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
      email: email || '',
      passwordHash: password, // pre-save hook will hash
      role: 'CUSTOMER',
      isMobileVerified: false,
      isActive: false,
      authProviders: ['PASSWORD'],
    });

    // Automatically send OTP via WhatsApp
    await generateAndSendOtp(normalizedMobile, 'REGISTRATION');

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please verify your mobile number via WhatsApp.',
      data: {
        mobileNumber: normalizedMobile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/send-whatsapp-otp
   Send OTP via WhatsApp Cloud API
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
        // Return success to prevent account enumeration
        return res.json({
          success: true,
          message: 'If this number is registered, a verification code has been sent to your WhatsApp.',
        });
      }
    }

    await generateAndSendOtp(normalizedMobile, normalizedPurposeVal);

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
   Verify OTP and complete the corresponding flow
   ═══════════════════════════════════════════════════ */

const verifyOtp = async (req, res, next) => {
  try {
    const { mobileNumber, otp, purpose } = req.body;

    if (!mobileNumber || !otp || !purpose) {
      throw new ApiError(400, 'Mobile number, OTP, and purpose are required.');
    }

    const normalizedMobile = normalizeMobile(mobileNumber);
    const normalizedPurposeVal = normalizePurpose(purpose);

    await verifyOtpCode(normalizedMobile, otp, normalizedPurposeVal);

    if (normalizedPurposeVal === 'REGISTRATION') {
      // Activate the user account
      const user = await User.findOne({ mobileNumber: normalizedMobile });
      if (!user) {
        throw new ApiError(404, 'Registration data not found. Please register again.');
      }

      user.isMobileVerified = true;
      user.isActive = true;
      await user.save();

      const token = generateToken(user._id, user.role);

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
      // Issue a short-lived password reset token
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

      // Store reset token on user (temporary, 10-minute expiry)
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      return res.json({
        success: true,
        message: 'OTP verified. You may now set a new password.',
        data: {
          resetToken,
        },
      });
    }

    // Generic success for other purposes
    res.json({
      success: true,
      message: 'Verification successful.',
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   POST /api/auth/login
   Customer login — mobile + password → JWT
   ═══════════════════════════════════════════════════ */

const login = async (req, res, next) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      throw new ApiError(400, 'Mobile number and password are required.');
    }

    const normalizedMobile = normalizeMobile(mobileNumber);

    const user = await User.findOne({ mobileNumber: normalizedMobile, role: 'CUSTOMER' });
    if (!user) {
      throw new ApiError(401, 'Invalid mobile number or password.');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Your account has been deactivated. Contact support.');
    }

    if (!user.isMobileVerified) {
      throw new ApiError(401, 'Please verify your mobile number first.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid mobile number or password.');
    }

    const token = generateToken(user._id, user.role);

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

    // Verify Google token server-side
    const googleProfile = await verifyGoogleToken(idToken);

    // 1. Check for existing user with this Google ID
    let user = await User.findOne({ googleId: googleProfile.googleId });

    if (user) {
      if (!user.isActive) {
        throw new ApiError(401, 'Your account has been deactivated. Contact support.');
      }

      const token = generateToken(user._id, user.role);
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
    if (googleProfile.email && googleProfile.emailVerified) {
      user = await User.findOne({
        email: googleProfile.email,
        isMobileVerified: true,
        isActive: true,
      });

      if (user) {
        // Link Google to existing verified account
        user.googleId = googleProfile.googleId;
        if (!user.authProviders.includes('GOOGLE')) {
          user.authProviders.push('GOOGLE');
        }
        await user.save();

        const token = generateToken(user._id, user.role);
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

    // 3. New user — needs mobile verification
    return res.json({
      success: true,
      message: 'Mobile verification required to complete registration.',
      data: {
        requiresMobileVerification: true,
        googleProfile: {
          googleId: googleProfile.googleId,
          email: googleProfile.email,
          name: googleProfile.name,
        },
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

    // Re-verify Google token
    const googleProfile = await verifyGoogleToken(idToken);
    const normalizedMobile = normalizeMobile(mobileNumber);

    // Check for existing user with same mobile
    const existingUser = await User.findOne({ mobileNumber: normalizedMobile });
    if (existingUser && existingUser.isMobileVerified) {
      throw new ApiError(400, 'An account with this mobile number already exists. Please login and link Google from your profile.');
    }

    // Remove any unverified user with this mobile
    if (existingUser && !existingUser.isMobileVerified) {
      await User.deleteOne({ _id: existingUser._id });
    }

    // Check for existing user with this Google ID
    const existingGoogleUser = await User.findOne({ googleId: googleProfile.googleId });
    if (existingGoogleUser) {
      throw new ApiError(400, 'This Google account is already linked to another Huma account.');
    }

    // Create inactive user (will activate after OTP)
    await User.create({
      fullName,
      mobileNumber: normalizedMobile,
      email: googleProfile.email || '',
      passwordHash: password,
      role: 'CUSTOMER',
      isMobileVerified: false,
      isActive: false,
      googleId: googleProfile.googleId,
      authProviders: ['PASSWORD', 'GOOGLE'],
    });

    // Send OTP for mobile verification
    await generateAndSendOtp(normalizedMobile, 'REGISTRATION');

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

    // Check if this Google ID is already linked elsewhere
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

    // Link Google to the authenticated user
    const user = await User.findById(req.user._id);
    user.googleId = googleProfile.googleId;
    if (googleProfile.email && !user.email) {
      user.email = googleProfile.email;
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
   Send WhatsApp OTP for password recovery
   ═══════════════════════════════════════════════════ */

const forgotPasswordSendOtp = async (req, res, next) => {
  try {
    const { mobileNumber } = req.body;

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
      // Don't reveal whether account exists (account enumeration protection)
      return res.json({
        success: true,
        message: 'If this number is registered, a verification code has been sent to your WhatsApp.',
      });
    }

    await generateAndSendOtp(normalizedMobile, 'FORGOT_PASSWORD');

    res.json({
      success: true,
      message: 'If this number is registered, a verification code has been sent to your WhatsApp.',
    });
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
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      throw new ApiError(400, 'Mobile number and OTP are required.');
    }

    const normalizedMobile = normalizeMobile(mobileNumber);

    await verifyOtpCode(normalizedMobile, otp, 'FORGOT_PASSWORD');

    // Generate a short-lived reset token
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
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
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

    // Update password
    user.passwordHash = newPassword; // pre-save hook will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Ensure PASSWORD is in authProviders
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
   ═══════════════════════════════════════════════════ */

const getDeviceFingerprint = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const clientFingerprint = req.headers['x-device-fingerprint'] || '';
  return crypto.createHash('sha256').update(userAgent + ip + clientFingerprint).digest('hex');
};

const generateAdminTokens = async (user, fingerprint, req) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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
   POST /api/auth/admin/login
   Admin login with Security Question challenge (Stage 1)
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

/* ═══════════════════════════════════════════════════
   POST /api/auth/admin/verify-security-answer
   Verify Security Answer & Issue Access/Refresh Tokens (Stage 2)
   ═══════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════
   POST /api/auth/admin/refresh-token
   Admin Token Refresh Rotation with Device Fingerprinting
   ═══════════════════════════════════════════════════ */

const adminRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
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

    if (session.deviceFingerprint !== fingerprint) {
      await AdminSession.updateMany({ adminId: session.adminId._id }, { isValid: false });
      throw new ApiError(401, 'Security alert: device mismatch detected. All sessions revoked.');
    }

    session.isValid = false;
    await session.save();

    const { accessToken, refreshToken: newRefreshToken } = await generateAdminTokens(
      session.adminId,
      fingerprint,
      req
    );

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

/* ═══════════════════════════════════════════════════
   POST /api/auth/admin/update-credentials-request
   Step 1: Admin change credentials request (sends OTP to 8960600371)
   ═══════════════════════════════════════════════════ */

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
      { mobileNumber: targetMobile, purpose: 'ADMIN_UPDATE', isUsed: false },
      { isUsed: true }
    );

    await Otp.create({
      mobileNumber: targetMobile,
      otpHash,
      purpose: 'ADMIN_UPDATE',
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
    };

    if (newPassword) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      payload.newPasswordHash = await bcrypt.hash(newPassword, salt);
    }

    if (newSecurityAnswer) {
      const bcrypt = require('bcryptjs');
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

/* ═══════════════════════════════════════════════════
   POST /api/auth/admin/update-credentials-verify
   Step 2: Admin change credentials verify (verifies OTP & saves changes)
   ═══════════════════════════════════════════════════ */

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

    const otpRecord = await Otp.findOne({
      mobileNumber,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

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

    if (decoded.newPasswordHash) {
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
   POST /api/auth/logout
   Stateless JWT — client discards token
   ═══════════════════════════════════════════════════ */

const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/* ═══════════════════════════════════════════════════
   GET /api/auth/me
   Return current authenticated user profile
   ═══════════════════════════════════════════════════ */

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = {
  register,
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
};
