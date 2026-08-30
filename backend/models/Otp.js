/**
 * @file Otp.js
 * @description Mongoose schema for managing one-time passwords (OTPs).
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
    enum: ['REGISTRATION', 'FORGOT_PASSWORD', 'CHANGE_MOBILE', 'ADMIN_LOGIN', 'ADMIN_UPDATE'],
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },  // MongoDB TTL index — auto-delete expired docs
  },
  attempts: {
    type: Number,
    default: 0,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  lastSentAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for quick lookups
otpSchema.index({ mobileNumber: 1, purpose: 1, isUsed: 1 });

/**
 * Compare an OTP with the hashed version stored in the database.
 * @param {string} candidateOtp - The OTP provided by the user.
 * @returns {Promise<boolean>} True if the OTP matches, false otherwise.
 */
otpSchema.methods.compareOtp = async function (candidateOtp) {
  return bcrypt.compare(candidateOtp, this.otpHash);
};

/**
 * Hash an OTP before storing it.
 * @param {string} otp - The plain text OTP.
 * @returns {Promise<string>} The hashed OTP.
 */
otpSchema.statics.hashOtp = async function (otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

module.exports = mongoose.model('Otp', otpSchema);
