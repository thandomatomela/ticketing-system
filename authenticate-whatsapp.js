require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🔐 WhatsApp Authentication Helper');
console.log('=================================');
console.log('This will authenticate WhatsApp Web for the ticketing system.');
console.log('');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "tenant-ticketing-system"
  }),
  puppeteer: {
    headless: false, // Show browser for easier debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('loading_screen', (percent, message) => {
  console.log(`📱 Loading WhatsApp: ${percent}% - ${message}`);
});

client.on('qr', (qr) => {
  console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP:');
  console.log('==========================================');
  qrcode.generate(qr, { small: true });
  console.log('');
  console.log('📱 Steps:');
  console.log('1. Open WhatsApp on your phone');
  console.log('2. Go to Settings > Linked Devices');
  console.log('3. Tap "Link a Device"');
  console.log('4. Scan the QR code above');
  console.log('');
  console.log('⏳ Waiting for QR code scan...');
});

client.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated successfully!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
  process.exit(1);
});

client.on('ready', async () => {
  console.log('✅ WhatsApp is ready!');
  console.log('');
  
  const groupId = process.env.WHATSAPP_GROUP_ID;
  
  if (!groupId || groupId === 'your-whatsapp-group-id@g.us') {
    console.log('❌ No valid group ID configured');
    process.exit(1);
  }
  
  try {
    // Test the group
    console.log(`🔍 Testing group: ${groupId}`);
    const chat = await client.getChatById(groupId);
    console.log(`✅ Group found: "${chat.name}"`);
    console.log(`👥 Participants: ${chat.participants.length}`);
    
    // Send test message
    console.log('🧪 Sending test message...');
    const testMessage = `🧪 WhatsApp Authentication Test
Time: ${new Date().toLocaleString()}

✅ WhatsApp is now authenticated and ready!
🎫 New ticket notifications will be sent to this group.

This is a one-time setup message.`;
    
    await client.sendMessage(groupId, testMessage);
    console.log('✅ Test message sent successfully!');
    console.log('');
    console.log('🎉 WhatsApp is now fully configured!');
    console.log('   Your server will now send notifications to this group.');
    console.log('');
    console.log('🔄 You can now restart your server and create tickets.');
    
  } catch (error) {
    console.error('❌ Error testing group:', error.message);
  }
  
  process.exit(0);
});

client.on('disconnected', (reason) => {
  console.log('📱 WhatsApp disconnected:', reason);
});

console.log('🔄 Initializing WhatsApp client...');
console.log('   This may take a moment...');
client.initialize();
