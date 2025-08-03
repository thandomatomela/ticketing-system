// Simple SMS test
require('dotenv').config();

console.log('🧪 Simple SMS Test\n');

// Check environment variables
console.log('📋 Twilio Configuration:');
console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID || 'Missing'}`);
console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? 'Found' : 'Missing'}`);
console.log(`TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER || 'Missing'}`);
console.log('');

// Test Twilio package
try {
  const twilio = require('twilio');
  console.log('✅ Twilio package loaded');
  
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client created');
    console.log('📱 Ready to send SMS (but not sending in test mode)');
  } else {
    console.log('❌ Missing Twilio credentials');
  }
  
} catch (error) {
  console.log('❌ Error loading Twilio:', error.message);
}

console.log('\n🎯 Next Steps:');
console.log('1. If you see "Missing Twilio credentials" - you need real Twilio account');
console.log('2. If you see "Ready to send SMS" - credentials are loaded');
console.log('3. Test by assigning a ticket to a company in the app');
console.log('4. Check server console for SMS notification logs');
