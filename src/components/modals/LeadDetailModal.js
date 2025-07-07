import React from 'react';
import { X, User, Phone, Mail, DollarSign, Info, Plus } from 'lucide-react';

/**
 * LeadDetailModal component
 * Displays detailed information about a specific lead and allows for actions.
 */
const LeadDetailModal = ({ isOpen, onClose, lead, onLogActivity, onConvertToClient }) => {
    if (!isOpen || !lead) {
        return null;
    }

    const formatStatus = (status) => {
        if (!status) return 'N/A';
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-amber-400">{lead.name}</h2>
                        <p className="text-gray-400">{lead.company || 'No company specified'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={28} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <InfoItem icon={<User />} label="Status" value={formatStatus(lead.status)} />
                    <InfoItem icon={<Phone />} label="Phone" value={lead.phone} />
                    <InfoItem icon={<Mail />} label="Email" value={lead.email || 'N/A'} />
                    <InfoItem icon={<DollarSign />} label="Estimated Value" value={lead.estimatedValue ? `$${Number(lead.estimatedValue).toLocaleString()}` : 'N/A'} />
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2 flex items-center"><Info className="mr-2" size={20}/> Notes</h3>
                    <div className="bg-gray-700/50 p-4 rounded-lg max-h-32 overflow-y-auto">
                        <p className="text-gray-300 whitespace-pre-wrap">{lead.notes || 'No notes for this lead.'}</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-4">
                    <button onClick={() => onLogActivity(lead)} className="flex items-center justify-center px-6 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-500">
                        <Plus className="mr-2" size={20} /> Log Activity
                    </button>
                    <button onClick={() => onConvertToClient(lead)} className="flex items-center justify-center px-6 py-2 rounded-md font-semibold text-gray-900 bg-green-500 hover:bg-green-400">
                        Convert to Client
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="text-amber-400 mt-1 mr-3">{icon}</div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    </div>
);

export default LeadDetailModal;
