import React, { useMemo } from 'react';
import { TrendingUp, Target, CheckCircle, Award, Zap, Sun, Moon, Star } from 'lucide-react';
import Card from '../ui/Card';

// Helper function to get achievement details based on points.
const getAchievement = (points) => {
    if (points >= 100) return { name: 'Master', icon: <Award className="text-amber-400" />, color: 'amber-400' };
    if (points >= 75) return { name: 'Elite', icon: <Star className="text-yellow-500" />, color: 'yellow-500' };
    if (points >= 50) return { name: 'Pro', icon: <Zap className="text-blue-500" />, color: 'blue-500' };
    if (points >= 25) return { name: 'Rookie', icon: <Sun className="text-green-500" />, color: 'green-500' };
    return { name: 'Beginner', icon: <Moon className="text-gray-500" />, color: 'gray-500' };
};

/**
 * Dashboard component
 * The main landing screen of the application, showing key stats and overviews.
 * @param {object} props - Component props
 * @param {Array} [props.activities=[]] - Array of user activities
 * @param {Array} [props.leads=[]] - Array of user leads
 * @returns {JSX.Element} The rendered dashboard screen
 */
const Dashboard = ({ activities = [], leads = [] }) => {
    // useMemo will recalculate stats only when activities or leads change.
    const stats = useMemo(() => {
        // Get the current date's components in the local timezone
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();

        // FIX #2: Compare calendar dates instead of timestamps to avoid timezone issues.
        const newLeadsToday = leads.filter(l => {
            if (!l.createdAt?.toDate) {
                return false; // Guard against missing or invalid data
            }
            const leadDate = l.createdAt.toDate();
            return leadDate.getFullYear() === todayYear &&
                   leadDate.getMonth() === todayMonth &&
                   leadDate.getDate() === todayDate;
        }).length;

        // Apply the same robust filtering for activities
        const todaysActivities = activities.filter(a => {
            if (!a.timestamp?.toDate) {
                return false;
            }
            const activityDate = a.timestamp.toDate();
            return activityDate.getFullYear() === todayYear &&
                   activityDate.getMonth() === todayMonth &&
                   activityDate.getDate() === todayDate;
        });

        const pointsToday = todaysActivities.reduce((acc, curr) => acc + (curr.points || 0), 0);
        const apiToday = todaysActivities.reduce((acc, curr) => acc + (curr.api || 0), 0);
        const followUpsToday = todaysActivities.filter(a => a.type === 'Call' || a.type === 'Meeting').length;

        return {
            pointsToday,
            apiToday,
            newLeadsToday,
            followUpsToday,
        };
    }, [activities, leads]);

    const achievement = getAchievement(stats.pointsToday);

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-lg text-gray-400">Today's Points</p>
                        <p className="text-4xl font-bold">{stats.pointsToday}</p>
                    </div>
                    <div className={`text-right text-${achievement.color}`}>
                        <div className="flex justify-end mb-1">{achievement.icon}</div>
                        <p className="font-bold">{achievement.name}</p>
                    </div>
                </div>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={<TrendingUp />} label="API Today" value={`$${stats.apiToday.toLocaleString()}`} />
                <StatCard icon={<Target />} label="New Leads" value={stats.newLeadsToday} />
                <StatCard icon={<CheckCircle />} label="Follow-ups" value={stats.followUpsToday} />
            </div>

            {/* Placeholder for Recent Activity */}
            <Card>
                <h3 className="font-bold text-lg mb-2">Recent Activity</h3>
                <p className="text-gray-400 text-center py-4">Recent activity feed will be displayed here.</p>
            </Card>

            {/* Placeholder for Upcoming Tasks */}
            <Card>
                <h3 className="font-bold text-lg mb-2">Upcoming Tasks</h3>
                <p className="text-gray-400 text-center py-4">A list of upcoming scheduled tasks will appear here.</p>
            </Card>
        </div>
    );
};

// Sub-component for individual stat cards
const StatCard = ({ icon, label, value }) => (
    <Card>
        <div className="flex items-center">
            <div className="p-2 bg-gray-700 rounded-full mr-4">
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="font-bold text-xl">{value}</p>
            </div>
        </div>
    </Card>
);

export default Dashboard;
