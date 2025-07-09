import React, { useState, useMemo } from 'react';
import { Phone, Mail, Building, UserPlus, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import FilterSortPanel from '../ui/FilterSortPanel';

const ContactsScreen = ({ contacts }) => {
    const [sort, setSort] = useState({ field: 'name', direction: 'asc' });

    const sortedContacts = useMemo(() => {
        if (!contacts) return [];
        
        return [...contacts].sort((a, b) => {
            const fieldA = a[sort.field] || '';
            const fieldB = b[sort.field] || '';
            
            let comparison = 0;
            if (fieldA > fieldB) {
                comparison = 1;
            } else if (fieldA < fieldB) {
                comparison = -1;
            }

            return sort.direction === 'desc' ? comparison * -1 : comparison;
        });
    }, [contacts, sort]);

    const sortOptions = [
        { value: 'name', label: 'Name' },
        { value: 'createdAt', label: 'Date Created' },
    ];

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Contacts</h1>
                <button className="bg-amber-500 text-white p-2 rounded-full shadow-lg hover:bg-amber-600 transition-colors">
                    <UserPlus size={24} />
                </button>
            </div>
            
            <FilterSortPanel 
                filterOptions={[]}
                sortOptions={sortOptions}
                filter={{}}
                setFilter={() => {}}
                sort={sort}
                setSort={setSort}
            />

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
                                {contact.dob && (
                                     <div className="flex items-center mt-2 text-gray-400">
                                        <Calendar size={16} className="mr-2" />
                                        <span>{new Date(contact.dob).toLocaleDateString()}</span>
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