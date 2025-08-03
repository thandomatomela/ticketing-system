// Script to clear users collection so they can be recreated with proper passwords
require('dotenv').config();
const mongoose = require('mongoose');

async function clearUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tenant-ticketing-system');
    console.log('Connected to MongoDB');

    // Clear users collection
    await mongoose.connection.db.collection('users').deleteMany({});
    console.log('Cleared users collection');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('Users cleared! Restart the server to recreate them with proper passwords.');
  } catch (error) {
    console.error('Error:', error);
  }
}

clearUsers();
