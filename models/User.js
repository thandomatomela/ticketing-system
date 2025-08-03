const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config/config");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
      required: false,
      validate: {
        validator: function(v) {
          // Allow empty/null phone numbers
          if (!v) return true;
          // Accept various phone formats including local numbers
          return /^[\+]?[0-9\s\-\(\)]{7,15}$/.test(v);
        },
        message: "Please provide a valid phone number"
      }
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "senior_admin", "landlord", "tenant", "worker", "owner"],
        message: "Role must be one of: admin, senior_admin, landlord, tenant, worker, owner",
      },
      default: "tenant",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Property assignment for tenants (single property)
    assignedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    assignedUnit: {
      type: String,
      trim: true
    },
    // Property management for admins/senior_admins (multiple properties)
    managedProperties: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    }],
    lastLogin: {
      type: Date,
    },
    profileImage: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: "US",
      },
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: "en",
      },
    },
    // For password reset functionality
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // For email verification
    emailVerificationToken: String,
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.emailVerificationToken;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true });
};

// Virtual for full name (if you want to split first/last name later)
userSchema.virtual("displayName").get(function () {
  return this.name;
});

module.exports = mongoose.model("User", userSchema);



