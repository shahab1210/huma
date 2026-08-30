const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  submitProof,
  verifyManualPayment,
  rejectManualPayment,
} = require('../controllers/paymentController');

// Submit payment proof (Customer)
router.post('/payments/submit-proof', requireAuth, submitProof);

// Verify or Reject payment proof (Admin only)
router.post('/payments/:id/verify', requireAuth, requireAdmin, verifyManualPayment);
router.post('/payments/:id/reject', requireAuth, requireAdmin, rejectManualPayment);

module.exports = router;
