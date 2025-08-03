import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

export default function AdminPage() {
  const { user, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [contractingCompanies, setContractingCompanies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "tenant",
    phone: "",
    propertyId: "",
    unit: "",
    managedProperties: []
  });
  const [newCompany, setNewCompany] = useState({
    name: "",
    category: "",
    phone: "",
    email: "",
    serviceAreas: [{ city: "", region: "", radius: 30 }],
    serviceProperties: []
  });
  const [newProperty, setNewProperty] = useState({
    name: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "South Africa"
    },
    type: "apartment",
    totalUnits: 10,
    amenities: []
  });
  const [saving, setSaving] = useState(false);
  const [changingRole, setChangingRole] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user?.role !== 'owner' && user?.role !== 'admin') {
      setError('Access denied. Only owners and admins can access this page.');
      setLoading(false);
      return;
    }
    fetchUsers();
    fetchContractingCompanies();
    fetchProperties();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.success ? response.data.data : response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchContractingCompanies = async () => {
    try {
      const response = await api.get('/contracting-companies');
      setContractingCompanies(response.data.success ? response.data.data : response.data || []);
    } catch (err) {
      console.error('Error fetching contracting companies:', err);
      // Don't set error here as it's not critical
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data.success ? response.data.data : response.data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      // Don't set error here as it's not critical
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { managedProperties, ...userData } = newUser;
      
      console.log('🔍 Creating user with data:', userData);

      // Create the user first
      const response = await api.post('/users', userData);
      console.log('✅ User created successfully:', response.data);

      const createdUser = response.data.success ? response.data.data : response.data;

      // Handle post-creation assignments
      if ((newUser.role === 'admin' || newUser.role === 'senior_admin') && managedProperties?.length > 0) {
        // Assign admin to properties
        try {
          await api.post(`/users/${createdUser._id}/assign-properties`, {
            propertyIds: managedProperties
          });
          console.log('✅ Admin assigned to properties:', managedProperties.length);
        } catch (error) {
          console.error('⚠️ Warning: Could not assign admin to properties:', error.message);
        }
      }

      setUsers([...users, createdUser]);
      setNewUser({ name: "", email: "", password: "", role: "tenant", phone: "", propertyId: "", unit: "", managedProperties: [] });
      setShowAddUser(false);
      setError(null);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.post('/contracting-companies', newCompany);
      const createdCompany = response.data.success ? response.data.data : response.data;

      setContractingCompanies([...contractingCompanies, createdCompany]);
      setNewCompany({
        name: "",
        category: "",
        phone: "",
        email: "",
        serviceAreas: [{ city: "", region: "", radius: 30 }],
        serviceProperties: []
      });
      setShowAddCompany(false);
      setError(`✅ Successfully created contracting company: ${createdCompany.name}`);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error creating contracting company:', err);
      setError(err.message || 'Failed to create contracting company');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this contracting company? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/contracting-companies/${companyId}`);

      setContractingCompanies(contractingCompanies.filter(c => c._id !== companyId));
      setError('✅ Contracting company deleted successfully');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error deleting contracting company:', err);
      setError(err.message || 'Failed to delete contracting company');
    }
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.post('/properties', newProperty);
      const createdProperty = response.data.data;
      setProperties([...properties, createdProperty]);
      setNewProperty({
        name: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "South Africa"
        },
        type: "apartment",
        totalUnits: 10,
        amenities: []
      });
      setShowAddProperty(false);
      setError(`✅ Successfully created property: ${createdProperty.name}`);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error creating property:', err);
      setError(err.message || 'Failed to create property');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);

      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    if (user.role === newRole) return; // No change needed

    if (!window.confirm(`Are you sure you want to change ${user.name}'s role from ${user.role} to ${newRole}?`)) {
      return;
    }

    setChangingRole(userId);
    try {
      const response = await api.put(`/users/${userId}`, { role: newRole });
      const updatedUser = response.data.success ? response.data.data : response.data;

      setUsers(users.map(u => u._id === userId ? updatedUser : u));
      setError(null);

      // Show success message
      setTimeout(() => {
        setError(`✅ Successfully changed ${user.name}'s role to ${newRole}`);
        setTimeout(() => setError(null), 3000);
      }, 100);
    } catch (err) {
      console.error('Error changing user role:', err);
      setError(err.message || 'Failed to change user role');
    } finally {
      setChangingRole(null);
    }
  };

  const handleResetPassword = async (userId) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setPasswordResetUser(user);
    setNewPassword("");
    setShowPasswordReset(true);
  };

  const confirmPasswordReset = async () => {
    if (!passwordResetUser || !newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setResettingPassword(passwordResetUser._id);
    try {
      await api.put(`/users/${passwordResetUser._id}/reset-password`, { password: newPassword });

      setShowPasswordReset(false);
      setPasswordResetUser(null);
      setNewPassword("");
      setError(`✅ Successfully reset password for ${passwordResetUser.name}`);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(null);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      owner: "bg-purple-100 text-purple-800 border-purple-200",
      admin: "bg-blue-100 text-blue-800 border-blue-200",
      tenant: "bg-green-100 text-green-800 border-green-200",
      worker: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && user?.role !== 'owner' && user?.role !== 'admin') {
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
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
                  System Administration
                </h1>
                <p className="text-sm text-gray-600 mt-1">Manage users, roles, and system settings</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {activeTab === 'users' && (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add User
                </button>
              )}
              {activeTab === 'companies' && (
                <button
                  onClick={() => setShowAddCompany(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Add Company
                </button>
              )}
              {activeTab === 'properties' && user?.role === 'owner' && (
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
                  </svg>
                  Add Property
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('companies')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'companies'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Companies ({contractingCompanies.length})
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'properties'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
                </svg>
                Properties ({properties.length})
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className={`mb-6 border-l-4 p-4 rounded-r-lg ${
            error.startsWith('✅')
              ? 'bg-green-50 border-green-400'
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {error.startsWith('✅') ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${error.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>
                  {error}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className={`inline-flex ${
                    error.startsWith('✅')
                      ? 'text-green-400 hover:text-green-600'
                      : 'text-red-400 hover:text-red-600'
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <h2 className="text-xl font-bold">System Users</h2>
            <p className="text-purple-100 mt-1">Manage all users and their roles</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.phone || 'No phone'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {user.role !== 'owner' && (
                          <div className="relative">
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeRole(user._id, e.target.value)}
                              disabled={changingRole === user._id}
                              className={`text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                changingRole === user._id ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'
                              }`}
                              title="Change user role"
                            >
                              <option value="tenant">🎓 Tenant</option>
                              <option value="worker">🔧 Worker</option>
                              <option value="admin">👑 Admin</option>
                            </select>
                            {changingRole === user._id && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                        )}
                        {user.role !== 'owner' && (
                          <>
                            <button
                              onClick={() => handleResetPassword(user._id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              title="Reset password"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                            {(user?.role === 'owner' || (user?.role === 'admin' && user.role !== 'admin')) && (
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                title="Delete user"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                        {user.role === 'owner' && (
                          <span className="text-xs text-gray-500 italic">System Owner</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Contracting Companies Table */}
        {activeTab === 'companies' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="px-8 py-6 bg-gradient-to-r from-green-600 to-blue-600 text-white">
              <h2 className="text-xl font-bold">Contracting Companies</h2>
              <p className="text-green-100 mt-1">Manage external service providers</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contractingCompanies.map((company) => (
                    <tr key={company._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {company.name?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{company.name}</div>
                            <div className="text-sm text-gray-500">{company.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 capitalize">
                          {company.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {company.phone || 'No phone'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {company.serviceProperties?.length > 0 ? (
                            <div className="space-y-1">
                              {company.serviceProperties.slice(0, 2).map(property => (
                                <div key={property._id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {property.name}
                                </div>
                              ))}
                              {company.serviceProperties.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{company.serviceProperties.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No properties assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteCompany(company._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete company"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Properties Table */}
        {activeTab === 'properties' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <h2 className="text-xl font-bold">Properties</h2>
              <p className="text-purple-100 mt-1">Manage your property portfolio</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property) => {
                    const occupiedUnits = property.units?.filter(unit => unit.isOccupied).length || 0;
                    const totalUnits = property.totalUnits || property.units?.length || 0;
                    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

                    return (
                      <tr key={property._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{property.name}</div>
                              <div className="text-sm text-gray-500">
                                {property.manager?.name ? `Managed by ${property.manager.name}` : 'No manager assigned'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{property.address?.street}</div>
                          <div className="text-sm text-gray-500">
                            {property.address?.city}, {property.address?.state} {property.address?.zipCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {property.type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalUnits} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900">{occupiedUnits}/{totalUnits}</div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${occupancyRate}%` }}
                              ></div>
                            </div>
                            <div className="ml-2 text-xs text-gray-500">{occupancyRate}%</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                            title="View property details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {user?.role === 'owner' && (
                            <button
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete property"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
              </div>
              
              <form onSubmit={handleAddUser} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tenant">Tenant/Student</option>
                    <option value="worker">Worker/Supplier</option>
                    <option value="admin">Admin</option>
                    <option value="senior_admin">Senior Admin</option>
                  </select>
                </div>

                {/* Property Assignment for Tenants and Admins */}
                {(newUser.role === 'tenant' || newUser.role === 'admin' || newUser.role === 'senior_admin') && (
                  <>
                    {newUser.role === 'tenant' ? (
                      // Tenant Assignment - Single Property/Unit
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Property</label>
                          <select
                            value={newUser.propertyId || ''}
                            onChange={(e) => setNewUser({...newUser, propertyId: e.target.value, unit: ''})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select Property (Optional)</option>
                            {properties.map(property => (
                              <option key={property._id} value={property._id}>
                                {property.name} - {property.address?.city}
                              </option>
                            ))}
                          </select>
                        </div>

                        {newUser.propertyId && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Unit</label>
                            <select
                              value={newUser.unit || ''}
                              onChange={(e) => setNewUser({...newUser, unit: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select Unit (Optional)</option>
                              {properties
                                .find(p => p._id === newUser.propertyId)
                                ?.units?.filter(unit => !unit.isOccupied)
                                .map(unit => (
                                  <option key={unit.unitNumber} value={unit.unitNumber}>
                                    {unit.unitNumber} - {unit.type} (Floor {unit.floor})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </>
                    ) : (
                      // Admin Assignment - Multiple Properties
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign Properties to Manage (Optional)
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                          {properties.map(property => (
                            <label key={property._id} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                checked={(newUser.managedProperties || []).includes(property._id)}
                                onChange={(e) => {
                                  const managedProperties = newUser.managedProperties || [];
                                  if (e.target.checked) {
                                    setNewUser({
                                      ...newUser,
                                      managedProperties: [...managedProperties, property._id]
                                    });
                                  } else {
                                    setNewUser({
                                      ...newUser,
                                      managedProperties: managedProperties.filter(id => id !== property._id)
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {property.name} - {property.address?.city}
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {newUser.role === 'admin' ? 'Admin' : 'Senior Admin'} can manage multiple properties
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Company Modal */}
        {showAddCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Add Contracting Company</h3>
              </div>

              <form onSubmit={handleAddCompany} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newCompany.category}
                    onChange={(e) => setNewCompany({...newCompany, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="heating">Heating & HVAC</option>
                    <option value="cooling">Cooling & AC</option>
                    <option value="appliances">Appliances</option>
                    <option value="maintenance">General Maintenance</option>
                    <option value="cleaning">Cleaning Services</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({...newCompany, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="contact@company.com"
                  />
                </div>

                {/* Service Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Area</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCompany.serviceAreas[0]?.city || ''}
                      onChange={(e) => setNewCompany({
                        ...newCompany,
                        serviceAreas: [{
                          ...newCompany.serviceAreas[0],
                          city: e.target.value
                        }]
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={newCompany.serviceAreas[0]?.region || ''}
                      onChange={(e) => setNewCompany({
                        ...newCompany,
                        serviceAreas: [{
                          ...newCompany.serviceAreas[0],
                          region: e.target.value
                        }]
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Region/State"
                    />
                  </div>
                </div>

                {/* Property Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Properties (Optional)
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {properties.map(property => (
                      <label key={property._id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={(newCompany.serviceProperties || []).includes(property._id)}
                          onChange={(e) => {
                            const serviceProperties = newCompany.serviceProperties || [];
                            if (e.target.checked) {
                              setNewCompany({
                                ...newCompany,
                                serviceProperties: [...serviceProperties, property._id]
                              });
                            } else {
                              setNewCompany({
                                ...newCompany,
                                serviceProperties: serviceProperties.filter(id => id !== property._id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">
                          {property.name} - {property.address?.city}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Company can service tickets from selected properties
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Property Modal */}
        {showAddProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Add New Property</h3>
              </div>

              <form onSubmit={handleAddProperty} className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                    <input
                      type="text"
                      value={newProperty.name}
                      onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Sunset Student Residence"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={newProperty.address.street}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        address: {...newProperty.address, street: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="123 Main Street"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newProperty.address.city}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        address: {...newProperty.address, city: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Cape Town"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      value={newProperty.address.state}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        address: {...newProperty.address, state: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Western Cape"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      value={newProperty.address.zipCode}
                      onChange={(e) => setNewProperty({
                        ...newProperty,
                        address: {...newProperty.address, zipCode: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="8001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                    <select
                      value={newProperty.type}
                      onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="student_residence">Student Residence</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={newProperty.totalUnits}
                      onChange={(e) => setNewProperty({...newProperty, totalUnits: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddProperty(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordReset && passwordResetUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Reset password for {passwordResetUser.name}
                </p>
              </div>

              <div className="px-6 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password (min 6 characters)"
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setPasswordResetUser(null);
                      setNewPassword("");
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPasswordReset}
                    disabled={resettingPassword || !newPassword.trim() || newPassword.length < 6}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resettingPassword ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

