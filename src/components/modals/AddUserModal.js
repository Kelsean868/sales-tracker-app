import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield } from 'lucide-react';
import { USER_ROLES } from '../../constants';

/**
 * AddUserModal component
 * Provides a form to invite/add a new user to the system.
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Controls if the modal is visible
 * @param {function} props.onClose - Function to call when the modal should be closed
 * @param {function} props.onAddUser - Function to call to add the new user
 * @returns {JSX.Element|null} The rendered modal or null if not open
 */
const AddUserModal = ({ isOpen, onClose, onAddUser }) => {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        role: USER_ROLES.SALES_PERSON, // Default role
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userData.name || !userData.email) {
            alert('Please fill in all fields.');
            return;
        }
        onAddUser(userData);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        // FIX: Increased z-index from z-50 to z-[110] to appear above the ProfileScreen (which is z-[100])
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[110]"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400">Add New User</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input id="name" name="name" type="text" value={userData.name} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input id="email" name="email" type="email" value={userData.email} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Assign Role</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <select id="role" name="role" value={userData.role} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 appearance-none focus:ring-amber-500 focus:border-amber-500">
                                {Object.values(USER_ROLES).map(role => (
                                    <option key={role} value={role}>
                                        {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">
                            Add User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
