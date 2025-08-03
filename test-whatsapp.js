require('dotenv').config();
const whatsappService = require('./services/whatsappService');

console.log('🔄 Starting WhatsApp service...');
console.log('📱 Scan the QR code with your WhatsApp to authenticate');

// Wait for the service to be ready
setTimeout(async () => {
  if (whatsappService.isReady) {
    console.log('✅ WhatsApp service is ready!');
    
    // Get all groups
    const groups = await whatsappService.getGroups();
    console.log('\n📋 Available WhatsApp Groups:');
    
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.name}`);
      console.log(`   ID: ${group.id}`);
      console.log(`   Participants: ${group.participants}`);
      console.log('');
    });
    
    if (groups.length === 0) {
      console.log('❌ No groups found. Make sure you have WhatsApp groups.');
    }
  } else {
    console.log('❌ WhatsApp service not ready. Please scan the QR code.');
  }
}, 10000); // Wait 10 seconds for QR scan