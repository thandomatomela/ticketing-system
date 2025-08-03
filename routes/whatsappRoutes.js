const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const ApiResponse = require('../utils/response');

// Apply authentication to all routes
router.use(protect);
router.use(allowRoles('owner', 'admin'));

// Get available WhatsApp groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await whatsappService.getGroups();
    return ApiResponse.success(res, groups, 'WhatsApp groups retrieved successfully');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to get WhatsApp groups', 500);
  }
});

// Test WhatsApp connection
router.get('/status', async (req, res) => {
  try {
    const status = {
      isReady: whatsappService.isReady,
      groupId: whatsappService.groupId,
      hasGroupId: !!whatsappService.groupId
    };
    return ApiResponse.success(res, status, 'WhatsApp status retrieved');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to get WhatsApp status', 500);
  }
});

module.exports = router;