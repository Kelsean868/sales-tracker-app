import React, { useState, useMemo } from 'react';
import { Search, User, Phone, Mail, Briefcase, Shield, DollarSign } from 'lucide-react';
import Card from '../ui/Card';

const PortfolioScreen = ({ clients = [], policies = [], onSelectClient, onSelectPolicy }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredItems = useMemo(() => {
        let items = [];
        if (activeFilter === 'All') {
            items = [
                ...clients.map(c => ({ ...c, itemType: 'client' })),
                ...policies.map(p => ({ ...p, itemType: 'policy' }))
            ];
        } else if (activeFilter === 'Clients') {
            items = clients.map(c => ({ ...c, itemType: 'client' }));
        } else if (activeFilter === 'Policies') {
            items = policies.map(p => ({ ...p, itemType: 'policy' }));
        }

        if (!searchTerm) {
            return items;
        }

        return items.filter(item => {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            if (item.itemType === 'client') {
                return item.name.toLowerCase().includes(lowercasedSearchTerm);
            }
            if (item.itemType === 'policy') {
                const ownerName = item.owner?.name?.toLowerCase() || '';
                const insuredName = item.insured?.name?.toLowerCase() || '';
                const payorName = item.payor?.name?.toLowerCase() || '';
                const beneficiaryName = typeof item.beneficiary === 'string' ? item.beneficiary.toLowerCase() : item.beneficiary?.name?.toLowerCase() || '';

                return item.policyNumber.toLowerCase().includes(lowercasedSearchTerm) ||
                       ownerName.includes(lowercasedSearchTerm) ||
                       insuredName.includes(lowercasedSearchTerm) ||
                       payorName.includes(lowercasedSearchTerm) ||
                       beneficiaryName.includes(lowercasedSearchTerm);
            }
            return false;
        });
    }, [clients, policies, searchTerm, activeFilter]);

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Portfolio</h1>

            <div className="flex space-x-2">
                <FilterButton
                    label="All"
                    isActive={activeFilter === 'All'}
                    onClick={() => setActiveFilter('All')}
                />
                <FilterButton
                    label="Clients"
                    isActive={activeFilter === 'Clients'}
                    onClick={() => setActiveFilter('Clients')}
                />
                <FilterButton
                    label="Policies"
                    isActive={activeFilter === 'Policies'}
                    onClick={() => setActiveFilter('Policies')}
                />
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder={`Search ${activeFilter.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>

            <div className="space-y-3">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item =>
                        item.itemType === 'client' ? 
                        <ClientCard key={`client-${item.id}`} client={item} onClick={() => onSelectClient(item)} /> :
                        <PolicyCard key={`policy-${item.id}`} policy={item} onClick={() => onSelectPolicy(item)} />
                    )
                ) : (
                    <p className="text-center text-gray-500 pt-8">No {activeFilter.toLowerCase()} found.</p>
                )}
            </div>
        </div>
    );
};

const FilterButton = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            isActive 
                ? 'bg-amber-500 text-gray-900' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
    >
        {label}
    </button>
);

const ClientCard = ({ client, onClick }) => (
    <Card onClick={onClick} className="cursor-pointer hover:border-amber-500 transition-colors">
        <div className="flex justify-between items-start">
            <p className="font-bold text-lg flex items-center"><User size={18} className="mr-2 text-amber-400"/>{client.name}</p>
            <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                Client
            </div>
        </div>
        <div className="mt-3 text-sm text-gray-300 space-y-1 pl-7">
            <p className="flex items-center"><Phone size={14} className="mr-2 text-gray-500"/>{client.phone || 'No phone'}</p>
            <p className="flex items-center"><Mail size={14} className="mr-2 text-gray-500"/>{client.email || 'No email'}</p>
        </div>
    </Card>
);

const PolicyCard = ({ policy, onClick }) => (
     <Card onClick={onClick} className="cursor-pointer hover:border-teal-500 transition-colors">
        <div className="flex justify-between items-start">
            <p className="font-bold text-lg flex items-center"><Shield size={18} className="mr-2 text-teal-400"/>Policy #{policy.policyNumber}</p>
            <div className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                {policy.status}
            </div>
        </div>
        <div className="mt-3 text-sm text-gray-300 space-y-1 pl-7">
            <p className="flex items-center font-semibold"><User size={14} className="mr-2 text-gray-500"/>Owner: {policy.owner?.name || 'N/A'}</p>
            <p className="flex items-center"><Briefcase size={14} className="mr-2 text-gray-500"/>Type: {policy.type || 'N/A'}</p>
            <p className="flex items-center"><DollarSign size={14} className="mr-2 text-gray-500"/>Premium: ${Number(policy.premium || 0).toLocaleString()}</p>
        </div>
    </Card>
);

export default PortfolioScreen;
