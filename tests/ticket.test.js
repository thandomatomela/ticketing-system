const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const config = require('../config/config');

// Test database connection
beforeAll(async () => {
  await mongoose.connect(config.database.testUri, config.database.options);
});

// Clean up database after each test
afterEach(async () => {
  await User.deleteMany({});
  await Ticket.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Ticket Endpoints', () => {
  let tenantToken, adminToken, tenantUser, adminUser;

  beforeEach(async () => {
    // Create test users
    tenantUser = new User({
      name: 'Tenant User',
      email: 'tenant@example.com',
      password: 'password123',
      role: 'tenant'
    });
    await tenantUser.save();

    adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    await adminUser.save();

    // Get tokens
    const tenantLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'tenant@example.com',
        password: 'password123'
      });
    tenantToken = tenantLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    adminToken = adminLogin.body.data.token;
  });

  describe('POST /api/tickets', () => {
    it('should create ticket as tenant', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          title: 'Leaky faucet',
          description: 'The kitchen faucet is leaking water',
          category: 'plumbing',
          priority: 'medium'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Leaky faucet');
      expect(response.body.data.forTenant).toBe(tenantUser._id.toString());
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          title: 'Test',
          // Missing description
          category: 'plumbing'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .send({
          title: 'Leaky faucet',
          description: 'The kitchen faucet is leaking water',
          category: 'plumbing'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tickets', () => {
    beforeEach(async () => {
      // Create test tickets
      const ticket1 = new Ticket({
        title: 'Tenant Ticket',
        description: 'Ticket for tenant',
        createdBy: tenantUser._id,
        forTenant: tenantUser._id,
        category: 'plumbing',
        priority: 'medium'
      });
      await ticket1.save();

      const ticket2 = new Ticket({
        title: 'Admin Ticket',
        description: 'Ticket created by admin',
        createdBy: adminUser._id,
        forTenant: tenantUser._id,
        category: 'electrical',
        priority: 'high'
      });
      await ticket2.save();
    });

    it('should get tickets for tenant (only their tickets)', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Both tickets are for this tenant
    });

    it('should get all tickets for admin', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/tickets?status=unassigned')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // All tickets should be unassigned by default
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/tickets/:id', () => {
    let ticket;

    beforeEach(async () => {
      ticket = new Ticket({
        title: 'Test Ticket',
        description: 'Test description',
        createdBy: tenantUser._id,
        forTenant: tenantUser._id,
        category: 'plumbing',
        priority: 'medium'
      });
      await ticket.save();
    });

    it('should get ticket by ID for authorized user', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Ticket');
    });

    it('should return 404 for non-existent ticket', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tickets/${fakeId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tickets/:id/comments', () => {
    let ticket;

    beforeEach(async () => {
      ticket = new Ticket({
        title: 'Test Ticket',
        description: 'Test description',
        createdBy: tenantUser._id,
        forTenant: tenantUser._id,
        category: 'plumbing',
        priority: 'medium'
      });
      await ticket.save();
    });

    it('should add comment to ticket', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          message: 'This is a test comment'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('This is a test comment');
    });

    it('should validate comment message', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticket._id}/comments`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          message: '' // Empty message
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
