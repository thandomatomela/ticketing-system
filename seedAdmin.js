const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hashed = await bcrypt.hash('admin123', 10);

  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) {
    console.log('Admin already exists');
    return process.exit();
  }

  const admin = new User({
    name: 'Super Admin',
    email: 'admin@example.com',
    phone: '555-555-1234',
    password: hashed,
    role: 'admin',
  });

  await admin.save();
  console.log('✅ Admin user created');
  process.exit();
});
 
