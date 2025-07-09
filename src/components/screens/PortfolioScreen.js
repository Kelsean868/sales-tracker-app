import React, { useState, useMemo } from 'react';
import { Search, User, Phone, Mail, Briefcase, Shield, DollarSign } from 'lucide-react';
import Card from '../ui/Card';
import FilterSortPanel from '../ui/FilterSortPanel';
import { POLICY_STATUSES } from '../../constants';

const PortfolioScreen = ({ clients = [], policies = [], onSelectClient, onSelectPolicy }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState({ itemType: 'All', policyStatus: 'all' });
    const [sort, setSort] = useState({ field: 'name', direction: 'asc' });

    const combinedItems = useMemo(() => {
        return [
            ...clients.map(c => ({ ...c, itemType: 'Client', sortName: c.name.toLowerCase() })),
            ...policies.map(p => ({ ...p, itemType: 'Policy', sortName: p.policyNumber, createdAt: p.inforcedDate }))
        ];
    }, [clients, policies]);

    const filteredAndSortedItems = useMemo(() => {
        let items = [...combinedItems];

        if (filter.itemType !== 'All') {
            items = items.filter(item => item.itemType === filter.itemType);
        }

        if (filter.policyStatus !== 'all') {
            items = items.filter(item => item.itemType !== 'Policy' || item.status === filter.policyStatus);
        }

        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            items = items.filter(item => {
                if (item.itemType === 'Client') {
                    return item.name.toLowerCase().includes(lowercasedSearchTerm);
                }
                if (item.itemType === 'Policy') {
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
        }
        
        items.sort((a, b) => {
            const fieldA = a[sort.field] || (sort.field === 'name' ? a.sortName : '');
            const fieldB = b[sort.field] || (sort.field === 'name' ? b.sortName : '');

            let comparison = 0;
            if (fieldA > fieldB) comparison = 1;
            else if (fieldA < fieldB) comparison = -1;
            
            return sort.direction === 'desc' ? comparison * -1 : comparison;
        });

        return items;
    }, [combinedItems, searchTerm, filter, sort]);
    
    const filterOptions = [
        { name: 'itemType', label: 'Type', options: ['Clients', 'Policies'] },
        { name: 'policyStatus', label: 'Policy Status', options: Object.values(POLICY_STATUSES) }
    ];

    const sortOptions = [
        { value: 'name', label: 'Name / Number' },
        { value: 'createdAt', label: 'Date Created' },
    ];

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Portfolio</h1>

            <FilterSortPanel 
                filterOptions={filterOptions}
                sortOptions={sortOptions}
                filter={filter}
                setFilter={setFilter}
                sort={sort}
                setSort={setSort}
            />

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search portfolio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>

            <div className="space-y-3">
                {filteredAndSortedItems.length > 0 ? (
                    filteredAndSortedItems.map(item =>
                        item.itemType === 'Client' ? 
                        <ClientCard key={`client-${item.id}`} client={item} onClick={() => onSelectClient(item)} /> :
                        <PolicyCard key={`policy-${item.id}`} policy={item} onClick={() => onSelectPolicy(item)} />
                    )
                ) : (
                    <p className="text-center text-gray-500 pt-8">No items found.</p>
                )}
            </div>
        </div>
    );
};

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