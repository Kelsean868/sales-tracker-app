import React, { useState, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import Card from '../ui/Card';

/**
 * LeaderboardScreen component
 * Displays a leaderboard of users based on points, calculated from real activity data.
 * @param {object} props - Component props
 * @param {Array} [props.allUsers=[]] - Array of all users in the system
 * @param {Array} [props.activities=[]] - Array of all activities in the system
 * @returns {JSX.Element} The rendered leaderboard screen
 */
const LeaderboardScreen = ({ allUsers = [], activities = [] }) => {
    const [period, setPeriod] = useState('weekly'); // 'daily', 'weekly', 'monthly'

    // Memoized calculation for the leaderboard
    const leaderboardData = useMemo(() => {
        const now = new Date();
        let startOfPeriod;

        // Determine the start date for the selected period
        switch (period) {
            case 'daily':
                startOfPeriod = new Date();
                startOfPeriod.setHours(0, 0, 0, 0);
                break;
            case 'monthly':
                startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'weekly':
            default:
                // FIX: Create a new Date object for calculation to avoid mutation
                const weeklyNow = new Date();
                const day = weeklyNow.getDay();
                const diff = weeklyNow.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                startOfPeriod = new Date(weeklyNow.setDate(diff));
                startOfPeriod.setHours(0, 0, 0, 0);
                break;
        }

        // Filter activities that fall within the current period
        const relevantActivities = activities.filter(a => {
            const activityDate = a.timestamp?.toDate();
            return activityDate && activityDate >= startOfPeriod;
        });

        // Calculate total points for each user
        const userScores = allUsers.map(user => {
            const userActivities = relevantActivities.filter(a => a.userId === user.id);
            const totalPoints = userActivities.reduce((sum, activity) => sum + (activity.points || 0), 0);
            return {
                ...user,
                points: totalPoints,
            };
        });

        // Sort users by points in descending order
        return userScores.sort((a, b) => b.points - a.points);

    }, [allUsers, activities, period]);

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
                    {leaderboardData.length > 0 ? leaderboardData.map((user, index) => (
                        <li key={user.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-lg font-bold text-gray-400 w-8">{index + 1}</span>
                                <img 
                                    src={user.photoURL || `https://placehold.co/40x40/374151/ECF0F1?text=${user.name ? user.name.charAt(0) : 'A'}`} 
                                    alt={user.name} 
                                    className="w-10 h-10 rounded-full object-cover ml-3"
                                />
                                <div className="ml-4">
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{(user.role || 'sales_person').replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Trophy className="text-yellow-500 mr-2" size={18} />
                                <span className="font-bold text-lg">{user.points.toLocaleString()}</span>
                            </div>
                        </li>
                    )) : (
                        <p className="text-center text-gray-500 py-4">No activity data for this period.</p>
                    )}
                </ul>
            </Card>
        </div>
    );
};

export default LeaderboardScreen;
