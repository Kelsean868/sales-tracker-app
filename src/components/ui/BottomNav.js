import React from 'react';
import { Home, Calendar as CalendarIcon, BookUser, Trophy, Target, BarChart2, Users2, Users } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
        { id: 'agenda', icon: CalendarIcon, label: 'Agenda' },
        { id: 'portfolio', icon: BookUser, label: 'Portfolio' },
        { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
        { id: 'goals', icon: Target, label: 'Goals' },
        { id: 'reports', icon: BarChart2, label: 'Reports' },
        { id: 'contacts', icon: Users2, label: 'Contacts' },
        { id: 'leads', icon: Users, label: 'Leads' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 shadow-lg">
            <div className="flex justify-around max-w-4xl mx-auto">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors duration-200 ${activeTab === item.id ? 'text-amber-400' : 'text-gray-400 hover:text-white'}`}>
                        <item.icon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
