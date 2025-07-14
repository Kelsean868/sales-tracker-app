import React, { useState, useEffect, useMemo } from 'react';
import { X, Phone, PhoneOff, Voicemail, CalendarPlus, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const CallingSessionModal = ({ isOpen, onClose, activities, onLogCall, onReschedule }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [callNotes, setCallNotes] = useState('');
    const [outcomes, setOutcomes] = useState({}); // Stores outcome for each activity ID

    const activeActivities = useMemo(() => activities.filter(a => a.status !== 'completed'), [activities]);
    const currentActivity = useMemo(() => activeActivities[currentIndex], [activeActivities, currentIndex]);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setSessionEnded(false);
            setOutcomes({});
            setCallNotes('');
        }
    }, [isOpen]);
    
    useEffect(() => {
        setCallNotes(''); // Reset notes when activity changes
    }, [currentIndex]);

    const handleNext = () => {
        if (currentIndex < activeActivities.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setSessionEnded(true);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleLogOutcome = async (outcome) => {
        if (!currentActivity) return;
        if (outcome === 'reschedule') {
            onReschedule(currentActivity);
            return;
        }
        await onLogCall(currentActivity, outcome, callNotes);
        setOutcomes(prev => ({...prev, [currentActivity.id]: outcome}));
        // Do not automatically move to next, let the user decide.
    };

    const CallOutcomeButton = ({ outcome, Icon, label }) => {
        const isSelected = outcomes[currentActivity?.id] === outcome;
        return (
             <button
                onClick={() => handleLogOutcome(outcome)}
                disabled={!currentActivity || isSelected}
                className={`flex-1 p-3 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    isSelected
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700'
                }`}
            >
                <Icon size={24} />
                <span className="mt-2 text-sm font-semibold">{label}</span>
                {isSelected && <Check size={16} className="absolute top-2 right-2"/>}
            </button>
        )
    }

    const renderContent = () => {
        if (sessionEnded || activeActivities.length === 0) {
            const completedCount = Object.keys(outcomes).length;
            return (
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-green-400 mb-4">Calling Session Complete!</h3>
                    <p className="text-lg">You've gone through all your scheduled calls.</p>
                    <p className="mt-2">You made <span className="font-bold text-amber-400">{completedCount}</span> out of <span className="font-bold">{activities.length}</span> scheduled calls.</p>
                    <button onClick={onClose} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                        Close Session
                    </button>
                </div>
            );
        }

        return (
            <>
                {/* Contact Info */}
                <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-white">{currentActivity?.contactName || 'Unknown Contact'}</h3>
                    <p className="text-xl text-amber-400 font-mono mt-2">{currentActivity?.contactPhone || 'No Phone'}</p>
                    <p className="text-sm text-gray-400 mt-1">Activity: {currentActivity?.subject}</p>
                </div>

                {/* Outcome Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                   <CallOutcomeButton outcome="connected" Icon={Phone} label="Connected" />
                   <CallOutcomeButton outcome="no_answer" Icon={PhoneOff} label="No Answer" />
                   <CallOutcomeButton outcome="voicemail" Icon={Voicemail} label="Left Voicemail" />
                   <CallOutcomeButton outcome="reschedule" Icon={CalendarPlus} label="Reschedule" />
                </div>
                
                {/* Notes */}
                <div>
                    <label htmlFor="callNotes" className="block text-sm font-medium text-gray-300 mb-2">Call Notes</label>
                    <textarea
                        id="callNotes"
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        className="w-full bg-gray-900 border-gray-700 rounded-md p-3 h-28 resize-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Log details of the conversation..."
                    />
                </div>
            </>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-3xl transform transition-all relative">
                <div className="absolute top-4 right-4">
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-amber-400">Guided Calling Session</h2>
                    {!sessionEnded && activeActivities.length > 0 && (
                        <span className="text-lg font-semibold bg-gray-700 px-4 py-1 rounded-lg">
                            {currentIndex + 1} / {activeActivities.length}
                        </span>
                    )}
                </div>

                <div className="min-h-[350px] flex flex-col justify-center">
                    {renderContent()}
                </div>

                {/* Navigation */}
                {!sessionEnded && activeActivities.length > 0 && (
                    <div className="mt-8 flex justify-between items-center">
                         <button 
                            onClick={handlePrev} 
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} /> Previous
                        </button>
                        <button 
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                           {currentIndex === activeActivities.length - 1 ? 'Finish Session' : 'Next Call'} <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallingSessionModal;
