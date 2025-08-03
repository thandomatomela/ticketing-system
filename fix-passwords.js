// Quick script to fix user passwords in MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

async function fixPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tenant-ticketing-system');
    console.log('Connected to MongoDB');

    // Get the User model
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      phone: String,
      isActive: Boolean
    }, { timestamps: true }));

    // Update all users with the correct password
    const users = [
      { email: 'owner@example.com', password: 'admin123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'maintenance@example.com', password: 'admin123' },
      { email: 'student@example.com', password: 'admin123' }
    ];

    for (const userData of users) {
      const result = await User.updateOne(
        { email: userData.email },
        { $set: { password: userData.password } }
      );
      console.log(`Updated ${userData.email}:`, result.modifiedCount > 0 ? 'Success' : 'Not found');
    }

    // Verify the updates
    console.log('\nVerifying passwords:');
    for (const userData of users) {
      const user = await User.findOne({ email: userData.email });
      console.log(`${userData.email}: password = "${user?.password}"`);
    }

    await mongoose.disconnect();
    console.log('\nPassword fix complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixPasswords();
