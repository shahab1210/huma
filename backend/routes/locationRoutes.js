const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const locationCtrl = require('../controllers/locationController');

// Public routes
router.get('/locations', locationCtrl.getLocations);
router.get('/locations/:slug', locationCtrl.getLocationBySlug);

// Admin routes
router.post('/admin/locations', requireAuth, requireAdmin, locationCtrl.createLocation);
router.put('/admin/locations/:id', requireAuth, requireAdmin, locationCtrl.updateLocation);
router.delete('/admin/locations/:id', requireAuth, requireAdmin, locationCtrl.deleteLocation);

module.exports = router;
