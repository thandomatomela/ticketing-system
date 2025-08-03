const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      enum: {
        values: [
          "plumbing",
          "electrical",
          "heating",
          "cooling",
          "appliances",
          "structural",
          "pest_control",
          "cleaning",
          "security",
          "other"
        ],
        message: "Please select a valid category",
      },
      default: "other",
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "Priority must be one of: low, medium, high, urgent",
      },
      default: "medium",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    forTenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["unassigned", "in_progress", "waiting", "completed", "resolved", "cancelled"],
        message: "Status must be one of: unassigned, in_progress, waiting, completed, resolved, cancelled",
      },
      default: "unassigned",
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value > new Date();
        },
        message: "Due date must be in the future",
      },
    },
    completedAt: {
      type: Date,
    },
    estimatedCost: {
      type: Number,
      min: [0, "Estimated cost cannot be negative"],
      default: 0,
    },
    actualCost: {
      type: Number,
      min: [0, "Actual cost cannot be negative"],
      default: 0,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property is required']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true
    },
    room: {
      type: String,
      trim: true
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    history: [
      {
        action: {
          type: String,
          enum: ["created", "status_changed", "assigned", "commented", "updated"],
          required: true,
        },
        status: String,
        previousStatus: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    comments: [
      {
        message: {
          type: String,
          required: [true, "Comment message is required"],
          trim: true,
          minlength: [1, "Comment cannot be empty"],
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        isInternal: {
          type: Boolean,
          default: false, // Internal comments only visible to staff
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        editedAt: Date,
        isEdited: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ forTenant: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ dueDate: 1 });
ticketSchema.index({ isArchived: 1 });

// Compound indexes
ticketSchema.index({ status: 1, priority: -1 });
ticketSchema.index({ forTenant: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

// Virtual for days since creation
ticketSchema.virtual("daysSinceCreation").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
ticketSchema.virtual("isOverdue").get(function () {
  return this.dueDate && new Date() > this.dueDate && !["completed", "resolved", "cancelled"].includes(this.status);
});

// Pre-save middleware to update history
ticketSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.history.push({
      action: "status_changed",
      status: this.status,
      previousStatus: this.constructor.findOne({ _id: this._id }).status,
      updatedBy: this.assignedTo || this.createdBy,
      timestamp: new Date(),
    });
  }

  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});

// Static method to find active tickets
ticketSchema.statics.findActive = function () {
  return this.find({ isArchived: false });
};

// Static method to find by status
ticketSchema.statics.findByStatus = function (status) {
  return this.find({ status, isArchived: false });
};

// Static method to find overdue tickets
ticketSchema.statics.findOverdue = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ["completed", "resolved", "cancelled"] },
    isArchived: false,
  });
};

// Instance method to add comment
ticketSchema.methods.addComment = function (message, author, isInternal = false) {
  this.comments.push({
    message,
    author,
    isInternal,
  });

  this.history.push({
    action: "commented",
    updatedBy: author,
    timestamp: new Date(),
  });

  return this.save();
};

// Instance method to assign ticket
ticketSchema.methods.assignTo = function (userId, assignedBy) {
  this.assignedTo = userId;
  this.status = "in_progress";

  this.history.push({
    action: "assigned",
    status: this.status,
    updatedBy: assignedBy,
    timestamp: new Date(),
  });

  return this.save();
};

module.exports = mongoose.model("Ticket", ticketSchema);
