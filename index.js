// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Import routes
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Create the app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the GeoSpatial Data Application API');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
