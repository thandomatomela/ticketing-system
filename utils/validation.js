const validator = require('validator');

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class Validator {
  constructor() {
    this.errors = {};
  }

  // Email validation
  email(value, field = 'email') {
    if (!value) {
      this.errors[field] = 'Email is required';
      return this;
    }
    if (!validator.isEmail(value)) {
      this.errors[field] = 'Please provide a valid email address';
    }
    return this;
  }

  // Password validation
  password(value, field = 'password') {
    if (!value) {
      this.errors[field] = 'Password is required';
      return this;
    }
    if (value.length < 6) {
      this.errors[field] = 'Password must be at least 6 characters long';
      return this;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      this.errors[field] = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return this;
  }

  // Required field validation
  required(value, field) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      this.errors[field] = `${field} is required`;
    }
    return this;
  }

  // String length validation
  length(value, field, min = 0, max = Infinity) {
    if (value && typeof value === 'string') {
      if (value.length < min) {
        this.errors[field] = `${field} must be at least ${min} characters long`;
      }
      if (value.length > max) {
        this.errors[field] = `${field} must not exceed ${max} characters`;
      }
    }
    return this;
  }

  // Phone number validation
  phone(value, field = 'phone') {
    if (value && !validator.isMobilePhone(value, 'any')) {
      this.errors[field] = 'Please provide a valid phone number';
    }
    return this;
  }

  // Role validation
  role(value, allowedRoles, field = 'role') {
    if (value && !allowedRoles.includes(value)) {
      this.errors[field] = `Role must be one of: ${allowedRoles.join(', ')}`;
    }
    return this;
  }

  // MongoDB ObjectId validation
  objectId(value, field) {
    if (value && !validator.isMongoId(value)) {
      this.errors[field] = `${field} must be a valid ID`;
    }
    return this;
  }

  // Status validation
  status(value, allowedStatuses, field = 'status') {
    if (value && !allowedStatuses.includes(value)) {
      this.errors[field] = `Status must be one of: ${allowedStatuses.join(', ')}`;
    }
    return this;
  }

  // URL validation
  url(value, field) {
    if (value && !validator.isURL(value)) {
      this.errors[field] = `${field} must be a valid URL`;
    }
    return this;
  }

  // Custom validation
  custom(value, field, validationFn, errorMessage) {
    if (!validationFn(value)) {
      this.errors[field] = errorMessage;
    }
    return this;
  }

  // Check if validation passed
  isValid() {
    return Object.keys(this.errors).length === 0;
  }

  // Get validation errors
  getErrors() {
    return this.errors;
  }

  // Throw validation error if invalid
  validate() {
    if (!this.isValid()) {
      throw new ValidationError(this.errors);
    }
    return true;
  }

  // Static method to create new validator instance
  static create() {
    return new Validator();
  }
}

// Validation schemas for common use cases
const schemas = {
  user: {
    create: (data) => {
      return Validator.create()
        .required(data.name, 'name')
        .length(data.name, 'name', 2, 50)
        .email(data.email)
        .password(data.password)
        .phone(data.phone)
        .role(data.role, ['admin', 'landlord', 'tenant', 'worker', 'owner']);
    },
    
    login: (data) => {
      return Validator.create()
        .email(data.email)
        .required(data.password, 'password');
    }
  },
  
  ticket: {
    create: (data) => {
      return Validator.create()
        .required(data.title, 'title')
        .length(data.title, 'title', 5, 100)
        .required(data.description, 'description')
        .length(data.description, 'description', 10, 1000)
        .objectId(data.forTenant, 'forTenant')
        .objectId(data.assignedTo, 'assignedTo');
    },
    
    update: (data) => {
      return Validator.create()
        .status(data.status, ['unassigned', 'in progress', 'waiting', 'completed', 'resolved'])
        .objectId(data.assignedTo, 'assignedTo');
    },
    
    comment: (data) => {
      return Validator.create()
        .required(data.message, 'message')
        .length(data.message, 'message', 1, 500);
    }
  }
};

module.exports = { Validator, ValidationError, schemas };
