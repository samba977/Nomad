// middleware/validateObjectId.js
const mongoose = require('mongoose');

module.exports = (req, res, next) => {
  const { userId, companionId } = req.params;

  const ids = [userId, companionId];
  const invalid = ids.filter(id => id && !mongoose.Types.ObjectId.isValid(id));

  if (invalid.length) {
    return res.status(400).json({ message: `Invalid ObjectId(s): ${invalid.join(', ')}` });
  }

  next();
};
