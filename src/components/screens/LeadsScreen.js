import React, { useState, useMemo } from 'react';
import { List, Trello, Phone, Mail, DollarSign } from 'lucide-react';
import { LEAD_STAGES, LEAD_TEMPERATURE_COLORS } from '../../constants';
import Card from '../ui/Card';

/**
 * LeadsScreen component
 * Displays and manages user leads in either a pipeline or list view.
 * @param {object} props - Component props
 * @param {Array} [props.leads=[]] - Array of user leads
 * @param {function} props.onSelectLead - Function to call when a lead is selected
 * @returns {JSX.Element} The rendered leads screen
 */
const LeadsScreen = ({ leads = [], onSelectLead }) => {
    const [view, setView] = useState('pipeline'); // 'pipeline' or 'list'
    const [activeFilter, setActiveFilter] = useState('ALL'); 

    // Memoize the filtered leads to prevent unnecessary recalculations
    const filteredLeads = useMemo(() => {
        if (activeFilter === 'ALL') {
            return leads;
        }
        // FIX: Use a case-insensitive comparison for robust filtering.
        return leads.filter(lead => 
            lead.status && lead.status.toLowerCase() === activeFilter.toLowerCase()
        );
    }, [leads, activeFilter]);

    const renderView = () => {
        if (view === 'pipeline') {
            return <PipelineView leads={filteredLeads} onSelectLead={onSelectLead} />;
        }
        return <ListView leads={filteredLeads} onSelectLead={onSelectLead} />;
    };

    return (
        <div className="space-y-4">
            {/* Header with View Toggler */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Leads</h1>
                <div className="flex items-center bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setView('pipeline')} className={`px-3 py-1 text-sm rounded-md ${view === 'pipeline' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}><Trello className="inline-block mr-1" size={16}/>Pipeline</button>
                    <button onClick={() => setView('list')} className={`px-3 py-1 text-sm rounded-md ${view === 'list' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}><List className="inline-block mr-1" size={16}/>List</button>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
                <FilterButton status="ALL" activeFilter={activeFilter} setActiveFilter={setActiveFilter}>All</FilterButton>
                {Object.values(LEAD_STAGES).map(stage => (
                    <FilterButton key={stage} status={stage} activeFilter={activeFilter} setActiveFilter={setActiveFilter}>{stage}</FilterButton>
                ))}
            </div>

            {/* Content Area */}
            {renderView()}
        </div>
    );
};

// Sub-component for filter buttons
const FilterButton = ({ status, activeFilter, setActiveFilter, children }) => (
    <button
        onClick={() => setActiveFilter(status)}
        className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ${activeFilter.toLowerCase() === status.toLowerCase() ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
    >
        {children}
    </button>
);

// Sub-component for the Pipeline View
const PipelineView = ({ leads, onSelectLead }) => (
    <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.values(LEAD_STAGES).map(stage => (
            <div key={stage} className="w-72 bg-gray-800 rounded-lg p-3 flex-shrink-0">
                <h3 className="font-bold mb-3 text-amber-400">{stage}</h3>
                <div className="space-y-3">
                    {/* FIX: Use a case-insensitive comparison to correctly place leads in columns. */}
                    {leads.filter(lead => lead.status && lead.status.toLowerCase() === stage.toLowerCase()).map(lead => (
                        <LeadCard key={lead.id} lead={lead} onClick={() => onSelectLead(lead)} />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

// Sub-component for the List View
const ListView = ({ leads, onSelectLead }) => (
    <div className="space-y-3">
        {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onSelectLead(lead)} />
        ))}
    </div>
);

// Reusable card for displaying a single lead
const LeadCard = ({ lead, onClick }) => (
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
            <p className="flex items-center"><Phone size={14} className="mr-2 text-gray-500"/>{lead.phone}</p>
            <p className="flex items-center"><Mail size={14} className="mr-2 text-gray-500"/>{lead.email || 'No email'}</p>
            {lead.estimatedValue && <p className="flex items-center"><DollarSign size={14} className="mr-2 text-gray-500"/>${Number(lead.estimatedValue).toLocaleString()}</p>}
        </div>
    </Card>
);

export default LeadsScreen;
