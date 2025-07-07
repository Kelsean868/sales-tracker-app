import React, { useState, useEffect } from 'react';
import { X, Shield, Users, Briefcase, Building } from 'lucide-react'; // FIX: Removed unused User and Mail icons
import { USER_ROLES } from '../../constants';

/**
 * EditUserModal component
 * Provides a form to edit an existing user's details, like their role and assignments.
 */
const EditUserModal = ({ isOpen, onClose, onSave, userToEdit, teams = [], units = [], branches = [] }) => {
    const [userData, setUserData] = useState({});

    useEffect(() => {
        if (userToEdit) {
            setUserData({
                role: userToEdit.role || USER_ROLES.SALES_PERSON,
                teamId: userToEdit.teamId || '',
                unitId: userToEdit.unitId || '',
                branchId: userToEdit.branchId || '',
            });
        }
    }, [userToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(userToEdit.uid, userData);
        onClose();
    };

    if (!isOpen || !userToEdit) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[110]"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-amber-400">Edit User</h2>
                        <p className="text-gray-400">{userToEdit.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <SelectInput
                        label="Role"
                        name="role"
                        value={userData.role}
                        onChange={handleChange}
                        icon={<Shield size={20} />}
                    >
                        {Object.values(USER_ROLES).map(role => (
                            <option key={role} value={role}>
                                {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </SelectInput>

                    <SelectInput
                        label="Assign to Branch"
                        name="branchId"
                        value={userData.branchId}
                        onChange={handleChange}
                        icon={<Building size={20} />}
                    >
                        <option value="">None</option>
                        {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </SelectInput>

                    <SelectInput
                        label="Assign to Unit"
                        name="unitId"
                        value={userData.unitId}
                        onChange={handleChange}
                        icon={<Briefcase size={20} />}
                    >
                        <option value="">None</option>
                        {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </SelectInput>

                    <SelectInput
                        label="Assign to Team"
                        name="teamId"
                        value={userData.teamId}
                        onChange={handleChange}
                        icon={<Users size={20} />}
                    >
                        <option value="">None</option>
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </SelectInput>

                    <div className="pt-4 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SelectInput = ({ label, name, value, onChange, icon, children }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>
            <select 
                id={name} 
                name={name} 
                value={value} 
                onChange={onChange} 
                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 appearance-none focus:ring-amber-500 focus:border-amber-500"
            >
                {children}
            </select>
        </div>
    </div>
);

export default EditUserModal;
