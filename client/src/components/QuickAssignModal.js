import { useState, useEffect } from "react";
import api from "../api/api";
import Button from "./ui/Button";
import Select from "./ui/Select";

export default function QuickAssignModal({ ticket, onClose, onAssigned }) {
  const [assignedTo, setAssignedTo] = useState(ticket?.assignedTo?._id || "");
  const [contractingCompany, setContractingCompany] = useState(ticket?.contractingCompany || "");
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkers();
    fetchCompanies();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('🔧 Workers state updated:', workers.length, workers);
  }, [workers]);

  useEffect(() => {
    console.log('🏢 Companies state updated:', companies.length, companies);
  }, [companies]);

  const fetchWorkers = async () => {
    try {
      console.log('🔍 Fetching workers...');
      const response = await api.get('/users?role=worker');
      console.log('👥 Workers response:', response.data);
      if (response.data.success) {
        setWorkers(response.data.data || []);
        console.log('✅ Workers set:', response.data.data?.length || 0);
      } else {
        console.log('❌ Workers fetch failed:', response.data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching workers:', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      console.log('🔍 Fetching companies...');
      const response = await api.get('/contracting-companies');
      console.log('🏢 Companies response:', response.data);
      if (response.data.success) {
        setCompanies(response.data.data || []);
        console.log('✅ Companies set:', response.data.data?.length || 0);
      } else {
        console.log('❌ Companies fetch failed:', response.data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching companies:', err);
    }
  };

  const handleAssign = async () => {
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        assignedTo: assignedTo || null,
        contractingCompany: contractingCompany || null
      };

      const response = await api.put(`/tickets/${ticket._id}`, updateData);
      
      if (response.data.success) {
        onAssigned(response.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAssignment = async () => {
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        assignedTo: null,
        contractingCompany: null
      };

      const response = await api.put(`/tickets/${ticket._id}`, updateData);
      
      if (response.data.success) {
        onAssigned(response.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Quick Assign Ticket</h3>
          <p className="text-sm text-gray-600 mt-1">
            Assign "{ticket?.title}" to worker or company
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
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                ticket?.status === 'unassigned' ? 'bg-yellow-100 text-yellow-800' :
                ticket?.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket?.status?.replace('_', ' ')}
              </span>
            </label>
          </div>

          <Select
            label="Assign to Worker"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            options={[
              { value: "", label: "No worker assigned" },
              ...workers.map(worker => ({
                value: worker._id,
                label: `${worker.name} (${worker.email})`
              }))
            ]}
            disabled={loading}
          />

          <Select
            label="Assign to Company"
            value={contractingCompany}
            onChange={(e) => setContractingCompany(e.target.value)}
            options={[
              { value: "", label: "No company assigned" },
              ...companies.map(company => ({
                value: company._id,
                label: `${company.name} - ${company.category}`
              }))
            ]}
            disabled={loading}
          />

          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            <strong>Note:</strong> You can assign to both a worker and a company. 
            The ticket status will automatically change to "In Progress" when assigned.
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <Button
            variant="outline"
            onClick={handleClearAssignment}
            disabled={loading}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Clear Assignment
          </Button>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={loading}
            >
              {loading ? 'Assigning...' : 'Assign Ticket'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
