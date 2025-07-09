import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, DollarSign, Briefcase, Building, Home, PhoneForwarded, Edit, Tag } from 'lucide-react';

const ContactModal = ({ isOpen, onClose, contact, onUpdateContact }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedContact, setEditedContact] = useState(contact);

    useEffect(() => {
        setEditedContact(contact);
        setIsEditMode(false);
    }, [contact]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedContact(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onUpdateContact(editedContact.id, editedContact);
        setIsEditMode(false);
    };

    if (!isOpen || !contact) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-4xl transform transition-all max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-start mb-6 flex-shrink-0">
                    <div>
                        <h2 className="text-3xl font-bold text-amber-400">{contact.name}</h2>
                        <p className="text-gray-400">{contact.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setIsEditMode(!isEditMode)} className="flex items-center justify-center px-4 py-2 rounded-md font-semibold text-white bg-gray-600 hover:bg-gray-500">
                            <Edit className="mr-2" size={16} /> {isEditMode ? 'Cancel' : 'Edit'}
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={28} /></button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto pr-4 -mr-4 flex-grow">
                    <h3 className="text-xl font-semibold text-gray-300 mb-4">Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <InfoItem icon={<Tag />} label="Category" name="category" value={editedContact.category} isEditMode={isEditMode} onChange={handleChange} />
                        <InfoItem icon={<Phone />} label="Primary Phone" name="phone" value={editedContact.phone} isEditMode={isEditMode} onChange={handleChange} />
                        <InfoItem icon={<PhoneForwarded />} label="Other Phone" name="otherNumber" value={editedContact.otherNumber} isEditMode={isEditMode} onChange={handleChange} />
                        <InfoItem icon={<Briefcase />} label="Occupation" name="occupation" value={editedContact.occupation} isEditMode={isEditMode} onChange={handleChange} />
                        <InfoItem icon={<Building />} label="Employer" name="employer" value={editedContact.employer} isEditMode={isEditMode} onChange={handleChange} />
                        <InfoItem icon={<DollarSign />} label="Monthly Income" name="monthlyIncome" value={editedContact.monthlyIncome} isEditMode={isEditMode} onChange={handleChange} type="number" />
                        <InfoItem icon={<Home />} label="Home Address" name="homeAddress" value={editedContact.homeAddress} isEditMode={isEditMode} onChange={handleChange} isTextArea />
                        <InfoItem icon={<Building />} label="Employer Address" name="employerAddress" value={editedContact.employerAddress} isEditMode={isEditMode} onChange={handleChange} isTextArea />
                    </div>
                </div>

                {/* Footer */}
                {isEditMode && (
                    <div className="flex justify-end mt-6 flex-shrink-0">
                        <button onClick={handleSave} className="px-6 py-2 rounded-md font-semibold text-gray-900 bg-green-500 hover:bg-green-400">
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoItem = ({ icon, label, name, value, isEditMode, onChange, type = "text", isTextArea = false }) => (
    <div className="flex items-start bg-gray-700/30 p-3 rounded-lg min-h-[70px]">
        <div className="text-amber-400 mt-1 mr-4">{icon}</div>
        <div className="w-full">
            <p className="text-sm text-gray-400">{label}</p>
            {isEditMode ? (
                isTextArea ? (
                    <textarea
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        className="w-full bg-gray-600 border-gray-500 rounded-md p-2 mt-1 text-base resize-none"
                        rows={3}
                    />
                ) : (
                    <input
                        type={type}
                        name={name}
                        value={value || ''}
                        onChange={onChange}
                        className="w-full bg-gray-600 border-gray-500 rounded-md p-2 mt-1 text-base"
                    />
                )
            ) : (
                <p className="font-semibold text-base whitespace-pre-wrap">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

export default ContactModal;
