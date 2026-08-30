const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
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
} = require('../controllers/authController');

/* ── Customer Registration ── */
router.post('/register', register);

/* ── WhatsApp OTP ── */
router.post('/send-whatsapp-otp', sendOtp);
router.post('/verify-whatsapp-otp', verifyOtp);

/* ── Customer Login ── */
router.post('/login', login);

/* ── Google Authentication ── */
router.post('/google', googleAuth);
router.post('/google/complete-registration', completeGoogleRegistration);
router.post('/google/link', requireAuth, linkGoogleAccount);

/* ── Forgot Password ── */
router.post('/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOtp);
router.post('/reset-password', resetPassword);

/* ── Admin Login ── */
router.post('/admin/login', adminLogin);
router.post('/admin/verify-security-answer', adminVerifySecurityAnswer);
router.post('/admin/refresh-token', adminRefreshToken);
router.post('/admin/update-credentials-request', requireAuth, updateAdminCredentialsRequest);
router.post('/admin/update-credentials-verify', requireAuth, updateAdminCredentialsVerify);

/* ── Session ── */
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
