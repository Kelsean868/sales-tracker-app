import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, DollarSign, FileSignature, UserPlus } from 'lucide-react';
import Card from '../ui/Card';

// Charting components need to be created or imported if they don't exist
const PieChart = ({ data, options }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
        if (!window.Chart || !canvasRef.current) return;
        const chart = new window.Chart(canvasRef.current, { type: 'pie', data, options });
        return () => chart.destroy();
    }, [data, options]);
    return <canvas ref={canvasRef} style={{maxHeight: '250px'}}></canvas>;
};

const ReportsScreen = ({ userId, activities, clients }) => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const setDatePreset = (preset) => {
        const end = new Date();
        let start = new Date();
        switch (preset) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                start.setDate(start.getDate() - start.getDay());
                start.setHours(0, 0, 0, 0);
                break;
            case 'monthly':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'quarterly':
                start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'ytd':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                break;
            default: break;
        }
        setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
    };

    const generateReport = () => {
        if (!dateRange.start || !dateRange.end) return;
        setLoading(true);

        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);

        const filteredActivities = activities.filter(act => {
            const actDate = act.createdTimestamp?.toDate();
            return actDate && actDate >= start && actDate <= end;
        });

        const filteredClients = clients.filter(c => {
            const createDate = c.createdTimestamp?.toDate();
            return createDate && createDate >= start && createDate <= end;
        });

        const totalApi = filteredActivities
            .filter(a => a.type === "Sale Closed (Apps filled, premium collected)")
            .reduce((sum, act) => sum + (act.api || 0), 0);

        const totalApps = filteredActivities
            .filter(a => a.summaryKey === 'applications')
            .length;

        const activityByCategory = filteredActivities.reduce((acc, act) => {
            const category = act.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        
        const categoryData = {
            labels: Object.keys(activityByCategory),
            datasets: [{
                data: Object.values(activityByCategory),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            }]
        };

        setReport({
            totalActivities: filteredActivities.length,
            totalApi,
            totalApps,
            newClients: filteredClients.length,
            categoryData,
        });
        setLoading(false);
    };
    
    const KPI_Card = ({ title, value, icon }) => (
        <Card className="text-center">
            <div className="text-amber-400 mb-2">{icon}</div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400">{title}</p>
        </Card>
    );

    return (
        <div className="p-4 pt-20 pb-24">
            <h1 className="text-2xl font-bold text-white mb-4">Reports</h1>
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2"/>
                    </div>
                </div>
                 <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={() => setDatePreset('today')} className="flex-grow p-2 rounded-md text-xs font-semibold bg-gray-600">Today</button>
                    <button onClick={() => setDatePreset('weekly')} className="flex-grow p-2 rounded-md text-xs font-semibold bg-gray-600">This Week</button>
                    <button onClick={() => setDatePreset('monthly')} className="flex-grow p-2 rounded-md text-xs font-semibold bg-gray-600">This Month</button>
                    <button onClick={() => setDatePreset('quarterly')} className="flex-grow p-2 rounded-md text-xs font-semibold bg-gray-600">This Quarter</button>
                    <button onClick={() => setDatePreset('ytd')} className="flex-grow p-2 rounded-md text-xs font-semibold bg-gray-600">YTD</button>
                </div>
                <button onClick={generateReport} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-4 rounded-md disabled:bg-gray-500">
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            </Card>

            {report && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPI_Card title="Total Activities" value={report.totalActivities} icon={<ClipboardList className="w-8 h-8 mx-auto"/>} />
                        <KPI_Card title="API Submitted" value={`$${report.totalApi.toLocaleString()}`} icon={<DollarSign className="w-8 h-8 mx-auto"/>} />
                        <KPI_Card title="Apps Submitted" value={report.totalApps} icon={<FileSignature className="w-8 h-8 mx-auto"/>} />
                        <KPI_Card title="New Clients" value={report.newClients} icon={<UserPlus className="w-8 h-8 mx-auto"/>} />
                    </div>
                    <Card>
                        <h3 className="text-xl font-bold text-white mb-3 text-center">Activities by Category</h3>
                        <PieChart data={report.categoryData} options={{ responsive: true, plugins: { legend: { position: 'top' }}}} />
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ReportsScreen;
