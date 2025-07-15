import React, { useMemo } from 'react';
import { Users, Shield, DollarSign, CheckCircle, Activity, Clock, TrendingUp, Target } from 'lucide-react';
import Card from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LEAD_STAGES } from '../../constants';

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
    if (!activity) return null;
    
    return (
        <div className="flex items-center p-3 hover:bg-gray-800 rounded-lg">
            <div className="text-amber-400 mr-3">
                <Activity size={16} />
            </div>
            <div className="flex-grow">
                <p className="text-white font-semibold">{activity.details || 'No details'}</p>
                <p className="text-gray-400 text-sm">by {activity.userName || 'Unknown'}</p>
            </div>
            <div className="text-right">
                <p className="text-gray-500 text-xs flex items-center">
                    <Clock size={12} className="mr-1" />
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </p>
                {activity.points > 0 && 
                    <p className="text-green-400 text-xs font-bold">+{activity.points} pts</p>
                }
            </div>
        </div>
    );
};

const SalesFunnelChart = ({ leads = [] }) => {
    const funnelData = useMemo(() => {
        const stages = Object.values(LEAD_STAGES);
        const counts = stages.reduce((acc, stage) => {
            acc[stage] = 0;
            return acc;
        }, {});

        // Filter out undefined leads before processing
        const validLeads = leads.filter(lead => lead && lead.stage !== undefined);
        
        validLeads.forEach(lead => {
            const stage = lead.stage || LEAD_STAGES.NEW;
            if (counts[stage] !== undefined) {
                counts[stage]++;
            }
        });
        
        return stages.map(stage => ({
            name: stage,
            count: counts[stage]
        }));
    }, [leads]);

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sales Funnel</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={funnelData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const Dashboard = ({ 
    user, 
    allUsers = [], 
    activities = [], 
    leads = [], 
    policies = [], 
    clients = [] 
}) => {

    // Safe user check
    if (!user) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-400">Loading user data...</p>
            </div>
        );
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const isManager = useMemo(() => 
        ['super_admin', 'admin', 'regional_manager', 'branch_manager', 'unit_manager'].includes(user?.role),
        [user?.role]
    );

    const { myActivities, teamActivities } = useMemo(() => {
        // Filter out undefined activities and ensure they have userId
        const validActivities = activities.filter(a => a && a.userId);
        
        const my = validActivities.filter(a => a.userId === user?.uid);
        if (!isManager) return { myActivities: my, teamActivities: [] };
        
        // Filter out undefined users and ensure they have id/uid
        const validUsers = allUsers.filter(u => u && (u.id || u.uid));
        
        const myTeamUserIds = validUsers.filter(u => u.managerId === user?.uid).map(u => u.id || u.uid);
        const team = validActivities.filter(a => myTeamUserIds.includes(a.userId));
        
        return { myActivities: my, teamActivities: team };
    }, [activities, user, allUsers, isManager]);

    const recentActivities = useMemo(() => {
        const feedActivities = isManager ? teamActivities : myActivities;
        return [...feedActivities]
            .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
            .slice(0, 5);
    }, [myActivities, teamActivities, isManager]);
    
    const kpiStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const isThisMonth = (date) => date ? new Date(date) >= startOfMonth : false;

        const calcStats = (userList) => {
            // Filter out undefined users and ensure they have id/uid
            const validUsers = userList.filter(u => u && (u.id || u.uid));
            const userIds = validUsers.map(u => u.id || u.uid);
            
            // Filter out undefined items before processing
            const validPolicies = policies.filter(p => p && (p.userId || p.agentId) && p.createdAt);
            const validClients = clients.filter(c => c && c.userId && c.createdAt);
            const validLeads = leads.filter(l => l && l.userId && l.createdAt);
            
            const relevantPolicies = validPolicies.filter(p => userIds.includes(p.userId || p.agentId) && isThisMonth(p.createdAt));
            const relevantClients = validClients.filter(c => userIds.includes(c.userId) && isThisMonth(c.createdAt));
            const relevantLeads = validLeads.filter(l => userIds.includes(l.userId) && isThisMonth(l.createdAt));
            
            return {
                policiesSold: relevantPolicies.length,
                totalPremium: relevantPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0),
                clientsConverted: relevantClients.length,
                newLeads: relevantLeads.length,
            };
        }

        const myStats = calcStats([user].filter(u => u));
        if (!isManager) return { my: myStats };

        // Filter out undefined users before processing team stats
        const validAllUsers = allUsers.filter(u => u && (u.id || u.uid));
        const teamStats = calcStats(validAllUsers.filter(u => u.managerId === user?.uid));
        return { my: myStats, team: teamStats };
    }, [leads, clients, policies, user, allUsers, isManager]);
    
    return (
        <div className="p-6 space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {getGreeting()}, {user.name?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-gray-400">Here's your performance summary for this month.</p>
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">My Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            icon={<Users size={20} />} 
                            label="New Leads" 
                            value={kpiStats.my.newLeads} 
                            color="blue" 
                        />
                        <StatCard 
                            icon={<CheckCircle size={20} />} 
                            label="Clients Converted" 
                            value={kpiStats.my.clientsConverted} 
                            color="green" 
                        />
                        <StatCard 
                            icon={<Shield size={20} />} 
                            label="Policies Sold" 
                            value={kpiStats.my.policiesSold} 
                            color="purple" 
                        />
                        <StatCard 
                            icon={<DollarSign size={20} />} 
                            label="My Premium" 
                            value={`$${kpiStats.my.totalPremium.toLocaleString()}`} 
                            color="amber" 
                        />
                    </div>
                </div>

                {isManager && kpiStats.team && (
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4">Team Performance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard 
                                icon={<Users size={20} />} 
                                label="Team Leads" 
                                value={kpiStats.team.newLeads} 
                                color="blue" 
                            />
                            <StatCard 
                                icon={<CheckCircle size={20} />} 
                                label="Team Conversions" 
                                value={kpiStats.team.clientsConverted} 
                                color="green" 
                            />
                            <StatCard 
                                icon={<Shield size={20} />} 
                                label="Team Policies" 
                                value={kpiStats.team.policiesSold} 
                                color="purple" 
                            />
                            <StatCard 
                                icon={<DollarSign size={20} />} 
                                label="Team Premium" 
                                value={`$${kpiStats.team.totalPremium.toLocaleString()}`} 
                                color="amber" 
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SalesFunnelChart leads={isManager ? 
                        leads.filter(l => l && l.userId && allUsers.some(u => u && (u.id || u.uid) && u.managerId === user.uid && (u.id || u.uid) === l.userId)) : 
                        leads.filter(l => l && l.userId === user.uid)} />
                    
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity {isManager && '(My Team)'}</h3>
                            <div className="space-y-2">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((activity, index) => (
                                        <RecentActivityItem key={activity.id || index} activity={activity} />
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No recent activity.</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
