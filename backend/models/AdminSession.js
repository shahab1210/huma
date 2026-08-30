/**
 * @file AdminSession.js
 * @description Mongoose schema for Admin login session tracking, token refresh rotation, and device fingerprint validation.
 */
const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    deviceFingerprint: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index - auto-deletes document when current date >= expiresAt
    },
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookup of active refresh tokens
adminSessionSchema.index({ adminId: 1, refreshTokenHash: 1, isValid: 1 });

module.exports = mongoose.model('AdminSession', adminSessionSchema);
