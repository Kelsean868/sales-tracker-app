import React, { useMemo } from 'react';
import { Users, Target, Briefcase, TrendingUp, CheckCircle, Activity, Clock } from 'lucide-react';
import Card from '../ui/Card';

const StatCard = ({ icon, label, value, color }) => (
    <Card>
        <div className="p-4 flex items-center">
            <div className={`p-3 rounded-full mr-4 bg-${color}-500 bg-opacity-20 text-${color}-400`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    </Card>
);

const RecentActivityItem = ({ activity }) => {
    const activityIcons = {
        'Meeting': <Users size={16} />,
        'Call': <Phone size={16} />,
        'Email': <Mail size={16} />,
        'Presentation': <Briefcase size={16} />,
        'Follow-up': <Activity size={16} />,
        'New Client': <UserPlus size={16} />,
        'Policy Sold': <CheckCircle size={16} />,
        default: <Activity size={16} />
    };

    return (
        <div className="flex items-center p-3 hover:bg-gray-800 rounded-lg">
            <div className="text-amber-400 mr-3">
                {activityIcons[activity.type] || activityIcons.default}
            </div>
            <div className="flex-grow">
                <p className="text-white font-semibold">{activity.type}</p>
                <p className="text-gray-400 text-sm">{activity.details}</p>
            </div>
            <div className="text-right">
                <p className="text-gray-500 text-xs flex items-center">
                    <Clock size={12} className="mr-1" />
                    {new Date(activity.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {activity.points > 0 && 
                    <p className="text-green-400 text-xs font-bold">+{activity.points} pts</p>
                }
            </div>
        </div>
    );
};

const Dashboard = ({ activities, leads, currentUser }) => {
    // --- DEBUGGING LINE ---
    // Let's see what props the Dashboard component is receiving.
    console.log("DEBUG: Dashboard component received leads:", leads);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const recentActivities = useMemo(() => {
        return [...activities]
            .sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate())
            .slice(0, 5);
    }, [activities]);
    
    // Calculate stats
    const totalLeads = leads?.length || 0;
    const totalClients = leads?.filter(lead => lead.status === 'Converted').length || 0;
    const totalActivities = activities?.length || 0;
    const conversionRate = totalLeads > 0 ? ((totalClients / totalLeads) * 100).toFixed(1) : 0;

    return (
        <div className="p-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">{getGreeting()}, {currentUser?.name?.split(' ')[0]}!</h1>
                <p className="text-gray-400">Here's your performance summary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={<Users size={24} />} label="Total Leads" value={totalLeads} color="blue" />
                <StatCard icon={<Briefcase size={24} />} label="New Clients" value={totalClients} color="green" />
                <StatCard icon={<Target size={24} />} label="Activities Logged" value={totalActivities} color="purple" />
                <StatCard icon={<TrendingUp size={24} />} label="Conversion Rate" value={`${conversionRate}%`} color="amber" />
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
                <Card>
                    <div className="p-2">
                        {recentActivities.length > 0 ? (
                            recentActivities.map(activity => <RecentActivityItem key={activity.id} activity={activity} />)
                        ) : (
                            <div className="p-4 text-center text-gray-400">
                                No recent activity to display.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
