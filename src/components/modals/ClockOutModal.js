import React, { useState, useEffect, useMemo } from 'react';
import { X, List, ArrowRight, ArrowLeft, Award, Star, ThumbsUp, Plus, Trash2 } from 'lucide-react';
import { ACTIVITY_POINTS_SYSTEM } from '../../constants';

const SUMMARY_ITEMS = {
    "Prospecting Activities (other than calls)": [
        { "label": "Prospecting emails sent", "key": "prospecting_outreach" },
        { "label": "Seminars Booked", "key": "seminars_booked" },
        { "label": "Seminars Conducted", "key": "seminars_conducted" },
        { "label": "Trade shows Booked", "key": "trade_shows_booked" },
        { "label": "Trade shows Attended", "key": "trade_shows_attended" },
        { "label": "Social Media Posts", "key": "social_media_posts" },
        { "label": "Time spent Cold Canvasing", "key": "time_spent_cold_canvasing", "isTime": true },
        { "label": "Time spent Online Prospecting", "key": "time_spent_online_prospecting", "isTime": true },
    ],
    "Prospecting Calls": [
        { "label": "Total", "key": "prospecting_calls" },
        { "label": "Old", "key": "prospecting_calls_old" },
        { "label": "New", "key": "prospecting_calls_new" },
    ],
    "Appointments": [
        { "label": "Booked", "key": "appointments_booked" },
        { "label": "Cancelled/Postponed", "key": "appointments_cancelled" },
        { "label": "Conducted", "key": "appointments_conducted" },
    ],
    "FFI (Fact Find Interviews)": [
        { "label": "Booked", "key": "ffi_booked" },
        { "label": "Conducted", "key": "ffi_conducted" },
    ],
    "Solutions": [
        { "label": "Presented", "key": "solutions_presented" },
    ],
    "Closing Interviews": [
        { "label": "Booked", "key": "closing_interviews_booked" },
        { "label": "Conducted", "key": "closing_interviews_conducted" },
        { "label": "Postponed/Cancelled", "key": "closing_interviews_cancelled" },
    ],
    "Sales": [
        { "label": "Potential Sales where Prospect/s agree to buy (in the future months)", "key": "sales_agreed_future" },
        { "label": "Potential Sales where Prospect/s agree to buy (within the current month)", "key": "sales_agreed_now" },
        { "label": "API Potential of new sales (no cash collected)", "key": "api_potential_no_cash" },
        { "label": "API of New sales (cash collected)", "key": "api_cash_collected", "isCurrency": true },
        { "label": "Sales made with cash collected", "key": "sales_with_cash" },
        { "label": "Number of Applications", "key": "apps_submitted" },
        { "label": "Number of New Clients", "key": "new_clients" },
    ],
    "New Names": [
        { "label": "Referrals", "key": "referrals_earned" },
        { "label": "Names from Seminars Conducted", "key": "names_from_seminars" },
        { "label": "Names from Trade shows", "key": "names_from_trade_shows" },
        { "label": "Names from Cold Canvasing", "key": "names_from_cold_canvasing" },
        { "label": "Names from Online Prospecting", "key": "names_from_online_prospecting" },
        { "label": "Names from Social Media Posts", "key": "names_from_social_media" },
        { "label": "Names from Other", "key": "names_from_other" },
    ],
    "Servicing Activities": [
        { "label": "Premium Arrears Collected", "key": "premiums_paid" },
        { "label": "Reinstatements Completed", "key": "policies_reinstated" },
        { "label": "Orphans Adopted", "key": "service_reviews_submitted" },
        { "label": "Other", "key": "other_servicing_activities" },
    ]
};

