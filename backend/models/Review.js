const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    serviceName: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'HIDDEN'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ booking: 1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);
