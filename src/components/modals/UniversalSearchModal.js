import React, { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Search, X, Loader, User, Briefcase, Shield, Clock } from 'lucide-react';

// A simple debounce hook to prevent calling the function on every keystroke
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const UniversalSearchModal = ({ isOpen, onClose, onSelectLead, onSelectClient, onSelectPolicy }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState({ leads: [], clients: [], policies: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('leads');
    const [recentSearches, setRecentSearches] = useState([]);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Load recent searches from localStorage when the modal opens
    useEffect(() => {
        if (isOpen) {
            const storedSearches = localStorage.getItem('recentSearches');
            if (storedSearches) {
                setRecentSearches(JSON.parse(storedSearches));
            }
        }
    }, [isOpen]);

    // Stable function to add a new search term using the callback form of setState
    const addRecentSearch = useCallback((term) => {
        setRecentSearches(prevSearches => {
            const updatedSearches = [term, ...prevSearches.filter(t => t !== term)].slice(0, 5);
            localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
            return updatedSearches;
        });
    }, []);
    
    // Memoized function to call the cloud function
    const performSearch = useCallback(async (term) => {
        if (term.length < 2) {
            setResults({ leads: [], clients: [], policies: [] });
            return;
        }
        setIsLoading(true);
        addRecentSearch(term); // This is now a stable dependency
        try {
            const functions = getFunctions();
            const universalSearch = httpsCallable(functions, 'universalSearch');
            const response = await universalSearch({ searchTerm: term });
            setResults(response.data);
        } catch (error) {
            console.error("Error performing search:", error);
        } finally {
            setIsLoading(false);
        }
    }, [addRecentSearch]); // The dependency array is now stable

    // Effect to trigger search when the debounced search term changes
    useEffect(() => {
        if (debouncedSearchTerm) {
            performSearch(debouncedSearchTerm);
        } else {
            setResults({ leads: [], clients: [], policies: [] });
        }
    }, [debouncedSearchTerm, performSearch]);

    // Reset search term when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setResults({ leads: [], clients: [], policies: [] });
            setActiveTab('leads');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleRecentSearchClick = (term) => {
        setSearchTerm(term);
    };
    
    const renderRecentSearches = () => {
        if (recentSearches.length === 0) {
            return <div className="text-center p-8 text-gray-500">No recent searches.</div>;
        }
        return (
            <div>
                <h3 className="text-sm font-semibold text-gray-400 px-3 mb-2">Recent Searches</h3>
                <ul className="space-y-1">
                    {recentSearches.map((term, index) => (
                        <li 
                            key={index} 
                            onClick={() => handleRecentSearchClick(term)}
                            className="p-3 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center"
                        >
                            <Clock className="h-4 w-4 mr-3 text-gray-500" />
                            <span className="text-white">{term}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderResults = () => {
        const data = results[activeTab] || [];
        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-8">
                    <Loader className="animate-spin text-blue-500" size={32} />
                </div>
            );
        }
        if (data.length === 0 && debouncedSearchTerm) {
            return <div className="text-center p-8 text-gray-500">No results found for "{debouncedSearchTerm}".</div>;
        }
        return (
            <ul className="space-y-2">
                {data.map((item) => (
                    <li 
                        key={item.id} 
                        className="p-3 hover:bg-gray-800 rounded-lg cursor-pointer"
                        onClick={() => {
                            if (activeTab === 'leads') onSelectLead(item);
                            if (activeTab === 'clients') onSelectClient(item);
                            if (activeTab === 'policies') onSelectPolicy(item);
                            onClose();
                        }}
                    >
                        {activeTab === 'leads' && (
                            <div className="flex items-center">
                                <User className="h-5 w-5 mr-3 text-gray-400" />
                                <div>
                                    <p className="font-semibold text-white">{item.name}</p>
                                    <p className="text-sm text-gray-400">{item.status}</p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'clients' && (
                             <div className="flex items-center">
                                <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                                <div>
                                    <p className="font-semibold text-white">{item.name}</p>
                                    <p className="text-sm text-gray-400">{item.phone}</p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'policies' && (
                             <div className="flex items-center">
                                <Shield className="h-5 w-5 mr-3 text-gray-400" />
                                <div>
                                    <p className="font-semibold text-white">Policy #{item.policyNumber}</p>
                                    <p className="text-sm text-gray-400">Holder: {item.clientName}</p>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start pt-16">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 transform transition-all">
                <div className="p-4 border-b border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search for leads, clients, policies..."
                            className="w-full pl-10 pr-10 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                         <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <X size={24}/>
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    {searchTerm ? (
                        <>
                            <div className="flex border-b border-gray-700 mb-4">
                                <button onClick={() => setActiveTab('leads')} className={`px-4 py-2 text-sm sm:text-base ${activeTab === 'leads' ? 'border-b-2 border-amber-500 text-amber-400 font-semibold' : 'text-gray-400'}`}>Leads ({results.leads.length})</button>
                                <button onClick={() => setActiveTab('clients')} className={`px-4 py-2 text-sm sm:text-base ${activeTab === 'clients' ? 'border-b-2 border-amber-500 text-amber-400 font-semibold' : 'text-gray-400'}`}>Clients ({results.clients.length})</button>
                                <button onClick={() => setActiveTab('policies')} className={`px-4 py-2 text-sm sm:text-base ${activeTab === 'policies' ? 'border-b-2 border-amber-500 text-amber-400 font-semibold' : 'text-gray-400'}`}>Policies ({results.policies.length})</button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {renderResults()}
                            </div>
                        </>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            {renderRecentSearches()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UniversalSearchModal;
