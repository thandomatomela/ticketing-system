const database = require('../utils/database');
const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority, location } = req.body;

    const ticketData = {
      title,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      location,
      createdBy: req.user._id,
      forTenant: req.user.role === 'tenant' ? req.user._id : null,
      property: req.user.assignedProperty,
      status: 'open',
      createdAt: new Date()
    };

    const ticket = await database.createTicket(ticketData);

    // Send WhatsApp notification for all new tickets
    try {
      await notificationService.notifyWhatsAppGroupNewTicket(ticket, req.user);
      logger.info('WhatsApp group notified of new ticket', { ticketId: ticket._id });
    } catch (error) {
      logger.error('Failed to notify WhatsApp group', { 
        ticketId: ticket._id, 
        error: error.message 
      });
    }

    return ApiResponse.success(res, ticket, 'Ticket created successfully', 201);
  } catch (error) {
    logger.error('Error creating ticket', { error: error.message });
    return ApiResponse.error(res, 'Failed to create ticket', 500);
  }
};

const getTickets = async (req, res) => {
  try {
    const tickets = await database.getTickets({});
    return ApiResponse.success(res, tickets, 'Tickets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tickets', { error: error.message });
    return ApiResponse.error(res, 'Failed to fetch tickets', 500);
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await database.findTicketById(req.params.ticketId);
    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }
    return ApiResponse.success(res, ticket, 'Ticket retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ticket', { error: error.message });
    return ApiResponse.error(res, 'Failed to fetch ticket', 500);
  }
};

const updateTicket = async (req, res) => {
  try {
    const ticket = await database.updateTicket(req.params.ticketId, req.body);
    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }
    return ApiResponse.success(res, ticket, 'Ticket updated successfully');
  } catch (error) {
    logger.error('Error updating ticket', { error: error.message });
    return ApiResponse.error(res, 'Failed to update ticket', 500);
  }
};

const addComment = async (req, res) => {
  try {
    const comment = await database.addComment(req.params.ticketId, {
      ...req.body,
      createdBy: req.user._id
    });
    return ApiResponse.success(res, comment, 'Comment added successfully');
  } catch (error) {
    logger.error('Error adding comment', { error: error.message });
    return ApiResponse.error(res, 'Failed to add comment', 500);
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await database.deleteTicket(req.params.ticketId);
    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }
    return ApiResponse.success(res, null, 'Ticket deleted successfully');
  } catch (error) {
    logger.error('Error deleting ticket', { error: error.message });
    return ApiResponse.error(res, 'Failed to delete ticket', 500);
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  deleteTicket
};
