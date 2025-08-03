require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('🔄 Starting with visible browser...');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "debug-visible"
  }),
  puppeteer: {
    headless: false, // Show browser
    args: ['--no-sandbox'],
    defaultViewport: null
  }
});

client.on('ready', async () => {
  console.log('✅ WhatsApp is ready!');
  console.log('📱 Check the browser window - you should see WhatsApp Web loaded');
  
  // Wait and try to get chats
  setTimeout(async () => {
    try {
      console.log('🔍 Attempting to get chats...');
      const chats = await client.getChats();
      console.log(`Found ${chats.length} chats`);
      
      const groups = chats.filter(chat => chat.isGroup);
      console.log(`Groups: ${groups.length}`);
      
      groups.forEach(group => {
        console.log(`- ${group.name}: ${group.id._serialized}`);
      });
      
    } catch (error) {
      console.error('Error getting chats:', error);
    }
  }, 10000);
});

client.initialize();