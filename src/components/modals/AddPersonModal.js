import React, { useState } from 'react';
import { X, User, Phone, Mail, Calendar } from 'lucide-react';

const AddPersonModal = ({ isOpen, onClose, onSave }) => {
    const [personData, setPersonData] = useState({ name: '', email: '', phone: '', dob: '' });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPersonData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(personData);
        onClose();
        setPersonData({ name: '', email: '', phone: '', dob: '' }); // Reset form
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex justify-center items-center" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-amber-400">Create New Person</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputWithIcon icon={<User />} name="name" placeholder="Full Name" value={personData.name} onChange={handleChange} required />
                    <InputWithIcon icon={<Mail />} name="email" placeholder="Email Address" value={personData.email} onChange={handleChange} type="email" />
                    <InputWithIcon icon={<Phone />} name="phone" placeholder="Phone Number" value={personData.phone} onChange={handleChange} />
                    <InputWithIcon icon={<Calendar />} name="dob" label="Date of Birth" value={personData.dob} onChange={handleChange} type="date" />
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-5 py-2 rounded-md font-semibold text-gray-900 bg-amber-500 hover:bg-amber-400">Create</button>
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

export default AddPersonModal;
