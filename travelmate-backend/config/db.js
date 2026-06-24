// config/db.js
const mongoose = require('mongoose');

const connectDB = () => {
  console.log('Connecting to MongoDB...');
  console.log('URI:', process.env.MONGO_URI);

  return mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  });
};

module.exports = connectDB;
