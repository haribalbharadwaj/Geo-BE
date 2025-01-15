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
    cb(null, 'uploads/'); // Ensure this path exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Use a timestamp to avoid filename collisions
  }
});

// File filter to allow GeoJSON, KML, and TIFF files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /geojson|json|kml|tiff?|tif/i;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  // Log to debug file properties
  console.log('File name:', file.originalname);
  console.log('File extension:', path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);  // Accept the file
  } else {
    return cb(new Error('Unsupported file type. Only GeoJSON, KML, and TIFF files are allowed.'));
  }
};

// Multer setup for handling the file upload
const upload = multer({
  storage,
  fileFilter,
}).single('file');

// Save map data to the database
/*exports.saveMap = async (req, res) => {
  try {
    const { mapData } = req.body;

    if (!mapData || !mapData.features || mapData.features.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty map data' });
    }

    // Save the map data to the database
    const newMap = new File({
      mapData,
      user: req.user._id, // Assuming user authentication
      filename: `map_${Date.now()}.geojson`, // Generate a filename or allow user to name the file
    });

    await newMap.save();
    res.status(201).json({ message: 'Map saved successfully', map: newMap });
  } catch (err) {
    console.error('Error saving map:', err);
    res.status(500).json({ error: 'Error saving map data to the database' });
  }
};*/

exports.saveMap = async (req, res) => {
  try {
    const { mapData, filename } = req.body;
    const user = req.user; // Assuming the user is authenticated and attached to req.user
    
    // Ensure the filename is valid and sanitized
    const validFilename = filename || 'Unnamed_Map'; // Default name if not provided
    const uploadDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, `${validFilename}.geojson`);
    console.log('File saved at:', filePath);


    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save GeoJSON file to the server
    try {
      fs.writeFileSync(filePath, JSON.stringify(mapData), { flag: 'w' }); // 'w' flag overwrites the file if it exists
    } catch (err) {
      console.error('Error saving map:', err);
      return res.status(500).json({ error: 'Error saving map', details: err.message });
    }
    

    // Create a new file metadata record
    const newFile = new File({
      filename: validFilename,
      filepath: filePath,
      fileType: 'GeoJSON',
      user: user._id
    });

    // Save file metadata to the database
    await newFile.save();

    // Respond with success message and saved file data
    res.status(201).json({ message: 'Map saved successfully', file: newFile });
  } catch (error) {
    console.error('Error saving map:', error); // Log the error for debugging
    res.status(500).json({ error: 'Error saving map', details: error.message });
  }
};



// Upload a file handler
exports.uploadFile = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: 'Multer error during file upload' });
    } else if (err) {
      console.error('Error:', err);
      return res.status(400).json({ error: 'File upload error' });
    }

    // If no file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or unsupported file type' });
    }

    // Extract the fileType from the request body
    const { fileType } = req.body;

    if (!fileType || !['GeoJSON', 'KML', 'TIFF'].includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type. Only GeoJSON, KML, and TIFF files are allowed.' });
    }

    try {
      // Save the file information in the database
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
      console.error('Error saving file:', error);
      res.status(500).json({ error: 'Error saving file to the database' });
    }
  });
};

// Get all files for a user
exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id }); // Use req.user._id
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching files' });
  }
};

// Fetch a file by its 
exports.getFileById = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.resolve(file.filepath);
    console.log('Fetching file from path:', filePath);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'Error reading the file' });
      }

      if (file.fileType === 'KML') {
        // If it's a KML file, parse it as XML
        parseString(data, (xmlErr, result) => {
          if (xmlErr) {
            return res.status(500).json({ error: 'Error parsing KML file' });
          }
          res.json({
            kmlData: result, // Return the parsed KML data
            filename: file.filename,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt,
            user: file.user
          });
        });
      } else {
        // Otherwise, assume it's GeoJSON or other JSON-based formats
        try {
          const jsonData = JSON.parse(data); // Attempt to parse as JSON
          res.json({
            geoJSON: jsonData,
            filename: file.filename,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt,
            user: file.user
          });
        } catch (jsonErr) {
          return res.status(500).json({ error: 'Error parsing file as JSON' });
        }
      }
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Error fetching file' });
  }
};



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


// Get all saved files for the logged-in user
exports.getSavedMaps = async (req, res) => {
  try {
    const user = req.user; // Assuming authenticated user
    const savedFiles = await File.find({ user: user._id });
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

    // Read the file from the server and send the data as JSON
    const fileData = fs.readFileSync(file.filepath, 'utf-8');
    const geoJSONData = JSON.parse(fileData);

    res.json({ geoJSON: geoJSONData });
  } catch (error) {
    res.status(500).json({ error: 'Error loading map' });
  }
};


exports.updateMap = async (req, res) => {
  try {
    const mapId = req.params.id;
    const { mapData, filename } = req.body;

    const file = await File.findById(mapId);

    if (!file) {
      return res.status(404).json({ error: 'Map not found' });
    }

    if (mapData) {
      file.mapData = mapData;
    }

    if (filename) {
      file.filename = filename;
    }

    await file.save();

    res.status(200).json({ message: 'Map updated successfully', file });
  } catch (error) {
    res.status(500).json({ error: 'Error updating map' });
  }
};

exports.saveMap = async (req, res) => {
  try {
    const { mapData, filename } = req.body;
    const user = req.user;

    // Ensure the filename is valid and sanitized
    const validFilename = filename || 'Unnamed_Map';
    const uploadDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, `${validFilename}.geojson`);

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save GeoJSON file to the server
    fs.writeFileSync(filePath, JSON.stringify(mapData), { flag: 'w' });

    // Create a new file metadata record
    const newFile = new File({
      filename: validFilename,
      filepath: filePath,
      fileType: 'GeoJSON',
      user: user._id
    });

    // Save the metadata to the database
    await newFile.save();

    res.status(201).json({ message: 'Map saved successfully', file: newFile });
  } catch (error) {
    console.error('Error saving map:', error);
    res.status(500).json({ error: 'Error saving map', details: error.message });
  }
};
