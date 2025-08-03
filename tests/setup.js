// Test setup file
const mongoose = require('mongoose');

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'tenant',
    ...overrides
  }),

  createTestTicket: (userId, overrides = {}) => ({
    title: 'Test Ticket',
    description: 'Test description for ticket',
    createdBy: userId,
    forTenant: userId,
    category: 'plumbing',
    priority: 'medium',
    ...overrides
  })
};

// Clean up any hanging connections
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
