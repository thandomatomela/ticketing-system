import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Alert from "./ui/Alert";

export default function TicketForm({ onTicketCreated, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "", // Make priority required
    dueDate: "", // Make due date required
    assignedTo: "",
    contractingCompany: "",
    propertyId: "",
    unit: "",
    room: "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [contractingCompanies, setContractingCompanies] = useState([]);
  const [properties, setProperties] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'admin') {
      fetchWorkers();
      fetchContractingCompanies();
      fetchProperties();
    }
  }, [user]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/users?role=worker');
      if (response.data.success) {
        setWorkers(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
    }
  };

  const fetchContractingCompanies = async () => {
    try {
      const response = await api.get('/contracting-companies');
      if (response.data.success) {
        setContractingCompanies(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching contracting companies:', err);
    }
  };

  const categoryOptions = [
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "heating", label: "Heating" },
    { value: "cooling", label: "Cooling" },
    { value: "appliances", label: "Appliances" },
    { value: "structural", label: "Structural" },
    { value: "pest_control", label: "Pest Control" },
    { value: "cleaning", label: "Cleaning" },
    { value: "security", label: "Security" },
    { value: "other", label: "Other" },
  ];

  const priorityOptions = [
    { value: "", label: "Select Priority" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (formData.title.length < 5) {
      setError("Title must be at least 5 characters long");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (formData.description.length < 10) {
      setError("Description must be at least 10 characters long");
      return false;
    }
    if (!formData.priority) {
      setError("Priority is required");
      return false;
    }
    if (!formData.dueDate) {
      setError("Due date is required");
      return false;
    }
    // Validate due date is not in the past
    const selectedDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError("Due date cannot be in the past");
      return false;
    }
    return true;
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      if (response.data.success) {
        setProperties(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/tickets", formData);

      if (response.data.success) {
        onTicketCreated?.(response.data.data);
        // Reset form
        setFormData({
          title: "",
          description: "",
          category: "",
          priority: "medium",
          dueDate: "",
          assignedTo: "",
          contractingCompany: "",
          propertyId: "",
          unit: "",
          room: "",
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Create New Ticket</h2>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Brief description of the issue"
            required
            disabled={isSubmitting}
          />

          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            options={categoryOptions}
            placeholder="Select category"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Detailed description of the issue..."
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            options={priorityOptions}
            disabled={isSubmitting}
            required
            placeholder="Select priority"
          />

          <Input
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleInputChange}
            disabled={isSubmitting}
            required
            helperText="Required: When should this be completed?"
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role === 'tenant' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <input
                    type="text"
                    value={user?.assignedProperty?.name || user?.property?.name || 'Not assigned to property'}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={user?.unit || user?.assignedUnit || 'Not assigned to unit'}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <Input
                  label="Room (Optional)"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="Specific room"
                  disabled={isSubmitting}
                />
              </>
            ) : (
              <>
                <Select
                  label="Property"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                  options={[
                    { value: "", label: "Select Property" },
                    ...properties.map(property => ({
                      value: property._id,
                      label: property.name
                    }))
                  ]}
                />

                <Input
                  label="Unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder="Unit/Apartment number"
                  disabled={isSubmitting}
                  required
                />

                <Input
                  label="Room (Optional)"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="Specific room"
                  disabled={isSubmitting}
                />
              </>
            )}
          </div>
        </div>

        {/* Assignment Section - Only for Owner and Admin */}
        {(user?.role === 'owner' || user?.role === 'admin') && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Assign to Worker"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                options={[
                  { value: "", label: "Select worker (optional)" },
                  ...workers.map(worker => ({
                    value: worker._id,
                    label: worker.name
                  }))
                ]}
                disabled={isSubmitting}
                helperText="Optional: Assign this ticket to a specific worker"
              />

              <Select
                label="Contracting Company"
                name="contractingCompany"
                value={formData.contractingCompany}
                onChange={handleInputChange}
                options={[
                  { value: "", label: "Select company (optional)" },
                  ...contractingCompanies.map(company => ({
                    value: company.name,
                    label: company.name
                  }))
                ]}
                disabled={isSubmitting}
                helperText="Optional: Select external contracting company"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Ticket
          </Button>
        </div>
      </form>
    </div>
  );
}