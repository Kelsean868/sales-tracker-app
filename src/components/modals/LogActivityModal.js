import React, { useState, useEffect } from 'react';
import { X, User as UserIcon } from 'lucide-react';
import { ACTIVITY_POINTS_SYSTEM } from '../../constants';

const LogActivityModal = ({ isOpen, onClose, onLogActivity, relatedTo, currentUser, allUsers = [] }) => {
    const managementRoles = ['super_admin', 'admin', 'branch_manager', 'unit_manager'];
    const isManagerView = currentUser && managementRoles.includes(currentUser.role);

    const [activity, setActivity] = useState(null);
    const [details, setDetails] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledTimestamp, setScheduledTimestamp] = useState('');
    const [targetUserId, setTargetUserId] = useState(currentUser?.uid);
    const [apiValue, setApiValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActivity(null);
            setDetails('');
            setIsScheduled(false);
            setScheduledTimestamp('');
            setTargetUserId(currentUser?.uid);
            setApiValue('');
        }
    }, [isOpen, currentUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!activity) {
            alert('Please select an activity type.');
            return;
        }

        const activityData = {
            type: activity.name,
            details: details,
            relatedTo: relatedTo ? { id: relatedTo.id, name: relatedTo.name } : null,
            isScheduled: isScheduled,
            scheduledTimestamp: isScheduled && scheduledTimestamp ? new Date(scheduledTimestamp).toISOString() : null,
            logForUserId: targetUserId,
            points: activity.points,
            apiValue: activity.name === 'API' ? apiValue : null,
        };
        
        onLogActivity(activityData);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400">Log Activity</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                {relatedTo && <p className="text-gray-400 mb-4 -mt-4">Related to: <span className="font-semibold text-gray-300">{relatedTo.name}</span></p>}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {isManagerView && (
                            <div>
                                <label htmlFor="targetUser" className="block text-sm font-medium text-gray-300 mb-2">Log Activity For:</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <select id="targetUser" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 appearance-none focus:ring-amber-500 focus:border-amber-500">
                                        <option value={currentUser.uid}>Myself ({currentUser.name})</option>
                                        {allUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Activity Type</label>
                            <select onChange={(e) => setActivity(JSON.parse(e.target.value))} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500">
                                <option value="">Select an activity</option>
                                {Object.entries(ACTIVITY_POINTS_SYSTEM).map(([category, activities]) => (
                                    <optgroup label={category} key={category}>
                                        {activities.map(act => <option key={act.name} value={JSON.stringify(act)}>{act.name} ({act.points} pts)</option>)}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        
                        {activity?.name === 'API' && (
                            <div>
                                <label htmlFor="apiValue" className="block text-sm font-medium text-gray-300 mb-2">API Value</label>
                                <input id="apiValue" type="number" value={apiValue} onChange={(e) => setApiValue(e.target.value)} placeholder="Enter API value" className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" required />
                            </div>
                        )}

                        <div>
                            <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-2">Details / Notes</label>
                            <textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add a note..." className="w-full bg-gray-700 border-gray-600 rounded-md p-2 h-28 resize-none focus:ring-amber-500 focus:border-amber-500" required />
                        </div>

                        <div className="bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <input type="checkbox" id="schedule-task" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="h-5 w-5 rounded text-amber-500 bg-gray-600 border-gray-500 focus:ring-amber-500" />
                                <label htmlFor="schedule-task" className="ml-3 text-white">Schedule this as a future task?</label>
                            </div>
                            {isScheduled && (
                                <div className="mt-4">
                                    <label htmlFor="scheduledTimestamp" className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                                    <input type="datetime-local" id="scheduledTimestamp" value={scheduledTimestamp} onChange={(e) => setScheduledTimestamp(e.target.value)} className="w-full bg-gray-600 border-gray-500 rounded-md p-2 text-white" required />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">Log Activity</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LogActivityModal;
