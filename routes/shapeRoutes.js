const express = require('express');
const router = express.Router();
const { saveShape, getShapes } = require('../controllers/shapeController');
const { authMiddleware } = require('../middleware/auth');

router.post('/save', authMiddleware, saveShape);
router.get('/getShapes', authMiddleware, getShapes);

module.exports = router;
