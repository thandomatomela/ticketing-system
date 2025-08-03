require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('🔄 Testing WhatsApp message sending...');
console.log('📋 Group ID from .env:', process.env.WHATSAPP_GROUP_ID);

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "tenant-ticketing-system"
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('ready', async () => {
  console.log('✅ WhatsApp is ready!');
  
  const groupId = process.env.WHATSAPP_GROUP_ID;
  if (!groupId) {
    console.error('❌ No WHATSAPP_GROUP_ID found in .env file');
    process.exit(1);
  }
  
  try {
    console.log('📤 Sending test message to group...');
    const message = `🧪 Test message from Tenant Ticketing System\nTime: ${new Date().toLocaleString()}`;
    
    await client.sendMessage(groupId, message);
    console.log('✅ Test message sent successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    process.exit(1);
  }
});

client.on('auth_failure', (msg) => {
  console.error('❌ Auth failed:', msg);
  process.exit(1);
});

client.initialize();

setTimeout(() => {
  console.log('⏰ Timeout - taking too long');
  process.exit(1);
}, 60000);