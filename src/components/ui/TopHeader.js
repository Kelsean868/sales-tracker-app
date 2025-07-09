import React from 'react';
import { PowerIcon, UserCircleIcon, BellIcon, MagnifyingGlassIcon, ArrowLeftOnRectangleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import LiveClock from './LiveClock';
import Weather from './Weather';
import { getFunctions, httpsCallable } from 'firebase/functions';

const TopHeader = ({ user, onProfileClick, onSearchClick, isClockedIn, onClockIn, onClockOut }) => {
    const handleDebugClick = async () => {
        const functions = getFunctions();
        const debugAdminDashboard = httpsCallable(functions, 'debugAdminDashboard');
        try {
            console.log("Calling debugAdminDashboard function...");
            const result = await debugAdminDashboard();
            console.log('Debug result from admin dashboard check:', result.data);
        } catch (error) {
            console.error('Error calling debugAdminDashboard:', error);
        }
    };

    return (
        <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center text-white">
            <div className="flex items-center">
                <div className="w-10 h-10 bg-amber-400 rounded-full mr-3"></div>
                <div>
                    <h1 className="text-xl font-bold">Sales Pro</h1>
                    <p className="text-sm text-gray-400">{user?.name || 'Guest'}</p>
                </div>
            </div>

            <div className="flex-grow flex justify-center items-center">
                <LiveClock />
                <Weather />
            </div>

            <div className="flex items-center space-x-4">
                <button onClick={onSearchClick} className="p-2 rounded-full hover:bg-gray-700">
                    <MagnifyingGlassIcon className="h-6 w-6" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-700">
                    <BellIcon className="h-6 w-6" />
                </button>
                <button 
                    onClick={isClockedIn ? onClockOut : onClockIn}
                    className={`flex items-center px-4 py-2 rounded-md font-semibold text-sm ${isClockedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {isClockedIn ? <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" /> : <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />}
                    {isClockedIn ? 'Clock Out' : 'Clock In'}
                </button>
                <button onClick={onProfileClick} className="p-2 rounded-full hover:bg-gray-700">
                    <UserCircleIcon className="h-8 w-8" />
                </button>
                <button
                    onClick={handleDebugClick}
                    className="p-2 bg-blue-500 text-white rounded"
                >
                    Debug
                </button>
            </div>
        </header>
    );
};

export default TopHeader;
