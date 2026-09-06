const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  submitProof,
  verifyManualPayment,
  rejectManualPayment,
  verifyPartialPayment,
  processRefund,
} = require('../controllers/paymentController');

// Submit payment proof (Customer)
router.post('/payments/submit-proof', requireAuth, submitProof);

// Verify, Reject, Partial, or Process Refund payment proof (Admin only)
router.post('/payments/:id/verify', requireAuth, requireAdmin, verifyManualPayment);
router.post('/payments/:id/reject', requireAuth, requireAdmin, rejectManualPayment);
router.post('/payments/:id/partial', requireAuth, requireAdmin, verifyPartialPayment);
router.post('/payments/:id/process-refund', requireAuth, requireAdmin, processRefund);
router.post('/bookings/:id/process-refund', requireAuth, requireAdmin, processRefund);

module.exports = router;
