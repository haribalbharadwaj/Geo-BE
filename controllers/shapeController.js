const Shape = require('../models/Shape');

// Create or save a shape
exports.saveShape = async (req, res) => {
  const { shapeData } = req.body;
  try {
    const shape = new Shape({
      user: req.userId,
      shapeData
    });
    await shape.save();
    res.status(201).json(shape);
  } catch (err) {
    res.status(500).json({ error: 'Error saving shape' });
  }
};

// Get all shapes for a user
exports.getShapes = async (req, res) => {
  try {
    const shapes = await Shape.find({ user: req.userId });
    res.json(shapes);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching shapes' });
  }
};
