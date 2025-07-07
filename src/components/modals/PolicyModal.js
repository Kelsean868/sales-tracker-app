import React, { useState, useEffect } from 'react';
import { X, Shield, Calendar, DollarSign, Hash, Edit3 } from 'lucide-react';

/**
 * PolicyModal component
 * A modal for adding or editing an insurance policy.
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Controls if the modal is visible
 * @param {function} props.onClose - Function to call when the modal should be closed
 * @param {function} props.onSave - Function to call to save the policy data
 * @param {object} [props.policy] - The policy object to edit. If null, it's in 'add' mode.
 * @param {string} props.clientId - The ID of the client this policy belongs to
 * @returns {JSX.Element|null} The rendered modal or null if not open
 */
const PolicyModal = ({ isOpen, onClose, onSave, policy, clientId }) => {
    const isEditMode = Boolean(policy);

    const [policyData, setPolicyData] = useState({
        policyNumber: '',
        type: '',
        premium: '',
        startDate: '',
        status: 'active',
    });

    // When the modal opens or the policy prop changes, update the form state
    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setPolicyData({
                    policyNumber: policy.policyNumber || '',
                    type: policy.type || '',
                    premium: policy.premium || '',
                    // Format date for the datetime-local input
                    startDate: policy.startDate ? new Date(policy.startDate).toISOString().slice(0, 16) : '',
                    status: policy.status || 'active',
                });
            } else {
                // Reset form for adding a new policy
                setPolicyData({ policyNumber: '', type: '', premium: '', startDate: '', status: 'active' });
            }
        }
    }, [isOpen, policy, isEditMode]);

    // Handles changes in form inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPolicyData(prev => ({ ...prev, [name]: value }));
    };

    // Handles form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        const finalPolicyData = {
            ...policyData,
            clientId: clientId, // Ensure the client ID is attached
            // Convert local datetime back to a simple ISO string or timestamp for storage
            startDate: policyData.startDate ? new Date(policyData.startDate).toISOString() : null,
        };
        onSave(finalPolicyData);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400">
                        {isEditMode ? 'Edit Policy' : 'Add New Policy'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Policy Form */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <InputWithIcon icon={<Hash />} name="policyNumber" placeholder="Policy Number" value={policyData.policyNumber} onChange={handleChange} required />
                        <InputWithIcon icon={<Shield />} name="type" placeholder="Policy Type (e.g., Life, Health)" value={policyData.type} onChange={handleChange} required />
                        <InputWithIcon icon={<DollarSign />} name="premium" placeholder="Premium Amount" value={policyData.premium} onChange={handleChange} type="number" required />
                        <InputWithIcon icon={<Calendar />} name="startDate" placeholder="Start Date" value={policyData.startDate} onChange={handleChange} type="datetime-local" required />
                        
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={policyData.status}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="active">Active</option>
                                <option value="lapsed">Lapsed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">
                            {isEditMode ? 'Save Changes' : 'Add Policy'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Reusable Input with Icon sub-component
const InputWithIcon = ({ icon, name, ...props }) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <input
            name={name}
            {...props}
            className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500"
        />
    </div>
);

export default PolicyModal;
