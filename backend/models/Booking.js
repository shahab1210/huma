const mongoose = require('mongoose');

/* ── BookingItem sub-document ── */
const bookingItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['SERVICE', 'DESIGN'],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    nameSnapshot: {
      type: String,
      required: true,
    },
    priceSnapshot: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    durationSnapshot: {
      type: String,
      default: '',
    },
    categorySnapshot: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

/* ── Reschedule request sub-document ── */
const rescheduleRequestSchema = new mongoose.Schema(
  {
    requestedDate: Date,
    requestedSlot: String,
    reason: String,
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    adminResponse: String,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: Date,
  },
  { _id: false }
);

/* ── Booking ── */
const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    items: [bookingItemSchema],
    serviceArea: {
      type: String,
      required: [true, 'Service area is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    locationName: {
      type: String,
      default: '',
    },
    locationSlug: {
      type: String,
      default: '',
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
    },
    timeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeSlot',
    },
    subtotal: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    onlineBookingAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAYMENT_VERIFICATION_PENDING', 'BOOKING_AMOUNT_PAID', 'PARTIAL_PAYMENT', 'FAILED', 'REFUNDED', 'REJECTED'],
      default: 'PENDING',
    },
    bookingStatus: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'PAYMENT_VERIFICATION_PENDING',
        'CONFIRMED',
        'AWAITING_REMAINING_PAYMENT',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'RESCHEDULED',
        'PAYMENT_REJECTED',
      ],
      default: 'PENDING_PAYMENT',
    },
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN'],
    },
    cancelledAt: Date,
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PROCESSED', 'REJECTED'],
      default: 'NONE',
    },
    adminRefundNote: {
      type: String,
      default: '',
    },
    refundProcessedAt: Date,
    refundTransactionId: {
      type: String,
      default: '',
    },
    customerUpiId: {
      type: String,
      default: '',
    },
    customerUpiName: {
      type: String,
      default: '',
    },
    rescheduleRequest: rescheduleRequestSchema,
    transactionId: {
      type: String,
      default: '',
    },
    paymentScreenshot: {
      type: String,
      default: '',
    },
    customerNotes: String,
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ customer: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
