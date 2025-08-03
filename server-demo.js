// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const database = require('./utils/database');
const notificationService = require('./utils/notificationService');
const bcrypt = require('bcryptjs');
const whatsappService = require('./services/whatsappService');
const enhancedNotificationService = require('./services/enhancedNotificationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Initialize MongoDB connection
async function initializeDatabase() {
  try {
    await database.connect();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase();

// Data will be loaded from MongoDB

let tickets = [
  {
    _id: '1',
    title: 'Leaky Kitchen Faucet',
    description: 'The kitchen faucet has been leaking for 2 days. Water is dripping constantly.',
    category: 'plumbing',
    priority: 'high',
    status: 'unassigned',
    createdBy: '4',
    forTenant: '4',
    assignedTo: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    comments: [],
    history: []
  },
  {
    _id: '2',
    title: 'Broken Light Switch',
    description: 'The light switch in the living room is not working properly.',
    category: 'electrical',
    priority: 'medium',
    status: 'in_progress',
    createdBy: '4',
    forTenant: '4',
    assignedTo: '3',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    comments: [
      {
        _id: '1',
        message: 'I will check this tomorrow morning.',
        author: '3',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ],
    history: []
  },
  {
    _id: '3',
    title: 'AC Not Cooling',
    description: 'The air conditioning unit is running but not cooling the apartment effectively.',
    category: 'cooling',
    priority: 'urgent',
    status: 'completed',
    createdBy: '4',
    forTenant: '4',
    assignedTo: '3',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    comments: [],
    history: []
  }
];

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, 'demo-secret-key', { expiresIn: '7d' });
};

const findUserById = async (id) => await database.findUserById(id);
const findUserByEmail = async (email) => await database.findUserByEmail(email);

// Helper function to send assignment notifications
const sendAssignmentNotifications = async (ticket) => {
  const notifications = [];

  try {
    console.log('📬 Sending assignment notifications for ticket:', ticket._id);
    console.log('📬 Assigned to:', ticket.assignedTo?.name || 'None');
    console.log('📬 Contracting company:', ticket.contractingCompany || 'None');

    // Send email to assigned worker
    if (ticket.assignedTo) {
      const worker = ticket.assignedTo; // Already populated from MongoDB
      if (worker && worker.email) {
        console.log('📧 Sending email to worker:', worker.email);
        const result = await notificationService.sendEmailNotification(ticket, worker);
        notifications.push(result);
      }
    }

    // Send SMS to contracting company
    if (ticket.contractingCompany) {
      // Get company details from database
      const company = await database.findCompanyById(ticket.contractingCompany);
      if (company && company.phone) {
        console.log('📱 Sending SMS to company:', company.name, company.phone);
        const result = await notificationService.sendSMSNotification(ticket, company.name, company.phone);
        notifications.push(result);
      } else {
        console.log('⚠️ Company not found or no phone number:', ticket.contractingCompany);
      }
    }

    console.log('📬 Total notifications sent:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    return [];
  }
};

// Auth middleware
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ') 
    ? req.headers.authorization.split(' ')[1] 
    : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, 'demo-secret-key');
    const user = await findUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is healthy',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'demo'
    }
  });
});

// WhatsApp status endpoint
app.get('/whatsapp/status', (req, res) => {
  const status = whatsappService.getStatus();
  res.json({
    success: true,
    message: 'WhatsApp service status',
    data: status,
    timestamp: new Date().toISOString()
  });
});

