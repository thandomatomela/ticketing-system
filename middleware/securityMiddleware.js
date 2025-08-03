const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('../config/config');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/response');

/**
 * Rate limiting middleware
 */
const createRateLimiter = (windowMs = config.rateLimit.windowMs, max = config.rateLimit.maxRequests, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return ApiResponse.error(res, message, 429);
    }
  });
};

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter();

const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests
  'Too many requests for this endpoint'
);

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", config.client.url]
    }
  },
  crossOriginEmbedderPolicy: false
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (config.security.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    logger.warn('CORS blocked request', { origin });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

/**
 * Request size limiter
 */
const requestSizeLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    logger.warn('Request size too large', {
      size: req.headers['content-length'],
      maxSize,
      ip: req.ip
    });
    return ApiResponse.error(res, 'Request entity too large', 413);
  }
  
  next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (config.nodeEnv === 'development') {
      return next(); // Skip in development
    }
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }
    
    logger.warn('IP not whitelisted', {
      clientIP,
      allowedIPs,
      path: req.path
    });
    
    return ApiResponse.forbidden(res, 'Access denied from this IP address');
  };
};

/**
 * User agent validation
 */
const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent || userAgent.length < 10) {
    logger.warn('Suspicious request: Invalid user agent', {
      userAgent,
      ip: req.ip,
      path: req.path
    });
    return ApiResponse.error(res, 'Invalid request', 400);
  }
  
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  strictLimiter,
  securityHeaders,
  corsOptions,
  requestSizeLimiter,
  ipWhitelist,
  validateUserAgent
};
