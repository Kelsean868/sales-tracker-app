import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, Users } from 'lucide-react';
import Papa from 'papaparse';
import Card from '../ui/Card';

// Constants
const TIME_RANGES = {
    '7': 'Last 7 Days',
    '30': 'Last 30 Days',
    '90': 'Last 90 Days',
    '365': 'Last Year',
    'all': 'All Time',
};

const TABS = ['Sales', 'Activity', 'Team'];

// Helper Functions
const classNames = (...classes) => classes.filter(Boolean).join(' ');

const downloadCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const ReportsScreen = ({ activities = [], leads = [], policies = [], allUsers = [], currentUser }) => {
    const [activeTab, setActiveTab] = useState('Sales');
    const [timeRange, setTimeRange] = useState('30');
    const [selectedTeamMember, setSelectedTeamMember] = useState('all');

    const isManager = useMemo(() => 
        ['TEAM_LEAD', 'UNIT_MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role),
        [currentUser.role]
    );

    const teamMembers = useMemo(() => {
        if (!isManager) return [];
        // Add logic to filter users based on manager's hierarchy
        return allUsers.filter(u => u.teamId === currentUser.teamId);
    }, [isManager, allUsers, currentUser]);

    const filteredData = useMemo(() => {
        const now = new Date();
        const timeLimit = timeRange === 'all' ? 0 : now.setDate(now.getDate() - parseInt(timeRange));

        const filterByDate = (item) => {
            if (timeRange === 'all') return true;
            const itemDate = item.timestamp || item.createdAt;
            if (!itemDate || typeof itemDate.getTime !== 'function') return false;
            return itemDate.getTime() > timeLimit;
        };

        const filterByUser = (item) => {
            if (!isManager || selectedTeamMember === 'all') return item.userId === currentUser.uid;
            return item.userId === selectedTeamMember;
        };
        
        const managerFilter = (item) => {
             if (!isManager) return item.userId === currentUser.uid;
             if(selectedTeamMember !== 'all') return item.userId === selectedTeamMember;
             const teamMemberIds = teamMembers.map(m => m.id);
             return [...teamMemberIds, currentUser.uid].includes(item.userId);
        }

        return {
            activities: activities.filter(managerFilter).filter(filterByDate),
            leads: leads.filter(managerFilter).filter(filterByDate),
            policies: policies.filter(managerFilter).filter(filterByDate),
        };

    }, [timeRange, selectedTeamMember, activities, leads, policies, currentUser, isManager, teamMembers]);
    
    const handleExport = () => {
        let dataToExport, filename;
        switch(activeTab){
            case 'Sales':
                dataToExport = filteredData.policies.map(p => ({
                    PolicyID: p.id,
                    Premium: p.premium,
                    Type: p.type,
                    Date: p.createdAt.toLocaleDateString(),
                }));
                filename = 'sales_report.csv';
                break;
            case 'Activity':
                dataToExport = filteredData.activities.map(a => ({
                    ActivityID: a.id,
                    Type: a.type,
                    Points: a.points,
                    Date: a.timestamp.toLocaleDateString(),
                }));
                 filename = 'activity_report.csv';
                break;
            case 'Team':
                 dataToExport = teamMembers.map(user => {
                    const userActivities = filteredData.activities.filter(a => a.userId === user.id);
                    return {
                        User: user.name,
                        Activities: userActivities.length,
                        Points: userActivities.reduce((sum, act) => sum + (act.points || 0), 0),
                    }
                 })
                 filename = 'team_report.csv';
                break;
            default: return;
        }
        downloadCSV(dataToExport, filename);
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Reports</h1>
                <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Time Range Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-gray-400" />
                        <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="bg-gray-700 border-gray-600 rounded-md p-2">
                            {Object.entries(TIME_RANGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </div>

                    {/* Team Member Filter (for managers) */}
                    {isManager && (
                         <div className="flex items-center gap-2">
                            <Users size={20} className="text-gray-400" />
                             <select value={selectedTeamMember} onChange={e => setSelectedTeamMember(e.target.value)} className="bg-gray-700 border-gray-600 rounded-md p-2">
                                <option value="all">All Team</option>
                                 {teamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                             </select>
                         </div>
                    )}
                </div>
            </Card>

            <div>
                <div className="border-b border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={classNames(
                                    tab === activeTab
                                        ? 'border-amber-500 text-amber-500'
                                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500',
                                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="mt-6">
                {activeTab === 'Sales' && <SalesReports data={filteredData} />}
                {activeTab === 'Activity' && <ActivityReports data={filteredData} />}
                {activeTab === 'Team' && isManager && <TeamReports data={filteredData} users={teamMembers} />}
            </div>
        </div>
    );
};

// Report Section Components
const SalesReports = ({ data }) => {
    const premiumByDay = useMemo(() => {
        const res = {};
        data.policies.forEach(p => {
            const day = p.createdAt.toLocaleDateString();
            if(!res[day]) res[day] = { name: day, premium: 0 };
            res[day].premium += p.premium;
        });
        return Object.values(res);
    }, [data.policies]);

    const policiesByType = useMemo(() => {
         const res = {};
         data.policies.forEach(p => {
            if(!res[p.type]) res[p.type] = { name: p.type, value: 0 };
            res[p.type].value += 1;
        });
        return Object.values(res);
    }, [data.policies])

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <h3 className="font-bold text-lg mb-4">Premium Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={premiumByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                        <YAxis stroke="#A0AEC0" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748' }} />
                        <Line type="monotone" dataKey="premium" stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                 <h3 className="font-bold text-lg mb-4">Policies by Type</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={policiesByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                             {policiesByType.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748' }} />
                        <Legend />
                    </PieChart>
                 </ResponsiveContainer>
            </Card>
        </div>
    )
}

const ActivityReports = ({ data }) => {
     const pointsByDay = useMemo(() => {
        const res = {};
        data.activities.forEach(a => {
            const day = a.timestamp.toLocaleDateString();
            if(!res[day]) res[day] = { name: day, points: 0 };
            res[day].points += (a.points || 0);
        });
        return Object.values(res);
    }, [data.activities]);

    const activityByType = useMemo(() => {
        const res = {};
        data.activities.forEach(a => {
            if(!res[a.type]) res[a.type] = { name: a.type, count: 0 };
            res[a.type].count += 1;
        });
        return Object.values(res);
    }, [data.activities]);
    
    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <h3 className="font-bold text-lg mb-4">Points Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pointsByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                        <YAxis stroke="#A0AEC0" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748' }} />
                        <Bar dataKey="points" fill="#FBBF24" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                <h3 className="font-bold text-lg mb-4">Activity Volume by Type</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={activityByType} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis type="number" stroke="#A0AEC0" fontSize={12} />
                        <YAxis type="category" dataKey="name" stroke="#A0AEC0" fontSize={12} width={80}/>
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748' }} />
                        <Bar dataKey="count" fill="#00C49F" />
                    </BarChart>
                 </ResponsiveContainer>
            </Card>
        </div>
    )
}

const TeamReports = ({ data, users }) => {
    const teamPerformance = useMemo(() => {
        return users.map(user => {
            const userActivities = data.activities.filter(a => a.userId === user.id);
            const userPolicies = data.policies.filter(p => p.userId === user.id);
            return {
                name: user.name,
                points: userActivities.reduce((sum, act) => sum + (act.points || 0), 0),
                premium: userPolicies.reduce((sum, pol) => sum + pol.premium, 0),
                activities: userActivities.length,
            };
        });
    }, [data, users]);

    return (
        <Card>
            <h3 className="font-bold text-lg mb-4">Team Performance</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip contentStyle={{ backgroundColor: '#2D3748' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="points" fill="#8884d8" name="Total Points"/>
                    <Bar yAxisId="right" dataKey="premium" fill="#82ca9d" name="Total Premium"/>
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
};


export default ReportsScreen;