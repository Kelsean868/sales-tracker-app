import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, Search, Plus } from 'lucide-react';

const RoleSelector = ({
    label,
    value,
    onSelect,
    contacts,
    onAddNew,
    isBeneficiary,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Effect to handle clicks outside the component to close the dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, dropdownOpen]);

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayValue = value?.name || (value === 'Estate' ? 'Estate' : '');

    const handleSelect = (item) => {
        onSelect(item);
        setDropdownOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {value === 'Estate' ? <Shield size={16} /> : <User size={16}/>}
                </div>
                <input
                    type="text"
                    value={displayValue}
                    onClick={() => setDropdownOpen(true)}
                    readOnly
                    className="w-full bg-gray-900 border-gray-700 rounded-md p-2 pl-10 cursor-pointer"
                    placeholder="Select a person"
                />
            </div>
            
            {dropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-700 rounded-md mt-1 shadow-lg z-10">
                    <div className="p-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10"
                                autoFocus
                            />
                        </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                        {filteredContacts.map(contact => (
                            <li
                                key={contact.id}
                                onMouseDown={() => handleSelect(contact)}
                                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                            >
                                {contact.name}
                            </li>
                        ))}
                         {filteredContacts.length === 0 && (
                            <p className="px-4 py-2 text-sm text-gray-500">No contacts found.</p>
                        )}
                    </ul>
                    <div className="p-2 border-t border-gray-700">
                        <button
                            type="button"
                            onMouseDown={() => { onAddNew(label.toLowerCase()); setDropdownOpen(false); }}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md"
                        >
                            <Plus size={16} className="mr-2"/> Create New Person
                        </button>
                        {isBeneficiary && (
                            <button
                                type="button"
                                onMouseDown={() => handleSelect({ name: 'Estate' })}
                                className="w-full mt-1 flex items-center justify-center px-4 py-2 text-sm text-white bg-gray-600 hover:bg-gray-500 rounded-md"
                            >
                                <Shield size={16} className="mr-2"/> Set as Estate
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleSelector;
