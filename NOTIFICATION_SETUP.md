# 📬 Email & SMS Notification Setup Guide

The system is currently in **demo mode** - notifications are logged to the console. To enable real email and SMS sending, follow these steps:

## 📧 Email Setup (Gmail Example)

### Step 1: Enable Gmail App Passwords
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Copy the 16-character password

### Step 2: Create .env file
Create a `.env` file in the project root with:

```bash
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=noreply@tenanttickets.com
```

### Step 3: Restart Server
```bash
npm run demo
```

## 📱 SMS Setup (Twilio)

### Step 1: Create Twilio Account
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token
3. Get a Twilio phone number

### Step 2: Add to .env file
```bash
# SMS Configuration
TWILIO_SID=your-account-sid
TWILIO_TOKEN=your-auth-token
TWILIO_PHONE=+1234567890
```

### Step 3: Install Twilio (if not already installed)
```bash
npm install twilio
```

## 🧪 Testing Notifications

### Test Email:
1. Login as Owner/Admin
2. Create ticket and assign to worker
3. Check worker's email inbox

### Test SMS:
1. Login as Owner/Admin  
2. Create ticket and assign to contracting company
3. Check company phone for SMS

## 🔍 Current Status

**Right now the system is working in demo mode:**
- ✅ Notifications are triggered correctly
- ✅ Console shows detailed logs
- ⚠️ No actual emails/SMS sent (need configuration)

**Console output shows:**
```
📧 EMAIL NOTIFICATION:
   ✉️  To: maintenance@example.com (Internal Maintenance Staff)
   📋 Subject: 🎫 New Ticket Assigned: Broken Light Switch

📱 SMS NOTIFICATION:
   📞 To: +27784232464 (Amble Group)
   💬 Message: 🎫 NEW TICKET: Broken Light Switch | Priority: MEDIUM...
```

## 🚀 Production Alternatives

### Email Services:
- **SendGrid**: Professional email service
- **AWS SES**: Amazon's email service  
- **Mailgun**: Developer-friendly email API
- **Postmark**: Transactional email service

### SMS Services:
- **Twilio**: Most popular SMS API
- **AWS SNS**: Amazon's notification service
- **Vonage**: Global SMS provider
- **MessageBird**: Multi-channel messaging

## 🔧 Troubleshooting

### Email Issues:
- Check Gmail App Password is correct
- Verify 2FA is enabled
- Check spam folder
- Try different SMTP provider

### SMS Issues:
- Verify Twilio credentials
- Check phone number format (+country code)
- Ensure Twilio account has credit
- Check Twilio console for errors

## 📞 Need Help?

The notification system is working perfectly - it just needs your email/SMS credentials to send real messages instead of console logs!
