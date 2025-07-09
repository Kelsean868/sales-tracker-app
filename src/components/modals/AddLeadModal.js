import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, Building, DollarSign, Info, Calendar, ChevronDown } from 'lucide-react';

const AddLeadModal = ({ isOpen, onClose, onAddLead }) => {
    const [isDetailed, setIsDetailed] = useState(false);
    const [leadData, setLeadData] = useState({
        name: '',
        phone: '',
        email: '',
        company: '',
        status: 'new',
        estimatedValue: '',
        notes: '',
        dob: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLeadData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddLead(leadData);
        setLeadData({ name: '', phone: '', email: '', company: '', status: 'new', estimatedValue: '', notes: '', dob: '' });
        setIsDetailed(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-amber-400">Add New Lead</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <InputWithIcon icon={<UserPlus />} name="name" placeholder="Full Name" value={leadData.name} onChange={handleChange} required />
                        <InputWithIcon icon={<Phone />} name="phone" placeholder="Phone Number" value={leadData.phone} onChange={handleChange} required />

                        {isDetailed && (
                            <>
                                <InputWithIcon icon={<Mail />} name="email" placeholder="Email Address" value={leadData.email} onChange={handleChange} type="email" />
                                <InputWithIcon icon={<Building />} name="company" placeholder="Company (Optional)" value={leadData.company} onChange={handleChange} />
                                <InputWithIcon icon={<DollarSign />} name="estimatedValue" placeholder="Estimated Value (Optional)" value={leadData.estimatedValue} onChange={handleChange} type="number" />
                                <InputWithIcon icon={<Calendar />} name="dob" label="Date of Birth" value={leadData.dob} onChange={handleChange} type="date" />
                                <div className="relative">
                                    <Info className="absolute left-3 top-4 text-gray-400" size={20} />
                                    <textarea name="notes" placeholder="Notes (Optional)" value={leadData.notes} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 h-24 resize-none focus:ring-amber-500 focus:border-amber-500"></textarea>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                        <button 
                            type="button" 
                            onClick={() => setIsDetailed(!isDetailed)} 
                            className="flex items-center text-sm text-amber-400 hover:text-amber-300"
                        >
                            {isDetailed ? 'Quick Add' : 'Detailed Add'}
                            <ChevronDown className={`ml-1 transition-transform ${isDetailed ? 'rotate-180' : ''}`} size={16} />
                        </button>
                        <div className="space-x-4">
                            <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                                Cancel
                            </button>
                            <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">
                                Add Lead
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InputWithIcon = ({ icon, name, label, ...props }) => (
    <div>
        {label && <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
            <input name={name} id={name} {...props} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" />
        </div>
    </div>
);

export default AddLeadModal;
