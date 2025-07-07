import React, { useState, useEffect, useMemo } from 'react';
import { Target, Edit, Save, CheckCircle, Trophy } from 'lucide-react';
import Card from '../ui/Card';
import { ACTIVITY_TYPES } from '../../constants'; // FIX: Import the ACTIVITY_TYPES constant

/**
 * GoalsScreen component
 * Allows users to set and track their sales goals.
 * @param {object} props - Component props
 * @param {string} props.userId - The ID of the current user
 * @param {Array} [props.activities=[]] - Array of user's activities
 * @returns {JSX.Element} The rendered goals screen
 */
const GoalsScreen = ({ userId, activities = [] }) => {
    const [period, setPeriod] = useState('weekly');
    const [isEditing, setIsEditing] = useState(false);
    
    // Default goals, can be customized
    const defaultGoals = {
        new_contacts: 10,
        appointments_booked: 5,
        ffi_conducted: 3,
        applications_submitted: 2,
        api: 5000,
    };

    const [goals, setGoals] = useState(defaultGoals);

    // Load goals from localStorage when the component mounts
    useEffect(() => {
        try {
            const savedGoals = localStorage.getItem(`goals_${userId}`);
            if (savedGoals) {
                setGoals(JSON.parse(savedGoals));
            }
        } catch (error) {
            console.error("Failed to load goals from localStorage", error);
        }
    }, [userId]);

    // Save goals to localStorage whenever they change
    const handleSaveGoals = () => {
        try {
            localStorage.setItem(`goals_${userId}`, JSON.stringify(goals));
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save goals to localStorage", error);
        }
    };

    const handleGoalChange = (key, value) => {
        setGoals(prev => ({ ...prev, [key]: Number(value) || 0 }));
    };

    // Calculate current progress based on activities
    const progress = useMemo(() => {
        const now = new Date();
        let startOfPeriod;

        switch (period) {
            case 'daily':
                startOfPeriod = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'monthly':
                startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                startOfPeriod = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'weekly':
            default:
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                startOfPeriod = new Date(now.setDate(diff));
                startOfPeriod.setHours(0, 0, 0, 0);
                break;
        }

        const relevantActivities = activities.filter(a => new Date(a.timestamp) >= startOfPeriod);

        // FIX: Use the imported ACTIVITY_TYPES constant
        return {
            new_contacts: relevantActivities.filter(a => a.summaryKey === 'new_contact').length,
            appointments_booked: relevantActivities.filter(a => a.summaryKey === 'appointment_booked').length,
            ffi_conducted: relevantActivities.filter(a => a.type === ACTIVITY_TYPES.FFI).length,
            applications_submitted: relevantActivities.filter(a => a.summaryKey === 'application_submitted').length,
            api: relevantActivities.filter(a => a.type === ACTIVITY_TYPES.API).reduce((sum, a) => sum + (a.api || 0), 0),
        };
    }, [activities, period]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Goals</h1>
                {isEditing ? (
                    <button onClick={handleSaveGoals} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center"><Save className="w-4 h-4 mr-2"/>Save Goals</button>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center"><Edit className="w-4 h-4 mr-2"/>Edit Targets</button>
                )}
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
                <PeriodButton period="daily" activePeriod={period} setPeriod={setPeriod}>Daily</PeriodButton>
                <PeriodButton period="weekly" activePeriod={period} setPeriod={setPeriod}>Weekly</PeriodButton>
                <PeriodButton period="monthly" activePeriod={period} setPeriod={setPeriod}>Monthly</PeriodButton>
                <PeriodButton period="quarterly" activePeriod={period} setPeriod={setPeriod}>Quarterly</PeriodButton>
            </div>

            {/* Goals List */}
            <div className="space-y-4">
                <GoalItem label="New Contacts" current={progress.new_contacts} target={goals.new_contacts} isEditing={isEditing} onChange={(val) => handleGoalChange('new_contacts', val)} />
                <GoalItem label="Appointments Booked" current={progress.appointments_booked} target={goals.appointments_booked} isEditing={isEditing} onChange={(val) => handleGoalChange('appointments_booked', val)} />
                <GoalItem label="FFI Conducted" current={progress.ffi_conducted} target={goals.ffi_conducted} isEditing={isEditing} onChange={(val) => handleGoalChange('ffi_conducted', val)} />
                <GoalItem label="Applications Submitted" current={progress.applications_submitted} target={goals.applications_submitted} isEditing={isEditing} onChange={(val) => handleGoalChange('applications_submitted', val)} />
                <GoalItem label="API" current={progress.api} target={goals.api} isEditing={isEditing} isCurrency onChange={(val) => handleGoalChange('api', val)} />
            </div>
        </div>
    );
};

const PeriodButton = ({ period, activePeriod, setPeriod, children }) => (
    <button onClick={() => setPeriod(period)} className={`w-full px-3 py-1 text-sm rounded-md ${activePeriod === period ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}>{children}</button>
);

const GoalItem = ({ label, current, target, isEditing, isCurrency, onChange }) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const isAchieved = current >= target;

    let barColor = 'bg-red-500';
    if (percentage > 75) barColor = 'bg-green-500';
    else if (percentage > 40) barColor = 'bg-yellow-500';
    else if (percentage > 10) barColor = 'bg-blue-500';

    return (
        <Card>
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{label}</span>
                {isAchieved && !isEditing && <Trophy className="text-yellow-400" size={20} />}
                <div className="flex items-center">
                    <span className="text-white font-bold">{isCurrency ? `$${current.toLocaleString()}` : current}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    {isEditing ? (
                        <input type="number" value={target} onChange={(e) => onChange(e.target.value)} className="w-20 bg-gray-700 text-white p-1 rounded-md text-right" />
                    ) : (
                        <span className="text-gray-400">{isCurrency ? `$${target.toLocaleString()}` : target}</span>
                    )}
                </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </Card>
    );
};

export default GoalsScreen;
