// Test SMS functionality
require('dotenv').config();

const testSMS = async () => {
  console.log('🧪 Testing SMS Configuration...\n');
  
  // Check environment variables
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  
  console.log('📋 Environment Variables:');
  console.log(`   TWILIO_ACCOUNT_SID: ${twilioSid ? 'Found' : 'Missing'}`);
  console.log(`   TWILIO_AUTH_TOKEN: ${twilioToken ? 'Found' : 'Missing'}`);
  console.log(`   TWILIO_PHONE_NUMBER: ${twilioPhone || 'Missing'}`);
  console.log('');
  
  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.log('❌ Missing Twilio credentials in .env file');
    return;
  }
  
  try {
    const twilio = require('twilio');
    console.log('📦 Twilio package loaded successfully');
    
    const client = twilio(twilioSid, twilioToken);
    console.log('🔗 Twilio client created');
    
    // Test with a demo phone number (this won't actually send)
    const testMessage = {
      body: '🧪 Test SMS from Tenant Ticketing System',
      from: twilioPhone,
      to: '+1234567890' // Demo number
    };
    
    console.log('📱 Attempting to send test SMS...');
    console.log(`   From: ${testMessage.from}`);
    console.log(`   To: ${testMessage.to}`);
    console.log(`   Message: ${testMessage.body}`);
    
    const message = await client.messages.create(testMessage);
    
    console.log('✅ SMS sent successfully!');
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    
  } catch (error) {
    console.log('❌ SMS Test Failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.code) {
      console.log(`   Twilio Error Code: ${error.code}`);
    }
    
    // Common error explanations
    if (error.message.includes('authenticate')) {
      console.log('   💡 This usually means invalid Account SID or Auth Token');
    } else if (error.message.includes('phone number')) {
      console.log('   💡 This usually means invalid phone number format');
    } else if (error.message.includes('trial')) {
      console.log('   💡 Trial accounts can only send to verified numbers');
    }
  }
};

testSMS();
