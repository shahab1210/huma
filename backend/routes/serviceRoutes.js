const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const admin = require('../controllers/adminController');
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Public routes — no auth required
router.get('/categories', getCategories);
router.get('/services', getServices);
router.get('/services/:id', getServiceById);
router.get('/designs', getDesigns);
router.get('/designs/:id', getDesignById);
router.get('/service-areas', getServiceAreas);
router.get('/reviews', getPublicReviews);
router.get('/settings', getBusinessSettings);

// Authenticated Admin upload endpoint: POST /api/designs/upload-image
router.post('/designs/upload-image', requireAuth, requireAdmin, upload.single('image'), admin.uploadDesignImage);

module.exports = router;
