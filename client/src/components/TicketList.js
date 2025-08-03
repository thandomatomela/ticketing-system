import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./ui/LoadingSpinner";
import Button from "./ui/Button";
import QuickAssignModal from "./QuickAssignModal";
import QuickStatusModal from "./QuickStatusModal";

export default function TicketList({ tickets, loading, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { user } = useAuth();

  const getStatusColor = (status) => {
    const colors = {
      unassigned: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      waiting: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      resolved: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleQuickAssign = (ticket, e) => {
    e.preventDefault(); // Prevent navigation to ticket detail
    e.stopPropagation();
    setSelectedTicket(ticket);
    setShowAssignModal(true);
  };

  const handleQuickStatus = (ticket, e) => {
    e.preventDefault(); // Prevent navigation to ticket detail
    e.stopPropagation();
    setSelectedTicket(ticket);
    setShowStatusModal(true);
  };

  const handleAssignmentComplete = (updatedTicket) => {
    // Refresh the ticket list to show updated assignments
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleStatusChanged = (updatedTicket) => {
    // Refresh the ticket list to show updated status
    if (onRefresh) {
      onRefresh();
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      urgent: "text-red-600",
    };
    return colors[priority] || "text-gray-600";
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === "all") return true;
    return ticket.status === filter;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === "createdAt") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === "priority") {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tickets</option>
            <option value="unassigned">Unassigned</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="completed">Completed</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        <Button variant="outline" onClick={onRefresh} size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Tickets Grid */}
      {sortedTickets.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all" ? "Get started by creating a new ticket." : `No tickets with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedTickets.map((ticket) => (
            <Link
              key={ticket._id}
              to={`/tickets/${ticket._id}`}
              className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {ticket.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {ticket.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {ticket.category && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 capitalize">
                      {ticket.category.replace("_", " ")}
                    </span>
                  </div>
                )}

                {/* Assignment Information */}
                {(ticket.assignedTo || ticket.contractingCompany) && (
                  <div className="mt-2 space-y-1">
                    {ticket.assignedTo && (
                      <div className="flex items-center">
                        <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-gray-600">
                          Worker: {ticket.assignedTo.name}
                        </span>
                      </div>
                    )}
                    {ticket.contractingCompany && (
                      <div className="flex items-center">
                        <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-gray-600">
                          Company: {ticket.contractingCompany}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions for Admins */}
                {(user?.role === 'owner' || user?.role === 'admin') && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <button
                      onClick={(e) => handleQuickAssign(ticket, e)}
                      className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded hover:bg-blue-50 transition-colors"
                    >
                      {ticket.assignedTo || ticket.contractingCompany ? 'Reassign' : 'Assign'} Ticket
                    </button>
                    <button
                      onClick={(e) => handleQuickStatus(ticket, e)}
                      className="w-full text-xs text-purple-600 hover:text-purple-800 font-medium py-1 px-2 rounded hover:bg-purple-50 transition-colors"
                    >
                      Change Status
                    </button>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Assign Modal */}
      {showAssignModal && selectedTicket && (
        <QuickAssignModal
          ticket={selectedTicket}
          onClose={() => setShowAssignModal(false)}
          onAssigned={handleAssignmentComplete}
        />
      )}

      {/* Quick Status Modal */}
      {showStatusModal && selectedTicket && (
        <QuickStatusModal
          ticket={selectedTicket}
          onClose={() => setShowStatusModal(false)}
          onStatusChanged={handleStatusChanged}
        />
      )}
    </div>
  );
}
