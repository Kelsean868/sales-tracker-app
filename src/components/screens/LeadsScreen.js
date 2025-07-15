import React, { useState, useMemo, useRef, useCallback } from 'react';
import { List, Trello, User, Phone, Mail, DollarSign } from 'lucide-react';
import { LEAD_STAGES, LEAD_TEMPERATURES, LEAD_TEMPERATURE_COLORS } from '../../constants';
import Card from '../ui/Card';
import FilterSortPanel from '../ui/FilterSortPanel';

const LeadsScreen = ({ leads, fetchMoreData, loadingMore, onSelectLead, allUsers = [], currentUser, onUpdateLead }) => {
    const [view, setView] = useState(currentUser?.settings?.defaultLeadsView || 'pipeline');
    const [filter, setFilter] = useState({ stage: 'all', temperature: 'all' });
    const [sort, setSort] = useState({ field: 'createdAt', direction: 'desc' });

    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && fetchMoreData) {
                fetchMoreData();
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, fetchMoreData]);

    const managementRoles = ['super_admin', 'admin', 'branch_manager', 'unit_manager'];
    const isManagerView = currentUser && managementRoles.includes(currentUser.role);

    const filteredAndSortedLeads = useMemo(() => {
        let filtered = [...leads];

        if (filter.stage !== 'all') {
            filtered = filtered.filter(lead => lead.stage === filter.stage);
        }
        if (filter.temperature !== 'all') {
            filtered = filtered.filter(lead => lead.temperature === filter.temperature);
        }

        const sorted = filtered.sort((a, b) => {
            const fieldA = a[sort.field] || (sort.field === 'name' ? a.name.toLowerCase() : '');
            const fieldB = b[sort.field] || (sort.field === 'name' ? b.name.toLowerCase() : '');
            let comparison = 0;
            if (fieldA > fieldB) comparison = 1;
            else if (fieldA < fieldB) comparison = -1;
            return sort.direction === 'desc' ? comparison * -1 : comparison;
        });
        
        return sorted;
    }, [leads, filter, sort]);

    const getUserName = (userId) => {
        if (!userId || !allUsers.length) return 'Unknown Agent';
        const user = allUsers.find(u => u.id === userId);
        return user ? user.name : 'Unknown Agent';
    };

    const handleDragStart = (e, leadId) => {
        e.dataTransfer.setData("leadId", leadId);
    };
    
    const handleDrop = (e, newStage) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData("leadId");
        const leadToUpdate = leads.find(lead => lead.id === leadId);
        if (leadToUpdate && leadToUpdate.stage !== newStage) {
            onUpdateLead({ id: leadId, stage: newStage });
        }
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    
    const filterOptions = [
        { name: 'stage', label: 'Stage', options: Object.values(LEAD_STAGES) },
        { name: 'temperature', label: 'Temp', options: Object.values(LEAD_TEMPERATURES) }
    ];

    const sortOptions = [
        { value: 'createdAt', label: 'Date Created' }, { value: 'name', label: 'Name' }, { value: 'estimatedValue', label: 'Value' }
    ];

    const renderView = () => {
        if (leads.length === 0 && !loadingMore) {
            return <p className="text-center p-8">No leads found. Add one to get started!</p>;
        }

        if (view === 'pipeline') {
            return <PipelineView 
                        leads={leads} onSelectLead={onSelectLead} isManagerView={isManagerView} 
                        getUserName={getUserName} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} 
                        lastElementRef={lastElementRef}
                    />;
        }
        return <ListView 
                    leads={filteredAndSortedLeads} onSelectLead={onSelectLead} isManagerView={isManagerView} 
                    getUserName={getUserName} lastElementRef={lastElementRef} 
                />;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Leads</h1>
                <div className="flex items-center bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setView('pipeline')} className={`px-3 py-1 text-sm rounded-md ${view === 'pipeline' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}><Trello className="inline-block mr-1" size={16}/>Pipeline</button>
                    <button onClick={() => setView('list')} className={`px-3 py-1 text-sm rounded-md ${view === 'list' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}><List className="inline-block mr-1" size={16}/>List</button>
                </div>
            </div>
            {view === 'list' && <FilterSortPanel filterOptions={filterOptions} sortOptions={sortOptions} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />}
            {renderView()}
            {loadingMore && <p className="text-center py-4">Loading more leads...</p>}
        </div>
    );
};

const PipelineView = ({ leads, onSelectLead, isManagerView, getUserName, onDragStart, onDrop, onDragOver }) => {
    const leadsByStage = useMemo(() => {
        const grouped = {};
        Object.values(LEAD_STAGES).forEach(stage => {
            grouped[stage] = [];
        });
        leads.forEach(lead => {
            const stage = lead.stage || LEAD_STAGES.NEW;
            if (grouped[stage]) {
                grouped[stage].push(lead);
            }
        });
        return grouped;
    }, [leads]);

    return (
        <div className="flex space-x-4 overflow-x-auto pb-4">
            {Object.values(LEAD_STAGES).map(stage => (
                <div 
                    key={stage} 
                    className="w-72 bg-gray-800 rounded-lg p-3 flex-shrink-0" 
                    onDrop={(e) => onDrop(e, stage)} 
                    onDragOver={onDragOver}
                >
                    <h3 className="font-bold mb-3 text-amber-400">{stage} ({leadsByStage[stage].length})</h3>
                    <div className="space-y-3 min-h-[100px]">
                        {leadsByStage[stage].map(lead => (
                            <LeadCard 
                                key={lead.id} 
                                lead={lead} 
                                onClick={() => onSelectLead(lead)} 
                                userName={isManagerView ? getUserName(lead.userId) : null} 
                                draggable 
                                onDragStart={(e) => onDragStart(e, lead.id)} 
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ListView = ({ leads, onSelectLead, isManagerView, getUserName, lastElementRef }) => (
    <div className="space-y-3">
        {leads.map((lead, index) => {
            const isLastElement = index === leads.length - 1;
            return <div ref={isLastElement ? lastElementRef : null} key={lead.id}>
                      <LeadCard lead={lead} onClick={() => onSelectLead(lead)} userName={isManagerView ? getUserName(lead.userId) : null} />
                   </div>
        })}
    </div>
);

const LeadCard = React.forwardRef(({ lead, onClick, userName, ...props }, ref) => (
    <Card ref={ref} onClick={onClick} className="cursor-pointer hover:border-amber-500 transition-colors" {...props}>
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold">{lead.name}</p>
                <p className="text-sm text-gray-400">{lead.company || 'No company'}</p>
            </div>
            {lead.temperature && <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${LEAD_TEMPERATURE_COLORS[lead.temperature]}`}>{lead.temperature}</span>}
        </div>
        <div className="mt-3 text-sm text-gray-300 space-y-1">
            <p className="flex items-center"><Phone size={14} className="mr-2 text-gray-500"/>{lead.phone || 'No phone'}</p>
            <p className="flex items-center"><Mail size={14} className="mr-2 text-gray-500"/>{lead.email || 'No email'}</p>
            {lead.estimatedValue && <p className="flex items-center"><DollarSign size={14} className="mr-2 text-gray-500"/>${Number(lead.estimatedValue).toLocaleString()}</p>}
        </div>
        {userName && <div className="mt-3 pt-2 border-t border-gray-700/50"><p className="text-xs text-amber-400 flex items-center"><User size={14} className="mr-2"/>Assigned to: {userName}</p></div>}
    </Card>
));

export default LeadsScreen;
