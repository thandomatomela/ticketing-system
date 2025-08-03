// Dynamic import for nodemailer to avoid startup issues
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.log('📧 Nodemailer not available, using demo mode');
}

class NotificationService {
  constructor() {
    console.log('📬 Notification Service initialized');

    // Initialize email transporter
    this.setupEmailTransporter();

    // SMS configuration
    this.smsEnabled = process.env.SMS_ENABLED === 'true';
  }

  setupEmailTransporter() {
    if (!nodemailer) {
      console.log('📧 Nodemailer not available - using demo mode');
      this.emailEnabled = false;
      return;
    }

    try {
      // Fix: Use nodemailer.createTransporter instead of nodemailer.createTransporter
      this.emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });

      // Test email configuration
      this.emailTransporter.verify((error, success) => {
        if (error) {
          console.log('📧 Email configuration error (using demo mode):', error.message);
          this.emailEnabled = false;
        } else {
          console.log('📧 Email server is ready to send messages');
          this.emailEnabled = true;
        }
      });
    } catch (error) {
      console.log('📧 Email setup error (using demo mode):', error.message);
      this.emailEnabled = false;
    }
  }

  // Email notification for internal workers
  async sendEmailNotification(ticket, worker) {
    try {
      const subject = `🎫 New Ticket Assigned: ${ticket.title}`;
      const htmlContent = this.generateEmailHTML(ticket, worker);

      // Always log to console first
      console.log('\n📧 EMAIL NOTIFICATION:');
      console.log(`   ✉️  To: ${worker.email} (${worker.name})`);
      console.log(`   📋 Subject: ${subject}`);
      console.log(`   🎯 Ticket ID: ${ticket._id}`);
      console.log(`   ⚡ Priority: ${ticket.priority.toUpperCase()}`);

      // Try to send real email if configured
      if (this.emailEnabled && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: worker.email,
          subject: subject,
          html: htmlContent
        };

        const result = await this.emailTransporter.sendMail(mailOptions);
        console.log(`   ✅ Email sent successfully! Message ID: ${result.messageId}`);
        console.log('   ─────────────────────────────────────────────────');

        return { success: true, type: 'email', recipient: worker.email, messageId: result.messageId };
      } else {
        console.log(`   ⚠️  Email not configured - using demo mode`);
        console.log(`   📍 Location: ${ticket.location?.building || 'N/A'} ${ticket.location?.unit || ''}`);
        console.log(`   📝 Description: ${ticket.description?.substring(0, 100)}...`);
        console.log(`   🔗 Login at: http://localhost:3000`);
        console.log('   ─────────────────────────────────────────────────');

        return { success: true, type: 'email', recipient: worker.email, demo: true };
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, type: 'email', error: error.message };
    }
  }

  // SMS notification for contracting companies
  async sendSMSNotification(ticket, companyName, companyPhone) {
    try {
      // Build location string from new property-based structure
      const propertyName = ticket.property?.name || 'Unknown Property';
      const unit = ticket.unit || '';
      const room = ticket.room || '';
      const location = `${propertyName} ${unit} ${room}`.trim();

      const smsMessage = `🎫 NEW TICKET: ${ticket.title} | Priority: ${ticket.priority.toUpperCase()} | Location: ${location} | Category: ${ticket.category?.replace('_', ' ')} | Contact property manager for details.`;

      // Always log to console first
      console.log('\n📱 SMS NOTIFICATION:');
      console.log(`   📞 To: ${companyPhone} (${companyName})`);
      console.log(`   💬 Message: ${smsMessage}`);
      console.log(`   🎯 Ticket ID: ${ticket._id}`);

      // Try to send real SMS if Twilio is configured
      const twilioSid = process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE || process.env.TWILIO_PHONE_NUMBER;

      console.log(`   🔍 Debug - SID: ${twilioSid ? 'Found' : 'Missing'}, Token: ${twilioToken ? 'Found' : 'Missing'}, Phone: ${twilioPhone ? twilioPhone : 'Missing'}`);

      if (twilioSid && twilioToken && twilioPhone) {
        try {
          const twilio = require('twilio');
          const client = twilio(twilioSid, twilioToken);

          const message = await client.messages.create({
            body: smsMessage,
            from: twilioPhone,
            to: companyPhone
          });

          console.log(`   ✅ SMS sent successfully! Message SID: ${message.sid}`);
          console.log('   ─────────────────────────────────────────────────');

          return { success: true, type: 'sms', recipient: companyPhone, messageSid: message.sid };
        } catch (twilioError) {
          console.log(`   ❌ Twilio error: ${twilioError.message}`);
          console.log(`   ⚠️  Using demo mode instead`);
        }
      } else {
        console.log(`   ⚠️  Twilio not configured - using demo mode`);
      }

      console.log(`   📅 Created: ${new Date(ticket.createdAt).toLocaleString()}`);
      console.log('   ─────────────────────────────────────────────────');

      return { success: true, type: 'sms', recipient: companyPhone, demo: true };
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      return { success: false, type: 'sms', error: error.message };
    }
  }

  // Generate professional HTML email template
  generateEmailHTML(ticket, worker) {
    // Build location string from new property-based structure
    const propertyName = ticket.property?.name || 'Unknown Property';
    const unit = ticket.unit || '';
    const room = ticket.room || '';
    const location = `${propertyName} ${unit} ${room}`.trim();
    const priorityColor = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    }[ticket.priority] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .ticket-info { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${priorityColor}; margin: 20px 0; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #6b7280; }
          .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; background: ${priorityColor}; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 New Ticket Assignment</h1>
            <p>Hello ${worker.name}, you have been assigned a new maintenance ticket.</p>
          </div>

          <div class="content">
            <div class="ticket-info">
              <h2>${ticket.title}</h2>
              <div class="info-row">
                <span class="label">Description:</span><br>
                <span class="value">${ticket.description}</span>
              </div>
              <div class="info-row">
                <span class="label">Priority:</span> <span class="priority">${ticket.priority}</span>
              </div>
              <div class="info-row">
                <span class="label">Category:</span> <span class="value">${ticket.category?.replace('_', ' ')}</span>
              </div>
              <div class="info-row">
                <span class="label">Location:</span> <span class="value">${location}</span>
              </div>
              <div class="info-row">
                <span class="label">Created:</span> <span class="value">${new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <p>Please log into the system to view full details and update the ticket status.</p>
            <a href="http://localhost:3000" class="button">Login to System</a>
          </div>

          <div class="footer">
            <p>This is an automated message from the Tenant Ticketing System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send notification based on assignment type
  async sendAssignmentNotification(ticket, assignmentType, recipient) {
    const notifications = [];

    if (assignmentType === 'worker' && recipient) {
      const result = await this.sendEmailNotification(ticket, recipient);
      notifications.push(result);
    }

    if (assignmentType === 'company' && recipient) {
      const result = await this.sendSMSNotification(ticket, recipient.name, recipient.phone);
      notifications.push(result);
    }

    return notifications;
  }
}

module.exports = new NotificationService();

