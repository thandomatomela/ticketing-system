require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🔄 Starting WhatsApp debug...');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "debug-test"
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  }
});

client.on('loading_screen', (percent, message) => {
  console.log(`📱 Loading: ${percent}% - ${message}`);
});

client.on('qr', (qr) => {
  console.log('\n📱 QR CODE RECEIVED!');
  qrcode.generate(qr, { small: true });
  console.log('Scan this QR code with WhatsApp!\n');
});

client.on('authenticated', () => {
  console.log('✅ Authenticated!');
});

client.on('ready', async () => {
  console.log('✅ WhatsApp is ready!');
  
  // Wait a bit for everything to load
  console.log('⏳ Waiting 5 seconds for chats to load...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    console.log('🔍 Getting all chats...');
    
    // Add timeout to getChats
    const chatsPromise = client.getChats();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getChats timeout')), 30000)
    );
    
    const chats = await Promise.race([chatsPromise, timeoutPromise]);
    console.log(`📊 Total chats found: ${chats.length}`);
    
    // Log all chats to see what we have
    console.log('\n📋 All chats:');
    chats.forEach((chat, index) => {
      console.log(`${index + 1}. ${chat.name || 'Unknown'} - Type: ${chat.isGroup ? 'GROUP' : 'INDIVIDUAL'}`);
      if (chat.isGroup) {
        console.log(`   Group ID: ${chat.id._serialized}`);
      }
    });
    
    const groups = chats.filter(chat => chat.isGroup);
    console.log(`\n🎯 Found ${groups.length} groups specifically:`);
    
    if (groups.length === 0) {
      console.log('❌ No groups found. Make sure you:');
      console.log('   1. Are part of at least one WhatsApp group');
      console.log('   2. Have recent messages in those groups');
      console.log('   3. The groups are active');
    } else {
      groups.forEach((group, index) => {
        console.log(`${index + 1}. ${group.name}`);
        console.log(`   ID: ${group.id._serialized}`);
        console.log(`   Participants: ${group.participants ? group.participants.length : 'Unknown'}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error getting chats:', error);
    process.exit(1);
  }
});

client.on('auth_failure', (msg) => {
  console.error('❌ Auth failed:', msg);
});

client.on('disconnected', (reason) => {
  console.log('❌ Disconnected:', reason);
});

console.log('🚀 Initializing...');
client.initialize();

// Increase timeout to 2 minutes
setTimeout(() => {
  console.log('⏰ Timeout after 2 minutes');
  process.exit(1);
}, 120000);

