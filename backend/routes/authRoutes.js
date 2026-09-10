const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
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
} = require('../controllers/authController');

/* ── Customer Registration ── */
router.post('/register', register);

/* ── Email OTP ── */
router.post('/email/send-otp', sendEmailOtp);
router.post('/email/verify-otp', verifyEmailOtp);

/* ── SMS OTP ── */
router.post('/sms/send-otp', sendSmsOtp);
router.post('/sms/verify-otp', verifySmsOtp);

/* ── WhatsApp OTP (preserved — gated by WHATSAPP_OTP_ENABLED feature flag) ── */
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

router.post('/admin/set-pin', requireAuth, requireAdmin, setAdminPin);
router.post('/admin/verify-pin', requireAuth, requireAdmin, verifyAdminPin);
router.post('/admin/reset-pin', requireAuth, requireAdmin, resetAdminPin);

/* ── Session ── */
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

module.exports = router;
