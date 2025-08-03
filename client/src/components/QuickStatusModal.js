import { useState } from "react";
import api from "../api/api";
import Button from "./ui/Button";
import Select from "./ui/Select";

export default function QuickStatusModal({ ticket, onClose, onStatusChanged }) {
  const [status, setStatus] = useState(ticket?.status || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusOptions = [
    { value: "unassigned", label: "Unassigned" },
    { value: "in_progress", label: "In Progress" },
    { value: "waiting", label: "Waiting" },
    { value: "completed", label: "Completed" },
    { value: "resolved", label: "Resolved" },
    { value: "cancelled", label: "Cancelled" }
  ];

  const getStatusColor = (status) => {
    const colors = {
      unassigned: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      waiting: "bg-orange-100 text-orange-800 border-orange-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      unassigned: "Ticket is not assigned to anyone yet",
      in_progress: "Work is currently being done on this ticket",
      waiting: "Waiting for external dependencies or customer response",
      completed: "Work has been completed, pending verification",
      resolved: "Ticket is fully resolved and closed",
      cancelled: "Ticket has been cancelled and will not be completed"
    };
    return descriptions[status] || "";
  };

  const handleStatusChange = async () => {
    if (status === ticket.status) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = { status };
      const response = await api.put(`/tickets/${ticket._id}`, updateData);
      
      if (response.data.success) {
        onStatusChanged(response.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Change Ticket Status</h3>
          <p className="text-sm text-gray-600 mt-1">
            Update status for "{ticket?.title}"
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status: 
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket?.status)}`}>
                {ticket?.status?.replace('_', ' ')}
              </span>
            </label>
          </div>

          <Select
            label="New Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
            disabled={loading}
          />

          {status && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {getStatusDescription(status)}
              </p>
            </div>
          )}

          {/* Assignment Info */}
          {(ticket?.assignedTo || ticket?.contractingCompany) && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assignment:</h4>
              {ticket.assignedTo && (
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Worker: {ticket.assignedTo.name}
                </div>
              )}
              {ticket.contractingCompany && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Company: {ticket.contractingCompany}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusChange}
            disabled={loading || status === ticket?.status}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </div>
    </div>
  );
}
