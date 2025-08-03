// Debug SMS flow step by step
require('dotenv').config();

const mongoose = require('mongoose');
const database = require('./utils/database');
const notificationService = require('./utils/notificationService');

const debugSMSFlow = async () => {
  console.log('🔍 DEBUGGING SMS FLOW STEP BY STEP\n');
  
  try {
    // Step 1: Connect to database
    console.log('1️⃣ Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tenant-ticketing-system');
    console.log('✅ Database connected\n');
    
    // Step 2: Check if companies exist
    console.log('2️⃣ Checking companies in database...');
    const companies = await database.getCompanies();
    console.log(`✅ Found ${companies.length} companies:`);
    companies.forEach(company => {
      console.log(`   - ${company.name} (${company.category}) - Phone: ${company.phone || 'NO PHONE'}`);
    });
    console.log('');
    
    // Step 3: Find Amble Group specifically
    console.log('3️⃣ Finding Amble Group...');
    const ambleGroup = companies.find(c => c.name === 'Amble Group');
    if (ambleGroup) {
      console.log('✅ Amble Group found:');
      console.log(`   ID: ${ambleGroup._id}`);
      console.log(`   Name: ${ambleGroup.name}`);
      console.log(`   Phone: ${ambleGroup.phone}`);
      console.log(`   Category: ${ambleGroup.category}`);
    } else {
      console.log('❌ Amble Group NOT found in database');
      return;
    }
    console.log('');
    
    // Step 4: Test findCompanyById function
    console.log('4️⃣ Testing findCompanyById function...');
    const foundCompany = await database.findCompanyById(ambleGroup._id);
    if (foundCompany) {
      console.log('✅ findCompanyById works:');
      console.log(`   Found: ${foundCompany.name} - ${foundCompany.phone}`);
    } else {
      console.log('❌ findCompanyById failed');
      return;
    }
    console.log('');
    
    // Step 5: Create mock ticket
    console.log('5️⃣ Creating mock ticket...');
    const mockTicket = {
      _id: 'mock-ticket-123',
      title: 'Test Maintenance Issue',
      priority: 'high',
      category: 'maintenance',
      property: { name: 'Sunset Student Residence' },
      unit: 'Unit 205',
      room: 'Living Room',
      contractingCompany: ambleGroup._id, // Use the actual company ID
      createdAt: new Date()
    };
    console.log('✅ Mock ticket created with contractingCompany:', mockTicket.contractingCompany);
    console.log('');
    
    // Step 6: Test SMS notification function directly
    console.log('6️⃣ Testing SMS notification function...');
    try {
      const result = await notificationService.sendSMSNotification(
        mockTicket,
        ambleGroup.name,
        ambleGroup.phone
      );
      console.log('✅ SMS notification function completed:');
      console.log('   Result:', result);
    } catch (smsError) {
      console.log('❌ SMS notification function failed:');
      console.log('   Error:', smsError.message);
    }
    console.log('');
    
    // Step 7: Test the full sendAssignmentNotifications flow
    console.log('7️⃣ Testing sendAssignmentNotifications flow...');
    
    // Simulate the sendAssignmentNotifications function
    const testAssignmentNotifications = async (ticket) => {
      console.log('📬 Sending assignment notifications for ticket:', ticket._id);
      console.log('📬 Contracting company ID:', ticket.contractingCompany);
      
      if (ticket.contractingCompany) {
        const company = await database.findCompanyById(ticket.contractingCompany);
        if (company && company.phone) {
          console.log('📱 Sending SMS to company:', company.name, company.phone);
          const result = await notificationService.sendSMSNotification(ticket, company.name, company.phone);
          console.log('📱 SMS result:', result);
          return [result];
        } else {
          console.log('⚠️ Company not found or no phone number:', ticket.contractingCompany);
          return [];
        }
      }
      return [];
    };
    
    const notifications = await testAssignmentNotifications(mockTicket);
    console.log(`✅ Assignment notifications completed: ${notifications.length} sent`);
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Database disconnected');
  }
};

debugSMSFlow();
