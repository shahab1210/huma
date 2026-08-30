const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { ApiError } = require('../middleware/errorHandler');

/**
 * POST /api/reviews
 * Submit a review. Only customers with COMPLETED bookings can review.
 */
const submitReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment, images } = req.body;

    if (!bookingId || !rating) {
      throw new ApiError(400, 'Booking ID and rating are required.');
    }

    if (rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5.');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found.');

    if (booking.customer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only review your own bookings.');
    }

    if (booking.bookingStatus !== 'COMPLETED') {
      throw new ApiError(400, 'You can only review completed bookings.');
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      booking: booking._id,
      customer: req.user._id,
    });
    if (existingReview) {
      throw new ApiError(400, 'You have already submitted a review for this booking.');
    }

    const serviceName = booking.items.map((i) => i.nameSnapshot).join(', ');

    const review = await Review.create({
      booking: booking._id,
      customer: req.user._id,
      rating,
      comment: comment || '',
      images: images || [],
      serviceName,
      status: 'PENDING', // Admin must approve
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted. It will be visible after admin approval.',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitReview };
