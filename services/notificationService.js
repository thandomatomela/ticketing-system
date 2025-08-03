const twilio = require('twilio');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');
const whatsappService = require('./whatsappService');

class NotificationService {
  constructor() {
    // Initialize Twilio client
    if (config.sms.accountSid && config.sms.authToken) {
      this.twilioClient = twilio(config.sms.accountSid, config.sms.authToken);
    } else {
      logger.warn('Twilio credentials not configured. SMS/WhatsApp notifications disabled.');
    }

    // Initialize email transporter
    if (config.email.host && config.email.auth.user) {
      this.emailTransporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.auth.user,
          pass: config.email.auth.pass,
        },
      });
    } else {
      logger.warn('Email credentials not configured. Email notifications disabled.');
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(to, message) {
    if (!this.twilioClient) {
      logger.warn('SMS not sent: Twilio not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: config.sms.phoneNumber,
        to: to,
      });

      logger.info('SMS sent successfully', { 
        to, 
        messageSid: result.sid 
      });

      return { success: true, messageSid: result.sid };
    } catch (error) {
      logger.error('Failed to send SMS', { 
        to, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, htmlContent, textContent = null) {
    if (!this.emailTransporter) {
      logger.warn('Email not sent: Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"Tenant Ticketing System" <${config.email.auth.user}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      logger.info('Email sent successfully', { 
        to, 
        subject,
        messageId: result.messageId 
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send email', { 
        to, 
        subject,
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify WhatsApp group about new ticket
   */
  async notifyWhatsAppGroupNewTicket(ticket, createdBy) {
    try {
      const message = whatsappService.formatNewTicketMessage(ticket, createdBy);
      const result = await whatsappService.sendToGroup(message);
      
      logger.info('WhatsApp group notification sent', {
        ticketId: ticket._id,
        success: result.success
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to send WhatsApp group notification', {
        ticketId: ticket._id,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send comprehensive notifications for new ticket
   */
  async sendNewTicketNotifications(ticket, createdBy) {
    const notifications = [];

    // Always send WhatsApp notification for new tickets
    try {
      const whatsappResult = await this.notifyWhatsAppGroupNewTicket(ticket, createdBy);
      notifications.push({
        type: 'whatsapp',
        success: whatsappResult.success,
        error: whatsappResult.error
      });
    } catch (error) {
      logger.error('WhatsApp notification failed', { ticketId: ticket._id, error: error.message });
      notifications.push({
        type: 'whatsapp',
        success: false,
        error: error.message
      });
    }

    // Send assignment notifications if ticket is already assigned
    if (ticket.assignedTo) {
      const worker = await database.getUserById(ticket.assignedTo);
      if (worker && worker.email) {
        const emailResult = await this.sendEmailNotification(ticket, worker);
        notifications.push({
          type: 'email',
          success: emailResult.success,
          recipient: worker.email,
          error: emailResult.error
        });
      }
    }

    if (ticket.contractingCompany) {
      // You'll need to implement getting company details
      const smsResult = await this.sendSMSNotification(ticket, ticket.contractingCompany, '+1234567890');
      notifications.push({
        type: 'sms',
        success: smsResult.success,
        error: smsResult.error
      });
    }

    return notifications;
  }

  /**
   * Format location for display
   */
  formatLocation(location) {
    if (!location) return 'Not specified';
    if (typeof location === 'string') return location;
    return `${location.building || ''} ${location.unit || ''} ${location.room || ''}`.trim() || 'Not specified';
  }
}

module.exports = new NotificationService();


