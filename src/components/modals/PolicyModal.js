import React, { useState, useEffect } from 'react';
import { X, Shield, Calendar, DollarSign, Hash } from 'lucide-react';
import RoleSelector from './RoleSelector';

const PolicyModal = ({ isOpen, onClose, onAddPolicy, policy, client, clientId, contacts, onAddNewPerson, ageCalculationType = 'ageNextBirthday' }) => {
    const isEditMode = Boolean(policy && policy.id);

    const [policyData, setPolicyData] = useState({
        policyNumber: '',
        type: '',
        premium: '',
        premiumFrequency: 'monthly',
        inforcedDate: '',
        maturityDate: '',
        status: 'active',
        beneficiary: 'Estate',
        ageAtIssue: null,
    });

    const [roles, setRoles] = useState({
        owner: null,
        insured: null,
        payor: null,
    });

    useEffect(() => {
        if (isOpen) {
            const formatDateForInput = (dateString) => {
                if (!dateString) return '';
                try {
                    return new Date(dateString).toISOString().slice(0, 10);
                } catch (e) { return ''; }
            };

            const personInfo = client ? { name: client.name, id: client.id, dob: client.dob } : null;

            if (isEditMode) {
                setPolicyData({
                    policyNumber: policy.policyNumber || '',
                    type: policy.type || '',
                    premium: policy.premium || '',
                    premiumFrequency: policy.premiumFrequency || 'monthly',
                    inforcedDate: formatDateForInput(policy.inforcedDate),
                    maturityDate: formatDateForInput(policy.maturityDate),
                    status: policy.status || 'active',
                    beneficiary: policy.beneficiary || 'Estate',
                    ageAtIssue: policy.ageAtIssue || null,
                });
                setRoles({
                    owner: policy.owner || personInfo,
                    insured: policy.insured || personInfo,
                    payor: policy.payor || personInfo,
                });
            } else {
                setPolicyData({ 
                    policyNumber: '', type: '', premium: '', 
                    premiumFrequency: 'monthly', inforcedDate: '', 
                    maturityDate: '', status: 'active',
                    beneficiary: 'Estate',
                    ageAtIssue: null,
                });
                setRoles({
                    owner: personInfo,
                    insured: personInfo,
                    payor: personInfo,
                });
            }
        }
    }, [isOpen, policy, isEditMode, client]);

    useEffect(() => {
        if (roles.insured?.dob) {
            const birthDate = new Date(roles.insured.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            const finalAge = ageCalculationType === 'ageNextBirthday' ? age + 1 : age;
            setPolicyData(prev => ({...prev, ageAtIssue: finalAge}));
        } else {
            setPolicyData(prev => ({...prev, ageAtIssue: null}));
        }
    }, [roles.insured, ageCalculationType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPolicyData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleSelect = (role, person) => {
        setRoles(prev => ({ ...prev, [role]: person }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalPolicyData = {
            ...policyData,
            ...roles,
            clientId: clientId,
            clientName: client.name,
            inforcedDate: policyData.inforcedDate ? new Date(policyData.inforcedDate).toISOString() : null,
            maturityDate: policyData.maturityDate ? new Date(policyData.maturityDate).toISOString() : null,
        };
        if (isEditMode) {
            finalPolicyData.id = policy.id;
        }
        onAddPolicy(finalPolicyData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-800 py-4 z-10">
                    <h2 className="text-2xl font-bold text-amber-400">
                        {isEditMode ? `Edit Policy #${policy.policyNumber}` : 'Add New Policy'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <InputWithIcon icon={<Hash />} name="policyNumber" placeholder="Policy Number" value={policyData.policyNumber} onChange={handleChange} required />
                        <InputWithIcon icon={<Shield />} name="type" placeholder="Policy Type (e.g., Life, Health)" value={policyData.type} onChange={handleChange} required />
                        <InputWithIcon icon={<DollarSign />} name="premium" placeholder="Premium Amount" value={policyData.premium} onChange={handleChange} type="number" required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <SelectInput label="Premium Frequency" name="premiumFrequency" value={policyData.premiumFrequency} onChange={handleChange} options={['monthly', 'quarterly', 'semi-annually', 'annually']} />
                            <SelectInput label="Status" name="status" value={policyData.status} onChange={handleChange} options={['active', 'lapsed', 'cancelled', 'pending']} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputWithIcon icon={<Calendar />} name="inforcedDate" label="Inforced Date" value={policyData.inforcedDate} onChange={handleChange} type="date" required />
                            <InputWithIcon icon={<Calendar />} name="maturityDate" label="Maturity Date" value={policyData.maturityDate} onChange={handleChange} type="date" />
                        </div>
                        
                        {policyData.ageAtIssue !== null && (
                            <div className="p-3 bg-gray-700/50 rounded-md text-center">
                                <p className="text-gray-300">
                                    {ageCalculationType === 'ageNextBirthday' ? "Age Next Birthday" : "Current Age"} at Issue: 
                                    <span className="font-bold text-amber-400"> {policyData.ageAtIssue}</span>
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-300 mb-3">Policy Roles</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <RoleSelector label="Owner" value={roles.owner} onSelect={(p) => handleRoleSelect('owner', p)} contacts={contacts} onAddNew={() => onAddNewPerson('owner')} />
                               <RoleSelector label="Insured" value={roles.insured} onSelect={(p) => handleRoleSelect('insured', p)} contacts={contacts} onAddNew={() => onAddNewPerson('insured')} />
                               <RoleSelector label="Payor" value={roles.payor} onSelect={(p) => handleRoleSelect('payor', p)} contacts={contacts} onAddNew={() => onAddNewPerson('payor')} />
                               <RoleSelector label="Beneficiary" value={policyData.beneficiary} onSelect={(p) => handleRoleSelect('beneficiary', p)} contacts={contacts} onAddNew={() => onAddNewPerson('beneficiary')} isBeneficiary={true} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">
                            {isEditMode ? 'Save Changes' : 'Add Policy'}
                        </button>
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

const SelectInput = ({ label, name, value, onChange, options }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <select id={name} name={name} value={value} onChange={onChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500 capitalize">
            {options.map(opt => <option key={opt} value={opt}>{opt.replace(/ /g, '-')}</option>)}
        </select>
    </div>
);

export default PolicyModal;
