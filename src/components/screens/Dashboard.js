import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { Users, Shield, DollarSign, CheckCircle, Activity, Clock, Phone, Mail, UserPlus, Briefcase, TrendingUp, Target } from 'lucide-react';
import Card from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
        'Note': <Mail size={16} />,
        'Call': <Phone size={16} />,
        'Meeting': <Users size={16} />,
        'Lunch': <Briefcase size={16} />,
        'FFI': <UserPlus size={16} />,
        'API': <DollarSign size={16} />,
        default: <Activity size={16} />
    };

    const toDate = (timestamp) => {
        if (!timestamp) return new Date();
        if (timestamp.toDate) return timestamp.toDate();
        return new Date(timestamp);
    };

    return (
        <div className="flex items-center p-3 hover:bg-gray-800 rounded-lg">
            <div className="text-amber-400 mr-3">
                {activityIcons[activity.type] || activityIcons.default}
            </div>
            <div className="flex-grow">
                <p className="text-white font-semibold">{activity.details}</p>
                <p className="text-gray-400 text-sm">by {activity.userName || 'Unknown'}</p>
            </div>
            <div className="text-right">
                <p className="text-gray-500 text-xs flex items-center">
                    <Clock size={12} className="mr-1" />
                    {toDate(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won'];
        const counts = statuses.reduce((acc, status) => {
            acc[status] = 0;
            return acc;
        }, {});
        leads.forEach(lead => {
            if (lead.status && counts[lead.status] !== undefined) {
                counts[lead.status]++;
            }
        });
        return statuses.map(status => ({
            name: status,
            count: counts[status]
        }));
    }, [leads]);

    return (
        <Card>
            <div className="p-4">
                <h3 className="text-lg font-bold mb-4">Sales Funnel</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none' }} cursor={{ fill: 'rgba(252, 211, 77, 0.1)' }}/>
                        <Bar dataKey="count" fill="#3B82F6" barSize={20} label={{ position: 'right', fill: '#fff', fontSize: 12 }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};


const Dashboard = ({ currentUser, allUsers = [] }) => {
    const [activities, setActivities] = useState([]);
    const [leads, setLeads] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getFirestore();
        
        const transformTimestamp = (item, key) => {
            const timestamp = item[key];
            if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
                return { ...item, [key]: new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate() };
            }
            return item;
        };
        
        const collectionsToFetch = {
            activities: (data) => setActivities(data.map(item => transformTimestamp(item, 'timestamp'))),
            leads: (data) => setLeads(data.map(item => transformTimestamp(item, 'createdAt'))),
            policies: (data) => setPolicies(data.map(item => transformTimestamp(item, 'createdAt'))),
            clients: (data) => setClients(data.map(item => transformTimestamp(item, 'createdAt'))),
        };

        const unsubscribes = Object.entries(collectionsToFetch).map(([collectionName, transformer]) => {
            const q = query(collection(db, collectionName));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                transformer(data);
            });
        });

        setLoading(false);
        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };
    
    const toDate = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate();
        return new Date(timestamp);
    };

    const isManager = ['super_admin', 'admin', 'regional_manager', 'branch_manager', 'unit_manager'].includes(currentUser?.role);

    const { myActivities, teamActivities } = useMemo(() => {
        const my = activities.filter(a => a.userId === currentUser.uid);
        if (!isManager) return { myActivities: my, teamActivities: [] };
        
        const myTeamUserIds = allUsers.filter(u => u.managerId === currentUser.uid).map(u => u.id);
        const team = activities.filter(a => myTeamUserIds.includes(a.userId));
        
        return { myActivities: my, teamActivities: team };
    }, [activities, currentUser, allUsers, isManager]);

    const recentActivities = useMemo(() => {
        const feedActivities = isManager ? teamActivities : myActivities;
        return [...feedActivities]
            .sort((a, b) => toDate(b.timestamp) - toDate(a.timestamp))
            .slice(0, 5);
    }, [myActivities, teamActivities, isManager]);
    
    const kpiStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const isThisMonth = (date) => date ? toDate(date) >= startOfMonth : false;

        const calcStats = (userList) => {
            const userIds = userList.map(u => u.id || u.uid);
            const relevantPolicies = policies.filter(p => userIds.includes(p.userId || p.agentId) && isThisMonth(p.createdAt));
            const relevantClients = clients.filter(c => userIds.includes(c.userId) && isThisMonth(c.createdAt));
            const relevantLeads = leads.filter(l => userIds.includes(l.userId) && isThisMonth(l.createdAt));
            
            return {
                policiesSold: relevantPolicies.length,
                totalPremium: relevantPolicies.reduce((sum, p) => sum + (Number(p.premium) || 0), 0),
                clientsConverted: relevantClients.length,
                newLeads: relevantLeads.length,
            };
        }

        const myStats = calcStats([currentUser]);
        if (!isManager) return { my: myStats };

        const teamStats = calcStats(allUsers.filter(u => u.managerId === currentUser.uid));
        return { my: myStats, team: teamStats };
    }, [leads, clients, policies, currentUser, allUsers, isManager]);
    
    if (loading) {
        return <p className="text-center p-8">Loading dashboard...</p>;
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">{getGreeting()}, {currentUser?.name?.split(' ')[0]}!</h1>
                <p className="text-gray-400">Here's your performance summary for this month.</p>
            </div>
            
            <h3 className="text-lg font-bold">My Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp size={24} />} label="New Leads" value={kpiStats.my.newLeads} color="blue" />
                <StatCard icon={<CheckCircle size={24} />} label="Clients Converted" value={kpiStats.my.clientsConverted} color="green" />
                <StatCard icon={<Shield size={24} />} label="Policies Sold" value={kpiStats.my.policiesSold} color="purple" />
                <StatCard icon={<DollarSign size={24} />} label="My Premium" value={`$${kpiStats.my.totalPremium.toLocaleString()}`} color="amber" />
            </div>

            {isManager && (
                <>
                    <h3 className="text-lg font-bold">Team Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={<Users size={24} />} label="Team Leads" value={kpiStats.team.newLeads} color="blue" />
                        <StatCard icon={<Target size={24} />} label="Team Conversions" value={kpiStats.team.clientsConverted} color="green" />
                        <StatCard icon={<CheckCircle size={24} />} label="Team Policies" value={kpiStats.team.policiesSold} color="purple" />
                        <StatCard icon={<DollarSign size={24} />} label="Team Premium" value={`$${kpiStats.team.totalPremium.toLocaleString()}`} color="amber" />
                    </div>
                </>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesFunnelChart leads={isManager ? leads.filter(l => allUsers.some(u => u.managerId === currentUser.uid && u.id === l.userId)) : leads.filter(l => l.userId === currentUser.uid)} />
                </div>
                 <div>
                    <h3 className="text-lg font-bold mb-4">Recent Activity {isManager && '(My Team)'}</h3>
                    <Card>
                        <div className="p-2">
                            {recentActivities.length > 0 ? (
                                recentActivities.map(activity => <RecentActivityItem key={activity.id} activity={activity} />)
                            ) : (
                                <div className="p-4 text-center text-gray-400">
                                    No recent activity.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;