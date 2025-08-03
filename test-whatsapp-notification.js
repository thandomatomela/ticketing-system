require('dotenv').config();
const whatsappService = require('./services/whatsappService');

console.log('🧪 Testing WhatsApp Notification System');
console.log('=====================================');

// Mock ticket data
const mockTicket = {
  _id: 'test-ticket-123',
  title: 'Test Maintenance Request',
  description: 'This is a test ticket to verify WhatsApp notifications are working properly.',
  priority: 'high',
  category: 'plumbing',
  property: {
    name: 'Student Residence A'
  },
  unit: '101',
  room: 'Bathroom',
  createdAt: new Date()
};

// Mock user data
const mockUser = {
  name: 'Test User',
  email: 'test@example.com'
};

async function testWhatsAppNotification() {
  console.log('📱 WhatsApp Service Status:');
  console.log(`   Ready: ${whatsappService.isReady}`);
  console.log(`   Group ID: ${whatsappService.groupId}`);
  console.log(`   Group Name: ${whatsappService.groupName}`);
  console.log('');

  if (!whatsappService.groupId || whatsappService.groupId === 'your-whatsapp-group-id@g.us') {
    console.log('❌ WhatsApp group ID not configured properly');
    console.log('   Please update WHATSAPP_GROUP_ID in your .env file');
    return;
  }

  console.log('🧪 Attempting to send test notification...');
  
  try {
    const result = await whatsappService.notifyNewTicket(mockTicket, mockUser);
    
    if (result.success) {
      console.log('✅ WhatsApp notification sent successfully!');
      console.log('   Check your WhatsApp group for the message.');
    } else {
      console.log('❌ WhatsApp notification failed:');
      console.log(`   Error: ${result.error}`);
      
      if (result.error === 'WhatsApp service not ready') {
        console.log('');
        console.log('💡 This usually means:');
        console.log('   1. WhatsApp Web needs to be authenticated (QR code scan)');
        console.log('   2. The WhatsApp client is still initializing');
        console.log('   3. Network connectivity issues');
        console.log('');
        console.log('🔧 To fix this:');
        console.log('   1. Run: node setup-whatsapp.js');
        console.log('   2. Scan the QR code with your phone');
        console.log('   3. Wait for "WhatsApp is ready!" message');
        console.log('   4. Try creating a ticket again');
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Wait a moment for WhatsApp service to initialize
console.log('⏳ Waiting for WhatsApp service to initialize...');
setTimeout(testWhatsAppNotification, 5000);
