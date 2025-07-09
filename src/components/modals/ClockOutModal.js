import React, { useState, useEffect } from 'react';
import { X, CheckCircle, List } from 'lucide-react';
import { ACTIVITY_POINTS } from '../../constants';

const ClockOutModal = ({ isOpen, onClose, onClockOut, user, activities }) => {
    const [summaryNotes, setSummaryNotes] = useState('');
    const [dailySummary, setDailySummary] = useState({
        calls: 0,
        meetings: 0,
        policies: 0,
        points: 0,
    });

    useEffect(() => {
        if (isOpen && user && activities) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaysActivities = activities.filter(activity => {
                const activityDate = activity.timestamp?.toDate();
                return activity.userId === user.uid && activityDate >= today;
            });
            
            const summary = {
                calls: todaysActivities.filter(a => a.type === 'call').length,
                meetings: todaysActivities.filter(a => a.type === 'meeting').length,
                policies: todaysActivities.filter(a => a.type === 'policy_sold').length,
                points: todaysActivities.reduce((acc, a) => acc + (ACTIVITY_POINTS[a.type] || 0), 0),
            };
            setDailySummary(summary);
        }
    }, [isOpen, user, activities]);

    const handleConfirm = () => {
        onClockOut(summaryNotes);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400">Clock Out & Daily Summary</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center mb-2">
                            <CheckCircle size={20} className="mr-2 text-green-400" />
                            Today's Accomplishments
                        </h3>
                        <div className="bg-gray-700 p-4 rounded-md grid grid-cols-2 gap-4 text-center">
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-blue-400">{dailySummary.calls}</p>
                                <p className="text-sm text-gray-400">Calls Made</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-purple-400">{dailySummary.meetings}</p>
                                <p className="text-sm text-gray-400">Meetings</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-green-400">{dailySummary.policies}</p>
                                <p className="text-sm text-gray-400">Policies Sold</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <p className="text-2xl font-bold text-amber-400">{dailySummary.points}</p>
                                <p className="text-sm text-gray-400">Points Earned</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="summaryNotes" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                            <List size={16} className="mr-2" />
                            End of Day Summary Notes
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

                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="px-6 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                        Confirm & Clock Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClockOutModal;