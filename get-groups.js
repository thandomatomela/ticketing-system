const whatsappService = require('./services/whatsappService');

console.log('Getting WhatsApp groups...');

setTimeout(async () => {
  if (whatsappService.isReady) {
    const groups = await whatsappService.getGroups();
    console.log('\n📋 Your WhatsApp Groups:');
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.name}`);
      console.log(`   ID: ${group.id}`);
      console.log(`   Participants: ${group.participants}`);
      console.log('');
    });
  } else {
    console.log('WhatsApp service not ready yet...');
  }
}, 5000);