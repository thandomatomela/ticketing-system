require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('🔄 Starting WhatsApp with visible browser...');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false, // This will open a visible browser
    args: ['--no-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('QR Code received - check the browser window!');
});

client.on('ready', () => {
  console.log('✅ Ready!');
});

client.initialize();