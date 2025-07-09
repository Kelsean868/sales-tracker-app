import React from 'react';
import { UserCircle, Bell, Search } from 'lucide-react';

const TopHeader = ({ user, onProfileClick, onSearchClick }) => {
    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        return names.map(n => n[0]).join('').toUpperCase();
    };

    return (
        <header className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-lg">
            <div className="flex items-center">
                {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full mr-3" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-lg font-bold">
                        {getInitials(user?.name)}
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-bold">{user?.name || 'Agent'}</h1>
                    <p className="text-sm text-gray-400 capitalize">{user?.role?.replace('_', ' ') || 'Sales Person'}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                {/* NEW Search Button */}
                <button 
                    onClick={onSearchClick} 
                    className="text-gray-300 hover:text-white transition-colors"
                    aria-label="Open search"
                >
                    <Search size={22} />
                </button>
                <button className="relative text-gray-300 hover:text-white transition-colors">
                    <Bell size={22} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </button>
                <button onClick={onProfileClick} className="text-gray-300 hover:text-white transition-colors">
                    <UserCircle size={22} />
                </button>
            </div>
        </header>
    );
};

export default TopHeader;