// Enhanced notification status endpoint
app.get('/notifications/status', (req, res) => {
  const notificationStatus = enhancedNotificationService.getStatus();
  const whatsappStatus = whatsappService.getStatus();

  res.json({
    success: true,
    message: 'Notification system status',
    data: {
      enhanced: notificationStatus,
      whatsapp: whatsappStatus
    },
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });

  const { email, password } = req.body;

  if (!email || !password) {
    console.log('❌ Missing email or password');
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    console.log('❌ User not found:', email);
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  console.log('👤 User found:', { email: user.email, role: user.role });
  console.log('🔑 Password debug:', { hasPassword: !!user.password, passwordLength: user.password?.length });

  // Use bcrypt to compare password (since User model hashes passwords)
  try {
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password comparison result:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.log('❌ Password comparison error:', error.message);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }

  const token = generateToken(user._id);

  // Get user with populated property data
  const populatedUser = await database.findUserById(user._id);

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: true,
    preferences: { emailNotifications: true, smsNotifications: false },
    // Add property and unit information for tenants
    assignedProperty: populatedUser.assignedProperty,
    assignedUnit: populatedUser.assignedUnit,
    unit: populatedUser.assignedUnit
  };

  console.log('✅ Login successful for:', email);
  res.json({
    success: true,
    message: 'Login successful',
    data: { token, user: userData }
  });
});

// Logout endpoint
app.post('/api/auth/logout', protect, (req, res) => {
  console.log('🚪 Logout request from:', req.user.email);
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.get('/api/auth/profile', protect, (req, res) => {
  const { password, ...userData } = req.user;
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: userData
  });
});

