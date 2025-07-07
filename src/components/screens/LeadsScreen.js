import React, { useState, useMemo } from 'react';
import { List, Trello, User, Phone, Mail, DollarSign } from 'lucide-react';
import { LEAD_STAGES, LEAD_TEMPERATURE_COLORS } from '../../constants';
import Card from '../ui/Card';

/**
 * LeadsScreen component
 * Displays and manages leads. Now supports a manager view.
 * @param {object} props - Component props
 * @param {Array} [props.leads=[]] - Array of leads to display
 * @param {function} props.onSelectLead - Function to call when a lead is selected
 * @param {Array} [props.allUsers=[]] - Array of all users (for manager view)
 * @param {object} props.currentUser - The currently logged-in user object
 * @returns {JSX.Element} The rendered leads screen
 */
const LeadsScreen = ({ leads = [], onSelectLead, allUsers = [], currentUser }) => {
    const [view, setView] = useState('pipeline');
    const [activeFilter, setActiveFilter] = useState('ALL');

    const managementRoles = ['super_admin', 'admin', 'branch_manager', 'unit_manager'];
    const isManagerView = currentUser && managementRoles.includes(currentUser.role);

    const filteredLeads = useMemo(() => {
        if (activeFilter === 'ALL') {
            return leads;
        }
        return leads.filter(lead => 
            lead.status && lead.status.toLowerCase() === activeFilter.toLowerCase()
        );
    }, [leads, activeFilter]);

    // Helper function to find a user's name by their ID
    const getUserName = (userId) => {
        if (!userId || !allUsers.length) return 'Unknown Agent';
        const user = allUsers.find(u => u.id === userId);
        return user ? user.name : 'Unknown Agent';
    };

    const renderView = () => {
        if (view === 'pipeline') {
            return <PipelineView leads={filteredLeads} onSelectLead={onSelectLead} isManagerView={isManagerView} getUserName={getUserName} />;
        }
        return <ListView leads={filteredLeads} onSelectLead={onSelectLead} isManagerView={isManagerView} getUserName={getUserName} />;
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

            <div className="flex space-x-2 overflow-x-auto pb-2">
                <FilterButton status="ALL" activeFilter={activeFilter} setActiveFilter={setActiveFilter}>All</FilterButton>
                {Object.values(LEAD_STAGES).map(stage => (
                    <FilterButton key={stage} status={stage} activeFilter={activeFilter} setActiveFilter={setActiveFilter}>{stage}</FilterButton>
                ))}
            </div>

            {renderView()}
        </div>
    );
};

const FilterButton = ({ status, activeFilter, setActiveFilter, children }) => (
    <button
        onClick={() => setActiveFilter(status)}
        className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ${activeFilter.toLowerCase() === status.toLowerCase() ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
    >
        {children}
    </button>
);

const PipelineView = ({ leads, onSelectLead, isManagerView, getUserName }) => (
    <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.values(LEAD_STAGES).map(stage => (
            <div key={stage} className="w-72 bg-gray-800 rounded-lg p-3 flex-shrink-0">
                <h3 className="font-bold mb-3 text-amber-400">{stage}</h3>
                <div className="space-y-3">
                    {leads.filter(lead => lead.status && lead.status.toLowerCase() === stage.toLowerCase()).map(lead => (
                        <LeadCard 
                            key={lead.id} 
                            lead={lead} 
                            onClick={() => onSelectLead(lead)}
                            userName={isManagerView ? getUserName(lead.userId) : null}
                        />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const ListView = ({ leads, onSelectLead, isManagerView, getUserName }) => (
    <div className="space-y-3">
        {leads.map(lead => (
            <LeadCard 
                key={lead.id} 
                lead={lead} 
                onClick={() => onSelectLead(lead)}
                userName={isManagerView ? getUserName(lead.userId) : null}
            />
        ))}
    </div>
);

// LeadCard now accepts and displays the agent's name
const LeadCard = ({ lead, onClick, userName }) => (
    <Card onClick={onClick} className="cursor-pointer hover:border-amber-500 transition-colors">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold">{lead.name}</p>
                <p className="text-sm text-gray-400">{lead.company || 'No company'}</p>
            </div>
            {lead.temperature && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${LEAD_TEMPERATURE_COLORS[lead.temperature]}`}>
                    {lead.temperature}
                </span>
            )}
        </div>
        <div className="mt-3 text-sm text-gray-300 space-y-1">
            <p className="flex items-center"><Phone size={14} className="mr-2 text-gray-500"/>{lead.phone || 'No phone'}</p>
            <p className="flex items-center"><Mail size={14} className="mr-2 text-gray-500"/>{lead.email || 'No email'}</p>
            {lead.estimatedValue && <p className="flex items-center"><DollarSign size={14} className="mr-2 text-gray-500"/>${Number(lead.estimatedValue).toLocaleString()}</p>}
        </div>
        {/* Conditionally render the assigned agent's name */}
        {userName && 
            <div className="mt-3 pt-2 border-t border-gray-700/50">
                <p className="text-xs text-amber-400 flex items-center"><User size={14} className="mr-2"/>Assigned to: {userName}</p>
            </div>
        }
    </Card>
);

export default LeadsScreen;
