require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // Database Configuration
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/tenant-ticketing-system',
    testUri: process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/tenant-ticketing-system-test',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },
  
  // Email Configuration (Nodemailer)
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  
  // SMS Configuration (Twilio)
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // WhatsApp Configuration
  whatsapp: {
    groupId: process.env.WHATSAPP_GROUP_ID,
    groupName: process.env.WHATSAPP_GROUP_NAME || 'Maintenance Team'
  },
  
  // Client Configuration
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // Security Configuration
  security: {
    bcryptRounds: 12,
    corsOrigins: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3001', // For development
    ],
  },
};

// Validation
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && config.server.env === 'production') {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

module.exports = config;

