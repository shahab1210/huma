const express = require('express');
const router = express.Router();
const { cleanupDatabase } = require('../controllers/cronController');

router.get('/cleanup', cleanupDatabase);

module.exports = router;
