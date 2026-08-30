const mongoose = require('mongoose');

// Connects to MongoDB using the URI from environment variables.
// Called once when the server starts (see server.js).
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit the process if we can't connect to the DB — there's no
    // useful way for the API to run without it.
    process.exit(1);
  }
};

module.exports = connectDB;
