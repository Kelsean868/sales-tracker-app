import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Save, Trophy, Users } from 'lucide-react';
import Card from '../ui/Card';
import { ACTIVITY_POINTS_SYSTEM } from '../../constants';

// Helper to get the Sunday of the week for a given date
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = d.getDate() - day; // Adjust to Sunday
    return new Date(d.setDate(diff));
};


const GoalsScreen = ({ userId, currentUser, allUsers = [], activities = [] }) => {
    const managementRoles = ['super_admin', 'admin', 'branch_manager', 'unit_manager'];
    const isManagerView = currentUser && managementRoles.includes(currentUser.role);
    
    const [selectedUserId, setSelectedUserId] = useState(userId);

    useEffect(() => {
        setSelectedUserId(userId);
    }, [userId, isManagerView]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Goals</h1>
            </div>

            {isManagerView && (
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 rounded-md p-3 pl-10 appearance-none focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value={userId}>My Personal Goals</option>
                        {allUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <GoalTracker 
                targetUserId={selectedUserId} 
                activities={activities} 
                isManagerViewing={isManagerView && selectedUserId !== userId}
            />
        </div>
    );
};


const GoalTracker = ({ targetUserId, activities, isManagerViewing }) => {
    const [period, setPeriod] = useState('weekly');
    const [isEditing, setIsEditing] = useState(false);
    
    const allActivities = useMemo(() => Object.values(ACTIVITY_POINTS_SYSTEM).flat(), []);
    const defaultGoals = useMemo(() => {
        const goals = {};
        allActivities.forEach(activity => {
            goals[activity.name] = 0;
        });
        return goals;
    }, [allActivities]);

    const [goals, setGoals] = useState(defaultGoals);

    useEffect(() => {
        if (!targetUserId) return;
        try {
            const savedGoals = localStorage.getItem(`goals_${targetUserId}`);
            if (savedGoals) {
                setGoals(JSON.parse(savedGoals));
            } else {
                setGoals(defaultGoals);
            }
        } catch (error) {
            console.error("Failed to load goals from localStorage", error);
        }
    }, [targetUserId, defaultGoals]);

    const handleSaveGoals = () => {
        if (!targetUserId) return;
        try {
            localStorage.setItem(`goals_${targetUserId}`, JSON.stringify(goals));
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save goals to localStorage", error);
        }
    };

    const handleGoalChange = (key, value) => {
        setGoals(prev => ({ ...prev, [key]: Number(value) || 0 }));
    };

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
            case 'weekly':
            default:
                startOfPeriod = getStartOfWeek(now);
                startOfPeriod.setHours(0, 0, 0, 0);
                break;
        }

        const userActivities = activities.filter(a => a.userId === targetUserId);
        const relevantActivities = userActivities.filter(a => new Date(a.timestamp) >= startOfPeriod);
        
        const calculatedProgress = {};
        allActivities.forEach(activity => {
            calculatedProgress[activity.name] = relevantActivities.filter(a => a.type === activity.name).length;
        });
        return calculatedProgress;
    }, [activities, period, targetUserId, allActivities]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center bg-gray-800 rounded-lg p-1">
                    <PeriodButton period="daily" activePeriod={period} setPeriod={setPeriod}>Daily</PeriodButton>
                    <PeriodButton period="weekly" activePeriod={period} setPeriod={setPeriod}>Weekly</PeriodButton>
                    <PeriodButton period="monthly" activePeriod={period} setPeriod={setPeriod}>Monthly</PeriodButton>
                </div>
                {!isManagerViewing && (
                    isEditing ? (
                        <button onClick={handleSaveGoals} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center"><Save className="w-4 h-4 mr-2"/>Save Goals</button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center"><Edit className="w-4 h-4 mr-2"/>Edit Targets</button>
                    )
                )}
            </div>
            
            <div className="space-y-4">
                {allActivities.map(activity => (
                    <GoalItem 
                        key={activity.name}
                        label={activity.name} 
                        current={progress[activity.name] || 0} 
                        target={goals[activity.name] || 0} 
                        isEditing={isEditing && !isManagerViewing} 
                        onChange={(val) => handleGoalChange(activity.name, val)} 
                    />
                ))}
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

    let barColor = 'bg-blue-500';
    if (percentage > 75) barColor = 'bg-green-500';
    else if (percentage > 40) barColor = 'bg-yellow-500';

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
