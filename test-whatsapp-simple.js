require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🔄 Starting simple WhatsApp test...');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "test-client"
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('loading_screen', (percent, message) => {
  console.log(`Loading: ${percent}% - ${message}`);
});

client.on('qr', (qr) => {
  console.log('\n📱 QR CODE RECEIVED:');
  qrcode.generate(qr, { small: true });
  console.log('\nScan this with WhatsApp!\n');
});

client.on('ready', async () => {
  console.log('✅ Client is ready!');
  
  try {
    const chats = await client.getChats();
    const groups = chats.filter(chat => chat.isGroup);
    
    console.log('\n📋 Your WhatsApp Groups:');
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.name}`);
      console.log(`   ID: ${group.id._serialized}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error getting groups:', error);
    process.exit(1);
  }
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
  process.exit(1);
});

console.log('🚀 Initializing client...');
client.initialize();

// Timeout after 2 minutes
setTimeout(() => {
  console.log('⏰ Timeout - QR code not scanned');
  process.exit(1);
}, 120000);