const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { submitReview } = require('../controllers/reviewController');

// Only authenticated customers with completed bookings can review
router.post('/reviews', requireAuth, submitReview);

module.exports = router;
