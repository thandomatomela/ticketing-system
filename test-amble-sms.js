// Test SMS to Amble Group
require('dotenv').config();

const testAmbleSMS = async () => {
  console.log('🧪 Testing SMS to Amble Group (+27784232464)\n');
  
  // Your Twilio credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER; // +13373913166
  
  // Amble Group details from database
  const companyName = 'Amble Group';
  const companyPhone = '+27784232464'; // South African number
  const companyCategory = 'maintenance';
  
  console.log('📋 Test Configuration:');
  console.log(`   From: ${twilioPhone} (Your Twilio number)`);
  console.log(`   To: ${companyPhone} (${companyName})`);
  console.log(`   Category: ${companyCategory}`);
  console.log('');
  
  // Create realistic ticket message
  const smsMessage = `🎫 NEW TICKET: Broken Door Lock | Priority: HIGH | Location: Sunset Student Residence Unit 205 Living Room | Category: maintenance | Contact property manager for details.`;
  
  console.log('📱 SMS Message:');
  console.log(`   "${smsMessage}"`);
  console.log('');
  
  try {
    const twilio = require('twilio');
    const client = twilio(twilioSid, twilioToken);
    
    console.log('🔄 Sending SMS...');
    
    const message = await client.messages.create({
      body: smsMessage,
      from: twilioPhone,
      to: companyPhone
    });
    
    console.log('✅ SMS SENT SUCCESSFULLY TO AMBLE GROUP!');
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    console.log(`   To: ${message.to}`);
    console.log(`   From: ${message.from}`);
    console.log('');
    console.log('📱 Check your phone at +27784232464 for the SMS!');
    
  } catch (error) {
    console.log('❌ SMS FAILED:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'No code'}`);
    
    // Common Twilio error codes
    if (error.code === 21211) {
      console.log('   💡 Invalid phone number format');
    } else if (error.code === 21608) {
      console.log('   💡 Phone number not verified (trial account limitation)');
    } else if (error.code === 21614) {
      console.log('   💡 Invalid phone number (not a mobile number)');
    } else if (error.code === 20003) {
      console.log('   💡 Authentication failed - check credentials');
    } else if (error.code === 21606) {
      console.log('   💡 Phone number not verified for trial account');
    }
    
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('   1. If trial account: verify +27784232464 in Twilio console');
    console.log('   2. Check if international SMS is enabled');
    console.log('   3. Verify phone number format is correct');
  }
};

console.log('🚀 Starting Amble Group SMS Test...\n');
testAmbleSMS();
