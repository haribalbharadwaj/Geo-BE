const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = { _id: decoded.userId }; // Set the entire user object with _id
    console.log('req.user',req.user);

    next(); // Continue to the protected route
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
