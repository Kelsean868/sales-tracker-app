import React, { useMemo } from 'react';
import { TrendingUp, Target, CheckCircle, Award, Zap, Sun, Moon, Star, Users } from 'lucide-react';
import Card from '../ui/Card';

// Helper function to get achievement details based on points.
const getAchievement = (points) => {
    if (points >= 1000) return { name: 'Master', icon: <Award className="text-amber-400" />, color: 'amber-400' };
    if (points >= 500) return { name: 'Elite', icon: <Star className="text-yellow-500" />, color: 'yellow-500' };
    if (points >= 250) return { name: 'Pro', icon: <Zap className="text-blue-500" />, color: 'blue-500' };
    if (points >= 100) return { name: 'Rookie', icon: <Sun className="text-green-500" />, color: 'green-500' };
    return { name: 'Beginner', icon: <Moon className="text-gray-500" />, color: 'gray-500' };
};

/**
 * Dashboard component
 * Now supports a manager view to show aggregate team stats.
 * @param {object} props - Component props
 * @param {Array} [props.activities=[]] - Array of activities (user's or all, depending on role)
 * @param {Array} [props.leads=[]] - Array of leads (user's or all, depending on role)
 * @param {object} props.currentUser - The currently logged-in user object
 * @returns {JSX.Element} The rendered dashboard screen
 */
const Dashboard = ({ activities = [], leads = [], currentUser }) => {
    
    const managementRoles = ['super_admin', 'admin', 'branch_manager', 'unit_manager'];
    const isManagerView = currentUser && managementRoles.includes(currentUser.role);

    const stats = useMemo(() => {
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();

        const isToday = (timestamp) => {
            if (!timestamp?.toDate) return false;
            const date = timestamp.toDate();
            return date.getFullYear() === todayYear &&
                   date.getMonth() === todayMonth &&
                   date.getDate() === todayDate;
        };

        const todaysActivities = activities.filter(a => isToday(a.createdAt || a.timestamp));
        const newLeadsToday = leads.filter(l => isToday(l.createdAt)).length;

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
                        {/* Title changes based on view */}
                        <p className="text-lg text-gray-400 flex items-center">
                            {isManagerView && <Users size={18} className="mr-2" />}
                            {isManagerView ? "Team's Points Today" : "My Points Today"}
                        </p>
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
                <StatCard icon={<TrendingUp />} label={isManagerView ? "Team API Today" : "My API Today"} value={`$${stats.apiToday.toLocaleString()}`} />
                <StatCard icon={<Target />} label="New Leads Today" value={stats.newLeadsToday} />
                <StatCard icon={<CheckCircle />} label="Follow-ups Today" value={stats.followUpsToday} />
            </div>

            {/* Placeholder for Recent Activity */}
            <Card>
                <h3 className="font-bold text-lg mb-2">{isManagerView ? "Recent Team Activity" : "My Recent Activity"}</h3>
                <p className="text-gray-400 text-center py-4">Recent activity feed will be displayed here.</p>
            </Card>

            {/* Placeholder for Upcoming Tasks */}
            <Card>
                <h3 className="font-bold text-lg mb-2">{isManagerView ? "Team's Upcoming Tasks" : "My Upcoming Tasks"}</h3>
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
