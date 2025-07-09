import React, { useMemo } from 'react';
import { Users, Shield, DollarSign, CheckCircle, Activity, Clock, Phone, Mail, UserPlus, Briefcase } from 'lucide-react';
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

    const toDate = (timestamp) => {
        if (timestamp?.toDate) {
            return timestamp.toDate();
        }
        return new Date(timestamp);
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
                    {toDate(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {activity.points > 0 && 
                    <p className="text-green-400 text-xs font-bold">+{activity.points} pts</p>
                }
            </div>
        </div>
    );
};

const LeadFunnelChart = ({ leads = [] }) => {
    const funnelData = useMemo(() => {
        const statuses = ['new', 'contacted', 'qualified', 'proposal', 'converted'];
        const counts = statuses.reduce((acc, status) => {
            acc[status] = 0;
            return acc;
        }, {});
        leads.forEach(lead => {
            if (lead.status && counts[lead.status.toLowerCase()] !== undefined) {
                counts[lead.status.toLowerCase()]++;
            }
        });
        return statuses.map(status => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count: counts[status]
        }));
    }, [leads]);

    const maxCount = Math.max(...funnelData.map(d => d.count), 1);

    return (
        <Card>
            <div className="p-4">
                <h3 className="text-lg font-bold mb-4">Sales Funnel</h3>
                <div className="space-y-3">
                    {funnelData.map(({ status, count }) => (
                        <div key={status} className="flex items-center">
                            <p className="w-1/4 text-sm text-gray-400">{status}</p>
                            <div className="w-3/4 bg-gray-700 rounded-full h-4">
                                <div 
                                    className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                >
                                   <span className="text-xs font-bold text-white">{count}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};


const Dashboard = ({ activities = [], leads = [], policies = [], clients = [], currentUser }) => {

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };
    
    const toDate = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp.toDate) { // Firebase Timestamp object
            return timestamp.toDate();
        }
        return new Date(timestamp); // ISO string
    };

    const recentActivities = useMemo(() => {
        return [...activities]
            .sort((a, b) => toDate(b.timestamp) - toDate(a.timestamp))
            .slice(0, 5);
    }, [activities]);
    
    const monthlyStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const isThisMonth = (date) => date ? toDate(date) >= startOfMonth : false;

        const newLeads = leads.filter(l => isThisMonth(l.createdAt)).length;
        const clientsConverted = clients.filter(c => isThisMonth(c.createdAt)).length;
        const policiesSold = policies.filter(p => isThisMonth(p.inforcedDate)).length;
        const totalPremium = policies.reduce((sum, p) => {
            if(isThisMonth(p.inforcedDate)) {
                return sum + (Number(p.premium) || 0);
            }
            return sum;
        }, 0);

        return { newLeads, clientsConverted, policiesSold, totalPremium };

    }, [leads, clients, policies]);
    

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">{getGreeting()}, {currentUser?.name?.split(' ')[0]}!</h1>
                <p className="text-gray-400">Here's your performance summary for this month.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users size={24} />} label="New Leads" value={monthlyStats.newLeads} color="blue" />
                <StatCard icon={<CheckCircle size={24} />} label="Clients Converted" value={monthlyStats.clientsConverted} color="green" />
                <StatCard icon={<Shield size={24} />} label="Policies Sold" value={monthlyStats.policiesSold} color="purple" />
                <StatCard icon={<DollarSign size={24} />} label="Total Premium" value={`$${monthlyStats.totalPremium.toLocaleString()}`} color="amber" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <LeadFunnelChart leads={leads} />
                </div>
                 <div>
                    <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
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
