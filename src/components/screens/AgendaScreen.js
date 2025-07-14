import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Briefcase, PhoneCall, CheckSquare } from 'lucide-react';
import Card from '../ui/Card';

const AgendaScreen = ({ activities, currentUser, allUsers }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedUserId, setSelectedUserId] = useState(currentUser.uid);

    const isManager = ['TEAM_LEAD', 'UNIT_MANAGER', 'BRANCH_MANAGER', 'REGIONAL_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

    const teamMembers = useMemo(() => {
        if (!isManager) return [];
        // This logic needs to be adapted based on the actual user hierarchy
        return allUsers.filter(u => u.teamId === currentUser.teamId && u.uid !== currentUser.uid);
    }, [isManager, allUsers, currentUser]);

    const displayedUserId = isManager ? selectedUserId : currentUser.uid;

    const filteredActivities = useMemo(() => {
        return activities.filter(act => act.userId === displayedUserId);
    }, [activities, displayedUserId]);

    const handleDateChange = (newDate) => {
        setCurrentDate(newDate);
    };

    const handleUserChange = (event) => {
        setSelectedUserId(event.target.value);
    };
    
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="text-white">
            <h1 className="text-3xl font-bold mb-6">Agenda</h1>
            
            <HeaderControls
                currentDate={currentDate}
                onDateChange={handleDateChange}
                isManager={isManager}
                teamMembers={teamMembers}
                selectedUserId={selectedUserId}
                onUserChange={handleUserChange}
                onGoToToday={goToToday}
                currentUser={currentUser}
            />

            <div className="mt-6">
                <CalendarView
                    activities={filteredActivities}
                    currentDate={currentDate}
                />
            </div>
        </div>
    );
};

const HeaderControls = ({ currentDate, onDateChange, isManager, teamMembers, selectedUserId, onUserChange, onGoToToday, currentUser }) => {
    const handlePrevDay = () => onDateChange(new Date(currentDate.setDate(currentDate.getDate() - 1)));
    const handleNextDay = () => onDateChange(new Date(currentDate.setDate(currentDate.getDate() + 1)));

    return (
        <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevDay} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeft size={24} /></button>
                    <h2 className="text-xl font-semibold text-white text-center">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextDay} className="p-2 rounded-full hover:bg-gray-700"><ChevronRight size={24} /></button>
                    <button onClick={onGoToToday} className="ml-4 px-4 py-2 bg-gray-600 rounded-md text-sm font-semibold hover:bg-gray-500">Today</button>
                </div>
                
                {isManager && (
                    <div className="flex items-center gap-3">
                         <label htmlFor="user-select" className="text-sm font-medium">View Agenda:</label>
                         <select id="user-select" value={selectedUserId} onChange={onUserChange} className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                            <option value={currentUser.uid}>My Agenda</option>
                            {teamMembers.map(member => (
                                <option key={member.uid} value={member.uid}>{member.name}</option>
                            ))}
                         </select>
                    </div>
                )}
            </div>
        </Card>
    );
};

const CalendarView = ({ activities, currentDate }) => {
    const { timedEvents, allDayEvents } = useMemo(() => {
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        const dailyActivities = activities.filter(act => {
            const actDate = act.timestamp;
            if (!actDate) return false;
            return actDate >= startOfDay && actDate <= endOfDay;
        });
        
        const timed = dailyActivities
            .filter(act => act.isScheduled && act.scheduledTimestamp)
            .sort((a, b) => a.scheduledTimestamp - b.scheduledTimestamp);

        const allDay = dailyActivities.filter(act => !act.isScheduled || !act.scheduledTimestamp);

        return { timedEvents: timed, allDayEvents: allDay };
    }, [activities, currentDate]);

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-2/3">
                <Timeline timedEvents={timedEvents} />
            </div>
            <div className="lg:w-1/3">
                <AllDayPanel allDayEvents={allDayEvents} />
            </div>
        </div>
    );
};

const Timeline = ({ timedEvents }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4">Timeline</h3>
            <div className="relative">
                {/* Hour markers and grid lines */}
                {hours.map(hour => (
                    <div key={hour} className="relative h-20">
                        <div className="absolute -left-12 top-0 text-xs text-gray-400 w-10 text-right pr-2">
                           {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
                        </div>
                        <div className="h-full border-t border-gray-700"></div>
                    </div>
                ))}

                {/* Event rendering */}
                {timedEvents.map(event => <TimelineEvent key={event.id} event={event} />)}
            </div>
        </Card>
    );
};

const TimelineEvent = ({ event }) => {
    const eventStart = event.scheduledTimestamp;
    const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
    
    // Default duration to 30 minutes if not specified
    const durationHours = (event.duration || 30) / 60; 

    const top = startHour * 5; // 5rem (h-20) per hour
    const height = durationHours * 5;

    const getIcon = (type) => {
        const icons = {
            call: <PhoneCall className="w-4 h-4 mr-2" />,
            meeting: <Users className="w-4 h-4 mr-2" />,
            task: <CheckSquare className="w-4 h-4 mr-2" />,
            default: <Briefcase className="w-4 h-4 mr-2" />,
        };
        return icons[type] || icons.default;
    };

    return (
        <div
            className="absolute left-2 right-0 bg-blue-600/30 border-l-4 border-blue-400 p-2 rounded-r-lg overflow-hidden"
            style={{
                top: `${top}rem`,
                height: `${height}rem`,
            }}
        >
            <p className="font-bold text-sm text-white truncate">{event.details}</p>
            <p className="text-xs text-gray-300 flex items-center">{getIcon(event.type)} {event.type}</p>
        </div>
    );
};


const AllDayPanel = ({ allDayEvents }) => {
    return (
        <Card>
            <h3 className="text-xl font-bold mb-4">All-Day & Unscheduled</h3>
             <div className="space-y-3">
                {allDayEvents.length > 0 ? (
                    allDayEvents.map(event => (
                        <div key={event.id} className="bg-gray-700 p-3 rounded-lg">
                            <p className="font-semibold">{event.details}</p>
                            <span className="text-xs text-gray-400 capitalize">{event.type}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">No all-day or unscheduled tasks for this date.</p>
                )}
            </div>
        </Card>
    );
};


export default AgendaScreen;
