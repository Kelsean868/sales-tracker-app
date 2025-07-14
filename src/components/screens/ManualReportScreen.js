import React, { useState, useMemo } from 'react';
import { Calendar, Save } from 'lucide-react';
import Card from '../ui/Card';
import { ACTIVITY_POINTS_SYSTEM } from '../../constants';

const ManualReportScreen = ({ currentUser, onLogActivity, addToast }) => {
    const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [activityCounts, setActivityCounts] = useState({});
    const [salesDetails, setSalesDetails] = useState([]);

    const allActivitiesMap = useMemo(() => {
        const map = new Map();
        Object.values(ACTIVITY_POINTS_SYSTEM).forEach(categoryActivities => {
            categoryActivities.forEach(activity => {
                map.set(activity.name, activity);
            });
        });
        return map;
    }, []);

    const handleCountChange = (activityName, count) => {
        const newCount = Math.max(0, parseInt(count, 10) || 0);
        setActivityCounts(prev => ({ ...prev, [activityName]: newCount }));

        if (activityName === "Sale Closed (Apps filled, premium collected)") {
            const currentSales = salesDetails.length;
            if (newCount > currentSales) {
                const newSales = Array(newCount - currentSales).fill({ api: '', cashCollected: '', isOrphan: false });
                setSalesDetails(prev => [...prev, ...newSales]);
            } else if (newCount < currentSales) {
                setSalesDetails(prev => prev.slice(0, newCount));
            }
        }
    };

    const handleSaleDetailChange = (index, field, value) => {
        setSalesDetails(prev => {
            const newSales = [...prev];
            newSales[index] = { ...newSales[index], [field]: value };
            return newSales;
        });
    };
    
    const handleSubmit = async () => {
        const timestamp = new Date(reportDate);
        if (isNaN(timestamp.getTime())) {
            addToast("Invalid date selected.", "error");
            return;
        }

        const activitiesToLog = [];

        for (const [activityName, count] of Object.entries(activityCounts)) {
            const activityDef = allActivitiesMap.get(activityName);
            if (activityDef && count > 0) {
                for (let i = 0; i < count; i++) {
                    const activityLog = {
                        type: activityDef.name,
                        details: `Manual entry for ${activityDef.name} on ${reportDate}`,
                        points: activityDef.points,
                        timestamp: timestamp,
                        isScheduled: false,
                        summaryKey: activityDef.summaryKey,
                    };

                    if (activityName === "Sale Closed (Apps filled, premium collected)" && salesDetails[i]) {
                        activityLog.apiValue = parseFloat(salesDetails[i].api) || 0;
                        activityLog.cashCollected = parseFloat(salesDetails[i].cashCollected) || 0;
                        activityLog.isOrphanSale = salesDetails[i].isOrphan || false;
                    }
                    activitiesToLog.push(activityLog);
                }
            }
        }

        if (activitiesToLog.length === 0) {
            addToast("No activities entered for the report.", "info");
            return;
        }

        try {
            await onLogActivity(activitiesToLog);
            addToast("Report submitted successfully!", "success");
            setActivityCounts({});
            setSalesDetails([]);
        } catch (error) {
            addToast(`Error submitting report: ${error.message}`, "error");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Manual Report Entry</h1>
            <Card>
                <div className="p-4">
                    <label htmlFor="report-date" className="block text-sm font-medium text-gray-400 mb-2 flex items-center"><Calendar className="mr-2" />Report Date</label>
                    <input type="date" id="report-date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2"/>
                </div>
            </Card>

            {Object.entries(ACTIVITY_POINTS_SYSTEM).map(([category, activities]) => (
                <Card key={category}>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-4">{category}</h3>
                        <div className="space-y-4">
                            {activities.map(activity => (
                                <div key={activity.name}>
                                    <div className="flex justify-between items-center">
                                        <label htmlFor={activity.name}>{activity.name}</label>
                                        <input type="number" id={activity.name} min="0" value={activityCounts[activity.name] || ''} onChange={e => handleCountChange(activity.name, e.target.value)} className="w-24 bg-gray-700 p-1 rounded-md text-right"/>
                                    </div>
                                    {activity.name === "Sale Closed (Apps filled, premium collected)" && (activityCounts[activity.name] || 0) > 0 && (
                                        <div className="pl-6 mt-2 space-y-2">
                                            {salesDetails.map((sale, index) => (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-md">
                                                    <input type="number" placeholder="API" value={sale.api} onChange={e => handleSaleDetailChange(index, 'api', e.target.value)} className="w-full bg-gray-700 p-1 rounded-md"/>
                                                    <input type="number" placeholder="Cash" value={sale.cashCollected} onChange={e => handleSaleDetailChange(index, 'cashCollected', e.target.value)} className="w-full bg-gray-700 p-1 rounded-md"/>
                                                    <label className="flex items-center text-sm">
                                                        <input type="checkbox" checked={sale.isOrphan} onChange={e => handleSaleDetailChange(index, 'isOrphan', e.target.checked)} className="h-4 w-4 mr-1"/>
                                                        Orphan
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            ))}

            <div className="flex justify-end">
                <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md flex items-center"><Save className="mr-2"/>Submit Report</button>
            </div>
        </div>
    );
};

export default ManualReportScreen;
