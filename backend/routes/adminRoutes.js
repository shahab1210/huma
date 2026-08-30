const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const admin = require('../controllers/adminController');

// ALL admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/dashboard', admin.getDashboard);

// Booking management
router.get('/bookings', admin.getAllBookings);
router.put('/bookings/:id', admin.updateBooking);
router.post('/bookings/:id/respond-reschedule', admin.respondReschedule);

// Service CRUD
router.post('/services', admin.createService);
router.put('/services/:id', admin.updateService);
router.delete('/services/:id', admin.deleteService);

// Design CRUD
router.post('/designs', admin.createDesign);
router.put('/designs/:id', admin.updateDesign);
router.delete('/designs/:id', admin.deleteDesign);

// Category CRUD
router.post('/categories', admin.createCategory);
router.put('/categories/:id', admin.updateCategory);
router.delete('/categories/:id', admin.deleteCategory);

// Slot management
router.post('/slots', admin.createSlots);
router.put('/slots/:id', admin.updateSlot);
router.delete('/slots/:id', admin.deleteSlot);
router.put('/slots/:id/block', admin.blockSlot);

// Service area management
router.post('/service-areas', admin.createServiceArea);
router.put('/service-areas/:id', admin.updateServiceArea);
router.delete('/service-areas/:id', admin.deleteServiceArea);

// Customer management
router.get('/customers', admin.getAllCustomers);

// Payment management
router.get('/payments', admin.getAllPayments);

// Review moderation
router.get('/reviews', admin.getAllReviews);
router.put('/reviews/:id', admin.moderateReview);

// Business settings
router.put('/settings', admin.updateSettings);

module.exports = router;
