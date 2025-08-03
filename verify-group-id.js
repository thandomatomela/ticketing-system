require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('🔍 Verifying group ID...');
console.log('📋 Group ID from .env:', process.env.WHATSAPP_GROUP_ID);

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "verify-test"
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('ready', async () => {
  console.log('✅ WhatsApp is ready!');
  
  const targetGroupId = process.env.WHATSAPP_GROUP_ID;
  
  try {
    // Try to get chat info for the group ID
    console.log('🔍 Checking if group ID exists...');
    const chat = await client.getChatById(targetGroupId);
    
    if (chat) {
      console.log('✅ Group found!');
      console.log(`📋 Name: ${chat.name}`);
      console.log(`🆔 ID: ${chat.id._serialized}`);
      console.log(`👥 Participants: ${chat.participants ? chat.participants.length : 'Unknown'}`);
      console.log(`📱 Is Group: ${chat.isGroup}`);
      
      // Try sending a test message
      console.log('📤 Sending verification message...');
      await client.sendMessage(targetGroupId, '🔍 Group ID verification test - if you see this, the ID is correct!');
      console.log('✅ Verification message sent!');
    }
    
  } catch (error) {
    console.error('❌ Group not found or error:', error.message);
    console.log('\n🔍 Let me search for all your groups...');
    
    try {
      const chats = await client.getChats();
      const groups = chats.filter(chat => chat.isGroup);
      
      console.log(`\n📋 Found ${groups.length} groups:`);
      groups.forEach((group, index) => {
        console.log(`${index + 1}. ${group.name}`);
        console.log(`   ID: ${group.id._serialized}`);
        console.log('');
      });
      
    } catch (getChatsError) {
      console.error('❌ Could not get chats:', getChatsError.message);
    }
  }
  
  process.exit(0);
});

client.initialize();

setTimeout(() => {
  console.log('⏰ Timeout');
  process.exit(1);
}, 60000);