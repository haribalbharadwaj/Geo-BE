const File = require('../models/File');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const mongoose = require('mongoose');
const { parseString } = require('xml2js');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter to allow GeoJSON, KML, and TIFF files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /geojson|json|kml|tiff?|tif/i;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true); 
  } else {
    return cb(new Error('Unsupported file type. Only GeoJSON, KML, and TIFF files are allowed.'));
  }
};

// Multer setup for handling file upload
const upload = multer({
  storage,
  fileFilter,
}).single('file');

// Save GeoJSON map data to the server and database
exports.saveMap = async (req, res) => {
  try {
    const { mapData, filename } = req.body;
    const user = req.user; 

    if (!filename || !mapData) {
      return res.status(400).json({ message: 'Filename and mapData are required' });
    }

    const validFilename = filename || 'Unnamed_Map';
    const uploadDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, `${validFilename}.geojson`);

    fs.writeFileSync(filePath, JSON.stringify(mapData), 'utf8');


    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save GeoJSON file to the server
    fs.writeFileSync(filePath, JSON.stringify(mapData), { flag: 'w' });

    // Create and save file metadata in the database
    const newFile = new File({
      filename: validFilename,
      filepath: filePath,
      fileType: 'GeoJSON',
      user: user._id,
      geoJSON: mapData // Add the geoJSON data directly to the database
    });

    await newFile.save();

    res.status(201).json({ message: 'Map saved successfully', file: newFile });
  } catch (error) {
    console.error('Error saving map:', error);
    res.status(500).json({ error: 'Error saving map', details: error.message });
  }
};

// Handle file upload
exports.uploadFile = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ error: 'Multer error during file upload' });
    } else if (err) {
      return res.status(400).json({ error: 'File upload error' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or unsupported file type' });
    }

    const { fileType } = req.body;

    if (!fileType || !['GeoJSON', 'KML', 'TIFF'].includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type. Only GeoJSON, KML, and TIFF files are allowed.' });
    }

    try {
      const file = new File({
        filename: req.file.filename,
        filepath: req.file.path,
        fileType,
        user: req.user._id
      });

      await file.save();

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      res.status(201).json({ file, fileUrl });
    } catch (error) {
      res.status(500).json({ error: 'Error saving file to the database' });
    }
  });
};

// Get all files for a user
exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching files' });
  }
};

// Get file by ID
exports.getFileById = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.resolve(file.filepath);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'Error reading the file' });
      }

      if (file.fileType === 'KML') {
        parseString(data, (xmlErr, result) => {
          if (xmlErr) {
            return res.status(500).json({ error: 'Error parsing KML file' });
          }
          res.json({
            kmlData: result,
            filename: file.filename,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt,
            user: file.user
          });
        });
      } else {
        try {
          const jsonData = JSON.parse(data);
          res.json({
            geoJSON: jsonData,
            filename: file.filename,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt,
            user: file.user
          });
        } catch (jsonErr) {
          res.status(500).json({ error: 'Error parsing file as JSON' });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching file' });
  }
};

// Download file by ID
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(file.filepath, file.filename, (err) => {
      if (err) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching file for download' });
  }
};

// Get all saved maps for the logged-in user
exports.getSavedMaps = async (req, res) => {
  try {
    const savedFiles = await File.find({ user: req.user._id });
    res.json(savedFiles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching saved maps' });
  }
};

// Get specific map by ID
exports.getMapById = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const fileData = fs.readFileSync(file.filepath, 'utf-8');
    const geoJSONData = JSON.parse(fileData);

    res.json({ geoJSON: geoJSONData });
  } catch (error) {
    res.status(500).json({ error: 'Error loading map' });
  }
};

// Update map
exports.updateMap = async (req, res) => {
  try {
    const mapId = req.params.id;
    const { mapData, filename } = req.body;

    const file = await File.findById(mapId);

    if (!file) {
      return res.status(404).json({ error: 'Map not found' });
    }

    const uploadDir = path.join(__dirname, '../uploads');
    const oldFilePath = file.filepath;  // Old file path before update

    if (mapData) {
      file.geoJSON = mapData;

      // Update the content of the file in the uploads directory
      fs.writeFileSync(oldFilePath, JSON.stringify(mapData), 'utf8');
    }

    if (filename && filename !== file.filename) {
      const newFilePath = path.join(uploadDir, `${filename}.geojson`);

      // Rename the file in the uploads directory if the filename changes
      fs.renameSync(oldFilePath, newFilePath);

      // Update the file's filename and filepath in the database
      file.filename = filename;
      file.filepath = newFilePath;
    }

    await file.save();

    res.status(200).json({ message: 'Map updated successfully', file });
  } catch (error) {
    console.error('Error updating map:', error);
    res.status(500).json({ error: 'Error updating map', details: error.message });
  }
};
