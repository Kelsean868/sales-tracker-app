import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddContactModal = ({ isOpen, onClose, onAddContact }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !phone) {
            alert('Name and Phone are required.');
            return;
        }
        onAddContact({ name, phone, email, company });
        onClose(); // Close modal after submission
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-amber-400">Add New Contact</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone *</label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                            <input
                                id="company"
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-md font-semibold text-gray-900 bg-amber-400 hover:bg-amber-500">
                            Add Contact
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContactModal;
