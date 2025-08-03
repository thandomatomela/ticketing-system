// Test SMS to company phone number
require('dotenv').config();

const testCompanySMS = async () => {
  console.log('🧪 Testing Company SMS with Real Twilio Credentials\n');
  
  // Your confirmed working credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER; // +13373913166
  
  console.log('📋 Twilio Configuration:');
  console.log(`   Account SID: ${twilioSid}`);
  console.log(`   Auth Token: ${twilioToken ? 'Found' : 'Missing'}`);
  console.log(`   From Phone: ${twilioPhone}`);
  console.log('');
  
  // Company phone number from database (Mike Electrician Services)
  const companyPhone = '+1234567890';
  const companyName = 'Mike Electrician Services';
  
  // Create test message like the app would
  const smsMessage = `🎫 NEW TICKET: Test Electrical Issue | Priority: HIGH | Location: Sunset Student Residence Unit 101 | Category: electrical | Contact property manager for details.`;
  
  console.log('📱 Attempting to send SMS:');
  console.log(`   From: ${twilioPhone}`);
  console.log(`   To: ${companyPhone} (${companyName})`);
  console.log(`   Message: ${smsMessage}`);
  console.log('');
  
  try {
    const twilio = require('twilio');
    const client = twilio(twilioSid, twilioToken);
    
    const message = await client.messages.create({
      body: smsMessage,
      from: twilioPhone,
      to: companyPhone
    });
    
    console.log('✅ SMS SENT SUCCESSFULLY!');
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    console.log(`   To: ${message.to}`);
    console.log(`   From: ${message.from}`);
    
  } catch (error) {
    console.log('❌ SMS FAILED:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    
    if (error.code === 21211) {
      console.log('   💡 Invalid phone number format');
    } else if (error.code === 21608) {
      console.log('   💡 Phone number not verified (trial account)');
    } else if (error.code === 20003) {
      console.log('   💡 Authentication failed');
    }
  }
};

testCompanySMS();
