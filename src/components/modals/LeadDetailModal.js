import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, DollarSign, Info, Plus, Edit, Save, BarChart, Thermometer, Briefcase, Users, Building, Calendar } from 'lucide-react';
import { LEAD_STAGES, LEAD_TEMPERATURES } from '../../constants';

const LeadDetailModal = ({ isOpen, onClose, lead, onLogActivity, onConvertToClient, onUpdateLead }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedLead, setEditedLead] = useState({});

    useEffect(() => {
        if (lead) {
            setEditedLead({ ...lead });
        }
    }, [lead]);

    if (!isOpen || !lead) {
        return null;
    }

    const formatStatus = (status) => {
        if (!status) return 'N/A';
        return status.replace(/_/g, ' ').replace(/\w/g, l => l.toUpperCase());
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedLead(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onUpdateLead(editedLead);
        setIsEditing(false);
    };

    const renderViewMode = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <InfoItem icon={<User />} label="Status" value={formatStatus(lead.status)} />
                <InfoItem icon={<Phone />} label="Phone" value={lead.phone} />
                <InfoItem icon={<Mail />} label="Email" value={lead.email || 'N/A'} />
                <InfoItem icon={<DollarSign />} label="Estimated Value" value={lead.estimatedValue ? `$${Number(lead.estimatedValue).toLocaleString()}` : 'N/A'} />
                <InfoItem icon={<BarChart />} label="Stage" value={lead.stage || 'N/A'} />
                <InfoItem icon={<Thermometer />} label="Temperature" value={lead.temperature || 'N/A'} />
                <InfoItem icon={<DollarSign />} label="API Potential" value={lead.apiPotential ? `$${Number(lead.apiPotential).toLocaleString()}` : 'N/A'} />
                <InfoItem icon={<Briefcase />} label="Source" value={lead.source || 'N/A'} />
                <InfoItem icon={<Users />} label="Referrer" value={lead.referrer || 'N/A'} />
                <InfoItem icon={<Calendar />} label="Date of Birth" value={lead.dob || 'N/A'} />
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-300 mb-2 flex items-center"><Info className="mr-2" size={20}/> Notes</h3>
                <div className="bg-gray-700/50 p-4 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-gray-300 whitespace-pre-wrap">{lead.notes || 'No notes for this lead.'}</p>
                </div>
            </div>
        </>
    );

    const renderEditMode = () => (
        <div className="space-y-4 mb-6">
            <InputWithIcon icon={<User />} name="name" value={editedLead.name} onChange={handleChange} />
            <InputWithIcon icon={<Phone />} name="phone" value={editedLead.phone} onChange={handleChange} />
            <InputWithIcon icon={<Mail />} name="email" value={editedLead.email} onChange={handleChange} type="email" />
            <InputWithIcon icon={<Building />} name="company" value={editedLead.company} onChange={handleChange} />
            <InputWithIcon icon={<DollarSign />} name="estimatedValue" value={editedLead.estimatedValue} onChange={handleChange} type="number" />
            <InputWithIcon icon={<Calendar />} name="dob" value={editedLead.dob} onChange={handleChange} type="date" />
            <SelectInput icon={<BarChart />} name="stage" value={editedLead.stage} onChange={handleChange} options={Object.values(LEAD_STAGES)} />
            <SelectInput icon={<Thermometer />} name="temperature" value={editedLead.temperature} onChange={handleChange} options={Object.values(LEAD_TEMPERATURES)} />
            <InputWithIcon icon={<DollarSign />} name="apiPotential" value={editedLead.apiPotential} onChange={handleChange} type="number" />
            <InputWithIcon icon={<Briefcase />} name="source" value={editedLead.source} onChange={handleChange} />
            <InputWithIcon icon={<Users />} name="referrer" value={editedLead.referrer} onChange={handleChange} />
            <textarea name="notes" placeholder="Notes" value={editedLead.notes} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 h-24 resize-none focus:ring-amber-500 focus:border-amber-500"></textarea>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-amber-400">{lead.name}</h2>
                        <p className="text-gray-400">{lead.company || 'No company specified'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={28} /></button>
                </div>
                
                {isEditing ? renderEditMode() : renderViewMode()}

                <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-4">
                    {isEditing ? (
                        <button onClick={handleSave} className="flex items-center justify-center px-6 py-2 rounded-md font-semibold text-white bg-green-600 hover:bg-green-500">
                            <Save className="mr-2" size={20} /> Save Changes
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="flex items-center justify-center px-6 py-2 rounded-md font-semibold text-white bg-gray-600 hover:bg-gray-500">
                                <Edit className="mr-2" size={20} /> Edit
                            </button>
                            <button onClick={() => onLogActivity(lead)} className="flex items-center justify-center px-6 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-500">
                                <Plus className="mr-2" size={20} /> Log Activity
                            </button>
                            <button onClick={() => onConvertToClient(lead)} className="flex items-center justify-center px-6 py-2 rounded-md font-semibold text-gray-900 bg-green-500 hover:bg-green-400">
                                Convert to Client
                            </button>
                        </>
                    )}
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

const InputWithIcon = ({ icon, name, ...props }) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <input name={name} {...props} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500" />
    </div>
);

const SelectInput = ({ icon, name, value, onChange, options }) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <select 
            name={name} 
            value={value} 
            onChange={onChange}
            className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500 appearance-none"
        >
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
    </div>
);

export default LeadDetailModal;