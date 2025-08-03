const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['electrical', 'plumbing', 'heating', 'cooling', 'appliances', 'maintenance', 'cleaning', 'security', 'other']
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Properties this company can service
  serviceProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  // Service areas/locations
  serviceAreas: [{
    city: {
      type: String,
      trim: true
    },
    region: {
      type: String,
      trim: true
    },
    radius: {
      type: Number, // Service radius in km
      default: 50
    }
  }],
  // Owner who manages this company
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
