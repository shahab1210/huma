const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpayOrderId: {
      type: String,
      required: false,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['RAZORPAY', 'UPI_MANUAL'],
      default: 'RAZORPAY',
    },
    upiId: {
      type: String,
      default: '',
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    paymentScreenshot: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    adminNote: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
    },
    paymentType: {
      type: String,
      enum: ['BOOKING_AMOUNT', 'REMAINING_PAYMENT'],
      default: 'BOOKING_AMOUNT',
    },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED', 'VERIFIED', 'REJECTED'],
      default: 'CREATED',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
