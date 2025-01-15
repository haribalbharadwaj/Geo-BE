const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Register a new user
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // If no user exists, proceed with registration
    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Log to check if email and password are being received
    console.log('Login attempt:', email);

    // Check if the user exists
    const user = await User.findOne({ email:email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare the passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log to check if the token is being created
    console.log('User authenticated:', user._id);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

    // Respond with token and user info
    res.json({ token, user });
  } catch (err) {
    console.error('Login Error:', err); // Log the detailed error
    res.status(500).json({ error: 'Error logging in' });
  }
};


// Get user info (protected route)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user' });
  }
};
