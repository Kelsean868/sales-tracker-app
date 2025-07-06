import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PhoneCall, CheckSquare, Users, Briefcase, Inbox } from 'lucide-react';
import Card from '../ui/Card';

const AgendaScreen = ({ activities, clients, contacts, leads, onToggleActivityStatus, onViewClient, onViewLead, onRescheduleActivity, onStartCallingSession, theme }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'smart'

    const PIXELS_PER_HOUR = 80;
    const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

    const { timedActivities, allDayActivities, inboxActivities, dailyCalls } = useMemo(() => {
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        const dailyActivities = activities.filter(act => {
            if (!act.scheduledTimestamp) return false;
            const actDate = act.scheduledTimestamp.toDate();
            return actDate >= startOfDay && actDate <= endOfDay;
        }).sort((a,b) => a.scheduledTimestamp.toMillis() - b.scheduledTimestamp.toMillis());

        const timed = [];
        const allDay = [];
        const calls = [];

        dailyActivities.forEach(act => {
            if (act.activityType === 'Call') {
                calls.push(act);
            }
            if (act.scheduledTime) {
                timed.push(act);
            } else {
                allDay.push(act);
            }
        });
        
        const inbox = activities.filter(act => !act.scheduledTimestamp && act.status !== 'completed');

        return { timedActivities: timed, allDayActivities: allDay, inboxActivities: inbox, dailyCalls: calls };

    }, [activities, currentDate]);

    const handlePrev = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() - 1);
            return newDate;
        });
    };

    const handleNext = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + 1);
            return newDate;
        });
    };
    
    const getActivityIcon = (type) => {
        switch(type) {
            case 'Task': return <CheckSquare className="w-5 h-5 text-blue-400" />;
            case 'Call': return <PhoneCall className="w-5 h-5 text-green-400" />;
            case 'Meeting': return <Users className="w-5 h-5 text-purple-400" />;
            default: return <Briefcase className="w-5 h-5 text-gray-400" />;
        }
    };
    
    const MiniCalendar = ({ displayDate, onDateClick }) => {
        const [month, year] = [displayDate.getMonth(), displayDate.getFullYear()];
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const blanks = Array.from({ length: firstDay });
        const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        return (
            <div className="bg-gray-800 p-3 rounded-lg">
                <h4 className="text-center font-bold text-white mb-2">{displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
                    {weekDays.map((d, i) => <div key={`${d}-${i}`}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm mt-1">
                    {blanks.map((_, i) => <div key={`b-${i}`}></div>)}
                    {days.map(day => {
                        const isSelected = currentDate.getDate() === day && currentDate.getMonth() === month && currentDate.getFullYear() === year;
                        return (
                            <button 
                                key={day} 
                                onClick={() => onDateClick(new Date(year, month, day))}
                                className={`p-1 rounded-full ${isSelected ? 'bg-amber-500 text-gray-900' : 'hover:bg-gray-700'}`}
                            >
                                {day}
                            </button>
                        )
                    })}
                </div>
            </div>
        );
    };

    const ActivityCard = ({ act }) => {
        const contact = useMemo(() => {
            if (act.leadId) return leads.find(l => l.id === act.leadId);
            if (act.clientId) return clients.find(c => c.id === act.clientId);
            if (act.contactId) return contacts.find(c => c.id === act.contactId);
            return null;
        }, [act.leadId, act.clientId, act.contactId, leads, clients, contacts]);
        
        const contactName = contact ? (contact.name || contact.fullName) : null;
        
        const handleViewContact = (e) => {
            e.stopPropagation();
            if (act.leadId) onViewLead(act.leadId);
            else if (act.clientId) onViewClient(act.clientId);
            // No view for general contact yet
        };

        return (
            <Card onClick={() => onRescheduleActivity(act)} className={`transition-opacity ${act.status === 'completed' ? 'opacity-60' : 'opacity-100'}`}>
                <div className="flex items-start gap-4">
                    <div onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={act.status === 'completed'} onChange={() => onToggleActivityStatus(act, act.status)} className="mt-1 h-5 w-5" /></div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-center">
                            <p className={`font-bold text-lg text-white ${act.status === 'completed' && 'line-through'}`}>{act.subject || act.type}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                {getActivityIcon(act.activityType)}
                                <span>{act.activityType}</span>
                            </div>
                        </div>
                        <p className="text-sm text-amber-400">{act.scheduledTime ? act.scheduledTimestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'All-day'} ({act.duration} min)</p>
                        {contactName && (
                            <button onClick={handleViewContact} className="text-blue-400 hover:underline text-sm">{contactName}</button>
                        )}
                        {act.notes && <p className="text-sm text-gray-400 mt-2">{act.notes}</p>}
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="p-4 pt-20 pb-24">
            <h1 className="text-2xl font-bold text-white mb-4">Agenda</h1>
            
            <Card className="mb-4">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeft/></button>
                    <h2 className="text-lg font-semibold text-white text-center">
                        {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h2>
                    <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-700"><ChevronRight/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MiniCalendar displayDate={currentDate} onDateClick={setCurrentDate} />
                    <div className="flex flex-col justify-center">
                         <label className="block text-sm font-medium text-gray-300 mb-2 text-center">View Mode</label>
                         <div className="flex gap-2">
                             <button onClick={() => setViewMode('timeline')} className={`w-full p-2 rounded-md text-sm font-semibold ${viewMode === 'timeline' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>Timeline</button>
                             <button onClick={() => setViewMode('smart')} className={`w-full p-2 rounded-md text-sm font-semibold ${viewMode === 'smart' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>Smart</button>
                         </div>
                    </div>
                </div>
                 {dailyCalls.length > 0 && (
                    <button onClick={() => onStartCallingSession(dailyCalls)} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center">
                        <PhoneCall className="w-5 h-5 mr-2"/> Start Calling Session ({dailyCalls.length} calls)
                    </button>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {viewMode === 'smart' && (
                        <div className="space-y-3">
                            {[...allDayActivities, ...timedActivities].map(act => <ActivityCard key={act.id} act={act} />)}
                            {allDayActivities.length === 0 && timedActivities.length === 0 && <Card className="text-center"><p className="text-gray-400">No activities scheduled for this day.</p></Card>}
                        </div>
                    )}
                    {viewMode === 'timeline' && (
                        <>
                            <Card className="mb-4">
                                <h3 className="font-bold text-white mb-2">All-Day</h3>
                                <div className="space-y-2">
                                  {allDayActivities.length > 0 ? (
                                      allDayActivities.map(act => (
                                          <div key={act.id} onClick={() => onRescheduleActivity(act)} className={`flex items-start gap-3 p-2 rounded-md cursor-pointer ${act.status === 'completed' ? 'bg-gray-900/50' : 'bg-gray-700/80 hover:bg-gray-700'}`}>
                                               <div onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={act.status === 'completed'} onChange={() => onToggleActivityStatus(act, act.status)} className="mt-1 h-5 w-5" /></div>
                                               <p className={`flex-grow ${act.status === 'completed' && 'line-through opacity-60'}`}>{act.subject || act.type}</p>
                                          </div>
                                      ))
                                  ) : (
                                      <p className="text-sm text-gray-500">No all-day activities scheduled.</p>
                                  )}
                                </div>
                            </Card>
                            <div className="relative pl-16 pr-4 min-h-[1920px]">
                                <div className="absolute top-0 left-16 bottom-0 w-px bg-gray-700"></div>
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div key={hour} className="relative" style={{ height: `${PIXELS_PER_HOUR}px` }}>
                                        <span className="absolute -top-2 right-full pr-4 text-xs text-gray-500">
                                            {hour === 0 ? '12 AM' : (hour < 12 ? `${hour} AM` : (hour === 12 ? '12 PM' : `${hour - 12} PM`))}
                                        </span>
                                    </div>
                                ))}
                                {timedActivities.map(act => {
                                    const top = (act.scheduledTimestamp.toDate().getHours() * PIXELS_PER_HOUR) + (act.scheduledTimestamp.toDate().getMinutes() * PIXELS_PER_MINUTE);
                                    const height = Math.max(act.duration * PIXELS_PER_MINUTE, 40);
                                    return <div key={act.id} onClick={() => onRescheduleActivity(act)} className="absolute right-0 left-4 rounded-lg p-2 bg-gray-800/80 backdrop-blur-sm shadow-md flex gap-3 transition-all cursor-pointer hover:bg-gray-700/90 hover:shadow-lg" style={{ top: `${top}px`, height: `${height}px`, borderLeft: `3px solid ${theme.colors.accent}`, opacity: act.status === 'completed' ? 0.6 : 1 }}>
                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={act.status === 'completed'} onChange={() => onToggleActivityStatus(act, act.status)} className="h-5 w-5 rounded-full" /></div>
                                        <div className="flex-grow overflow-hidden">
                                            <p className={`font-bold text-white truncate ${act.status === 'completed' && 'line-through'}`}>{act.subject || act.type}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">{getActivityIcon(act.activityType)}<span>{act.scheduledTimestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                        </div>
                                    </div>
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <Card>
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Inbox className="w-5 h-5 text-amber-400"/> Inbox</h3>
                        <p className="text-xs text-gray-400 mb-3">Activities needing to be scheduled.</p>
                        <div className="space-y-2">
                            {inboxActivities.length > 0 ? (
                                inboxActivities.map(act => (
                                    <div key={act.id} onClick={() => onRescheduleActivity(act)} className="p-2 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600">
                                        <p className="font-semibold">{act.subject || act.type}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">Inbox is clear!</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AgendaScreen;
