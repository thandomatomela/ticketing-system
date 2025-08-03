const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const config = require("./config/config");
const logger = require("./utils/logger");
const ApiResponse = require("./utils/response");

// Import routes
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const userRoutes = require("./routes/userRoutes");

// Import middleware
const { protect, allowRoles } = require("./middleware/authMiddleware");
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");
const {
  securityHeaders,
  corsOptions,
  requestSizeLimiter
} = require("./middleware/securityMiddleware");

const app = express();

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(requestSizeLimiter);

// Compression middleware
app.use(compression());

// Request logging
if (config.nodeEnv !== "test") {
  app.use(morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Custom request logger
app.use(logger.requestLogger());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  return ApiResponse.success(res, {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  }, "Service is healthy");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);

// Test endpoints (development only)
if (config.nodeEnv === "development") {
  app.get("/api/test-protect", protect, (req, res) => {
    return ApiResponse.success(res, { user: req.user }, "Access granted");
  });

  app.get(
    "/api/test-role",
    protect,
    allowRoles("admin", "landlord"),
    (req, res) => {
      return ApiResponse.success(res, null, `Hello ${req.user.role}, you have access!`);
    }
  );
}

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
