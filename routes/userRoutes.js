const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignAdmin,
  removeAdmin,
  getUserStats,
} = require("../controllers/userController");

const { protect, allowRoles } = require("../middleware/authMiddleware");
const {
  validateUserCreation,
  sanitizeInput,
  validatePagination
} = require("../middleware/validationMiddleware");
const { generalLimiter } = require("../middleware/securityMiddleware");

// Apply rate limiting and authentication to all routes
router.use(generalLimiter);
router.use(protect);

// 📊 Get user statistics (Owner/Admin only)
router.get(
  "/stats",
  allowRoles("owner", "admin"),
  getUserStats
);

// 👥 Get all users (Owner only)
router.get(
  "/",
  allowRoles("owner"),
  validatePagination,
  getAllUsers
);

// 👤 Get user by ID (Owner only)
router.get(
  "/:id",
  allowRoles("owner"),
  getUserById
);

// ➕ Create new user (Owner only)
router.post(
  "/",
  allowRoles("owner"),
  sanitizeInput,
  validateUserCreation,
  createUser
);

// ✏️ Update user (Owner only)
router.put(
  "/:id",
  allowRoles("owner"),
  sanitizeInput,
  updateUser
);

// 🗑️ Delete user (Owner only)
router.delete(
  "/:id",
  allowRoles("owner"),
  deleteUser
);

// 👑 Assign admin role (Owner only)
router.put(
  "/:id/assign-admin",
  allowRoles("owner"),
  assignAdmin
);

// 👤 Remove admin role (Owner only)
router.put(
  "/:id/remove-admin",
  allowRoles("owner"),
  removeAdmin
);

module.exports = router;
