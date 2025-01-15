const express = require('express');
const router = express.Router();
const { addMarker, getMarkers } = require('../controllers/markerController');
const { authMiddleware } = require('../middleware/auth');

router.post('/add', authMiddleware, addMarker);
router.get('/', authMiddleware, getMarkers);

module.exports = router;
