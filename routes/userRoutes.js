const express = require('express');
const router = express.Router();
const { register, login, getUser } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getUser); // Protected route

module.exports = router;
