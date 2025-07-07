import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Building, Briefcase } from 'lucide-react';

/**
 * ClientModal component
 * A modal for creating a new client or editing an existing one.
 */
const ClientModal = ({ isOpen, onClose, onSave, client }) => {
    const isEditMode = Boolean(client);
    
    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
    });

    const [policies, setPolicies] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setClientData({
                    name: client.name || '',
                    phone: client.phone || '',
                    email: client.email || '',
                    address: client.address || '',
                });
                setPolicies(client.policies || []); 
            } else {
                setClientData({ name: '', phone: '', email: '', address: '' });
                setPolicies([]);
            }
        }
    }, [isOpen, client, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...clientData, policies });
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
                className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400">
                        {isEditMode ? 'Edit Client' : 'Add New Client'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <InputWithIcon icon={<User />} name="name" placeholder="Full Name" value={clientData.name} onChange={handleChange} required />
                        <InputWithIcon icon={<Phone />} name="phone" placeholder="Phone Number" value={clientData.phone} onChange={handleChange} required />
                        <InputWithIcon icon={<Mail />} name="email" placeholder="Email Address" value={clientData.email} onChange={handleChange} type="email" />
                        <InputWithIcon icon={<Building />} name="address" placeholder="Address" value={clientData.address} onChange={handleChange} />
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2 flex items-center">
                            <Briefcase className="mr-2" size={20} /> Policies
                        </h3>
                        <div className="bg-gray-700/50 p-4 rounded-lg">
                            <p className="text-center text-gray-400">Policy management UI will be here.</p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">
                            {isEditMode ? 'Save Changes' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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

export default ClientModal;
