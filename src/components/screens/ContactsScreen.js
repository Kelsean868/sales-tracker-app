import React, { useState, useMemo } from 'react';
import { Download, Filter, UserPlus } from 'lucide-react';
import { CONTACT_CATEGORIES } from '../../constants';
import Card from '../ui/Card';

const ContactsScreen = ({ contacts, onAddContact, onEditContact }) => {
    // const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    // const [queryState, setQueryState] = useState({ filters: [], sorts: [] });

    const filteredAndSortedContacts = useMemo(() => {
        // Placeholder for filter/sort logic
        return contacts.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [contacts]);

    // const handleExport = () => {
    //     const headers = {
    //         fullName: "Full Name",
    //         email: "Email",
    //         contactNumber: "Phone",
    //         category: "Category",
    //         notes: "Notes"
    //     };
    //     // exportToCSV(filteredAndSortedContacts, headers, 'contacts_export');
    // };

    return (
        <div className="p-4 pt-20 pb-24">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white">Contacts</h1>
                <div className="flex items-center gap-2">
                    {/* <button onClick={handleExport} className="p-2 rounded-md bg-green-600 hover:bg-green-700 text-white"><Download className="w-5 h-5" /></button>
                    <button onClick={() => setIsFilterPanelOpen(true)} className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"><Filter className="w-5 h-5" /></button> */}
                    <button onClick={onAddContact} className="bg-amber-500 hover:bg-amber-600 text-white font-bold p-2 rounded-md flex items-center">
                        <UserPlus className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            
            <div className="space-y-3">
                {filteredAndSortedContacts.map(contact => (
                    <Card key={contact.id} onClick={() => onEditContact(contact)}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white text-lg">{contact.fullName}</p>
                                <p className="text-sm text-gray-400">{contact.email || 'No email'}</p>
                            </div>
                             <p className="text-sm text-gray-300">{contact.category}</p>
                        </div>
                    </Card>
                ))}
            </div>
            {/* <FilterSortPanel isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)} onApply={setQueryState} config={filterConfig} initialState={queryState} /> */}
        </div>
    );
};

export default ContactsScreen;
