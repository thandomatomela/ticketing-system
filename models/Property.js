const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: [true, 'Unit number is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['studio', '1bed', '2bed', '3bed', '4bed', 'shared'],
    default: 'studio'
  },
  floor: {
    type: Number,
    min: 0
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'South Africa',
      trim: true
    }
  },
  type: {
    type: String,
    enum: ['apartment', 'house', 'townhouse', 'student_residence', 'commercial'],
    default: 'apartment'
  },
  totalUnits: {
    type: Number,
    required: [true, 'Total units is required'],
    min: 1
  },
  units: [unitSchema],
  amenities: [{
    type: String,
    trim: true
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Property owner is required']
  },
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
propertySchema.index({ owner: 1, isActive: 1 });
propertySchema.index({ 'address.city': 1, type: 1 });

// Virtual for full address
propertySchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}${addr.state ? ', ' + addr.state : ''}${addr.zipCode ? ' ' + addr.zipCode : ''}, ${addr.country}`;
});

// Method to get available units
propertySchema.methods.getAvailableUnits = function() {
  return this.units.filter(unit => !unit.isOccupied);
};

// Method to get occupied units
propertySchema.methods.getOccupiedUnits = function() {
  return this.units.filter(unit => unit.isOccupied);
};

module.exports = mongoose.model('Property', propertySchema);
