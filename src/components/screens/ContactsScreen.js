import React, { useMemo } from 'react';
import { Phone, Mail, Building, UserPlus } from 'lucide-react';
import Card from '../ui/Card';

const ContactsScreen = ({ contacts }) => {
    // Memoize the sorted contacts to prevent re-sorting on every render
    const sortedContacts = useMemo(() => {
        if (!contacts) return [];
        // Create a copy before sorting to avoid mutating the original prop array
        return [...contacts].sort((a, b) => {
            // CORRECTED: Add a fallback for contacts that might not have a name
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
    }, [contacts]);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Contacts</h1>
                <button className="bg-amber-500 text-white p-2 rounded-full shadow-lg hover:bg-amber-600 transition-colors">
                    <UserPlus size={24} />
                </button>
            </div>

            {sortedContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedContacts.map(contact => (
                        <Card key={contact.id}>
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-amber-400">{contact.name || 'No Name'}</h3>
                                {contact.company && (
                                    <div className="flex items-center mt-2 text-gray-400">
                                        <Building size={16} className="mr-2" />
                                        <span>{contact.company}</span>
                                    </div>
                                )}
                                {contact.phone && (
                                    <div className="flex items-center mt-2 text-gray-400">
                                        <Phone size={16} className="mr-2" />
                                        <a href={`tel:${contact.phone}`} className="hover:text-amber-400">{contact.phone}</a>
                                    </div>
                                )}
                                {contact.email && (
                                    <div className="flex items-center mt-2 text-gray-400">
                                        <Mail size={16} className="mr-2" />
                                        <a href={`mailto:${contact.email}`} className="hover:text-amber-400">{contact.email}</a>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-400">You have no contacts yet.</p>
                </div>
            )}
        </div>
    );
};

export default ContactsScreen;
