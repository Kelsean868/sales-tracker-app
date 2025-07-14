import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Building, Briefcase, Plus, Shield, Edit, Calendar, Save, DollarSign, Home } from 'lucide-react';

const ClientModal = ({ isOpen, onClose, client, policies = [], onAddPolicy, onSelectPolicy, onUpdateClient }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [clientData, setClientData] = useState({});

    useEffect(() => {
        if (client) {
            setClientData({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                dob: client.dob ? new Date(client.dob).toISOString().slice(0, 10) : '',
                occupation: client.occupation || '',
                employer: client.employer || '',
                monthlyIncome: client.monthlyIncome || '',
            });
        }
    }, [client]);
    
    if (!isOpen || !client) return null;

    const clientPolicies = policies.filter(p => p.clientId === client.id);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({...prev, [name]: value}));
    };

    const handleSave = () => {
        onUpdateClient(client.id, clientData);
        setIsEditMode(false);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 text-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    {isEditMode ? (
                        <InputWithIcon icon={<User />} name="name" value={clientData.name} onChange={handleChange} className="text-3xl font-bold text-amber-400 bg-transparent" />
                    ) : (
                        <h2 className="text-3xl font-bold text-amber-400">{client.name}</h2>
                    )}
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={28} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    <EditableInfoItem icon={<Mail />} label="Email" value={clientData.email} name="email" isEditMode={isEditMode} onChange={handleChange} />
                    <EditableInfoItem icon={<Phone />} label="Phone" value={clientData.phone} name="phone" isEditMode={isEditMode} onChange={handleChange} />
                    <EditableInfoItem icon={<Building />} label="Address" value={clientData.address} name="address" isEditMode={isEditMode} onChange={handleChange} />
                    <EditableInfoItem icon={<Calendar />} label="Date of Birth" value={clientData.dob} name="dob" isEditMode={isEditMode} onChange={handleChange} type="date" />
                    <EditableInfoItem icon={<Briefcase />} label="Occupation" value={clientData.occupation} name="occupation" isEditMode={isEditMode} onChange={handleChange} />
                    <EditableInfoItem icon={<Home />} label="Employer" value={clientData.employer} name="employer" isEditMode={isEditMode} onChange={handleChange} />
                    <EditableInfoItem icon={<DollarSign />} label="Monthly Income" value={clientData.monthlyIncome} name="monthlyIncome" isEditMode={isEditMode} onChange={handleChange} type="number" />
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-lg font-semibold text-gray-300 flex items-center"><Shield className="mr-2" size={20} /> Policies</h3>
                        <button onClick={onAddPolicy} className="flex items-center px-3 py-1 text-sm rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-500"><Plus className="mr-1" size={16} /> Add Policy</button>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg max-h-48 overflow-y-auto">
                        {clientPolicies.length > 0 ? (
                            <ul className="space-y-2">
                                {clientPolicies.map((policy, index) => (
                                    <li key={policy.id || index} className="p-3 bg-gray-800 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700" onClick={() => onSelectPolicy(policy)}>
                                        <div className="flex items-center"><Shield size={16} className="mr-3 text-teal-400"/>
                                            <div>
                                                <p className="font-semibold">Policy #{policy.policyNumber}</p>
                                                <p className="text-xs text-gray-400">{policy.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-400">${Number(policy.premium || 0).toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">{policy.status}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-center text-gray-400 py-4">No policies found for this client.</p>)}
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    {isEditMode ? (
                        <button onClick={handleSave} className="flex items-center px-4 py-2 rounded-md font-semibold text-gray-900 bg-green-500 hover:bg-green-400"><Save size={18} className="mr-2"/>Save Changes</button>
                    ) : (
                        <button onClick={() => setIsEditMode(true)} className="flex items-center px-4 py-2 rounded-md font-semibold text-white bg-gray-600 hover:bg-gray-500"><Edit size={18} className="mr-2"/>Edit Client</button>
                    )}
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-amber-600 hover:bg-amber-500">Close</button>
                </div>
            </div>
        </div>
    );
};

const EditableInfoItem = ({ icon, label, value, name, isEditMode, onChange, type = "text" }) => (
    <div className="flex items-start pt-2">
        <div className="text-amber-400 mt-1 mr-3">{icon}</div>
        <div className="w-full">
            <p className="text-sm text-gray-400">{label}</p>
            {isEditMode ? (
                 <input type={type} name={name} value={value} onChange={onChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-1 focus:ring-amber-500 focus:border-amber-500 text-base font-semibold" />
            ) : (
                 <p className="font-semibold">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

const InputWithIcon = ({ icon, name, label, ...props }) => (
    <div>
        {label && <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
            <input name={name} id={name} {...props} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" />
        </div>
    </div>
);

export default ClientModal;