const User = require("../models/User");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const logger = require("../utils/logger");
const ApiResponse = require("../utils/response");
const { asyncHandler } = require("../middleware/errorMiddleware");

/**
 * Generate JWT token for user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * User login
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.info("Login attempt", { email, ip: req.ip });

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    logger.warn("Login failed: User not found", { email, ip: req.ip });
    return ApiResponse.unauthorized(res, "Invalid email or password");
  }

  // Check if user is active
  if (!user.isActive) {
    logger.warn("Login failed: User account deactivated", {
      email,
      userId: user._id,
      ip: req.ip
    });
    return ApiResponse.unauthorized(res, "Account has been deactivated");
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    logger.warn("Login failed: Invalid password", {
      email,
      userId: user._id,
      ip: req.ip
    });
    return ApiResponse.unauthorized(res, "Invalid email or password");
  }

  // Update last login
  await user.updateLastLogin();

  // Generate token
  const token = generateToken(user._id);

  logger.info("Login successful", {
    email,
    userId: user._id,
    role: user.role,
    ip: req.ip
  });

  // Return user data without password
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    preferences: user.preferences,
  };

  return ApiResponse.success(res, { token, user: userData }, "Login successful");
});

/**
 * Create new user (Admin/Landlord only)
 * @route POST /api/auth/create-user
 * @access Private (Admin/Landlord)
 */
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, address } = req.body;

  logger.info("User creation attempt", {
    email,
    role,
    createdBy: req.user.id,
    ip: req.ip
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
    isEmailVerified: false, // Will need email verification
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
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }

  return ApiResponse.success(res, user, "Profile retrieved successfully");
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, preferences } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }

  // Update allowed fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = { ...user.address, ...address };
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  logger.info("Profile updated", {
    userId: user._id,
    updatedFields: Object.keys(req.body)
  });

  return ApiResponse.success(res, user, "Profile updated successfully");
});

/**
 * Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return ApiResponse.notFound(res, "User not found");
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    logger.warn("Password change failed: Invalid current password", {
      userId: user._id,
      ip: req.ip
    });
    return ApiResponse.unauthorized(res, "Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info("Password changed successfully", {
    userId: user._id,
    ip: req.ip
  });

  return ApiResponse.success(res, null, "Password changed successfully");
});

/**
 * Logout user (client-side token removal)
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = asyncHandler(async (req, res) => {
  logger.info("User logged out", {
    userId: req.user.id,
    ip: req.ip
  });

  return ApiResponse.success(res, null, "Logged out successfully");
});
