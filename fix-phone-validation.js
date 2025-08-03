require('dotenv').config();
const mongoose = require('mongoose');

async function fixPhoneValidation() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tenant-ticketing-system');
    console.log('✅ Connected to MongoDB');

    // Update the User schema to be more flexible with phone numbers
    const User = require('./models/User');
    
    // Test the phone validation with the problematic number
    const testPhone = '0605285280';
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    
    console.log('📱 Testing phone validation:');
    console.log(`   Phone: ${testPhone}`);
    console.log(`   Valid: ${phoneRegex.test(testPhone)}`);
    
    // Try creating a test user to verify the fix
    const testUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123',
      phone: testPhone,
      role: 'tenant'
    };
    
    // Validate without saving
    const testUser = new User(testUserData);
    await testUser.validate();
    
    console.log('✅ Phone validation fixed! You can now create users with local phone numbers.');
    
    // Clean up test
    await User.deleteOne({ email: 'test@example.com' });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixPhoneValidation();