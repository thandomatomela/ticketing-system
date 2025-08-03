const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Ticket = require('../models/Ticket');
const Property = require('../models/Property');

class DatabaseService {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tenant-ticketing-system';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      this.isConnected = true;
      console.log('🗄️  Connected to MongoDB:', mongoUri);
      
      // Initialize default data if database is empty
      await this.initializeDefaultData();
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async initializeDefaultData() {
    try {
      // Check if users exist
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('🔄 Creating default users...');
        
        const defaultUsers = [
          {
            name: 'System Owner',
            email: 'owner@example.com',
            password: 'admin123',
            role: 'owner',
            phone: '+1234567890',
            isActive: true
          },
          {
            name: 'Property Admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            phone: '+1234567891',
            isActive: true
          },
          {
            name: 'Internal Maintenance Staff',
            email: 'maintenance@example.com',
            password: 'admin123',
            role: 'worker',
            phone: '+1987654321',
            isActive: true
          },
          {
            name: 'Student Tenant',
            email: 'student@example.com',
            password: 'admin123',
            role: 'tenant',
            phone: '+1987654322',
            isActive: true
          }
        ];

        // Create users individually so password hashing middleware runs
        for (const userData of defaultUsers) {
          const user = new User(userData);
          await user.save();
        }
        console.log('✅ Default users created');
      }

      // Check if companies exist and update existing ones
      const companyCount = await Company.countDocuments();
      const companiesWithoutOwner = await Company.countDocuments({ owner: { $exists: false } });

      if (companyCount === 0) {
        console.log('🔄 Creating default companies...');

        // Get the owner user for company assignment
        const owner = await User.findOne({ email: 'owner@example.com' });

        if (owner) {
          const defaultCompanies = [
            {
              name: 'Mike Electrician Services',
              category: 'electrical',
              phone: '+1234567890',
              email: 'mike@electricianservices.com',
              isActive: true,
              owner: owner._id,
              serviceAreas: [
                { city: 'Cape Town', region: 'Western Cape', radius: 30 }
              ]
            },
            {
              name: 'QuickFix Plumbing',
              category: 'plumbing',
              phone: '+1234567891',
              email: 'info@quickfixplumbing.com',
              isActive: true,
              owner: owner._id,
              serviceAreas: [
                { city: 'Cape Town', region: 'Western Cape', radius: 25 }
              ]
            },
            {
              name: 'Elite HVAC Solutions',
              category: 'heating',
              phone: '+1234567892',
              email: 'contact@elitehvac.com',
              isActive: true,
              owner: owner._id,
              serviceAreas: [
                { city: 'Cape Town', region: 'Western Cape', radius: 35 }
              ]
            },
            {
              name: 'Amble Group',
              category: 'maintenance',
              phone: '+27784232464',
              email: 'info@amblegroup.com',
              isActive: true,
              owner: owner._id,
              serviceAreas: [
                { city: 'Cape Town', region: 'Western Cape', radius: 40 }
              ]
            }
          ];

          await Company.insertMany(defaultCompanies);
          console.log('✅ Default companies created');
        }
      } else if (companiesWithoutOwner > 0) {
        // Update existing companies without owner
        console.log('🔄 Updating existing companies with owner information...');
        const owner = await User.findOne({ email: 'owner@example.com' });

        if (owner) {
          await Company.updateMany(
            { owner: { $exists: false } },
            {
              $set: {
                owner: owner._id,
                serviceAreas: [{ city: 'Cape Town', region: 'Western Cape', radius: 30 }],
                serviceProperties: []
              }
            }
          );
          console.log('✅ Existing companies updated with owner information');
        }
      }

      // Check if properties exist
      const propertyCount = await Property.countDocuments();
      if (propertyCount === 0) {
        console.log('🔄 Creating default properties...');

        // Get the owner user for property assignment
        const owner = await User.findOne({ email: 'owner@example.com' });
        const admin = await User.findOne({ email: 'admin@example.com' });

        if (owner) {
          const defaultProperties = [
            {
              name: 'Sunset Student Residence',
              address: {
                street: '123 University Avenue',
                city: 'Cape Town',
                state: 'Western Cape',
                zipCode: '8001',
                country: 'South Africa'
              },
              type: 'student_residence',
              totalUnits: 50,
              units: Array.from({ length: 50 }, (_, i) => ({
                unitNumber: `A${String(i + 1).padStart(3, '0')}`,
                type: i < 20 ? 'studio' : i < 40 ? '1bed' : 'shared',
                floor: Math.floor(i / 10) + 1,
                isOccupied: false
              })),
              amenities: ['WiFi', 'Laundry', 'Study Room', 'Gym', 'Parking'],
              owner: owner._id,
              managers: admin ? [admin._id] : [],
              isActive: true
            },
            {
              name: 'Ocean View Apartments',
              address: {
                street: '456 Coastal Road',
                city: 'Cape Town',
                state: 'Western Cape',
                zipCode: '8005',
                country: 'South Africa'
              },
              type: 'apartment',
              totalUnits: 24,
              units: Array.from({ length: 24 }, (_, i) => ({
                unitNumber: `B${String(i + 1).padStart(2, '0')}`,
                type: i < 8 ? '1bed' : i < 16 ? '2bed' : '3bed',
                floor: Math.floor(i / 8) + 1,
                isOccupied: false
              })),
              amenities: ['Sea View', 'Pool', 'Security', 'Parking'],
              owner: owner._id,
              managers: admin ? [admin._id] : [],
              isActive: true
            }
          ];

          const createdProperties = [];
          for (const propertyData of defaultProperties) {
            const property = new Property(propertyData);
            const savedProperty = await property.save();
            createdProperties.push(savedProperty);
          }
          console.log('✅ Default properties created');

          // Assign companies to properties so admins can see them
          console.log('🔄 Assigning companies to properties...');
          const propertyIds = createdProperties.map(p => p._id);

          await Company.updateMany(
            { isActive: true },
            { $set: { serviceProperties: propertyIds } }
          );
          console.log('✅ Companies assigned to properties');
        }
      } else {
        // Properties exist, but check if companies are assigned to them
        const companiesWithoutProperties = await Company.countDocuments({
          isActive: true,
          $or: [
            { serviceProperties: { $exists: false } },
            { serviceProperties: { $size: 0 } }
          ]
        });

        if (companiesWithoutProperties > 0) {
          console.log('🔄 Assigning existing companies to existing properties...');
          const allProperties = await Property.find({ isActive: true });
          const propertyIds = allProperties.map(p => p._id);

          await Company.updateMany(
            {
              isActive: true,
              $or: [
                { serviceProperties: { $exists: false } },
                { serviceProperties: { $size: 0 } }
              ]
            },
            { $set: { serviceProperties: propertyIds } }
          );
          console.log('✅ Existing companies assigned to existing properties');
        }
      }

      // Ensure admin is assigned to manage properties
      console.log('🔄 Ensuring admin is assigned to manage properties...');
      const admin = await User.findOne({ email: 'admin@example.com' });
      const allProperties = await Property.find({ isActive: true });

      if (admin && allProperties.length > 0) {
        const propertyIds = allProperties.map(p => p._id);

        // Update all properties to include admin as manager
        await Property.updateMany(
          { isActive: true },
          { $addToSet: { managers: admin._id } }
        );

        console.log(`✅ Admin assigned to manage ${allProperties.length} properties`);
      }

      const finalUserCount = await User.countDocuments();
      const finalCompanyCount = await Company.countDocuments();
      const ticketCount = await Ticket.countDocuments();
      const finalPropertyCount = await Property.countDocuments();

      console.log(`📊 Database status: ${finalUserCount} users, ${finalCompanyCount} companies, ${ticketCount} tickets, ${finalPropertyCount} properties`);
      
    } catch (error) {
      console.error('❌ Error initializing default data:', error);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🗄️  Disconnected from MongoDB');
    }
  }

  // User operations
  async getUsers(filters = {}) {
    return await User.find(filters).sort({ createdAt: -1 });
  }

  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async updateUser(userId, updates) {
    return await User.findByIdAndUpdate(userId, updates, { new: true });
  }

  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }

  async findUserByEmail(email) {
    return await User.findOne({ email }).select('+password');
  }

  async findUserById(id) {
    return await User.findById(id).populate('assignedProperty', 'name address');
  }

  // Company operations
  async getCompanies(filters = {}) {
    return await Company.find(filters)
      .populate('serviceProperties', 'name address')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
  }

  async createCompany(companyData) {
    const company = new Company(companyData);
    return await company.save();
  }

  async updateCompany(companyId, updates) {
    return await Company.findByIdAndUpdate(companyId, updates, { new: true });
  }

  async deleteCompany(companyId) {
    return await Company.findByIdAndDelete(companyId);
  }

  async findCompanyById(companyId) {
    return await Company.findById(companyId);
  }

  // Ticket operations
  async getTickets(filters = {}) {
    return await Ticket.find(filters)
      .populate('createdBy', 'name email role')
      .populate('forTenant', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('property', 'name address type')
      .populate('comments.author', 'name email role')
      .sort({ createdAt: -1 });
  }

  async createTicket(ticketData) {
    const ticket = new Ticket(ticketData);
    return await ticket.save();
  }

  async updateTicket(ticketId, updates) {
    return await Ticket.findByIdAndUpdate(ticketId, updates, { new: true })
      .populate('createdBy', 'name email role')
      .populate('forTenant', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('property', 'name address type')
      .populate('comments.author', 'name email role');
  }

  async deleteTicket(ticketId) {
    return await Ticket.findByIdAndDelete(ticketId);
  }

  async findTicketById(ticketId) {
    return await Ticket.findById(ticketId)
      .populate('createdBy', 'name email role')
      .populate('forTenant', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('property', 'name address type')
      .populate('comments.author', 'name email role');
  }

  async addCommentToTicket(ticketId, comment) {
    return await Ticket.findByIdAndUpdate(
      ticketId,
      { $push: { comments: comment } },
      { new: true }
    ).populate('comments.author', 'name email role');
  }

  // Property operations
  async getProperties(filters = {}) {
    return await Property.find(filters)
      .populate('owner', 'name email')
      .populate('managers', 'name email role')
      .populate('units.tenant', 'name email')
      .sort({ createdAt: -1 });
  }

  async createProperty(propertyData) {
    const property = new Property(propertyData);
    return await property.save();
  }

  async updateProperty(propertyId, updates) {
    return await Property.findByIdAndUpdate(propertyId, updates, { new: true })
      .populate('owner', 'name email')
      .populate('managers', 'name email role')
      .populate('units.tenant', 'name email');
  }

  async deleteProperty(propertyId) {
    return await Property.findByIdAndDelete(propertyId);
  }

  async findPropertyById(propertyId) {
    return await Property.findById(propertyId)
      .populate('owner', 'name email')
      .populate('managers', 'name email role')
      .populate('units.tenant', 'name email');
  }

  async getPropertiesByOwner(ownerId) {
    return await Property.find({ owner: ownerId, isActive: true })
      .populate('managers', 'name email role')
      .sort({ name: 1 });
  }

  async assignTenantToUnit(propertyId, unitNumber, tenantId) {
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const unit = property.units.find(u => u.unitNumber === unitNumber);
    if (!unit) throw new Error('Unit not found');
    if (unit.isOccupied) throw new Error('Unit is already occupied');

    unit.tenant = tenantId;
    unit.isOccupied = true;

    await property.save();

    // Update user's assigned property and unit
    await User.findByIdAndUpdate(tenantId, {
      assignedProperty: propertyId,
      assignedUnit: unitNumber
    });

    return property;
  }

  async unassignTenantFromUnit(propertyId, unitNumber) {
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const unit = property.units.find(u => u.unitNumber === unitNumber);
    if (!unit) throw new Error('Unit not found');

    const tenantId = unit.tenant;
    unit.tenant = null;
    unit.isOccupied = false;

    await property.save();

    // Update user's assigned property and unit
    if (tenantId) {
      await User.findByIdAndUpdate(tenantId, {
        assignedProperty: null,
        assignedUnit: null
      });
    }

    return property;
  }

  // Admin-Property Management
  async assignAdminToProperties(adminId, propertyIds) {
    // Update user's managed properties
    await User.findByIdAndUpdate(adminId, {
      managedProperties: propertyIds
    });

    // Update properties to include this admin as manager
    await Property.updateMany(
      { _id: { $in: propertyIds } },
      { $addToSet: { managers: adminId } }
    );

    // Remove admin from properties not in the new list
    await Property.updateMany(
      { _id: { $nin: propertyIds }, managers: adminId },
      { $pull: { managers: adminId } }
    );

    return await User.findById(adminId).populate('managedProperties', 'name address');
  }

  async getPropertiesByManager(managerId) {
    return await Property.find({
      managers: managerId,
      isActive: true
    })
    .populate('owner', 'name email')
    .populate('managers', 'name email role')
    .sort({ name: 1 });
  }

  async getUsersByManagedProperties(managerId) {
    const properties = await this.getPropertiesByManager(managerId);
    const propertyIds = properties.map(p => p._id);

    return await User.find({
      assignedProperty: { $in: propertyIds },
      role: 'tenant'
    }).populate('assignedProperty', 'name');
  }

  async getTicketsByManagedProperties(managerId, filters = {}) {
    const properties = await this.getPropertiesByManager(managerId);
    const propertyIds = properties.map(p => p._id);

    const ticketFilters = {
      ...filters,
      property: { $in: propertyIds }
    };

    return await this.getTickets(ticketFilters);
  }

  // Company-Property Management
  async assignCompanyToProperties(companyId, propertyIds) {
    return await Company.findByIdAndUpdate(
      companyId,
      { serviceProperties: propertyIds },
      { new: true }
    ).populate('serviceProperties', 'name address')
     .populate('owner', 'name email');
  }

  async getCompaniesByManagedProperties(managerId) {
    const properties = await this.getPropertiesByManager(managerId);
    const propertyIds = properties.map(p => p._id);

    return await Company.find({
      serviceProperties: { $in: propertyIds },
      isActive: true
    })
    .populate('serviceProperties', 'name address')
    .populate('owner', 'name email')
    .sort({ name: 1 });
  }

  async getCompaniesByOwner(ownerId) {
    return await Company.find({
      owner: ownerId,
      isActive: true
    })
    .populate('serviceProperties', 'name address')
    .sort({ name: 1 });
  }
}

module.exports = new DatabaseService();
