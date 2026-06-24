const Destination = require('../models/Destination');

// ✅ Get all destinations
const getAllDestinations = async (req, res) => {
  try {
    const destinations = await Destination.find().sort({ createdAt: -1 });
    res.status(200).json(destinations);
  } catch (err) {
    console.error('Failed to fetch destinations:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Add a new destination (admin only)
const addDestination = async (req, res) => {
  try {
    // Accept 'link' from req.body
    const { name, category, description, imageUrl, link } = req.body;
    if (!name || !category || !description || !imageUrl) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newDest = new Destination({
      name,
      category,
      description,
      imageUrl,
      link, // This is optional, so if not present, it's undefined (which is fine)
    });
    await newDest.save();
    res.status(201).json({ message: 'Destination added', destination: newDest });
  } catch (err) {
    console.error('Add destination error:', err);
    res.status(500).json({ message: 'Failed to add destination' });
  }
};

// ✅ Delete a destination (admin only)
const deleteDestination = async (req, res) => {
  try {
    await Destination.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Destination deleted' });
  } catch (err) {
    console.error('Delete destination error:', err);
    res.status(500).json({ message: 'Failed to delete destination' });
  }
};

module.exports = {
  getAllDestinations,
  addDestination,
  deleteDestination,
};
