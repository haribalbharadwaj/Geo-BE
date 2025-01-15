const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  shapeData: {
    type: mongoose.Schema.Types.Mixed, // For storing GeoJSON data or any shape data
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model for the user reference
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Map', mapSchema);
