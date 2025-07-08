import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import { FileText, Target, TrendingUp, Award, Filter, Users } from 'lucide-react';
import Card from '../ui/Card';
import { LEAD_STAGES } from '../../constants';

/**
 * ReportsScreen component
 * Displays charts and statistics. Now includes a manager-specific chart.
 * @param {object} props - Component props
 * @param {Array} [props.activities=[]] - Array of activities
 * @param {Array} [props.leads=[]] - Array of leads
 * @param {Array} [props.allUsers=[]] - Array of all users (for manager view)
 * @param {object} props.currentUser - The currently logged-in user object
 * @returns {JSX.Element} The rendered reports screen
 */
const ReportsScreen = ({ activities = [], leads = [], allUsers = [], currentUser }) => {

    const managementRoles = ['super_admin', 'admin', 'branch_manager', 'unit_manager'];
    const isManagerView = currentUser && managementRoles.includes(currentUser.role);

    // Memoized calculation for all-time stats
    const allTimeStats = useMemo(() => {
        const totalPoints = activities.reduce((sum, a) => sum + (a.points || 0), 0);
        const totalApi = activities.reduce((sum, a) => sum + (a.api || 0), 0);
        return {
            totalLeads: leads.length,
            totalActivities: activities.length,
            totalPoints,
            totalApi,
        };
    }, [activities, leads]);

    // Memoized calculation for the weekly points chart
    const weeklyChartData = useMemo(() => {
        const weeks = {};
        
        activities.forEach(activity => {
            const activityDate = activity.timestamp?.toDate();
            if (!activityDate) return;

            const day = activityDate.getDay();
            const diff = activityDate.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(activityDate.setDate(diff));
            startOfWeek.setHours(0, 0, 0, 0);
            
            const weekKey = startOfWeek.toLocaleDateString();

            if (!weeks[weekKey]) {
                weeks[weekKey] = { name: `Week of ${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`, points: 0 };
            }
            weeks[weekKey].points += activity.points || 0;
        });

        return Object.values(weeks)
            .sort((a, b) => new Date(a.name.split(' ')[2]) - new Date(b.name.split(' ')[2]))
            .slice(-8);

    }, [activities]);

    // --- NEW: Calculation for the Points by Agent Chart ---
    const pointsByAgentData = useMemo(() => {
        if (!isManagerView) return [];

        const userScores = allUsers.map(user => {
            const userActivities = activities.filter(a => a.userId === user.id);
            const totalPoints = userActivities.reduce((sum, activity) => sum + (activity.points || 0), 0);
            return {
                name: user.name.split(' ')[0], // Use first name for chart label
                points: totalPoints,
            };
        });

        return userScores.sort((a, b) => b.points - a.points);
    }, [activities, allUsers, isManagerView]);

    // Calculation for the Lead Funnel Chart
    const leadFunnelData = useMemo(() => {
        const stageCounts = {};
        Object.values(LEAD_STAGES).forEach(stage => {
            stageCounts[stage] = 0;
        });

        leads.forEach(lead => {
            if (lead.status && stageCounts.hasOwnProperty(lead.status)) {
                stageCounts[lead.status]++;
            }
        });
        
        return Object.entries(stageCounts).map(([stage, count], index) => ({
            name: stage,
            value: count,
            fill: `hsl(${200 + (index * 20)}, 70%, 50%)`,
        }));

    }, [leads]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Performance Reports</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Target />} label="Total Leads" value={allTimeStats.totalLeads.toLocaleString()} />
                <StatCard icon={<FileText />} label="Total Activities" value={allTimeStats.totalActivities.toLocaleString()} />
                <StatCard icon={<Award />} label="Total Points" value={allTimeStats.totalPoints.toLocaleString()} />
                <StatCard icon={<TrendingUp />} label="Total API" value={`$${allTimeStats.totalApi.toLocaleString()}`} />
            </div>

            {/* --- NEW: Points by Agent Chart (Manager View Only) --- */}
            {isManagerView && (
                <Card>
                    <h3 className="font-bold text-lg mb-4 flex items-center"><Users className="mr-2" size={20}/> All-Time Points by Agent</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={pointsByAgentData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                                <YAxis stroke="#A0AEC0" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#F7FAFC' }}
                                />
                                <Bar dataKey="points" fill="#8884d8" name="Total Points" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            <Card>
                <h3 className="font-bold text-lg mb-4 flex items-center"><Filter className="mr-2" size={20}/> Lead Conversion Funnel</h3>
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <FunnelChart>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#F7FAFC' }}
                            />
                            <Funnel
                                dataKey="value"
                                data={leadFunnelData}
                                isAnimationActive
                            >
                                <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                                <LabelList position="center" fill="#fff" stroke="none" dataKey="value" formatter={(value) => value.toLocaleString()} />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card>
                <h3 className="font-bold text-lg mb-4">Weekly Points Summary</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                            <YAxis stroke="#A0AEC0" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#F7FAFC' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="points" fill="#FBBF24" name="Points Earned" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <Card>
        <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-gray-700 rounded-full mb-2 text-amber-400">
                {icon}
            </div>
            <p className="font-bold text-2xl">{value}</p>
            <p className="text-gray-400 text-sm">{label}</p>
        </div>
    </Card>
);

export default ReportsScreen;
