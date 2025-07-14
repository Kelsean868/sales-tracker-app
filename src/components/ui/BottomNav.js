import React from 'react';
import { LayoutDashboard, Users, Briefcase, Calendar, BookUser, BarChart, Trophy, Target, FilePlus } from 'lucide-react';

const BottomNav = ({ activeScreen, setActiveScreen }) => {
    const navItems = [
        { name: 'DASHBOARD', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
        { name: 'LEADS', icon: <Users size={24} />, label: 'Leads' },
        { name: 'PORTFOLIO', icon: <Briefcase size={24} />, label: 'Portfolio' },
        { name: 'AGENDA', icon: <Calendar size={24} />, label: 'Agenda' },
        { name: 'CONTACTS', icon: <BookUser size={24} />, label: 'Contacts' },
        { name: 'REPORTS', icon: <BarChart size={24} />, label: 'Reports' },
        { name: 'LEADERBOARD', icon: <Trophy size={24} />, label: 'Leaders' },
        { name: 'GOALS', icon: <Target size={24} />, label: 'Goals' },
        { name: 'MANUAL_REPORT', icon: <FilePlus size={24} />, label: 'Manual Report' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 shadow-lg z-40">
            <div className="flex justify-around max-w-screen-sm mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => setActiveScreen(item.name)}
                        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors duration-200 ${
                            activeScreen === item.name ? 'text-amber-400' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {item.icon}
                        <span className="mt-1">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
