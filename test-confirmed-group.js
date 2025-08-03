require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('🎯 Testing with confirmed group ID...');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('ready', async () => {
  console.log('✅ WhatsApp is ready!');
  
  const groupId = '120363403546198554@g.us';
  
  try {
    // Verify group exists
    const chat = await client.getChatById(groupId);
    console.log(`✅ Group confirmed: "${chat.name}"`);
    console.log(`👥 Participants: ${chat.participants.length}`);
    console.log(`📱 Is Group: ${chat.isGroup}`);
    
    // Send a distinctive test message
    const message = `🚨 URGENT TEST MESSAGE 🚨
    
🎯 This is a test from the Tenant Ticketing System
⏰ Time: ${new Date().toLocaleString()}
🔢 Random: ${Math.floor(Math.random() * 1000)}

If you see this message, the integration is working!`;
    
    console.log('📤 Sending test message...');
    const result = await client.sendMessage(groupId, message);
    console.log('✅ Message sent! Result:', result);
    
    // Wait a moment then check if message was actually sent
    setTimeout(async () => {
      try {
        const messages = await chat.fetchMessages({ limit: 5 });
        console.log('\n📋 Recent messages in group:');
        messages.forEach((msg, index) => {
          console.log(`${index + 1}. ${msg.body.substring(0, 50)}...`);
          console.log(`   From: ${msg.author || 'System'}`);
          console.log(`   Time: ${new Date(msg.timestamp * 1000).toLocaleString()}`);
        });
      } catch (fetchError) {
        console.log('⚠️ Could not fetch recent messages');
      }
      
      process.exit(0);
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});

client.on('message_create', (message) => {
  if (message.from === '120363403546198554@g.us') {
    console.log('📨 New message in target group:', message.body.substring(0, 50));
  }
});

client.initialize();

setTimeout(() => {
  console.log('⏰ Timeout');
  process.exit(1);
}, 60000);