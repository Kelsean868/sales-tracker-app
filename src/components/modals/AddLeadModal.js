import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, Building, DollarSign, Info } from 'lucide-react';

/**
 * AddLeadModal component
 * This component provides a form to add a new lead to the system.
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Controls if the modal is visible
 * @param {function} props.onClose - Function to call when the modal should be closed
 * @param {function} props.onAddLead - Function to call to add the new lead
 * @returns {JSX.Element|null} The rendered modal or null if not open
 */
const AddLeadModal = ({ isOpen, onClose, onAddLead }) => {
    // State to hold the form data for the new lead
    const [leadData, setLeadData] = useState({
        name: '',
        phone: '',
        email: '',
        company: '',
        status: 'new', // Default status
        estimatedValue: '',
        notes: '',
    });

    // Handles changes in form inputs and updates the state
    const handleChange = (e) => {
        const { name, value } = e.target;
        setLeadData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Handles form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation
        if (!leadData.name || !leadData.phone) {
            alert('Please fill in at least the name and phone number.');
            return;
        }
        onAddLead(leadData);
        // Reset form and close modal after submission
        setLeadData({
            name: '', phone: '', email: '', company: '',
            status: 'new', estimatedValue: '', notes: '',
        });
        onClose();
    };

    // If the modal is not open, render nothing
    if (!isOpen) {
        return null;
    }

    // Render the modal
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose} // Close modal on overlay click
        >
            <div 
                className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400">Add New Lead</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Lead Form */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Input fields for lead data */}
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" name="name" placeholder="Full Name" value={leadData.name} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="tel" name="phone" placeholder="Phone Number" value={leadData.phone} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="email" name="email" placeholder="Email Address" value={leadData.email} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" name="company" placeholder="Company (Optional)" value={leadData.company} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="number" name="estimatedValue" placeholder="Estimated Value (Optional)" value={leadData.estimatedValue} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                        <div className="relative">
                            <Info className="absolute left-3 top-4 text-gray-400" size={20} />
                            <textarea name="notes" placeholder="Notes (Optional)" value={leadData.notes} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 h-24 resize-none focus:ring-amber-500 focus:border-amber-500"></textarea>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">
                            Add Lead
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;
