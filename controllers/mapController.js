const Map = require('../models/Map'); // Assuming you have a Map model

// Function to save a new map
const saveMap = async (req, res) => {
  try {
    const { name, shapeData } = req.body; // Assuming name and shapeData are part of the request body

    // Create and save the map
    const newMap = new Map({ name, shapeData, user: req.user._id });
    await newMap.save();

    res.status(201).json({ message: 'Map saved successfully', map: newMap });
  } catch (error) {
    res.status(500).json({ message: 'Error saving map', error });
  }
};

// Function to get all maps
const getMaps = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is missing in request.' });
    }
    const maps = await Map.find({ user: userId }); // Ensure that the map's user field matches req.user.id
    res.status(200).json(maps);
  } catch (err) {
    console.error('Error fetching maps:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { saveMap, getMaps };
