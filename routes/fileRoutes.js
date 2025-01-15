const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Upload route
router.post('/upload', authMiddleware, fileController.uploadFile);

// Fetch all files for the authenticated user
router.get('/', authMiddleware, fileController.getFiles);

// Save map data (GeoJSON, KML, TIFF, etc.) to the server
// Update map data on the server
router.put('/update/:id', authMiddleware, fileController.updateMap);

// Fetch a file by its ID
router.get('/:id', authMiddleware, fileController.getFileById);

// Download a file
router.get('/download/:fileId', authMiddleware, fileController.downloadFile);

// Fetch all saved maps for the logged-in user
router.get('/saved', authMiddleware, fileController.getSavedMaps);

// Get a map by its ID
router.get('/map/:id', authMiddleware, fileController.getMapById);

// Create a new map and save the GeoJSON data to the server

router.post('/save', authMiddleware, fileController.saveMap);


module.exports = router;
