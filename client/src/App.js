import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, Link } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AdminPage from "./components/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

// Inline TicketDetails component
function TicketDetailsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5002/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ticket');
      }

      const data = await response.json();
      const ticketData = data.success ? data.data : data;
      setTicket(ticketData);
    } catch (err) {
      console.error("Error fetching ticket:", err);
      setError(err.message || "Failed to fetch ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5002/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: comment }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();
      const newComment = data.success ? data.data : data;

      setTicket((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }));
      setComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setError(err.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5002/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete ticket');
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Error deleting ticket:", err);
      setError(err.message || "Failed to delete ticket");
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteTicket = () => {
    return user?.role === "owner" || user?.role === "admin" ||
           (user?.role === "tenant" && ticket?.createdBy?._id === user?.id);
  };

  const canEditTicket = () => {
    return user?.role === "owner" || user?.role === "admin" ||
           (user?.role === "tenant" && ticket?.createdBy?._id === user?.id);
  };

  const canResolveTicket = () => {
    return user?.role === "worker" && ticket?.assignedTo?._id === user?.id;
  };

  const handleResolveTicket = async () => {
    if (!window.confirm("Mark this ticket as resolved? This will close the ticket.")) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:5002/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve ticket');
      }

      const data = await response.json();
      const updatedTicket = data.success ? data.data : data;
      setTicket(updatedTicket);
      setError(null);
    } catch (err) {
      console.error("Error resolving ticket:", err);
      setError(err.message || "Failed to resolve ticket");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Ticket</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Ticket Details
                </h1>
                <p className="text-sm text-gray-600 mt-1">#{ticket?._id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Edit Button for Students (their own tickets) */}
              {canEditTicket() && (
                <Link
                  to={`/tickets/${ticketId}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Ticket
                </Link>
              )}

              {/* Resolve Button for Workers */}
              {canResolveTicket() && ticket?.status !== 'resolved' && (
                <button
                  onClick={handleResolveTicket}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resolving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark Resolved
                    </>
                  )}
                </button>
              )}

              {/* Delete Button */}
              {canDeleteTicket() && (
                <button
                  onClick={handleDeleteTicket}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Ticket
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ticket Information */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-3">
                      {ticket?.title}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
                        {ticket?.status?.replace("_", " ").toUpperCase()}
                      </span>
                      <span className={`text-sm font-semibold ${ticket?.priority === 'urgent' ? 'bg-red-500 text-white px-3 py-1 rounded-full' : 'text-white/90'}`}>
                        {ticket?.priority?.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Description
                </h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed text-lg">{ticket?.description}</p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Comments
                </h3>
              </div>

              <div className="px-8 py-6">
                {ticket?.comments && ticket.comments.length > 0 ? (
                  <div className="space-y-6">
                    {ticket.comments.map((comment, index) => (
                      <div key={comment._id || index} className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {comment.author?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {comment.author?.name || 'Unknown User'}
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700">{comment.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No comments yet</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to add a comment</p>
                  </div>
                )}

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mt-8">
                  <div className="bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-6 py-4 bg-transparent border-0 resize-none focus:ring-0 focus:outline-none text-gray-700 placeholder-gray-500"
                      rows={4}
                    />
                    <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        {user?.role === 'tenant' && ticket?.createdBy?._id !== user?.id
                          ? 'You can comment on all tickets'
                          : 'Share your thoughts or updates'}
                      </p>
                      <button
                        type="submit"
                        disabled={submitting || !comment.trim()}
                        className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Comment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Ticket Details */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Ticket Details</h3>
              </div>
              <div className="px-6 py-6 space-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Created by</dt>
                  <dd className="text-base font-semibold text-gray-900">{ticket?.createdBy?.name || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">For tenant</dt>
                  <dd className="text-base font-semibold text-gray-900">{ticket?.forTenant?.name || 'Unknown'}</dd>
                </div>
                {ticket?.assignedTo && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Assigned to</dt>
                    <dd className="text-base font-semibold text-gray-900">{ticket?.assignedTo?.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Category</dt>
                  <dd className="text-base font-semibold text-gray-900 capitalize">{ticket?.category?.replace('_', ' ')}</dd>
                </div>
                {ticket?.contractingCompany && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Contracting Company</dt>
                    <dd className="text-base font-semibold text-gray-900">{ticket?.contractingCompany}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
                  <dd className="text-base font-semibold text-gray-900">
                    {ticket?.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Unknown'}
                  </dd>
                </div>

                {/* Permission Info */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Your Permissions</h4>
                    <div className="space-y-1 text-xs text-blue-700">
                      {user?.role === 'owner' && (
                        <>
                          <p>✓ Full system control</p>
                          <p>✓ Can manage all users and roles</p>
                          <p>✓ Can view, edit, delete all tickets</p>
                        </>
                      )}
                      {user?.role === 'admin' && (
                        <>
                          <p>✓ Property management access</p>
                          <p>✓ Can view, edit, delete all tickets</p>
                          <p>✓ Can assign tickets to workers</p>
                        </>
                      )}
                      {user?.role === 'tenant' && (
                        <>
                          <p>✓ Can view all tickets</p>
                          <p>✓ Can edit/delete only your tickets</p>
                          {ticket?.createdBy?._id === user?.id ? (
                            <p className="text-green-700 font-semibold">✓ You created this ticket</p>
                          ) : (
                            <p className="text-orange-700">⚠ You can only comment on this ticket</p>
                          )}
                        </>
                      )}
                      {user?.role === 'worker' && (
                        <>
                          <p>✓ Can view only assigned tickets</p>
                          <p>✓ Can resolve assigned tickets</p>
                          <p>✓ Can add progress comments</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Edit Ticket Page Component
function EditTicketPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [contractingCompanies, setContractingCompanies] = useState([]);
  const [properties, setProperties] = useState([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [unit, setUnit] = useState("");
  const [room, setRoom] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [contractingCompany, setContractingCompany] = useState("");

  useEffect(() => {
    fetchTicket();
    if (user?.role === 'owner' || user?.role === 'admin') {
      fetchWorkers();
      fetchContractingCompanies();
      fetchProperties();
    }
  }, [ticketId, user]);

  const fetchWorkers = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/users?role=worker', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkers(data.success ? data.data : data || []);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
    }
  };

  const fetchContractingCompanies = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/contracting-companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContractingCompanies(data.success ? data.data : data || []);
      }
    } catch (err) {
      console.error('Error fetching contracting companies:', err);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/properties', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.success ? data.data : data || []);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5002/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ticket');
      }

      const data = await response.json();
      const ticketData = data.success ? data.data : data;

      // Check if user can edit this ticket
      const canEdit = user?.role === "owner" || user?.role === "admin" ||
                     (user?.role === "tenant" && ticketData?.createdBy?._id === user?.id);

      if (!canEdit) {
        throw new Error('You do not have permission to edit this ticket');
      }

      setTicket(ticketData);
      setTitle(ticketData.title || "");
      setDescription(ticketData.description || "");
      setCategory(ticketData.category || "");
      setPriority(ticketData.priority || "");
      setPropertyId(ticketData.property?._id || "");
      setUnit(ticketData.unit || "");
      setRoom(ticketData.room || "");
      setAssignedTo(ticketData.assignedTo?._id || "");
      setContractingCompany(ticketData.contractingCompany || "");
    } catch (err) {
      console.error("Error fetching ticket:", err);
      setError(err.message || "Failed to fetch ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        title,
        description,
        category,
        priority,
        propertyId,
        unit,
        room
      };

      // Add assignment data for Owner/Admin
      if (user?.role === 'owner' || user?.role === 'admin') {
        updateData.assignedTo = assignedTo || null;
        updateData.contractingCompany = contractingCompany || null;
      }

      const response = await fetch(`http://localhost:5002/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket');
      }

      navigate(`/tickets/${ticketId}`);
    } catch (err) {
      console.error("Error updating ticket:", err);
      setError(err.message || "Failed to update ticket");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading ticket...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cannot Edit Ticket</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to={`/tickets/${ticketId}`}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Edit Ticket
                </h1>
                <p className="text-sm text-gray-600 mt-1">#{ticket?._id}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <h2 className="text-xl font-bold">Edit Ticket Details</h2>
              <p className="text-blue-100 mt-1">Update your maintenance request information</p>
            </div>

            <div className="px-8 py-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Detailed description of the issue"
                  required
                />
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="heating">Heating</option>
                    <option value="cooling">Cooling</option>
                    <option value="appliances">Appliances</option>
                    <option value="maintenance">General Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Location
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Property</label>
                    {user?.role === 'tenant' ? (
                      <input
                        type="text"
                        value={ticket?.property?.name || 'Not assigned to property'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        disabled
                      />
                    ) : (
                      <select
                        value={propertyId}
                        onChange={(e) => setPropertyId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      >
                        <option value="">Select Property</option>
                        {properties.map(property => (
                          <option key={property._id} value={property._id}>
                            {property.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        user?.role === 'tenant' ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                      }`}
                      placeholder="Unit/Apartment"
                      disabled={user?.role === 'tenant'}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Room (Optional)</label>
                    <input
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Room"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Section - Only for Owner and Admin */}
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <h2 className="text-xl font-bold">Assignment Details</h2>
                <p className="text-purple-100 mt-1">Reassign this ticket to different worker or company</p>
              </div>

              <div className="px-8 py-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assign to Worker */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Assign to Worker
                    </label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select worker (optional)</option>
                      {workers.map(worker => (
                        <option key={worker._id} value={worker._id}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">Assign to internal staff member</p>
                  </div>

                  {/* Contracting Company */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Contracting Company
                    </label>
                    <select
                      value={contractingCompany}
                      onChange={(e) => setContractingCompany(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select company (optional)</option>
                      {contractingCompanies.map(company => (
                        <option key={company._id} value={company.name}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">Assign to external service provider</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              to={`/tickets/${ticketId}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:ticketId"
              element={
                <ProtectedRoute>
                  <TicketDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:ticketId/edit"
              element={
                <ProtectedRoute>
                  <EditTicketPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
