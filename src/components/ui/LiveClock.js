import React, { useState, useEffect } from 'react';
import { Clock, Play, Square } from 'lucide-react';

const LiveClock = ({ onClockIn, onClockOut, isClockedIn }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const handleClockToggle = () => {
        if (isClockedIn) {
            onClockOut();
        } else {
            onClockIn();
        }
    };

    return (
        <div className="flex items-center space-x-4">
            <div className="flex items-center text-white">
                <Clock size={20} className="mr-2" />
                <span className="font-semibold">{time.toLocaleTimeString()}</span>
            </div>
            <button
                onClick={handleClockToggle}
                className={`flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                    isClockedIn 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
            >
                {isClockedIn ? <Square size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                {isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>
        </div>
    );
};

export default LiveClock;
