// Test notification service directly
require('dotenv').config();

const notificationService = require('./utils/notificationService');

const testNotification = async () => {
  console.log('🧪 Testing Notification Service...\n');
  
  // Create a mock ticket
  const mockTicket = {
    _id: 'test-123',
    title: 'Test Ticket for SMS',
    priority: 'high',
    category: 'electrical',
    property: { name: 'Test Property' },
    unit: 'Unit 101',
    room: 'Living Room',
    createdAt: new Date()
  };
  
  // Test SMS notification
  console.log('📱 Testing SMS notification...');
  
  try {
    const result = await notificationService.sendSMSNotification(
      mockTicket,
      'Mike Electrician Services',
      '+1234567890'
    );
    
    console.log('✅ SMS notification test completed');
    console.log('Result:', result);
    
  } catch (error) {
    console.log('❌ SMS notification test failed:');
    console.log('Error:', error.message);
  }
};

testNotification();
