const express = require('express');
const router = express.Router();
const {
  getCategories,
  getServices,
  getServiceById,
  getDesigns,
  getDesignById,
  getServiceAreas,
  getPublicReviews,
  getBusinessSettings,
} = require('../controllers/serviceController');

// Public routes — no auth required
router.get('/categories', getCategories);
router.get('/services', getServices);
router.get('/services/:id', getServiceById);
router.get('/designs', getDesigns);
router.get('/designs/:id', getDesignById);
router.get('/service-areas', getServiceAreas);
router.get('/reviews', getPublicReviews);
router.get('/settings', getBusinessSettings);

module.exports = router;
