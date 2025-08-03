const logger = require('../utils/logger');

class EnhancedNotificationService {
  constructor() {
    this.notificationChannels = [];
    this.setupChannels();
    console.log('📬 Enhanced Notification Service initialized');
  }

  setupChannels() {
    // Console logging (always available)
    this.notificationChannels.push({
      name: 'console',
      enabled: true,
      send: this.sendConsoleNotification.bind(this)
    });

    // Email notifications (if configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.notificationChannels.push({
        name: 'email',
        enabled: true,
        send: this.sendEmailNotification.bind(this)
      });
    }

    // SMS notifications (if Twilio configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.notificationChannels.push({
        name: 'sms',
        enabled: true,
        send: this.sendSMSNotification.bind(this)
      });
    }

    // File logging
    this.notificationChannels.push({
      name: 'file',
      enabled: true,
      send: this.sendFileNotification.bind(this)
    });

    console.log(`📬 Notification channels available: ${this.notificationChannels.map(c => c.name).join(', ')}`);
  }

  formatTicketMessage(ticket, createdBy) {
    const propertyName = ticket.property?.name || 'Unknown Property';
    const unit = ticket.unit || '';
    const room = ticket.room || '';
    
    let location = propertyName;
    if (unit) location += ` - Unit ${unit}`;
    if (room) location += ` (${room})`;
    if (!unit && !room) location = 'Location TBD';

    return {
      title: `🎫 NEW MAINTENANCE TICKET`,
      details: {
        ticketId: ticket._id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority?.toUpperCase() || 'MEDIUM',
        category: ticket.category?.replace('_', ' ').toUpperCase() || 'GENERAL',
        location: location,
        createdBy: createdBy.name || createdBy.email,
        createdAt: new Date(ticket.createdAt).toLocaleString(),
        assignedTo: ticket.assignedTo?.name || 'Unassigned',
        contractingCompany: ticket.contractingCompany || 'None'
      }
    };
  }

  async sendConsoleNotification(message) {
    console.log('\n' + '='.repeat(60));
    console.log('📱 NEW TICKET NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`📋 Title: ${message.details.title}`);
    console.log(`👤 Created by: ${message.details.createdBy}`);
    console.log(`⚡ Priority: ${message.details.priority}`);
    console.log(`📂 Category: ${message.details.category}`);
    console.log(`📍 Location: ${message.details.location}`);
    console.log(`🆔 Ticket ID: ${message.details.ticketId}`);
    console.log(`⏰ Created: ${message.details.createdAt}`);
    console.log('');
    console.log('📝 Description:');
    console.log(message.details.description);
    console.log('');
    if (message.details.assignedTo !== 'Unassigned') {
      console.log(`👷 Assigned to: ${message.details.assignedTo}`);
    }
    if (message.details.contractingCompany !== 'None') {
      console.log(`🏢 Company: ${message.details.contractingCompany}`);
    }
    console.log('='.repeat(60));
    console.log('🔗 View in system: http://localhost:3000');
    console.log('='.repeat(60) + '\n');

    return { success: true, channel: 'console' };
  }

  async sendFileNotification(message) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const logDir = path.join(__dirname, '..', 'logs');
      const logFile = path.join(logDir, 'ticket-notifications.log');
      
      // Ensure logs directory exists
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      const logEntry = `
[${new Date().toISOString()}] NEW TICKET NOTIFICATION
Ticket ID: ${message.details.ticketId}
Title: ${message.details.title}
Created by: ${message.details.createdBy}
Priority: ${message.details.priority}
Category: ${message.details.category}
Location: ${message.details.location}
Description: ${message.details.description}
Assigned to: ${message.details.assignedTo}
Company: ${message.details.contractingCompany}
Created: ${message.details.createdAt}
View: http://localhost:3000/tickets/${message.details.ticketId}
${'='.repeat(80)}
`;

      await fs.appendFile(logFile, logEntry);
      return { success: true, channel: 'file', file: logFile };
    } catch (error) {
      console.error('❌ File notification failed:', error.message);
      return { success: false, channel: 'file', error: error.message };
    }
  }

  async sendEmailNotification(message) {
    // Placeholder for email implementation
    console.log('📧 Email notification would be sent (not configured)');
    return { success: false, channel: 'email', error: 'Email not configured' };
  }

  async sendSMSNotification(message) {
    try {
      // Check if Twilio is configured
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (!twilioSid || !twilioToken || !twilioPhone) {
        console.log('📱 SMS notification would be sent (Twilio not configured)');
        console.log(`   📞 To: ${message.to}`);
        console.log(`   💬 Message: ${message.body}`);
        return { success: false, channel: 'sms', error: 'Twilio not configured' };
      }

      // Check if credentials are placeholder values
      if (twilioSid.includes('your-') || twilioToken.includes('your-') || twilioPhone.includes('+1234567890')) {
        console.log('📱 SMS notification would be sent (using demo credentials)');
        console.log(`   📞 To: ${message.to}`);
        console.log(`   💬 Message: ${message.body}`);
        console.log('   ⚠️  Please configure real Twilio credentials in .env file');
        return { success: true, channel: 'sms', demo: true };
      }

      // Send real SMS
      const twilio = require('twilio');
      const client = twilio(twilioSid, twilioToken);

      const result = await client.messages.create({
        body: message.body,
        from: twilioPhone,
        to: message.to
      });

      console.log(`📱 SMS sent successfully! Message SID: ${result.sid}`);
      return { success: true, channel: 'sms', messageSid: result.sid };

    } catch (error) {
      console.error('❌ Error sending SMS:', error.message);
      return { success: false, channel: 'sms', error: error.message };
    }
  }

  async notifyNewTicket(ticket, createdBy) {
    console.log(`📬 Processing notifications for ticket: ${ticket._id}`);
    
    const message = this.formatTicketMessage(ticket, createdBy);
    const results = [];

    // Send through all available channels
    for (const channel of this.notificationChannels) {
      if (channel.enabled) {
        try {
          const result = await channel.send(message);
          results.push(result);
          
          if (result.success) {
            console.log(`✅ ${channel.name} notification sent`);
          } else {
            console.log(`❌ ${channel.name} notification failed: ${result.error}`);
          }
        } catch (error) {
          console.error(`❌ ${channel.name} notification error:`, error.message);
          results.push({ 
            success: false, 
            channel: channel.name, 
            error: error.message 
          });
        }
      }
    }

    // Log summary
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`📊 Notification summary: ${successful}/${total} channels successful`);
    
    logger.info('Ticket notifications sent', {
      ticketId: ticket._id,
      channels: results.length,
      successful: successful,
      results: results
    });

    return {
      success: successful > 0,
      channels: results.length,
      successful: successful,
      results: results
    };
  }

  // Get notification status
  getStatus() {
    return {
      channels: this.notificationChannels.map(c => ({
        name: c.name,
        enabled: c.enabled
      })),
      totalChannels: this.notificationChannels.length,
      enabledChannels: this.notificationChannels.filter(c => c.enabled).length
    };
  }
}

module.exports = new EnhancedNotificationService();
