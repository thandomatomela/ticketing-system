require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

console.log('🔄 Testing WhatsApp message sending (clean)...');
console.log('📋 Group ID from .env:', process.env.WHATSAPP_GROUP_ID);

// Clean up any existing auth folder
const authPath = path.join(__dirname, '.wwebjs_auth');
if (fs.existsSync(authPath)) {
  console.log('🧹 Cleaning up old auth data...');
  try {
    fs.rmSync(authPath, { recursive: true, force: true });
    console.log('✅ Old auth data cleaned');
  } catch (error) {
    console.log('⚠️ Could not clean auth data, continuing anyway...');
  }
}

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "clean-test-" + Date.now() // Use unique client ID
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-javascript',
      '--disable-default-apps'
    ]
  }
});

client.on('loading_screen', (percent, message) => {
  console.log(`📱 Loading: ${percent}% - ${message}`);
});

client.on('qr', (qr) => {
  console.log('\n📱 QR CODE - Scan with WhatsApp:');
  const qrcode = require('qrcode-terminal');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('✅ Authenticated!');
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
    const message = `🧪 Clean Test Message from Tenant Ticketing System\nTime: ${new Date().toLocaleString()}`;
    
    await client.sendMessage(groupId, message);
    console.log('✅ Test message sent successfully!');
    
    // Clean shutdown
    await client.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    await client.destroy();
    process.exit(1);
  }
});

client.on('auth_failure', (msg) => {
  console.error('❌ Auth failed:', msg);
  process.exit(1);
});

client.on('disconnected', (reason) => {
  console.log('📱 Disconnected:', reason);
});

console.log('🚀 Initializing clean client...');
client.initialize();

// Timeout
setTimeout(async () => {
  console.log('⏰ Timeout - cleaning up...');
  try {
    await client.destroy();
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(1);
}, 120000);