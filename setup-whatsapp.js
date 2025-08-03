require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🔧 WhatsApp Setup Helper');
console.log('========================');
console.log('This script will help you:');
console.log('1. Authenticate WhatsApp Web');
console.log('2. Find your group ID');
console.log('3. Test sending messages');
console.log('');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "tenant-ticketing-setup"
  }),
  puppeteer: {
    headless: false, // Show browser for easier QR scanning
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('loading_screen', (percent, message) => {
  console.log(`📱 Loading WhatsApp: ${percent}% - ${message}`);
});

client.on('qr', (qr) => {
  console.log('📱 Scan this QR code with your WhatsApp mobile app:');
  console.log('');
  qrcode.generate(qr, { small: true });
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
  
  try {
    // Get all groups
    console.log('📋 Finding your WhatsApp groups...');
    const chats = await client.getChats();
    const groups = chats.filter(chat => chat.isGroup);
    
    if (groups.length === 0) {
      console.log('❌ No WhatsApp groups found.');
      console.log('   Make sure you are part of at least one WhatsApp group.');
      process.exit(1);
    }
    
    console.log(`\n📋 Found ${groups.length} WhatsApp groups:`);
    console.log('='.repeat(50));
    
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.name}`);
      console.log(`   ID: ${group.id._serialized}`);
      console.log(`   Participants: ${group.participants.length}`);
      console.log('');
    });
    
    // Check if current group ID exists
    const currentGroupId = process.env.WHATSAPP_GROUP_ID;
    if (currentGroupId && currentGroupId !== 'your-whatsapp-group-id@g.us') {
      console.log(`🔍 Checking current group ID: ${currentGroupId}`);
      try {
        const currentGroup = groups.find(g => g.id._serialized === currentGroupId);
        if (currentGroup) {
          console.log(`✅ Current group ID is valid: "${currentGroup.name}"`);
          
          // Test sending a message
          console.log('🧪 Sending test message...');
          const testMessage = `🧪 WhatsApp Setup Test\nTime: ${new Date().toLocaleString()}\n\nThis is a test message from the Tenant Ticketing System setup.`;
          
          await client.sendMessage(currentGroupId, testMessage);
          console.log('✅ Test message sent successfully!');
          console.log('');
          console.log('🎉 WhatsApp is properly configured and working!');
          
        } else {
          console.log('❌ Current group ID not found in your groups.');
          console.log('   Please update WHATSAPP_GROUP_ID in your .env file with one of the IDs above.');
        }
      } catch (error) {
        console.error('❌ Error testing current group:', error.message);
      }
    } else {
      console.log('⚠️  No valid group ID configured in .env file.');
      console.log('   Please update WHATSAPP_GROUP_ID with one of the IDs above.');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Copy one of the group IDs above');
    console.log('2. Update WHATSAPP_GROUP_ID in your .env file');
    console.log('3. Restart your server');
    console.log('4. Create a ticket to test WhatsApp notifications');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
});

client.on('disconnected', (reason) => {
  console.log('📱 WhatsApp disconnected:', reason);
});

console.log('🔄 Initializing WhatsApp client...');
client.initialize();
