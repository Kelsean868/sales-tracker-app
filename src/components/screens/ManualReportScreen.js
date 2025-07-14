import React, { useState, useMemo } from 'react';
import { Calendar, Save, ArrowLeft } from 'lucide-react';
import Card from '../ui/Card';
import { ACTIVITY_POINTS_SYSTEM, REPORT_SUMMARY_CATEGORIES } from '../../constants';

// Helper to get the Sunday (YYYY-MM-DD) of the week for a given date
const getSundayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
    const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const diff = (dayOfWeek === 0) ? 0 : -dayOfWeek; // Days to subtract to get to the most recent Sunday
    const sunday = new Date(date.setDate(date.getDate() + diff));
    return sunday.toISOString().slice(0, 10);
};

const ManualReportScreen = ({ currentUser, onLogActivity, addToast }) => {
    const [reportType, setReportType] = useState('Daily'); // 'Daily', 'Weekly', 'Monthly'
    const [reportDate, setReportDate] = useState(() => {
        const today = new Date();
        return today.toISOString().slice(0, 10);
    }); // YYYY-MM-DD for Daily/Weekly, YYYY-MM-01 for Monthly
    const [activityCounts, setActivityCounts] = useState({});
    const [salesDetails, setSalesDetails] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [activitiesToSubmit, setActivitiesToSubmit] = useState([]);

    const allActivitiesMap = useMemo(() => {
        const map = new Map();
        Object.values(ACTIVITY_POINTS_SYSTEM).forEach(categoryActivities => {
            categoryActivities.forEach(activity => {
                map.set(activity.name, activity);
            });
        });
        return map;
    }, []);

    const totalPoints = useMemo(() => {
        let points = 0;
        for (const [activityName, count] of Object.entries(activityCounts)) {
            const activityDef = allActivitiesMap.get(activityName);
            if (activityDef && count > 0) {
                points += activityDef.points * count;
            }
        }
        return points;
    }, [activityCounts, allActivitiesMap]);

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
            // Ensure API and Cash Collected are treated as numbers, default to 0 if blank
            newSales[index] = { 
                ...newSales[index], 
                [field]: (field === 'api' || field === 'cashCollected') ? (parseFloat(value) || 0) : value 
            };
            return newSales;
        });
    };
    
    const prepareActivitiesForSubmission = () => {
        let timestamp;
        let displayDate;

        if (reportType === 'Daily') {
            timestamp = new Date(reportDate + 'T00:00:00');
            displayDate = reportDate;
        } else if (reportType === 'Weekly') {
            const sundayOfWeek = getSundayOfWeek(reportDate);
            timestamp = new Date(sundayOfWeek + 'T00:00:00');
            
            // For display, show the range Sunday-Saturday
            const sunday = new Date(timestamp);
            const saturday = new Date(sunday);
            saturday.setDate(sunday.getDate() + 6); 
            displayDate = `${sunday.toISOString().slice(0, 10)} to ${saturday.toISOString().slice(0, 10)}`;

        } else if (reportType === 'Monthly') {
            timestamp = new Date(reportDate + '-01' + 'T00:00:00');
            displayDate = reportDate.slice(0, 7); // YYYY-MM
        }

        if (isNaN(timestamp.getTime())) {
            addToast("Invalid date selected.", "error");
            return [];
        }

        const activitiesToLog = [];

        for (const [activityName, count] of Object.entries(activityCounts)) {
            const activityDef = allActivitiesMap.get(activityName);
            if (activityDef && count > 0) {
                for (let i = 0; i < count; i++) {
                    const activityLog = {
                        type: activityDef.name,
                        details: `Manual entry for ${activityDef.name} for ${reportType} Report covering ${displayDate}`,
                        points: activityDef.points,
                        timestamp: timestamp,
                        isScheduled: false,
                        summaryKey: activityDef.summaryKey,
                        reportType: reportType,
                        reportPeriodDisplay: displayDate, // To show in summary
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
        return activitiesToLog;
    };

    const handleReviewReport = () => {
        const preparedActivities = prepareActivitiesForSubmission();
        if (preparedActivities.length === 0) {
            addToast("No activities entered for the report.", "info");
            return;
        }
        setActivitiesToSubmit(preparedActivities);
        setShowSummary(true);
    };

    const handleFinalSubmit = async () => {
        try {
            await onLogActivity(activitiesToSubmit);
            addToast("Report submitted successfully!", "success");
            setActivityCounts({});
            setSalesDetails([]);
            setActivitiesToSubmit([]);
            setShowSummary(false);
        } catch (error) {
            addToast(`Error submitting report: ${error.message}`, "error");
        }
    };

    const handleReportTypeChange = (type) => {
        setReportType(type);
        const today = new Date();
        if (type === 'Daily') {
            setReportDate(today.toISOString().slice(0, 10));
        } else if (type === 'Weekly') {
            // Set to current date, getSundayOfWeek will handle finding the Sunday
            setReportDate(today.toISOString().slice(0, 10));
        } else if (type === 'Monthly') {
            setReportDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
        }
    };

    // Aggregate activities for summary display
    const summarizedActivities = useMemo(() => {
        const summary = {};

        // Initialize all summary items based on REPORT_SUMMARY_CATEGORIES
        Object.values(REPORT_SUMMARY_CATEGORIES).flat().forEach(item => {
            summary[item.key] = {
                count: 0,
                points: 0,
                sales: [], // Only for sales category, initialized here
                isCurrency: item.isCurrency || false,
                isTime: item.isTime || false,
                label: item.label,
            };
        });

        activitiesToSubmit.forEach(activity => {
            const key = activity.summaryKey;
            if (summary[key]) {
                summary[key].count += 1;
                summary[key].points += activity.points;
                // Special handling for sales_closed to populate its sales array
                if (activity.type === "Sale Closed (Apps filled, premium collected)") {
                    summary["sales_closed"].sales.push({
                        api: activity.apiValue,
                        cashCollected: activity.cashCollected,
                        isOrphan: activity.isOrphanSale
                    });
                }
            }
        });

        // Special calculations for combined or derived metrics
        summary.prospecting_calls.count = (summary.prospecting_calls_old?.count || 0) + (summary.prospecting_calls_new?.count || 0);
        summary.prospecting_calls.points = (summary.prospecting_calls_old?.points || 0) + (summary.prospecting_calls_new?.points || 0);

        summary.appointments_cancelled.count = (summary.appointments_booked?.count || 0) - (summary.appointments_conducted?.count || 0);
        summary.appointments_cancelled.points = (summary.appointments_booked?.points || 0) - (summary.appointments_conducted?.points || 0);

        summary.closing_interviews_cancelled.count = (summary.closing_interviews_booked?.count || 0) - (summary.closing_interviews_conducted?.count || 0);
        summary.closing_interviews_cancelled.points = (summary.closing_interviews_booked?.points || 0) - (summary.closing_interviews_conducted?.points || 0);

        // Calculate total API and Cash Collected for the sales_closed summary item
        // Ensure these calculations are based on the populated sales_closed.sales array
        if (summary.sales_closed) {
            const totalApi = summary.sales_closed.sales.reduce((acc, sale) => acc + (sale.api || 0), 0);
            const totalCashCollected = summary.sales_closed.sales.reduce((acc, sale) => acc + (sale.cashCollected || 0), 0);
            const totalSalesWithCash = summary.sales_closed.sales.filter(sale => (sale.cashCollected || 0) > 0).length;

            // Assign to the appropriate summary keys
            if (summary.api_cash_collected) {
                summary.api_cash_collected.count = totalApi;
                // Note: The original ClockOutModal uses 'points' for cashCollected here.
                // Keeping it consistent, but logically 'count' for API and 'points' for cashCollected might be confusing.
                // For parity, let's keep it as per ClockOutModal.
                summary.api_cash_collected.points = totalCashCollected; 
            }
            if (summary.sales_with_cash) {
                summary.sales_with_cash.count = totalSalesWithCash;
            }
        }

        return summary;
    }, [activitiesToSubmit]);

    // Calculate total points for summary display
    const summaryTotalPoints = useMemo(() => {
        let points = 0;
        for (const activity of activitiesToSubmit) {
            points += activity.points;
        }
        return points;
    }, [activitiesToSubmit]);

    const displayReportPeriod = activitiesToSubmit.length > 0 ? activitiesToSubmit[0].reportPeriodDisplay : '';


    if (showSummary) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Review Report Summary</h1>
                <Card>
                    <div className="p-4">
                        <p className="text-lg font-semibold mb-2">Report Type: <span className="text-amber-400">{reportType}</span></p>
                        <p className="text-lg font-semibold">Period: <span className="text-amber-400">{displayReportPeriod}</span></p>
                        <p className="text-3xl font-bold text-amber-400 mt-4">{summaryTotalPoints} Points</p>
                        <p className="text-sm text-gray-400">Total Points for this Report</p>
                    </div>
                </Card>

                {Object.entries(REPORT_SUMMARY_CATEGORIES).map(([category, items]) => (
                    <div key={category}>
                        <div className="bg-gray-700/50 rounded-lg">
                            <h4 className="text-lg font-semibold p-3 border-b border-gray-600">{category}</h4>
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-gray-700">
                                    {items.map(item => (
                                        <tr key={item.key}>
                                            <td className="p-3 text-gray-300">{item.label}</td>
                                            <td className="p-3 text-right font-bold text-white">
                                                {item.isCurrency ? `$${(summarizedActivities[item.key]?.count || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : (summarizedActivities[item.key]?.count || 0)}
                                                {item.isTime && ' hrs'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {category === "Sales" && summarizedActivities.sales_closed?.sales.length > 0 && (
                            <div className="bg-gray-700/50 rounded-lg mt-4">
                                <h4 className="text-lg font-semibold p-3 border-b border-gray-600">Detailed Sales (Sale Closed)</h4>
                                <div className="p-3">
                                    {summarizedActivities.sales_closed.sales.map((sale, index) => (
                                        <div key={index} className="bg-gray-800/50 p-2 rounded-md mb-2 last:mb-0">
                                            <p>API: ${sale.api.toFixed(2)}</p>
                                            <p>Cash Collected: ${sale.cashCollected.toFixed(2)}</p>
                                            <p>Orphan Sale: {sale.isOrphan ? 'Yes' : 'No'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div className="flex justify-between mt-6">
                    <button onClick={() => setShowSummary(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md flex items-center">
                        <ArrowLeft className="mr-2" />Go Back & Edit
                    </button>
                    <button onClick={handleFinalSubmit} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md flex items-center">
                        <Save className="mr-2" />Confirm & Submit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Manual Report Entry</h1>
            <Card>
                <div className="p-4">
                    <div className="flex justify-around mb-4">
                        <button onClick={() => handleReportTypeChange('Daily')} className={`py-2 px-4 rounded-md ${reportType === 'Daily' ? 'bg-amber-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            Daily
                        </button>
                        <button onClick={() => handleReportTypeChange('Weekly')} className={`py-2 px-4 rounded-md ${reportType === 'Weekly' ? 'bg-amber-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            Weekly
                        </button>
                        <button onClick={() => handleReportTypeChange('Monthly')} className={`py-2 px-4 rounded-md ${reportType === 'Monthly' ? 'bg-amber-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            Monthly
                        </button>
                    </div>
                    <label htmlFor="report-date" className="block text-sm font-medium text-gray-400 mb-2 flex items-center"><Calendar className="mr-2" />Report Date</label>
                    {(reportType === 'Daily' || reportType === 'Weekly') && (
                        <input 
                            type="date" 
                            id="report-date" 
                            value={reportDate} 
                            onChange={e => setReportDate(e.target.value)} 
                            className="w-full bg-gray-700 border-gray-600 rounded-md p-2"
                        />
                    )}
                    {reportType === 'Monthly' && (
                        <input type="month" id="report-date" value={reportDate.slice(0, 7)} onChange={e => setReportDate(e.target.value + '-01')} className="w-full bg-gray-700 border-gray-600 rounded-md p-2"/>
                    )}
                </div>
            </Card>

            <Card>
                <div className="p-4 text-center">
                    <h3 className="text-3xl font-bold text-amber-400">{totalPoints} Points</h3>
                    <p className="text-sm text-gray-400">Total Points for this Report</p>
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
                                        <input 
                                            type="number" 
                                            id={activity.name} 
                                            min="0" 
                                            value={activityCounts[activity.name] || ''} 
                                            onChange={e => handleCountChange(activity.name, e.target.value)} 
                                            className="w-24 bg-gray-700 p-1 rounded-md text-right"
                                        />
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
                <button onClick={handleReviewReport} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md flex items-center"><Save className="mr-2"/>Review Report</button>
            </div>
        </div>
    );
};

export default ManualReportScreen;