import React, { useState, useEffect } from 'react';
import { X, List, Calendar, MessageSquare, Phone, Users, CheckSquare, DollarSign, User as UserIcon } from 'lucide-react';
import { ACTIVITY_TYPES, ACTIVITY_POINTS } from '../../constants';

/**
 * LogActivityModal component
 * A modal for logging sales activities. Now supports a manager view.
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Controls if the modal is visible
 * @param {function} props.onClose - Function to call when the modal should be closed
 * @param {function} props.onLogActivity - Function to call to save the activity
 * @param {object} [props.relatedTo] - The lead or client this activity is related to
 * @param {object} props.currentUser - The currently logged-in user object
 * @param {Array} [props.allUsers=[]] - Array of all users (for manager view)
 * @returns {JSX.Element|null} The rendered modal or null if not open
 */
const LogActivityModal = ({ isOpen, onClose, onLogActivity, relatedTo, currentUser, allUsers = [] }) => {
    const managementRoles = ['super_admin', 'admin', 'branch_manager', 'unit_manager'];
    const isManagerView = currentUser && managementRoles.includes(currentUser.role);

    const [activityType, setActivityType] = useState(ACTIVITY_TYPES.NOTE);
    const [details, setDetails] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledTimestamp, setScheduledTimestamp] = useState('');
    // NEW: State to hold the ID of the user the activity is being logged for
    const [targetUserId, setTargetUserId] = useState(currentUser?.uid);
    const [apiValue, setApiValue] = useState('');

    // Reset state when the modal is closed or opened
    useEffect(() => {
        if (isOpen) {
            setActivityType(ACTIVITY_TYPES.NOTE);
            setDetails('');
            setIsScheduled(false);
            setScheduledTimestamp('');
            // Default to logging for the current user unless changed
            setTargetUserId(currentUser?.uid);
            setApiValue('');
        }
    }, [isOpen, currentUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!details) {
            alert('Please provide some details for the activity.');
            return;
        }

        const activityData = {
            type: activityType,
            details: details,
            relatedTo: relatedTo ? { id: relatedTo.id, name: relatedTo.name } : null,
            isScheduled: isScheduled,
            scheduledTimestamp: isScheduled && scheduledTimestamp ? new Date(scheduledTimestamp).toISOString() : null,
            // Pass the target user's ID to the handler function
            logForUserId: targetUserId,
            points: ACTIVITY_POINTS[activityType] || 0,
            apiValue: activityType === ACTIVITY_TYPES.API ? apiValue : null,
        };
        
        onLogActivity(activityData);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const activityIcons = {
        [ACTIVITY_TYPES.NOTE]: <MessageSquare size={20} />,
        [ACTIVITY_TYPES.CALL]: <Phone size={20} />,
        [ACTIVITY_TYPES.MEETING]: <Users size={20} />,
        [ACTIVITY_TYPES.LUNCH]: <Users size={20} />,
        [ACTIVITY_TYPES.FFI]: <CheckSquare size={20} />,
        [ACTIVITY_TYPES.API]: <DollarSign size={20} />,
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 text-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400">Log Activity</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                {relatedTo && (
                    <p className="text-gray-400 mb-4 -mt-4">
                        Related to: <span className="font-semibold text-gray-300">{relatedTo.name}</span>
                    </p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* NEW: Manager's user selector dropdown */}
                        {isManagerView && (
                            <div>
                                <label htmlFor="targetUser" className="block text-sm font-medium text-gray-300 mb-2">Log Activity For:</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <select
                                        id="targetUser"
                                        value={targetUserId}
                                        onChange={(e) => setTargetUserId(e.target.value)}
                                        className="w-full bg-gray-700 border-gray-600 rounded-md p-2 pl-10 appearance-none focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value={currentUser.uid}>Myself ({currentUser.name})</option>
                                        {allUsers.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Activity Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.values(ACTIVITY_TYPES).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setActivityType(type)}
                                        className={`flex items-center justify-center p-2 rounded-md text-sm transition-colors ${
                                            activityType === type
                                                ? 'bg-amber-500 text-gray-900 font-bold'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    >
                                        {activityIcons[type]}
                                        <span className="ml-2">{type.replace(/_/g, ' ')} ({ACTIVITY_POINTS[type]} pts)</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activityType === ACTIVITY_TYPES.API && (
                            <div>
                                <label htmlFor="apiValue" className="block text-sm font-medium text-gray-300 mb-2">API Value</label>
                                <input
                                    id="apiValue"
                                    type="number"
                                    value={apiValue}
                                    onChange={(e) => setApiValue(e.target.value)}
                                    placeholder="Enter API value"
                                    className="w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-2">Details / Notes</label>
                            <textarea
                                id="details"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder={`Add a note about the ${activityType.toLowerCase().replace(/_/g, ' ')}...`}
                                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 h-28 resize-none focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>

                        <div className="bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="schedule-task"
                                    checked={isScheduled}
                                    onChange={(e) => setIsScheduled(e.target.checked)}
                                    className="h-5 w-5 rounded text-amber-500 bg-gray-600 border-gray-500 focus:ring-amber-500"
                                />
                                <label htmlFor="schedule-task" className="ml-3 text-white">
                                    Schedule this as a future task?
                                </label>
                            </div>
                            {isScheduled && (
                                <div className="mt-4">
                                    <label htmlFor="scheduledTimestamp" className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        id="scheduledTimestamp"
                                        value={scheduledTimestamp}
                                        onChange={(e) => setScheduledTimestamp(e.target.value)}
                                        className="w-full bg-gray-600 border-gray-500 rounded-md p-2 text-white"
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 rounded-md text-gray-900 font-semibold bg-amber-500 hover:bg-amber-400">
                            Log Activity
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LogActivityModal;
