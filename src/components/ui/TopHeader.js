import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Search, Star, Sun, Cloud, CloudRain, CloudSun, CloudSnow } from 'lucide-react';

const LiveClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    const formattedTime = time.toLocaleTimeString('en-TT', { timeZone: 'America/Port_of_Spain', hour: '2-digit', minute: '2-digit' });
    return <div className="bg-gray-900/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">{formattedTime}</div>;
};

const TopHeader = ({ onSearchClick, onClockOut, isClockedIn, clockInTime, dailyPointsData, weather, user, onProfileClick }) => {
    const [workDuration, setWorkDuration] = useState('00:00:00');

    useEffect(() => {
        let timerId;
        if (isClockedIn && clockInTime) {
            timerId = setInterval(() => {
                const now = new Date();
                const start = clockInTime.toDate();
                const diff = Math.floor((now - start) / 1000);
                const h = String(Math.floor(diff / 3600)).padStart(2, '0');
                const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
                const s = String(diff % 60).padStart(2, '0');
                setWorkDuration(`${h}:${m}:${s}`);
            }, 1000);
        } else {
            setWorkDuration('00:00:00');
        }
        return () => clearInterval(timerId);
    }, [isClockedIn, clockInTime]);

    const getWeatherIcon = (desc) => {
        const description = desc?.toLowerCase() || '';
        if (description.includes('sunny') || description.includes('clear')) return <Sun className="w-5 h-5 text-yellow-400" />;
        if (description.includes('partly cloudy')) return <CloudSun className="w-5 h-5 text-gray-300" />;
        if (description.includes('cloudy') || description.includes('overcast')) return <Cloud className="w-5 h-5 text-gray-400" />;
        if (description.includes('rain') || description.includes('shower')) return <CloudRain className="w-5 h-5 text-blue-400" />;
        if (description.includes('snow')) return <CloudSnow className="w-5 h-5 text-white" />;
        return <Cloud className="w-5 h-5 text-gray-400" />;
    };

    return (
        <div className="fixed top-0 left-0 right-0 bg-gray-900/70 backdrop-blur-md z-50 shadow-md">
            <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
                <div className="flex items-center gap-4 text-sm">
                    {isClockedIn && (
                        <>
                            <div className="flex items-center gap-2" title="Work Duration">
                                <Clock className="w-5 h-5 text-green-400" />
                                <span className="font-mono font-semibold">{workDuration}</span>
                            </div>
                            <div className="flex items-center gap-2" title={`Today's Points: ${dailyPointsData.actual} Earned / ${dailyPointsData.potential} Potential`}>
                                <Star className="w-5 h-5 text-amber-400" />
                                <span className="font-semibold">{dailyPointsData.actual} / {dailyPointsData.potential}</span>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {weather && <div title={weather.desc}>{getWeatherIcon(weather.desc)}</div>}
                    <LiveClock />
                    {isClockedIn && (
                        <button onClick={onClockOut} className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white" title="Clock Out">
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={onSearchClick} className="text-gray-300 hover:text-white" title="Universal Search">
                        <Search className="w-6 h-6" />
                    </button>
                    <button onClick={onProfileClick} className="text-gray-300 hover:text-white" title="Profile & Settings">
                        <img src={user.photoURL || `https://placehold.co/40x40/374151/ECF0F1?text=${user.name ? user.name.charAt(0) : 'A'}`} alt="Profile" className="w-8 h-8 rounded-full" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopHeader;
