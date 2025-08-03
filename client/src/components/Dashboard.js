import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../api/api";
import LoadingSpinner from "./ui/LoadingSpinner";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import TicketList from "./TicketList";
import TicketForm from "./TicketForm";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  const [stats, setStats] = useState({
    total: 0,
    unassigned: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchTickets();
    fetchAllTickets(); // Fetch all tickets for everyone
  }, [user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/tickets");

      if (response.data.success) {
        const ticketData = response.data.data || [];
        setTickets(ticketData);

        // Calculate stats for user's tickets
        const stats = {
          total: ticketData.length,
          unassigned: ticketData.filter(t => t.status === "unassigned").length,
          inProgress: ticketData.filter(t => t.status === "in_progress").length,
          completed: ticketData.filter(t => ["completed", "resolved"].includes(t.status)).length,
        };
        setStats(stats);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(err.response?.data?.message || "Failed to fetch tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTickets = async () => {
    try {
      // Fetch ALL tickets (not just open ones)
      const response = await api.get("/tickets?all=true");

      if (response.data.success) {
        const allTicketData = response.data.data || [];
        setAllTickets(allTicketData);
      }
    } catch (err) {
      console.error("Error fetching all tickets:", err);
    }
  };

  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setShowCreateForm(false);
    fetchTickets(); // Refresh to get updated stats
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: "Administrator",
      owner: "Property Owner",
      landlord: "Landlord",
      tenant: "Tenant",
      worker: "Maintenance Worker",
    };
    return roleNames[role] || role;
  };

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${color} rounded-md flex items-center justify-center`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {user?.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {getRoleDisplayName(user?.role)} Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {(user?.role === 'owner' || user?.role === 'admin') && (
                <Link to="/admin">
                  <Button
                    variant="secondary"
                    className="hidden sm:inline-flex"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Manage
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="hidden sm:inline-flex"
              >
                {showCreateForm ? "Cancel" : "Create Ticket"}
              </Button>
              <Button variant="ghost" onClick={logout}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tickets"
            value={stats.total}
            color="bg-blue-500"
            icon={
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Unassigned"
            value={stats.unassigned}
            color="bg-yellow-500"
            icon={
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            }
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            color="bg-orange-500"
            icon={
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            color="bg-green-500"
            icon={
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Create Ticket Form */}
        {showCreateForm && (
          <div className="mb-8">
            <TicketForm
              onTicketCreated={handleTicketCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Mobile Create Button */}
        <div className="sm:hidden mb-6">
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full"
          >
            {showCreateForm ? "Cancel" : "Create New Ticket"}
          </Button>
        </div>

        {/* Tickets Tabs */}
        <div className="bg-white shadow rounded-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-4 py-3">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tickets ({allTickets.length})
              </button>

              <button
                onClick={() => setActiveTab('your-tickets')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'your-tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Your Tickets ({stats.total})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-4 py-5 sm:p-6">
            {activeTab === 'tickets' ? (
              <>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  All Tickets
                </h3>
                <TicketList
                  tickets={allTickets}
                  loading={loading}
                  onRefresh={fetchAllTickets}
                />
              </>
            ) : (
              <>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Your Tickets
                </h3>
                <TicketList
                  tickets={tickets}
                  loading={loading}
                  onRefresh={fetchTickets}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
