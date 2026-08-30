const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED'],
      default: 'AVAILABLE',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    reservationExpiry: {
      type: Date,
      default: null,
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

timeSlotSchema.index({ date: 1, status: 1 });
timeSlotSchema.index({ date: 1, startTime: 1 }, { unique: true });
timeSlotSchema.index({ status: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
