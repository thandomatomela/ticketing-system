const User = require("../models/User");
const logger = require("../utils/logger");
const ApiResponse = require("../utils/response");
const { asyncHandler } = require("../middleware/errorMiddleware");

/**
 * Get all users (Owner only)
 * @route GET /api/users
 * @access Private (Owner only)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  let filter = {};

  // Filter by role if specified
  if (role) filter.role = role;

  // Search functionality
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Sorting
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Execute query with pagination
  const users = await User.find(filter)
    .select("-password")
    .sort(sortOptions)
    .limit(req.pagination?.limit || 50)
    .skip(req.pagination?.skip || 0);

  // Get total count for pagination
  const total = await User.countDocuments(filter);

  logger.info("Users retrieved", { 
    userId: req.user.id,
    count: users.length,
    total,
    filters: { role, search }
  });

  if (req.pagination) {
    return ApiResponse.paginated(res, users, {
      page: req.pagination.page,
      limit: req.pagination.limit,
      total
    }, "Users retrieved successfully");
  }

  return ApiResponse.success(res, users, "Users retrieved successfully");
});

/**
 * Get user by ID (Owner only)
 * @route GET /api/users/:id
 * @access Private (Owner only)
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password");
  
  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }

  logger.info("User retrieved by ID", { 
    userId: req.user.id,
    targetUserId: id
  });

  return ApiResponse.success(res, user, "User retrieved successfully");
});

/**
 * Create new user (Owner only)
 * @route POST /api/users
 * @access Private (Owner only)
 */
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, address } = req.body;

  logger.info("User creation attempt", { 
    email, 
    role, 
    createdBy: req.user.id
  });

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    logger.warn("User creation failed: Email already exists", { 
      email, 
      createdBy: req.user.id 
    });
    return ApiResponse.conflict(res, "User with this email already exists");
  }

  // Create user
  const userData = {
    name,
    email,
    phone,
    password,
    role,
    address,
    isEmailVerified: false,
  };

  const user = await User.create(userData);

  logger.info("User created successfully", { 
    userId: user._id,
    email: user.email,
    role: user.role,
    createdBy: req.user.id 
  });

  // Return user data without password
  const responseData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  return ApiResponse.created(res, responseData, "User created successfully");
});

/**
 * Update user (Owner only)
 * @route PUT /api/users/:id
 * @access Private (Owner only)
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, address, isActive } = req.body;

  const user = await User.findById(id);
  
  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.conflict(res, "Email already exists");
    }
  }

  // Update allowed fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (role) user.role = role;
  if (address) user.address = { ...user.address, ...address };
  if (typeof isActive === 'boolean') user.isActive = isActive;

  await user.save();

  logger.info("User updated successfully", { 
    userId: id,
    updatedBy: req.user.id,
    updatedFields: Object.keys(req.body)
  });

  return ApiResponse.success(res, user, "User updated successfully");
});

/**
 * Delete user (Owner only)
 * @route DELETE /api/users/:id
 * @access Private (Owner only)
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent owner from deleting themselves
  if (id === req.user.id) {
    return ApiResponse.error(res, "You cannot delete your own account", 400);
  }

  const user = await User.findById(id);
  
  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }

  await User.findByIdAndDelete(id);

  logger.info("User deleted successfully", { 
    deletedUserId: id,
    deletedUserEmail: user.email,
    deletedBy: req.user.id
  });

  return ApiResponse.success(res, null, "User deleted successfully");
});

/**
 * Assign admin role (Owner only)
 * @route PUT /api/users/:id/assign-admin
 * @access Private (Owner only)
 */
exports.assignAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  
  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }

  if (user.role === 'admin') {
    return ApiResponse.error(res, "User is already an admin", 400);
  }

  user.role = 'admin';
  await user.save();

  logger.info("Admin role assigned", { 
    userId: id,
    userEmail: user.email,
    assignedBy: req.user.id
  });

  return ApiResponse.success(res, user, "Admin role assigned successfully");
});

/**
 * Remove admin role (Owner only)
 * @route PUT /api/users/:id/remove-admin
 * @access Private (Owner only)
 */
exports.removeAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  
  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }

  if (user.role !== 'admin') {
    return ApiResponse.error(res, "User is not an admin", 400);
  }

  user.role = 'tenant'; // Default role when removing admin
  await user.save();

  logger.info("Admin role removed", { 
    userId: id,
    userEmail: user.email,
    removedBy: req.user.id
  });

  return ApiResponse.success(res, user, "Admin role removed successfully");
});

/**
 * Get user statistics (Owner/Admin only)
 * @route GET /api/users/stats
 * @access Private (Owner/Admin only)
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 }
      }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  const formattedStats = {
    total: totalUsers,
    active: activeUsers,
    inactive: totalUsers - activeUsers,
    byRole: stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };

  logger.info("User statistics retrieved", { 
    userId: req.user.id,
    stats: formattedStats
  });

  return ApiResponse.success(res, formattedStats, "User statistics retrieved successfully");
});
