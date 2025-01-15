const express = require('express');
const router = express.Router();
const { saveMap, getMaps } = require('../controllers/mapController'); // You need to create mapController
const { authMiddleware } = require('../middleware/auth');

// Define a POST route to save a map
router.post('/save', authMiddleware, saveMap);

// Define a GET route to retrieve all maps
router.get('/getmaps', authMiddleware, getMaps);

module.exports = router;
