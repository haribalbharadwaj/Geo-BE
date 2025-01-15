const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Include this if not already
const bcrypt = require('bcrypt'); // Include bcrypt if needed for hashing
// Import routes
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');
const shapeRoutes = require('./routes/shapeRoutes');
const markerRoutes = require('./routes/markerRoutes');
const mapsRoute = require('./routes/mapsRoute');

// Create the app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }))

// Routes
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/shapes', shapeRoutes);
app.use('/api/markers', markerRoutes);
app.use('/api/maps', mapsRoute);

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
