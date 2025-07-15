import React from 'react';
import { LayoutDashboard, Users, Briefcase, Calendar, BookUser, BarChart, Trophy, Target, FilePlus } from 'lucide-react';

const BottomNav = ({ activeScreen, onScreenChange }) => {
  // Debug logging to help identify issues
  console.log('BottomNav Props:', { activeScreen, onScreenChange });
  console.log('onScreenChange type:', typeof onScreenChange);
  
  const navItems = [
    { name: 'DASHBOARD', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { name: 'LEADS', icon: <Users size={20} />, label: 'Leads' },
    { name: 'PORTFOLIO', icon: <Briefcase size={20} />, label: 'Portfolio' },
    { name: 'AGENDA', icon: <Calendar size={20} />, label: 'Agenda' },
    { name: 'CONTACTS', icon: <BookUser size={20} />, label: 'Contacts' },
    { name: 'REPORTS', icon: <BarChart size={20} />, label: 'Reports' },
    { name: 'LEADERBOARD', icon: <Trophy size={20} />, label: 'Leaders' },
    { name: 'GOALS', icon: <Target size={20} />, label: 'Goals' },
    { name: 'MANUAL_REPORT', icon: <FilePlus size={20} />, label: 'Manual Report' },
  ];

  const handleNavClick = (screenName) => {
    console.log('BottomNav: Attempting to navigate to:', screenName);
    console.log('BottomNav: onScreenChange function exists:', typeof onScreenChange === 'function');
    
    if (typeof onScreenChange === 'function') {
      onScreenChange(screenName);
    } else {
      console.error('BottomNav: onScreenChange is not a function!', onScreenChange);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavClick(item.name)}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
              activeScreen === item.name 
                ? 'text-amber-400 bg-amber-400/10' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
