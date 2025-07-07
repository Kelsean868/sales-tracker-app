import React from 'react';
import { Search, Bell, User } from 'lucide-react';

/**
 * TopHeader component
 * Displays the top bar of the application with search, notifications, and user profile.
 * @param {object} props - Component props
 * @param {object} props.user - The currently logged-in user object
 * @param {function} props.onProfileClick - Function to call when the profile icon is clicked
 * @returns {JSX.Element} The rendered header component
 */
const TopHeader = ({ user, onProfileClick }) => {
    // This component now gracefully handles the case where the user object is null during loading.
    const userName = user ? user.name : 'User';
    const userRole = user ? (user.role || 'sales_person').replace(/_/g, ' ') : 'Loading...';
    const userPhotoURL = user ? user.photoURL : null;

    return (
        <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-40">
            {/* Left side: User Info */}
            <div className="flex items-center">
                <button onClick={onProfileClick} className="focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full">
                    {userPhotoURL ? (
                        <img src={userPhotoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                            <User className="text-gray-400" />
                        </div>
                    )}
                </button>
                <div className="ml-3">
                    <h1 className="text-md font-bold text-white capitalize">{userName}</h1>
                    <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center space-x-4">
                <button className="text-gray-400 hover:text-white">
                    <Search size={22} />
                </button>
                <button className="text-gray-400 hover:text-white relative">
                    <Bell size={22} />
                    {/* Notification dot */}
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-gray-800"></span>
                </button>
            </div>
        </header>
    );
};

export default TopHeader;
