const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  requestReschedule,
  getAvailableSlots,
} = require('../controllers/bookingController');

// Slots — optionalAuth so admin sees all, public sees available
router.get('/slots', optionalAuth, getAvailableSlots);

// All booking operations REQUIRE authentication
router.post('/bookings', requireAuth, createBooking);
router.get('/bookings', requireAuth, getMyBookings);
router.get('/bookings/:id', requireAuth, getBookingById);
router.post('/bookings/:id/cancel', requireAuth, cancelBooking);
router.post('/bookings/:id/reschedule', requireAuth, requestReschedule);

module.exports = router;
