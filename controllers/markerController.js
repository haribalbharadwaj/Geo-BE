const Marker = require('../models/Marker');

// Add or save marker
exports.addMarker = async (req, res) => {
  const { lat, lng } = req.body;
  try {
    const marker = new Marker({
      user: req.userId,
      coordinates: { lat, lng }
    });
    await marker.save();
    res.status(201).json(marker);
  } catch (err) {
    res.status(500).json({ error: 'Error saving marker' });
  }
};

// Get all markers for a user
exports.getMarkers = async (req, res) => {
  try {
    const markers = await Marker.find({ user: req.userId });
    res.json(markers);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching markers' });
  }
};