// Ticket routes
app.get('/api/tickets', protect, async (req, res) => {
  console.log('📋 API Request: GET /api/tickets by', req.user.email, 'role:', req.user.role, 'params:', req.query);

  try {
    let tickets = [];

    // Check if requesting all tickets
    if (req.query.all === 'true') {
      console.log('📋 Fetching ALL tickets for user:', req.user.email);
      tickets = await database.getTickets(); // Get all tickets regardless of role
    } else {
      // Role-based filtering for "Your Tickets"
      if (req.user.role === 'tenant') {
        // Tenants see tickets they created or are assigned to them
        const filters = {
          $or: [
            { createdBy: req.user._id },
            { forTenant: req.user._id }
          ]
        };
        tickets = await database.getTickets(filters);
      } else if (req.user.role === 'worker') {
        // Workers only see tickets assigned to them
        const filters = { assignedTo: req.user._id };
        tickets = await database.getTickets(filters);
      } else if (req.user.role === 'admin' || req.user.role === 'senior_admin') {
        // Admins see tickets only from properties they manage
        tickets = await database.getTicketsByManagedProperties(req.user._id);
      } else if (req.user.role === 'owner') {
        // Owners see all tickets
        tickets = await database.getTickets();
      }
    }

    console.log('📋 Found tickets:', tickets.length);

    res.json({
      success: true,
      message: 'Tickets retrieved successfully',
      data: tickets
    });
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/tickets', protect, async (req, res) => {
  console.log('🎫 API Request: POST /api/tickets by', req.user.email);
  const { title, description, category, priority, dueDate, propertyId, unit, room, assignedTo, contractingCompany } = req.body;

  try {
    // Ensure forTenant is always set (required field)
    let forTenantId;
    if (req.user.role === 'tenant') {
      forTenantId = req.user._id;
    } else if (req.body.forTenant) {
      forTenantId = req.body.forTenant;
    } else {
      // Default to the creator if no tenant specified
      forTenantId = req.user._id;
    }

    // For tenants, use their assigned property and unit if not specified
    let ticketPropertyId = propertyId;
    let ticketUnit = unit;

    if (req.user.role === 'tenant' && req.user.assignedProperty && !propertyId) {
      ticketPropertyId = req.user.assignedProperty;
      ticketUnit = req.user.assignedUnit;
    }

    if (!ticketPropertyId || !ticketUnit) {
      return res.status(400).json({
        success: false,
        message: 'Property and unit are required. Tenants must be assigned to a property.'
      });
    }

    const ticketData = {
      title,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      status: (assignedTo || contractingCompany) ? 'in_progress' : 'unassigned',
      createdBy: req.user._id,
      forTenant: forTenantId,
      assignedTo: assignedTo || null,
      contractingCompany: contractingCompany || null,
      dueDate: dueDate && new Date(dueDate) > new Date() ? new Date(dueDate) : null,
      property: ticketPropertyId,
      unit: ticketUnit,
      room: room || null,
      comments: [],
      history: []
    };

    const newTicket = await database.createTicket(ticketData);
    console.log('🎫 Ticket created:', newTicket._id);

    // Send enhanced notifications for new ticket
    try {
      const notificationResult = await enhancedNotificationService.notifyNewTicket(newTicket, req.user);
      if (notificationResult.success) {
        console.log(`📬 Notifications sent via ${notificationResult.successful}/${notificationResult.channels} channels`);
      } else {
        console.log('⚠️ All notification channels failed');
      }
    } catch (notificationError) {
      console.error('❌ Notification error:', notificationError.message);
    }

    // Send other notifications if ticket is assigned
    if (newTicket.assignedTo || newTicket.contractingCompany) {
      try {
        const notifications = await sendAssignmentNotifications(newTicket);
        console.log(`📬 Sent ${notifications.length} assignment notifications for ticket ${newTicket._id}`);
      } catch (error) {
        console.error('Error sending assignment notifications:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: newTicket
    });
  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.put('/api/tickets/:id', protect, async (req, res) => {
  console.log('🎫 API Request: PUT /api/tickets/:id by', req.user.email, 'for ticket', req.params.id);
  const ticketId = req.params.id;
  const { title, description, category, priority, propertyId, unit, room, assignedTo, contractingCompany, status } = req.body;

  try {
    const ticket = await database.findTicketById(ticketId);

    if (!ticket) {
      console.log('❌ Ticket not found:', ticketId);
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check permissions
    const canEdit = req.user.role === 'owner' || req.user.role === 'admin' ||
                   (req.user.role === 'tenant' && ticket.createdBy?._id?.toString() === req.user._id?.toString());

    if (!canEdit) {
      console.log('❌ Edit permission denied for user', req.user.email, 'on ticket', ticketId);
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this ticket' });
    }

    // Store old assignment for comparison
    const oldAssignedTo = ticket.assignedTo?._id?.toString();
    const oldContractingCompany = ticket.contractingCompany;

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;

    // Only Owner/Admin can update property/unit location
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      if (propertyId !== undefined) updateData.property = propertyId;
      if (unit !== undefined) updateData.unit = unit;
      if (room !== undefined) updateData.room = room;
    }

    // Only Owner/Admin can update assignments and status
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
      if (contractingCompany !== undefined) updateData.contractingCompany = contractingCompany || null;

      // Allow manual status updates by admin/owner
      if (status !== undefined) {
        const validStatuses = ['unassigned', 'in_progress', 'waiting', 'completed', 'resolved', 'cancelled'];
        if (validStatuses.includes(status)) {
          updateData.status = status;
        }
      } else {
        // Auto-update status based on assignment only if status not explicitly provided
        if (assignedTo !== undefined || contractingCompany !== undefined) {
          updateData.status = (updateData.assignedTo || updateData.contractingCompany) ? 'in_progress' : 'unassigned';
        }
      }
    }

    // Update ticket in MongoDB
    const updatedTicket = await database.updateTicket(ticketId, updateData);
    console.log('✅ Ticket updated:', ticketId);

    // Send notifications if assignment changed
    const newAssignedTo = updatedTicket.assignedTo?._id?.toString();
    const assignmentChanged = (oldAssignedTo !== newAssignedTo) ||
                             (oldContractingCompany !== updatedTicket.contractingCompany);

    if (assignmentChanged && (updatedTicket.assignedTo || updatedTicket.contractingCompany)) {
      try {
        const notifications = await sendAssignmentNotifications(updatedTicket);
        console.log(`📬 Sent ${notifications.length} reassignment notifications for ticket ${ticketId}`);
      } catch (error) {
        console.error('Error sending reassignment notifications:', error);
      }
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: updatedTicket
    });
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/tickets/:id', protect, async (req, res) => {
  console.log('🎫 API Request: GET /api/tickets/:id by', req.user.email, 'for ticket', req.params.id);
  try {
    const ticket = await database.findTicketById(req.params.id);

    if (!ticket) {
      console.log('❌ Ticket not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check access permissions
    console.log('🔍 Permission check:', {
      userRole: req.user.role,
      userId: req.user._id,
      ticketForTenant: ticket.forTenant?.toString(),
      ticketCreatedBy: ticket.createdBy?.toString(),
      ticketAssignedTo: ticket.assignedTo?.toString()
    });

    const hasAccess =
      req.user.role === 'admin' ||
      req.user.role === 'owner' ||
      ticket.forTenant?._id?.toString() === req.user._id?.toString() ||
      ticket.createdBy?._id?.toString() === req.user._id?.toString() ||
      ticket.assignedTo?._id?.toString() === req.user._id?.toString();

    if (!hasAccess) {
      console.log('❌ Access denied for user', req.user.email, 'to ticket', req.params.id);
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    console.log('✅ Ticket found and access granted');
    res.json({
      success: true,
      message: 'Ticket retrieved successfully',
      data: ticket
    });
  } catch (error) {
    console.error('❌ Error fetching ticket:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/tickets/:id/comments', protect, async (req, res) => {
  console.log('💬 API Request: POST /api/tickets/:id/comments by', req.user.email);
  const { message } = req.body;

  try {
    const ticket = await database.findTicketById(req.params.id);

    if (!ticket) {
      console.log('❌ Ticket not found for comment:', req.params.id);
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const newComment = {
      message: message,
      author: req.user._id,
      createdAt: new Date()
    };

    const updatedTicket = await database.addCommentToTicket(req.params.id, newComment);
    console.log('✅ Comment added to ticket:', req.params.id);

    // Get the newly added comment (last one)
    const addedComment = updatedTicket.comments[updatedTicket.comments.length - 1];

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: addedComment
    });
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.delete('/api/tickets/:id', protect, async (req, res) => {
  console.log('🗑️ API Request: DELETE /api/tickets/:id by', req.user.email, 'for ticket', req.params.id);

  try {
    const ticket = await database.findTicketById(req.params.id);

    if (!ticket) {
      console.log('❌ Ticket not found for deletion:', req.params.id);
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Permission check: Owner can delete all, Users can delete only their own
    const canDelete =
      req.user.role === 'owner' ||
      req.user.role === 'admin' ||
      ticket.createdBy?._id?.toString() === req.user._id?.toString();

    if (!canDelete) {
      console.log('❌ Delete permission denied for user', req.user.email, 'on ticket', req.params.id);
      return res.status(403).json({
        success: false,
        message: 'You can only delete tickets you created'
      });
    }

    await database.deleteTicket(req.params.id);
    console.log('✅ Ticket deleted:', req.params.id);

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting ticket:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// User management routes (Owner and Admin)
app.get('/api/users', protect, async (req, res) => {
  console.log('👥 API Request: GET /api/users by', req.user.email, 'role:', req.user.role);
  if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'senior_admin') {
    return res.status(403).json({ success: false, message: 'Only owners and admins can manage users' });
  }

  try {
    const { role, search } = req.query;
    let users = [];

    if (req.user.role === 'owner' || req.user.role === 'admin' || req.user.role === 'senior_admin') {
      // Both owners and admins see all users with same logic
      let filters = {};
      if (role) filters.role = role;
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      console.log(`👤 ${req.user.role.toUpperCase()} filters:`, filters);

      // Debug: Check total users in database
      const totalUsers = await database.getUsers({});
      console.log(`🔍 DEBUG: Total users in database:`, totalUsers.length);
      console.log(`🔍 DEBUG: All user emails:`, totalUsers.map(u => u.email));

      users = await database.getUsers(filters);
      console.log(`👤 ${req.user.role.toUpperCase()} found users:`, users.length);
      console.log(`👤 ${req.user.role.toUpperCase()} user emails:`, users.map(u => u.email));
      if (search) {
        users = users.filter(user =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        );
      }
    }

    console.log('👥 Found users:', users.length);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/users', protect, async (req, res) => {
  console.log('👥 API Request: POST /api/users by', req.user.email);
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only owners and admins can create users' });
  }

  const { name, email, password, role, phone, propertyId, unit } = req.body;

  try {
    // Check if user already exists
    const existingUser = await database.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const userData = {
      name,
      email,
      password,
      role: role || 'tenant',
      phone: phone || '',
      isActive: true
    };

    console.log('🔍 Creating user with data:', userData);

    // If creating a tenant and property/unit specified, assign them
    if ((role === 'tenant' || !role) && propertyId && unit) {
      userData.assignedProperty = propertyId;
      userData.assignedUnit = unit;
    }

    const newUser = await database.createUser(userData);
    console.log('✅ User created:', newUser.email);

    // If tenant was assigned to a property, update the property unit
    if (newUser.assignedProperty && newUser.assignedUnit) {
      try {
        await database.assignTenantToUnit(newUser.assignedProperty, newUser.assignedUnit, newUser._id);
        console.log('✅ Tenant assigned to unit:', newUser.assignedUnit);
      } catch (error) {
        console.error('⚠️ Warning: Could not assign tenant to unit:', error.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.delete('/api/users/:id', protect, async (req, res) => {
  console.log('🗑️ API Request: DELETE /api/users/:id by', req.user.email);
  if (req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Only owners can delete users' });
  }

  const userId = req.params.id;

  // Prevent owner from deleting themselves
  if (userId === req.user._id?.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
  }

  try {
    const user = await database.findUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await database.deleteUser(userId);
    console.log('✅ User deleted:', userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.put('/api/users/:id/assign-admin', protect, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Only owners can assign admin roles' });
  }

  const userId = req.params.id;
  const user = await database.findUserById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ success: false, message: 'User is already an admin' });
  }

  user.role = 'admin';

  const { password, ...safeUser } = user;

  res.json({
    success: true,
    message: 'Admin role assigned successfully',
    data: safeUser
  });
});

app.put('/api/users/:id', protect, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Only owners can update users' });
  }

  const userId = req.params.id;
  const { role, name, email, phone, isActive } = req.body;

  try {
    const user = await database.findUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent changing owner role
    if (user.role === 'owner' && role && role !== 'owner') {
      return res.status(400).json({ success: false, message: 'Cannot change owner role' });
    }

    // Update allowed fields
    const updates = {};
    if (role && role !== user.role) {
      updates.role = role;
      console.log(`🔄 Role changed: ${user.email} is now ${role}`);
    }
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const updatedUser = await database.updateUser(userId, updates);

    const { password, ...safeUser } = updatedUser.toObject();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: safeUser
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.put('/api/users/:id/reset-password', protect, async (req, res) => {
  console.log('🔑 API Request: PUT /api/users/:id/reset-password by', req.user.email);

  if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'senior_admin') {
    return res.status(403).json({ success: false, message: 'Only owners and admins can reset passwords' });
  }

  const userId = req.params.id;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await database.findUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent resetting owner password unless done by owner
    if (user.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Cannot reset owner password' });
    }

    // Update password using database
    const updatedUser = await database.updateUser(userId, { password });

    console.log(`🔑 Password reset: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Contracting Companies routes
app.get('/api/contracting-companies', protect, async (req, res) => {
  console.log('🏢 API Request: GET /api/contracting-companies by', req.user.email, 'role:', req.user.role);
  if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'senior_admin') {
    return res.status(403).json({ success: false, message: 'Only owners and admins can view contracting companies' });
  }

  try {
    let companies = [];

    if (req.user.role === 'owner') {
      // Owners see all their companies
      companies = await database.getCompaniesByOwner(req.user._id);
    } else if (req.user.role === 'admin' || req.user.role === 'senior_admin') {
      // For management purposes, admins should see all companies like owners
      // Find the owner and get their companies
      const owner = await database.getUsers({ role: 'owner' });
      if (owner.length > 0) {
        companies = await database.getCompaniesByOwner(owner[0]._id);
        console.log('🏢 Debug: Admin seeing owner companies:', companies.length);
      } else {
        companies = [];
      }
    }

    console.log('🏢 Found companies:', companies.length);
    res.json({
      success: true,
      message: 'Contracting companies retrieved successfully',
      data: companies
    });
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/contracting-companies', protect, async (req, res) => {
  console.log('🏢 API Request: POST /api/contracting-companies by', req.user.email);
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only owners and admins can add contracting companies' });
  }

  const { name, category, phone, email, serviceAreas, serviceProperties } = req.body;

  if (!name || !category) {
    return res.status(400).json({ success: false, message: 'Name and category are required' });
  }

  try {
    const newCompany = await database.createCompany({
      name,
      category,
      phone: phone || '',
      email: email || '',
      isActive: true,
      owner: req.user._id,
      serviceAreas: serviceAreas || [],
      serviceProperties: serviceProperties || []
    });

    console.log('✅ Company created:', newCompany.name);

    res.status(201).json({
      success: true,
      message: 'Contracting company created successfully',
      data: newCompany
    });
  } catch (error) {
    console.error('❌ Error creating company:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.delete('/api/contracting-companies/:id', protect, async (req, res) => {
  console.log('🗑️ API Request: DELETE /api/contracting-companies/:id by', req.user.email);
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only owners and admins can delete contracting companies' });
  }

  const companyId = req.params.id;

  try {
    const company = await database.findCompanyById(companyId);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Contracting company not found' });
    }

    await database.deleteCompany(companyId);
    console.log('✅ Company deleted:', companyId);

    res.json({
      success: true,
      message: 'Contracting company deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting company:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Property management routes (Owner and Admin)
app.get('/api/properties', protect, async (req, res) => {
  console.log('🏠 API Request: GET /api/properties by', req.user.email, 'role:', req.user.role);
  if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'senior_admin') {
    return res.status(403).json({ success: false, message: 'Only owners and admins can view properties' });
  }

  try {
    let properties = [];

    if (req.user.role === 'owner') {
      // Owners see all their properties
      const filters = { owner: req.user._id };
      properties = await database.getProperties(filters);
    } else if (req.user.role === 'admin' || req.user.role === 'senior_admin') {
      // For management purposes, admins should see all properties like owners
      // Find the owner and get their properties
      const owner = await database.getUsers({ role: 'owner' });
      if (owner.length > 0) {
        const filters = { owner: owner[0]._id };
        properties = await database.getProperties(filters);
        console.log('🏠 Debug: Admin seeing owner properties:', properties.length);
      } else {
        properties = [];
      }
    }

    console.log('🏠 Found properties:', properties.length);

    res.json({
      success: true,
      message: 'Properties retrieved successfully',
      data: properties
    });
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/properties', protect, async (req, res) => {
  console.log('🏠 API Request: POST /api/properties by', req.user.email);
  if (req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Only owners can create properties' });
  }

  const { name, address, type, totalUnits, amenities, managerId } = req.body;

  if (!name || !address || !totalUnits) {
    return res.status(400).json({ success: false, message: 'Name, address, and total units are required' });
  }

  try {
    // Generate units based on totalUnits
    const units = Array.from({ length: totalUnits }, (_, i) => ({
      unitNumber: `${String.fromCharCode(65 + Math.floor(i / 100))}${String(i + 1).padStart(3, '0')}`,
      type: 'studio', // Default type, can be updated later
      floor: Math.floor(i / 10) + 1,
      isOccupied: false
    }));

    const propertyData = {
      name,
      address,
      type: type || 'apartment',
      totalUnits,
      units,
      amenities: amenities || [],
      owner: req.user._id,
      manager: managerId || null,
      isActive: true
    };

    const newProperty = await database.createProperty(propertyData);
    console.log('✅ Property created:', newProperty.name);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: newProperty
    });
  } catch (error) {
    console.error('❌ Error creating property:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/properties/:id', protect, async (req, res) => {
  console.log('🏠 API Request: GET /api/properties/:id by', req.user.email);

  try {
    const property = await database.findPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Check access permissions
    const hasAccess =
      req.user.role === 'owner' && property.owner._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin' && (
        property.owner._id.toString() === req.user._id.toString() ||
        property.manager?._id?.toString() === req.user._id.toString()
      );

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      message: 'Property retrieved successfully',
      data: property
    });
  } catch (error) {
    console.error('❌ Error fetching property:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Assign tenant to unit
app.post('/api/properties/:id/assign-tenant', protect, async (req, res) => {
  console.log('🏠 API Request: POST /api/properties/:id/assign-tenant by', req.user.email);
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only owners and admins can assign tenants' });
  }

  const { unitNumber, tenantId } = req.body;

  if (!unitNumber || !tenantId) {
    return res.status(400).json({ success: false, message: 'Unit number and tenant ID are required' });
  }

  try {
    const property = await database.assignTenantToUnit(req.params.id, unitNumber, tenantId);
    console.log('✅ Tenant assigned to unit:', unitNumber);

    res.json({
      success: true,
      message: 'Tenant assigned to unit successfully',
      data: property
    });
  } catch (error) {
    console.error('❌ Error assigning tenant:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Company-Property Assignment
app.post('/api/companies/:id/assign-properties', protect, async (req, res) => {
  console.log('🏢 API Request: POST /api/companies/:id/assign-properties by', req.user.email);
  if (req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Only owners can assign properties to companies' });
  }

  const { propertyIds } = req.body;
  const companyId = req.params.id;

  if (!Array.isArray(propertyIds)) {
    return res.status(400).json({ success: false, message: 'Property IDs must be an array' });
  }

  try {
    // Verify the company belongs to the owner
    const company = await database.findCompanyById(companyId);
    if (!company || company.owner.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Company not found or access denied' });
    }

    // Verify all properties belong to the owner
    const properties = await database.getPropertiesByOwner(req.user._id);
    const ownerPropertyIds = properties.map(p => p._id.toString());
    const invalidIds = propertyIds.filter(id => !ownerPropertyIds.includes(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some properties do not belong to you or do not exist'
      });
    }

    const updatedCompany = await database.assignCompanyToProperties(companyId, propertyIds);
    console.log('✅ Company assigned to properties:', propertyIds.length);

    res.json({
      success: true,
      message: 'Company assigned to properties successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('❌ Error assigning company to properties:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin-Property Assignment
app.post('/api/users/:id/assign-properties', protect, async (req, res) => {
  console.log('🏠 API Request: POST /api/users/:id/assign-properties by', req.user.email);
  if (req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Only owners can assign properties to admins' });
  }

  const { propertyIds } = req.body;
  const adminId = req.params.id;

  if (!Array.isArray(propertyIds)) {
    return res.status(400).json({ success: false, message: 'Property IDs must be an array' });
  }

  try {
    // Verify the user is an admin
    const admin = await database.findUserById(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'senior_admin')) {
      return res.status(400).json({ success: false, message: 'User must be an admin or senior admin' });
    }

    // Verify all properties belong to the owner
    const properties = await database.getPropertiesByOwner(req.user._id);
    const ownerPropertyIds = properties.map(p => p._id.toString());
    const invalidIds = propertyIds.filter(id => !ownerPropertyIds.includes(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some properties do not belong to you or do not exist'
      });
    }

    const updatedAdmin = await database.assignAdminToProperties(adminId, propertyIds);
    console.log('✅ Admin assigned to properties:', propertyIds.length);

    res.json({
      success: true,
      message: 'Admin assigned to properties successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('❌ Error assigning admin to properties:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Demo server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n👤 Demo Credentials:`);
  console.log(`   🏢 Owner: owner@example.com / admin123 (Business Owner - Full Control)`);
  console.log(`   👑 Admin: admin@example.com / admin123 (Property Manager - Assigned by Owner)`);
  console.log(`   🎓 Student: student@example.com / admin123 (Tenant - Can edit own tickets)`);
  console.log(`   🔧 Maintenance: maintenance@example.com / admin123 (Internal Worker)`);
  console.log(`\n🌐 Frontend will be available at: http://localhost:3000`);
  console.log(`\n📋 Business Scenario:`);
  console.log(`   • Owner manages student accommodation business`);
  console.log(`   • Admin handles property management duties`);
  console.log(`   • Students can create maintenance tickets`);
  console.log(`   • Workers/Suppliers receive WhatsApp/SMS when assigned`);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at: http://localhost:${PORT}/api`);
});

module.exports = app;



