import React, { useState, useMemo } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { LayoutGrid, List, Filter, Download, History } from 'lucide-react';
import { LEAD_STAGES, LEAD_TEMPERATURE_COLORS } from '../../constants';
import Card from '../ui/Card';
// We will create FilterSortPanel later
// import FilterSortPanel from '../ui/FilterSortPanel'; 

const LeadsScreen = ({ leads, userId, onSelectLead, onConvertToClient, onLoseLead, appId }) => {
    const [view, setView] = useState('pipeline'); // 'pipeline' or 'list'
    // const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    // const [queryState, setQueryState] = useState({ filters: [], sorts: [] });
    const db = getFirestore();

    const filteredAndSortedLeads = useMemo(() => {
        // Placeholder for filter/sort logic
        return leads;
    }, [leads]);

    const handleDragStart = (e, leadId) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', leadId);
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = async (e, newStage) => {
        e.preventDefault();
        const draggedLeadId = e.dataTransfer.getData('text/plain');
        if (!draggedLeadId) return;
        
        const lead = leads.find(l => l.id === draggedLeadId);
        if (lead.stage === newStage) return;

        if (newStage === 'Closed') {
            onConvertToClient(draggedLeadId);
        } else if (newStage === 'Lost') {
            onLoseLead(draggedLeadId);
        } else {
            const leadDocRef = doc(db, `users/${userId}/leads`, draggedLeadId);
            try {
                await updateDoc(leadDocRef, { stage: newStage });
            } catch (error) { console.error("Error updating lead stage:", error); }
        }
    };
    
    // const handleExport = () => {
    //     const headers = {
    //         name: "Name",
    //         'contactInfo.phone': "Phone",
    //         'contactInfo.email': "Email",
    //         stage: "Stage",
    //         temperature: "Temperature",
    //         apiPotential: "API Potential",
    //         source: "Source",
    //     };
    //     // A utility function for CSV export would be needed here
    //     // exportToCSV(filteredAndSortedLeads, headers, 'leads_export');
    // };

    const PipelineView = () => (
        <div className="flex overflow-x-auto space-x-4 pb-4">
            {[...LEAD_STAGES, 'Lost'].map(stage => (
                <div key={stage} className={`bg-gray-900/50 rounded-lg p-3 w-72 flex-shrink-0 ${stage === 'Lost' ? 'bg-red-900/30' : ''}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage)}>
                    <h2 className="font-bold text-white mb-3 text-center">{stage} ({filteredAndSortedLeads.filter(lead => lead.stage === stage).length})</h2>
                    <div className="space-y-3 min-h-[200px]">
                        {filteredAndSortedLeads.filter(lead => lead.stage === stage).map(lead => (
                            <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)} onClick={() => onSelectLead(lead.id)} className="bg-gray-800 p-3 rounded-lg shadow-md cursor-pointer hover:bg-gray-700">
                                <p className="font-bold text-white">{lead.name}</p>
                                <p className="text-sm text-gray-400">${lead.apiPotential?.toLocaleString() || '0'} API</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${LEAD_TEMPERATURE_COLORS[lead.temperature]}`}>{lead.temperature}</span>
                                    {lead.tags && lead.tags.length > 0 && (
                                        <span className="text-xs text-gray-400 flex items-center" title={lead.tags.join(', ')}>
                                            <History className="w-3 h-3 mr-1" /> {lead.tags.length}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const ListView = () => (
        <div className="space-y-3">
            {filteredAndSortedLeads.map(lead => (
                <Card key={lead.id} onClick={() => onSelectLead(lead.id)}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <p className="font-bold text-white text-lg md:col-span-1">{lead.name}</p>
                        <p className="text-sm text-gray-300 md:col-span-1">{lead.stage}</p>
                        <div className="md:col-span-1 flex items-center gap-2">
                             <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${LEAD_TEMPERATURE_COLORS[lead.temperature]}`}>{lead.temperature}</span>
                        </div>
                        <p className="text-sm text-amber-400 font-semibold md:col-span-1 text-right">${lead.apiPotential?.toLocaleString() || '0'} API</p>
                    </div>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="p-4 pt-20 pb-24">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white">Lead Pipeline</h1>
                <div className="flex items-center gap-2">
                    {/* <button onClick={handleExport} className="p-2 rounded-md bg-green-600 hover:bg-green-700 text-white"><Download className="w-5 h-5" /></button>
                    <button onClick={() => setIsFilterPanelOpen(true)} className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"><Filter className="w-5 h-5" /></button> */}
                    <button onClick={() => setView('pipeline')} className={`p-2 rounded-md ${view === 'pipeline' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}><LayoutGrid className="w-5 h-5" /></button>
                    <button onClick={() => setView('list')} className={`p-2 rounded-md ${view === 'list' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}><List className="w-5 h-5" /></button>
                </div>
            </div>
            {view === 'pipeline' ? <PipelineView /> : <ListView />}
            {/* <FilterSortPanel isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)} onApply={setQueryState} config={filterConfig} initialState={queryState} /> */}
        </div>
    );
};

export default LeadsScreen;

