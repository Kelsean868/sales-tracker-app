import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Target, TrendingUp, Award } from 'lucide-react';
import Card from '../ui/Card';

/**
 * ReportsScreen component
 * Displays charts and statistics based on user or team performance.
 * @param {object} props - Component props
 * @param {Array} [props.activities=[]] - Array of activities
 * @param {Array} [props.leads=[]] - Array of leads
 * @returns {JSX.Element} The rendered reports screen
 */
const ReportsScreen = ({ activities = [], leads = [] }) => {

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
        const now = new Date();

        activities.forEach(activity => {
            const activityDate = activity.timestamp?.toDate();
            if (!activityDate) return;

            // Find the start of the week for this activity
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

        // Sort by week and take the last 8 weeks for the chart
        return Object.values(weeks)
            .sort((a, b) => new Date(a.name.split(' ')[2]) - new Date(b.name.split(' ')[2]))
            .slice(-8);

    }, [activities]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Performance Reports</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Target />} label="Total Leads" value={allTimeStats.totalLeads.toLocaleString()} />
                <StatCard icon={<FileText />} label="Total Activities" value={allTimeStats.totalActivities.toLocaleString()} />
                <StatCard icon={<Award />} label="Total Points" value={allTimeStats.totalPoints.toLocaleString()} />
                <StatCard icon={<TrendingUp />} label="Total API" value={`$${allTimeStats.totalApi.toLocaleString()}`} />
            </div>

            {/* Weekly Performance Chart */}
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

// Sub-component for individual stat cards
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
