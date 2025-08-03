const { Client, LocalAuth } = require('whatsapp-web.js');
const config = require('../config/config');
const logger = require('../utils/logger');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.isEnabled = process.env.WHATSAPP_ENABLED !== 'false'; // Default to enabled
    this.groupId = process.env.WHATSAPP_GROUP_ID;
    this.groupName = process.env.WHATSAPP_GROUP_NAME || 'Maintenance Team';
    this.initializationAttempts = 0;
    this.maxInitializationAttempts = 3;
    this.fallbackMode = false;

    console.log('🔧 WhatsApp Service Initializing...');
    console.log(`📱 Enabled: ${this.isEnabled}`);
    console.log(`📱 Group ID: ${this.groupId || 'NOT SET'}`);
    console.log(`📱 Group Name: ${this.groupName}`);

    if (!this.isEnabled) {
      console.log('⚠️  WhatsApp notifications disabled via WHATSAPP_ENABLED=false');
      this.fallbackMode = true;
      return;
    }

    if (this.groupId && this.groupId !== 'your-whatsapp-group-id@g.us') {
      console.log('✅ Valid group ID found, attempting WhatsApp initialization...');
      this.initializeWithRetry();
    } else {
      console.log('⚠️  WhatsApp group ID not configured, running in fallback mode');
      console.log('   Set WHATSAPP_GROUP_ID in .env to enable WhatsApp notifications');
      this.fallbackMode = true;
      logger.warn('WhatsApp group ID not configured in environment variables');
    }
  }

  async initializeWithRetry() {
    this.initializationAttempts++;

    if (this.initializationAttempts > this.maxInitializationAttempts) {
      console.log('❌ WhatsApp initialization failed after maximum attempts, switching to fallback mode');
      this.fallbackMode = true;
      return;
    }

    console.log(`🔄 WhatsApp initialization attempt ${this.initializationAttempts}/${this.maxInitializationAttempts}`);

    try {
      await this.initialize();
    } catch (error) {
      console.error(`❌ WhatsApp initialization attempt ${this.initializationAttempts} failed:`, error.message);

      // Wait before retry
      setTimeout(() => {
        this.initializeWithRetry();
      }, 10000); // Wait 10 seconds before retry
    }
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      try {
        this.client = new Client({
          authStrategy: new LocalAuth({
            clientId: "tenant-ticketing-system"
          }),
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu'
            ]
          }
        });

        // Set timeout for initialization
        const initTimeout = setTimeout(() => {
          console.log('⏰ WhatsApp initialization timeout, switching to fallback mode');
          this.fallbackMode = true;
          this.cleanup();
          reject(new Error('Initialization timeout'));
        }, 60000); // 60 second timeout

        this.client.on('ready', () => {
          clearTimeout(initTimeout);
          console.log('✅ WhatsApp client is ready!');
          logger.info('WhatsApp client is ready');
          this.isReady = true;
          this.initializationAttempts = 0; // Reset attempts on success
          resolve();
        });

        this.client.on('auth_failure', (msg) => {
          clearTimeout(initTimeout);
          console.log('❌ WhatsApp authentication failed, switching to fallback mode');
          logger.error('WhatsApp authentication failed', { error: msg });
          this.isReady = false;
          this.fallbackMode = true;
          this.cleanup();
          reject(new Error(`Authentication failed: ${msg}`));
        });

        this.client.on('disconnected', (reason) => {
          console.log('📱 WhatsApp client disconnected:', reason);
          logger.warn('WhatsApp client disconnected', { reason });
          this.isReady = false;

          // Try to reconnect after a delay
          setTimeout(() => {
            if (!this.fallbackMode && this.initializationAttempts < this.maxInitializationAttempts) {
              console.log('🔄 Attempting to reconnect WhatsApp...');
              this.initializeWithRetry();
            }
          }, 30000); // Wait 30 seconds before reconnect
        });

        this.client.initialize();
        console.log('🔄 WhatsApp client initializing...');
        logger.info('WhatsApp client initializing...');

      } catch (error) {
        console.error('❌ Failed to initialize WhatsApp client:', error.message);
        logger.error('Failed to initialize WhatsApp client', { error: error.message });
        this.fallbackMode = true;
        reject(error);
      }
    });
  }

  cleanup() {
    if (this.client) {
      try {
        this.client.destroy();
      } catch (error) {
        console.log('⚠️  Error cleaning up WhatsApp client:', error.message);
      }
      this.client = null;
    }
  }

  formatNewTicketMessage(ticket, createdBy) {
    const priority = ticket.priority?.toUpperCase() || 'MEDIUM';
    const category = ticket.category?.replace('_', ' ').toUpperCase() || 'GENERAL';

    // Handle property-based location structure
    const propertyName = ticket.property?.name || 'Unknown Property';
    const unit = ticket.unit || '';
    const room = ticket.room || '';

    let location = propertyName;
    if (unit) location += ` - Unit ${unit}`;
    if (room) location += ` (${room})`;
    if (!unit && !room) location = 'Location TBD';
    
    return `🎫 NEW MAINTENANCE TICKET

📋 Title: ${ticket.title}
👤 Created by: ${createdBy.name || createdBy.email}
⚡ Priority: ${priority}
📂 Category: ${category}
📍 Location: ${location}

📝 Description:
${ticket.description}

🆔 Ticket ID: ${ticket._id}
⏰ Created: ${new Date(ticket.createdAt).toLocaleString()}

Please check the system for full details and assignment.`;
  }

  async sendToGroup(message) {
    // If in fallback mode, log the message instead of sending
    if (this.fallbackMode || !this.isEnabled) {
      console.log('📱 WhatsApp (Fallback Mode): Message would be sent to group');
      console.log('📱 Group:', this.groupName);
      console.log('📱 Message:');
      console.log('─'.repeat(50));
      console.log(message);
      console.log('─'.repeat(50));

      logger.info('WhatsApp message logged (fallback mode)', {
        groupId: this.groupId,
        messageLength: message.length
      });

      return {
        success: true,
        fallback: true,
        message: 'Message logged in fallback mode'
      };
    }

    if (!this.isReady) {
      console.log('⚠️  WhatsApp not ready, logging message instead');
      console.log('📱 Message that would be sent:');
      console.log('─'.repeat(50));
      console.log(message);
      console.log('─'.repeat(50));

      logger.warn('WhatsApp not ready, message logged instead');
      return {
        success: true,
        fallback: true,
        error: 'WhatsApp service not ready - message logged'
      };
    }

    if (!this.groupId) {
      logger.warn('WhatsApp group ID not configured');
      return { success: false, error: 'Group ID not configured' };
    }

    try {
      await this.client.sendMessage(this.groupId, message);
      console.log('✅ WhatsApp message sent successfully to group');
      logger.info('WhatsApp group message sent successfully', { groupId: this.groupId });
      return { success: true };
    } catch (error) {
      console.log('❌ Failed to send WhatsApp message, logging instead:', error.message);
      console.log('📱 Message that failed to send:');
      console.log('─'.repeat(50));
      console.log(message);
      console.log('─'.repeat(50));

      logger.error('Failed to send WhatsApp group message', {
        groupId: this.groupId,
        error: error.message
      });

      return {
        success: true,
        fallback: true,
        error: `Send failed: ${error.message} - message logged`
      };
    }
  }

  async notifyNewTicket(ticket, createdBy) {
    try {
      console.log('📱 WhatsApp: Processing notification for ticket:', ticket._id);
      console.log('📱 WhatsApp: Enabled?', this.isEnabled);
      console.log('📱 WhatsApp: Ready?', this.isReady);
      console.log('📱 WhatsApp: Fallback mode?', this.fallbackMode);

      const message = this.formatNewTicketMessage(ticket, createdBy);
      console.log('📱 WhatsApp: Message formatted, length:', message.length);

      const result = await this.sendToGroup(message);

      if (result.success) {
        if (result.fallback) {
          console.log('✅ WhatsApp notification logged (fallback mode) for ticket:', ticket._id);
          logger.info('WhatsApp notification logged in fallback mode', {
            ticketId: ticket._id,
            reason: result.error || 'Fallback mode active'
          });
        } else {
          console.log('✅ WhatsApp notification sent successfully for ticket:', ticket._id);
          logger.info('WhatsApp notification sent for new ticket', { ticketId: ticket._id });
        }
      } else {
        console.log('❌ WhatsApp notification failed:', result.error);
        logger.error('WhatsApp notification failed', {
          ticketId: ticket._id,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      console.error('❌ WhatsApp notification error:', error.message);

      // Even if there's an error, log the message so it's not lost
      console.log('📱 Emergency fallback - logging message:');
      try {
        const message = this.formatNewTicketMessage(ticket, createdBy);
        console.log('─'.repeat(50));
        console.log(message);
        console.log('─'.repeat(50));
      } catch (formatError) {
        console.log('❌ Could not format message:', formatError.message);
      }

      logger.error('Failed to send WhatsApp notification', {
        ticketId: ticket._id,
        error: error.message
      });

      return {
        success: true,
        fallback: true,
        error: `Exception occurred: ${error.message} - message logged`
      };
    }
  }
  // Get service status for monitoring
  getStatus() {
    return {
      enabled: this.isEnabled,
      ready: this.isReady,
      fallbackMode: this.fallbackMode,
      groupId: this.groupId,
      groupName: this.groupName,
      initializationAttempts: this.initializationAttempts,
      maxAttempts: this.maxInitializationAttempts
    };
  }

  // Enable/disable the service
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.fallbackMode = true;
      this.cleanup();
      console.log('📱 WhatsApp service disabled');
    } else if (this.groupId && this.groupId !== 'your-whatsapp-group-id@g.us') {
      this.fallbackMode = false;
      this.initializationAttempts = 0;
      console.log('📱 WhatsApp service enabled, attempting initialization...');
      this.initializeWithRetry();
    }
  }
}

module.exports = new WhatsAppService();

