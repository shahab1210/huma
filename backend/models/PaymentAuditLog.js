/**
 * @file PaymentAuditLog.js
 * @description Mongoose model for logging payment action audits (verifications, submissions, rejections).
 */
const mongoose = require('mongoose');

const paymentAuditLogSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['SUBMIT_PROOF', 'ADMIN_CONFIRM', 'ADMIN_REJECT', 'ADMIN_EDIT_SETTINGS'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    previousStatus: {
      type: String,
      default: '',
    },
    newStatus: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentAuditLogSchema.index({ payment: 1 });
paymentAuditLogSchema.index({ booking: 1 });

module.exports = mongoose.model('PaymentAuditLog', paymentAuditLogSchema);
