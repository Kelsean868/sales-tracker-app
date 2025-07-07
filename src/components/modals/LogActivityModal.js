import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Phone, Users, CheckSquare, DollarSign } from 'lucide-react';
import { ACTIVITY_TYPES } from '../../constants';

/**
 * LogActivityModal component
 * A modal for logging various types of sales activities.
 */
const LogActivityModal = ({ isOpen, onClose, onLogActivity, relatedTo }) => {
    const [activityType, setActivityType] = useState(ACTIVITY_TYPES.NOTE);
    const [details, setDetails] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledTimestamp, setScheduledTimestamp] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActivityType(ACTIVITY_TYPES.NOTE);
            setDetails('');
            setIsScheduled(false);
            setScheduledTimestamp('');
        }
    }, [isOpen]);

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
            timestamp: new Date().toISOString(), 
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

                <div className="mb-4">
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
                                <span className="ml-2">{type.replace(/_/g, ' ')}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
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
