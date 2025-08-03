require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function debugUserCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tenant-ticketing-system');
    console.log('✅ Connected to MongoDB');

    // Test user data that's failing
    const testUserData = {
      name: 'Test User',
      email: 'debug@example.com',
      password: 'test123',
      role: 'tenant',
      phone: '0605285280' // The problematic phone number
    };

    console.log('🧪 Testing user creation with:', testUserData);

    // Try to create the user
    const user = new User(testUserData);
    await user.validate();
    console.log('✅ Validation passed');

    await user.save();
    console.log('✅ User saved successfully:', user._id);

    // Clean up
    await User.deleteOne({ email: 'debug@example.com' });
    console.log('🧹 Test user cleaned up');

  } catch (error) {
    console.error('❌ Error details:');
    console.error('Message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

debugUserCreation();