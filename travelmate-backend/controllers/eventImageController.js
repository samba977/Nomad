const EventImage = require('../models/EventImage');
const fs = require('fs');
const path = require('path');

// ✅ Upload a new event image
exports.uploadEventImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = req.file.filename;
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

    const newImage = await EventImage.create({ url: imageUrl });
    res.status(200).json(newImage);
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Image upload failed' });
  }
};

// ✅ Get all uploaded images
exports.getAllEventImages = async (req, res) => {
  try {
    const images = await EventImage.find().sort({ uploadedAt: -1 });
    res.status(200).json(images);
  } catch (error) {
    console.error('❌ Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
};

// ✅ Delete an event image
exports.deleteEventImage = async (req, res) => {
  try {
    const image = await EventImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete physical file if stored locally
    const filePath = path.join(__dirname, '..', 'uploads', path.basename(image.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete DB record
    await image.deleteOne();

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};
