import React, { useState, useMemo } from 'react';
import { Download, Filter } from 'lucide-react';
import { POLICY_STATUS_COLORS } from '../../constants';
import Card from '../ui/Card';

const PortfolioScreen = ({ clients, policies, onEditClient, onAddPolicy, onEditPolicy }) => {
    // const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    // const [queryState, setQueryState] = useState({ filters: [], sorts: [] });

    const combinedData = useMemo(() => {
        const clientData = clients.map(c => ({ ...c, type: 'client', sortKey: c.fullName }));
        const policyData = policies.map(p => ({ ...p, type: 'policy', sortKey: p.id }));
        return [...clientData, ...policyData].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [clients, policies]);

    // Placeholder for filtering and sorting logic
    const filteredAndSortedData = combinedData;

    // const handleExport = () => {
    //     // Export logic would go here
    // };

    return (
        <div className="p-4 pt-20 pb-24">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white">Portfolio</h1>
                 <div className="flex items-center gap-2">
                    {/* <button onClick={handleExport} className="p-2 rounded-md bg-green-600 hover:bg-green-700 text-white"><Download className="w-5 h-5" /></button>
                    <button onClick={() => setIsFilterPanelOpen(true)} className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"><Filter className="w-5 h-5" /></button> */}
                </div>
            </div>
            
            <div className="space-y-3">
                {filteredAndSortedData.length > 0 ? filteredAndSortedData.map(result => {
                    if (result.type === 'client') {
                        const client = result;
                        return (
                            <Card key={`client-${client.id}`} onClick={() => onEditClient(client)}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white text-lg">{client.fullName}</p>
                                        <p className="text-sm text-gray-400">{client.email}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={(e) => { e.stopPropagation(); onAddPolicy(client); }} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md text-sm">Add Policy</button>
                                    </div>
                                </div>
                            </Card>
                        )
                    }
                    if (result.type === 'policy') {
                        const policy = result;
                        const owner = clients.find(c => c.id === policy.ownerId);
                        return (
                             <Card key={`policy-${policy.id}`} onClick={() => onEditPolicy(policy)}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white text-lg">Policy #{policy.id}</p>
                                        <p className="text-sm text-gray-400">Owner: {owner?.fullName || 'N/A'}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${POLICY_STATUS_COLORS[policy.status]}`}>{policy.status}</span>
                                </div>
                            </Card>
                        )
                    }
                    return null;
                }) : (
                     <Card><p className="text-center text-gray-400">No clients or policies found.</p></Card>
                )}
            </div>
            {/* <FilterSortPanel isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)} onApply={setQueryState} config={filterConfig} initialState={queryState} /> */}
        </div>
    );
};

export default PortfolioScreen;
