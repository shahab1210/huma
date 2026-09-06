const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const sgCtrl = require('../controllers/serviceGroupController');

// Public routes
router.get('/service-groups', sgCtrl.getServiceGroups);
router.get('/service-groups/:slug', sgCtrl.getServiceGroupBySlug);

// Admin routes
router.post('/admin/service-groups', requireAuth, requireAdmin, sgCtrl.createServiceGroup);
router.put('/admin/service-groups/:id', requireAuth, requireAdmin, sgCtrl.updateServiceGroup);
router.delete('/admin/service-groups/:id', requireAuth, requireAdmin, sgCtrl.deleteServiceGroup);

module.exports = router;
