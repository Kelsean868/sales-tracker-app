import React, { useState, useMemo } from 'react';
import { Search, User, Phone, Mail, Briefcase } from 'lucide-react';
import Card from '../ui/Card';

/**
 * PortfolioScreen component
 * Displays a searchable list of the user's clients.
 * @param {object} props - Component props
 * @param {Array} [props.clients=[]] - Array of user's clients
 * @returns {JSX.Element} The rendered portfolio screen
 */
const PortfolioScreen = ({ clients = [] }) => { // FIX: Added default empty array to prevent crash
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = useMemo(() => {
        if (!searchTerm) {
            return clients;
        }
        return clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Client Portfolio</h1>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border-gray-700 rounded-md p-2 pl-10 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>

            {/* Client List */}
            <div className="space-y-3">
                {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                        <ClientCard key={client.id} client={client} />
                    ))
                ) : (
                    <p className="text-center text-gray-500 pt-8">No clients found.</p>
                )}
            </div>
        </div>
    );
};

// Sub-component for displaying a single client
const ClientCard = ({ client }) => (
    <Card className="cursor-pointer hover:border-amber-500 transition-colors">
        <div className="flex justify-between items-start">
            <p className="font-bold text-lg">{client.name}</p>
            <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                Active Client
            </div>
        </div>
        <div className="mt-3 text-sm text-gray-300 space-y-1">
            <p className="flex items-center"><Phone size={14} className="mr-2 text-gray-500"/>{client.phone || 'No phone'}</p>
            <p className="flex items-center"><Mail size={14} className="mr-2 text-gray-500"/>{client.email || 'No email'}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-700">
             <p className="text-xs text-gray-400 flex items-center"><Briefcase size={14} className="mr-2"/>Policies: {client.policies?.length || 0}</p>
        </div>
    </Card>
);

export default PortfolioScreen;