const ClockOutModal = ({ isOpen, onClose, onClockOut, user, activities }) => {
    const [page, setPage] = useState(1);
    const [summaryNotes, setSummaryNotes] = useState('');
    const [planNotes, setPlanNotes] = useState('');
    const [dailySummary, setDailySummary] = useState({});
    const [tomorrowPlan, setTomorrowPlan] = useState([]);
    const [timeAndExpense, setTimeAndExpense] = useState({
        timeOnField: 0,
        timeInOffice: 0,
        expenses: 0,
    });
    const [orphanSales, setOrphanSales] = useState({
        any: false,
        apiPotential: 0,
        applications: 0,
    });

    useEffect(() => {
        if (isOpen && user && activities) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaysActivities = activities.filter(activity => {
                const activityDate = new Date(activity.timestamp);
                return activity.userId === user.uid && activityDate >= today;
            });
            
            const summary = {};
            Object.values(SUMMARY_ITEMS).flat().forEach(item => {
                const activitiesOfType = todaysActivities.filter(a => a.summaryKey === item.key);
                if (item.isCurrency) {
                    summary[item.key] = activitiesOfType.reduce((acc, a) => acc + (a.apiValue || 0), 0);
                } else if (item.isTime) {
                    summary[item.key] = activitiesOfType.reduce((acc, a) => acc + (a.timeSpent || 0), 0);
                }
                else {
                    summary[item.key] = activitiesOfType.length;
                }
            });

            summary.prospecting_calls = summary.prospecting_calls_old + summary.prospecting_calls_new;
            summary.appointments_cancelled = summary.appointments_booked - summary.appointments_conducted;
            summary.closing_interviews_cancelled = summary.closing_interviews_booked - summary.closing_interviews_conducted;
            
            summary.points = todaysActivities.reduce((acc, a) => acc + (a.points || 0), 0);
            setDailySummary(summary);

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const endOfTomorrow = new Date(tomorrow);
            endOfTomorrow.setHours(23, 59, 59, 999);

            const tomorrowsActivities = activities.filter(activity => {
                const activityDate = new Date(activity.scheduledTimestamp);
                return activity.userId === user.uid && activityDate >= tomorrow && activityDate <= endOfTomorrow;
            });
            setTomorrowPlan(tomorrowsActivities);

        }
    }, [isOpen, user, activities]);

    const handleConfirm = () => {
        if (dailySummary.points === 0 && summaryNotes.trim() === '') {
            alert('Please provide a summary of your day.');
            return;
        }
        const clockOutData = {
            summary: dailySummary,
            summaryNotes,
            plan: {
                notes: planNotes,
                activities: tomorrowPlan,
            },
            ...timeAndExpense,
            orphanSales
        };
        onClockOut(clockOutData);
    };

    const getAchievement = () => {
        const points = dailySummary.points || 0;
        if (points >= 100) return { level: 'Superhuman', icon: <Award className="text-yellow-400" />, color: 'text-yellow-400' };
        if (points >= 50) return { level: 'Excellent', icon: <Star className="text-green-400" />, color: 'text-green-400' };
        if (points > 0) return { level: 'Good', icon: <ThumbsUp className="text-blue-400" />, color: 'text-blue-400' };
        return { level: 'N/A', icon: null, color: '' };
    };
    
    const achievement = getAchievement();
    
    const potentialPoints = useMemo(() => tomorrowPlan.reduce((acc, a) => acc + (a.points * (a.quantity || 1) || 0), 0), [tomorrowPlan]);
    const potentialApi = useMemo(() => tomorrowPlan.filter(a => a.type === "Sale Closed (Apps filled, premium collected)").reduce((acc, a) => acc + (a.apiValue * (a.quantity || 1) || 0), 0), [tomorrowPlan]);

    const addActivityToPlan = (activity) => {
        setTomorrowPlan([...tomorrowPlan, activity]);
    }

    const removeActivityFromPlan = (index) => {
        const newPlan = [...tomorrowPlan];
        newPlan.splice(index, 1);
        setTomorrowPlan(newPlan);
    }

    if (!isOpen) return null;

    const renderSummaryPage = () => (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400">End of Day Summary</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="text-center p-4 bg-gray-900 rounded-lg">
                    <h3 className={`text-3xl font-bold ${achievement.color}`}>{dailySummary.points || 0} Points</h3>
                    <div className="flex items-center justify-center mt-2">
                        {achievement.icon}
                        <p className={`ml-2 font-semibold ${achievement.color}`}>{achievement.level}</p>
                    </div>
                </div>

                {Object.entries(SUMMARY_ITEMS).map(([category, items]) => (
                    <div key={category}>
                        <div className="bg-gray-700/50 rounded-lg">
                            <h4 className="text-lg font-semibold p-3 border-b border-gray-600">{category}</h4>
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-gray-700">
                                    {items.map(item => (
                                        <tr key={item.key}>
                                            <td className="p-3 text-gray-300">{item.label}</td>
                                            <td className="p-3 text-right font-bold text-white">
                                                {item.isCurrency ? `$${(dailySummary[item.key] || 0).toLocaleString()}` : (dailySummary[item.key] || 0)}
                                                {item.isTime && ' hrs'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {category === "Sales" && (
                            <div className="bg-gray-700/50 rounded-lg mt-4">
                                <h4 className="text-lg font-semibold p-3 border-b border-gray-600">Orphan Sales</h4>
                                <div className="p-3">
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={orphanSales.any} onChange={(e) => setOrphanSales({...orphanSales, any: e.target.checked})} className="h-5 w-5 rounded text-amber-500 bg-gray-600 border-gray-500 focus:ring-amber-500" />
                                        <span className="ml-2">Any sales from Orphans today?</span>
                                    </label>
                                    {orphanSales.any && (
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">API Potential from Orphans</label>
                                                <input type="number" value={orphanSales.apiPotential} onChange={(e) => setOrphanSales({...orphanSales, apiPotential: e.target.value})} className="w-full bg-gray-800 p-2 rounded-md" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Applications from Orphans</label>
                                                <input type="number" value={orphanSales.applications} onChange={(e) => setOrphanSales({...orphanSales, applications: e.target.value})} className="w-full bg-gray-800 p-2 rounded-md" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                <div>
                    <label htmlFor="summaryNotes" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <List size={16} className="mr-2" />
                        Summary Notes
                    </label>
                    <textarea
                        id="summaryNotes"
                        value={summaryNotes}
                        onChange={(e) => setSummaryNotes(e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 h-28 resize-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Summarize your achievements, challenges, and any follow-ups for tomorrow."
                    />
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                <button onClick={() => setPage(2)} className="px-6 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                    Next <ArrowRight className="ml-2" size={18} />
                </button>
            </div>
        </>
    );

    const renderPlanPage = () => (
         <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-amber-400">Plan for Tomorrow</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-900 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-amber-400">{potentialPoints}</p>
                        <p className="text-sm text-gray-400">Potential Points</p>
                    </div>
                     <div className="bg-gray-900 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">${potentialApi.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Potential API</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Tomorrow's Agenda</h3>
                    {tomorrowPlan.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded-md mb-2">
                            <span>{item.quantity || 1} x {item.type} - {item.details}</span>
                            <button onClick={() => removeActivityFromPlan(index)}><Trash2 size={16} className="text-red-500"/></button>
                        </div>
                    ))}
                </div>
                
                <ActivityPlanner onAddActivity={addActivityToPlan}/>

                <div>
                    <label htmlFor="planNotes" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <List size={16} className="mr-2" />
                        Tomorrow's Plan Notes
                    </label>
                    <textarea
                        id="planNotes"
                        value={planNotes}
                        onChange={(e) => setPlanNotes(e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 h-28 resize-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Outline your main objectives for the next workday."
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="timeOnField" className="block text-sm font-medium text-gray-300 mb-2">Time on Field (hrs)</label>
                        <input type="number" id="timeOnField" value={timeAndExpense.timeOnField} onChange={(e) => setTimeAndExpense({...timeAndExpense, timeOnField: e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                    </div>
                    <div>
                        <label htmlFor="timeInOffice" className="block text-sm font-medium text-gray-300 mb-2">Time in Office (hrs)</label>
                        <input type="number" id="timeInOffice" value={timeAndExpense.timeInOffice} onChange={(e) => setTimeAndExpense({...timeAndExpense, timeInOffice: e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                    </div>
                    <div>
                        <label htmlFor="expenses" className="block text-sm font-medium text-gray-300 mb-2">Expenses ($)</label>
                        <input type="number" id="expenses" value={timeAndExpense.expenses} onChange={(e) => setTimeAndExpense({...timeAndExpense, expenses: e.target.value})} className="w-full bg-gray-700 border-gray-600 rounded-md p-2" />
                    </div>
                </div>

            </div>
            <div className="mt-8 flex justify-between">
                <button onClick={() => setPage(1)} className="px-6 py-2 rounded-md font-semibold text-white bg-gray-600 hover:bg-gray-500 flex items-center">
                    <ArrowLeft className="mr-2" size={18} /> Back
                </button>
                <button onClick={handleConfirm} className="px-6 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700">
                    Confirm & Clock Out
                </button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all">
                {page === 1 ? renderSummaryPage() : renderPlanPage()}
            </div>
        </div>
    );
};


const ActivityPlanner = ({ onAddActivity }) => {
    const [activity, setActivity] = useState(null);
    const [details, setDetails] = useState('');
    const [quantity, setQuantity] = useState(1);

    const handleAdd = () => {
        if(!activity) {
            alert("Please select an activity");
            return;
        }
        onAddActivity({ ...JSON.parse(activity), details, quantity });
        setActivity(null);
        setDetails('');
        setQuantity(1);
    }

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50">
            <select onChange={(e) => setActivity(e.target.value)} value={activity ? activity : ''} className="bg-gray-800 p-2 rounded-md">
                 <option value="">Select an activity</option>
                {Object.entries(ACTIVITY_POINTS_SYSTEM).map(([category, activities]) => (
                    <optgroup label={category} key={category}>
                        {activities.map(act => <option key={act.name} value={JSON.stringify(act)}>{act.name}</option>)}
                    </optgroup>
                ))}
            </select>
            <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} className="w-20 bg-gray-800 p-2 rounded-md" min="1" />
            <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Details..." className="flex-grow bg-gray-800 p-2 rounded-md"/>
            <button onClick={handleAdd} className="bg-blue-600 p-2 rounded-md"><Plus size={18}/></button>
        </div>
    )
}

export default ClockOutModal;
