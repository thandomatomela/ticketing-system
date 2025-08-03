// Test script to verify user creation and login
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tenant-ticketing-system');
    console.log('Connected to MongoDB');

    // Find a user
    const user = await User.findOne({ email: 'owner@example.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', {
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      passwordStart: user.password?.substring(0, 10) + '...'
    });

    // Test password comparison
    const testPassword = 'admin123';
    const isValid = await user.comparePassword(testPassword);
    console.log('🔐 Password test result:', isValid);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLogin();
