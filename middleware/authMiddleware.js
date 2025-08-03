const jwt = require('jsonwebtoken');
const config = require('../config/config');
const database = require('../utils/database');
const ApiResponse = require('../utils/response');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(res, 'Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await database.findUserById(decoded.id);

    if (!user) {
      return ApiResponse.error(res, 'Invalid token. User not found.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Invalid token.', 401);
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Access denied. User not authenticated.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(res, 'Access denied. Insufficient permissions.', 403);
    }

    next();
  };
};

module.exports = {
  protect,
  allowRoles
};

