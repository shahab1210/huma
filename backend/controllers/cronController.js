const Otp = require('../models/Otp');
const AdminSession = require('../models/AdminSession');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { ApiError } = require('../middleware/errorHandler');

/**
 * GET /api/cron/cleanup
 * Clean up database collections to prevent exceeding free tier limits (e.g. MongoDB Atlas M0).
 * Clears old OTPs, expired admin sessions, and heavy base64 screenshots for past/cancelled bookings.
 */
const cleanupDatabase = async (req, res, next) => {
  try {
    const { secret } = req.query;
    const configuredSecret = process.env.CRON_SECRET_KEY;

    // Verify secret key (only if configured in env, to prevent unauthorized calls)
    if (configuredSecret && secret !== configuredSecret) {
      throw new ApiError(401, 'Unauthorized: Invalid cron secret key.');
    }

    // 1. Delete expired or already used OTP records
    const otpResult = await Otp.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isUsed: true }
      ]
    });

    // 2. Delete expired or invalidated admin sessions
    const sessionResult = await AdminSession.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isValid: false }
      ]
    });

    // 3. Keep database storage footprint small by clearing base64 payment screenshots for:
    //    - Bookings that are cancelled
    //    - Verified/completed bookings where the booking date is in the past (older than 15 days)
    //    This keeps the database size extremely tiny and fits within free limits (base64 images consume massive space).
    
    // Find booking IDs that are cancelled
    const cancelledBookings = await Booking.find({ bookingStatus: 'CANCELLED' }).select('_id');
    const cancelledBookingIds = cancelledBookings.map(b => b._id);

    // Find booking IDs that are completed/confirmed and date is older than 15 days
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    const oldFinishedBookings = await Booking.find({
      bookingStatus: { $in: ['COMPLETED', 'CONFIRMED'] },
      bookingDate: { $lt: fifteenDaysAgo }
    }).select('_id');
    const oldFinishedBookingIds = oldFinishedBookings.map(b => b._id);

    const targetBookingIds = [...cancelledBookingIds, ...oldFinishedBookingIds];

    // Prune the heavy paymentScreenshot base64 field for those bookings
    const paymentResult = await Payment.updateMany(
      { 
        booking: { $in: targetBookingIds },
        paymentScreenshot: { $ne: '' }
      },
      { 
        $set: { paymentScreenshot: '' } 
      }
    );

    res.json({
      success: true,
      message: 'Database optimization and cleanup completed successfully.',
      pruned: {
        expiredOtpsDeleted: otpResult.deletedCount,
        expiredSessionsDeleted: sessionResult.deletedCount,
        heavyScreenshotsCleared: paymentResult.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  cleanupDatabase
};
