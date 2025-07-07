import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import Card from '../ui/Card';

// Mock data - in a real app, this would come from props or a data fetch
const mockLeaderboard = [
    { id: '1', name: 'John Doe', points: 1250 },
    { id: '2', name: 'Jane Smith', points: 1100 },
    { id: '3', name: 'Mike Johnson', points: 980 },
    { id: '4', name: 'Sarah Williams', points: 850 },
    { id: '5', name: 'David Brown', points: 720 },
];

/**
 * LeaderboardScreen component
 * Displays a leaderboard of users based on points.
 * @returns {JSX.Element} The rendered leaderboard screen
 */
const LeaderboardScreen = () => {
    const [period, setPeriod] = useState('weekly'); // 'daily', 'weekly', 'monthly'

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                {/* Period Selector */}
                <div className="flex items-center bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setPeriod('daily')} className={`px-3 py-1 text-sm rounded-md ${period === 'daily' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}>Daily</button>
                    <button onClick={() => setPeriod('weekly')} className={`px-3 py-1 text-sm rounded-md ${period === 'weekly' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}>Weekly</button>
                    <button onClick={() => setPeriod('monthly')} className={`px-3 py-1 text-sm rounded-md ${period === 'monthly' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}>Monthly</button>
                </div>
            </div>

            <Card>
                <ul className="space-y-3">
                    {mockLeaderboard.map((user, index) => (
                        <li key={user.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                                <div className="ml-3">
                                    <p className="font-semibold">{user.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Trophy className="text-yellow-500 mr-2" size={18} />
                                <span className="font-bold text-lg">{user.points.toLocaleString()}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

export default LeaderboardScreen;
