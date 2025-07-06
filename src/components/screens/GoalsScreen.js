import React, { useState, useEffect, useMemo } from 'react';
import { Target, Trophy, Edit, Save } from 'lucide-react';
import Card from '../ui/Card';

const GOAL_DEFINITIONS = [
    { key: 'telephoneContacts', label: 'New Contacts', defaultTarget: 100, isCurrency: false },
    { key: 'appointmentsBooked', label: 'Appointments Booked', defaultTarget: 20, isCurrency: false },
    { key: 'ffiConducted', label: 'FFI Conducted', defaultTarget: 15, isCurrency: false },
    { key: 'apiSubmitted', label: 'API Submitted', defaultTarget: 50000, isCurrency: true },
    { key: 'applications', label: 'Applications Submitted', defaultTarget: 10, isCurrency: false },
];

const ProgressBar = ({ percentage }) => {
    const cappedPercentage = Math.min(percentage, 100);
    const colorClass = useMemo(() => {
        if (cappedPercentage >= 100) return 'bg-green-500';
        if (cappedPercentage >= 75) return 'bg-sky-500';
        if (cappedPercentage >= 50) return 'bg-amber-500';
        if (cappedPercentage >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    }, [cappedPercentage]);

    return (
        <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
                className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `${cappedPercentage}%` }}
            ></div>
        </div>
    );
};

const GoalsScreen = ({ userId, activities }) => {
    const [period, setPeriod] = useState('weekly'); // 'daily', 'weekly', 'monthly', 'quarterly'
    const [goals, setGoals] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    // Load goals from localStorage on mount
    useEffect(() => {
        if (!userId) return;
        try {
            const savedGoals = localStorage.getItem(`goals_${userId}`);
            if (savedGoals) {
                setGoals(JSON.parse(savedGoals));
            } else {
                // Initialize with default goals if none are saved
                const defaultGoals = GOAL_DEFINITIONS.reduce((acc, goal) => {
                    acc[goal.key] = goal.defaultTarget;
                    return acc;
                }, {});
                setGoals(defaultGoals);
            }
        } catch (error) {
            console.error("Failed to load goals from localStorage:", error);
        }
    }, [userId]);

    // Save goals to localStorage whenever they change
    useEffect(() => {
        if (!userId || Object.keys(goals).length === 0) return;
        try {
            localStorage.setItem(`goals_${userId}`, JSON.stringify(goals));
        } catch (error) {
            console.error("Failed to save goals to localStorage:", error);
        }
    }, [goals, userId]);

    const handleTargetChange = (key, value) => {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
            setGoals(prevGoals => ({
                ...prevGoals,
                [key]: numericValue,
            }));
        }
    };

    const progressData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        switch (period) {
            case 'daily':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                const firstDayOfWeek = now.getDate() - now.getDay();
                startDate = new Date(now.setDate(firstDayOfWeek));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                break;
        }

        const relevantActivities = activities.filter(act => {
            if (!act.scheduledTimestamp) return false;
            const actDate = act.scheduledTimestamp.toDate();
            return actDate >= startDate && actDate <= endDate;
        });

        return GOAL_DEFINITIONS.map(goalDef => {
            const target = goals[goalDef.key] || goalDef.defaultTarget;
            let currentValue = 0;

            if (goalDef.key === 'apiSubmitted') {
                currentValue = relevantActivities
                    .filter(act => act.type === "Sale Closed (Apps filled, premium collected)")
                    .reduce((sum, act) => sum + (act.api || 0), 0);
            } else {
                const activityDetail = activityTypes[goalDef.category]?.find(a => a.summaryKey === goalDef.key);
                if(activityDetail) {
                    currentValue = relevantActivities.filter(act => act.type === activityDetail.name).length;
                }
            }

            const percentage = target > 0 ? (currentValue / target) * 100 : 0;

            return {
                ...goalDef,
                target,
                currentValue,
                percentage,
            };
        });
    }, [activities, period, goals]);

    const summaryStats = useMemo(() => {
        const totalGoals = progressData.length;
        const completedGoals = progressData.filter(g => g.currentValue >= g.target).length;
        const overallPercentage = progressData.reduce((sum, g) => sum + Math.min(g.percentage, 100), 0) / totalGoals;

        return {
            completedGoals,
            totalGoals,
            overallPercentage: isNaN(overallPercentage) ? 0 : overallPercentage,
        };
    }, [progressData]);

    const formatValue = (value, isCurrency) => {
        if (isCurrency) {
            return `$${value.toLocaleString()}`;
        }
        return value.toLocaleString();
    };

    return (
        <div className="p-4 pt-20 pb-24">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-white flex items-center">
                    <Target className="w-7 h-7 mr-3 text-amber-400" />
                    My Goals
                </h1>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    {isEditing ? <Save className="w-5 h-5 mr-2" /> : <Edit className="w-5 h-5 mr-2" />}
                    {isEditing ? 'Save' : 'Edit Targets'}
                </button>
            </div>

            <Card className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3 text-center">Select Period</h2>
                <div className="flex flex-wrap gap-2">
                    {['daily', 'weekly', 'monthly', 'quarterly'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 capitalize py-2 px-3 text-sm font-semibold rounded-md transition-colors ${period === p ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </Card>

            <Card className="mb-6">
                 <h2 className="text-xl font-bold text-white mb-4 text-center">{period.charAt(0).toUpperCase() + period.slice(1)} Summary</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-4xl font-bold text-green-400">{summaryStats.completedGoals} / {summaryStats.totalGoals}</p>
                        <p className="text-gray-400">Goals Completed</p>
                    </div>
                     <div className="bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-4xl font-bold text-sky-400">{summaryStats.overallPercentage.toFixed(0)}%</p>
                        <p className="text-gray-400">Overall Progress</p>
                    </div>
                 </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {progressData.map(goal => (
                    <Card key={goal.key}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-white">{goal.label}</h3>
                            {goal.percentage >= 100 && !isEditing && (
                                <div className="flex items-center text-green-400 bg-green-500/10 px-2 py-1 rounded-full text-xs font-bold">
                                    <Trophy className="w-4 h-4 mr-1" />
                                    <span>Complete!</span>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="flex items-center gap-3 my-4">
                                <span className="text-gray-400">Target:</span>
                                <input
                                    type="number"
                                    value={goals[goal.key] || ''}
                                    onChange={(e) => handleTargetChange(goal.key, e.target.value)}
                                    className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2 text-center font-bold"
                                />
                            </div>
                        ) : (
                            <div className="my-4 text-center">
                                <p className="text-3xl font-bold text-white">
                                    {formatValue(goal.currentValue, goal.isCurrency)}
                                </p>
                                <p className="text-gray-400">
                                    of {formatValue(goal.target, goal.isCurrency)}
                                </p>
                            </div>
                        )}

                        <ProgressBar percentage={goal.percentage} />
                        <p className="text-right text-sm text-gray-400 mt-2">{goal.percentage.toFixed(1)}%</p>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default GoalsScreen;
