const express = require("express");
const router = express.Router();

const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  deleteTicket,
} = require("../controllers/ticketController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

// Apply authentication to all routes
router.use(protect);

// Create a new ticket
router.post("/", createTicket);

// Get all tickets
router.get("/", getTickets);

// Get a single ticket by ID
router.get("/:ticketId", getTicketById);

// Update a ticket
router.put("/:ticketId", updateTicket);

// Add a comment to a ticket
router.post("/:ticketId/comments", addComment);

// Delete a ticket
router.delete("/:ticketId", deleteTicket);

module.exports = router;
