const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const config = require('../config/config');

// Test database connection
beforeAll(async () => {
  await mongoose.connect(config.database.testUri, config.database.options);
});

// Clean up database after each test
afterEach(async () => {
  await User.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'tenant'
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/create-user', () => {
    let adminToken;

    beforeEach(async () => {
      // Create admin user and get token
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });

      adminToken = loginResponse.body.data.token;
    });

    it('should create user with admin privileges', async () => {
      const response = await request(app)
        .post('/api/auth/create-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'tenant'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@example.com');
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .post('/api/auth/create-user')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'tenant'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/create-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'User One',
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'tenant'
        });

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/create-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'User Two',
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'tenant'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });
});
