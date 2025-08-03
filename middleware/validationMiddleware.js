const { schemas } = require('../utils/validation');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Generic validation middleware factory
 * Creates middleware that validates request data against a schema
 */
const validate = (schemaName, operation) => {
  return (req, res, next) => {
    try {
      const schema = schemas[schemaName];
      if (!schema || !schema[operation]) {
        logger.error('Validation schema not found', {
          schemaName,
          operation,
          availableSchemas: Object.keys(schemas)
        });
        return ApiResponse.error(res, 'Internal validation error', 500);
      }

      const validator = schema[operation](req.body);
      validator.validate();
      
      logger.debug('Validation passed', {
        schemaName,
        operation,
        dataKeys: Object.keys(req.body)
      });
      
      next();
    } catch (error) {
      if (error.name === 'ValidationError') {
        logger.warn('Validation failed', {
          schemaName,
          operation,
          errors: error.errors,
          data: req.body
        });
        return ApiResponse.validationError(res, error.errors);
      }
      
      logger.error('Validation middleware error', {
        error: error.message,
        stack: error.stack
      });
      return ApiResponse.error(res, 'Validation error', 500);
    }
  };
};

/**
 * Specific validation middleware for common operations
 */
const validateUserCreation = validate('user', 'create');
const validateUserLogin = validate('user', 'login');
const validateTicketCreation = validate('ticket', 'create');
const validateTicketUpdate = validate('ticket', 'update');
const validateTicketComment = validate('ticket', 'comment');

/**
 * Sanitize input middleware
 * Removes potentially harmful characters and trims whitespace
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * Pagination validation middleware
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Ensure reasonable limits
  const maxLimit = 100;
  const validatedLimit = Math.min(Math.max(limit, 1), maxLimit);
  const validatedPage = Math.max(page, 1);
  
  req.pagination = {
    page: validatedPage,
    limit: validatedLimit,
    skip: (validatedPage - 1) * validatedLimit
  };
  
  next();
};

module.exports = {
  validate,
  validateUserCreation,
  validateUserLogin,
  validateTicketCreation,
  validateTicketUpdate,
  validateTicketComment,
  sanitizeInput,
  validatePagination
};
