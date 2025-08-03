require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false, // Show browser so you can see groups
    args: ['--no-sandbox']
  }
});

client.on('ready', async () => {
  console.log('✅ WhatsApp is ready!');
  console.log('📱 Browser window should be open showing WhatsApp Web');
  console.log('\n🔍 Instructions:');
  console.log('1. Look at the browser window');
  console.log('2. Click on your target group');
  console.log('3. Right-click in the chat area');
  console.log('4. Select "Inspect" or "Inspect Element"');
  console.log('5. Look for data-id attribute in the HTML');
  console.log('6. The group ID will be something like "123456789@g.us"');
  
  // Also try to list groups programmatically
  setTimeout(async () => {
    try {
      const chats = await client.getChats();
      const groups = chats.filter(chat => chat.isGroup);
      
      console.log(`\n📋 Your groups (${groups.length} found):`);
      groups.forEach((group, index) => {
        console.log(`${index + 1}. "${group.name}"`);
        console.log(`   ID: ${group.id._serialized}`);
        console.log('');
      });
      
    } catch (error) {
      console.log('❌ Could not get groups programmatically');
    }
  }, 5000);
});

client.initialize();