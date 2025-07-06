import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Home, Clock, Star, Trophy, LogIn, LogOut, CalendarPlus } from 'lucide-react';
import { getAchievement } from '../../constants';
import Card from '../ui/Card';

const UpcomingFollowups = ({ leads }) => {
    const upcoming = useMemo(() => {
        const now = new Date();
        return leads
            .filter(lead => lead.followUpDate && lead.followUpDate.toDate() > now)
            .sort((a, b) => a.followUpDate.toMillis() - b.followUpDate.toMillis())
            .slice(0, 5);
    }, [leads]);

    if (upcoming.length === 0) {
        return (
            <Card className="my-4">
                 <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                    <CalendarPlus className="w-5 h-5 mr-2 text-green-400"/> Upcoming Follow-ups
                </h3>
                <p className="text-gray-400 text-center py-4">No upcoming follow-ups scheduled.</p>
            </Card>
        );
    }

    return (
        <Card className="my-4">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                <CalendarPlus className="w-5 h-5 mr-2 text-green-400"/> Upcoming Follow-ups
            </h3>
            <div className="space-y-3">
                {upcoming.map(lead => (
                    <div key={lead.id} className="bg-gray-900/50 p-3 rounded-lg">
                        <p className="font-bold text-white">{lead.name}</p>
                        <p className="text-sm text-amber-400">{new Date(lead.followUpDate.toMillis()).toLocaleString('en-TT')}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
};


const Dashboard = ({ user, activities, userId, onClockOut, leads, isClockedIn, dailyPointsData, db, appId }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    
    useEffect(() => {
        if (!userId) return;
        const now = new Date();
        const getWeek = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }
        const weekId = `${now.getFullYear()}-W${getWeek(now)}`;
        const leaderboardRef = collection(db, `artifacts/${appId}/public/data/leaderboards_weekly/${weekId}/scores`);
        const q = query(leaderboardRef, orderBy('points', 'desc'), limit(5));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => { 
            console.error("Leaderboard fetch error:", error);
            if (error.code !== 'permission-denied') {
                alert("Could not fetch leaderboard data.");
            }
        });

        return () => unsubscribe();
    }, [userId, db, appId]);

    const handleClockIn = async () => {
        if (!userId) return;
        const now = Timestamp.now();
        const dateString = new Date().toISOString().split('T')[0];
        const summaryDocRef = doc(db, `users/${userId}/daily_summaries`, dateString);
        try {
            await setDoc(summaryDocRef, { userId, date: now, clockInTime: now, lastUpdated: serverTimestamp() }, { merge: true });
        } catch (error) { console.error("Error clocking in:", error); }
    };

    const todaysActivities = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return activities.filter(act => {
            if (!act.scheduledTimestamp) return false;
            const actDate = act.scheduledTimestamp.toDate();
            actDate.setHours(0, 0, 0, 0);
            return actDate.getTime() === today.getTime();
        });
    }, [activities]);

    const achievement = getAchievement(dailyPointsData.totalWithBonus);

    return (
        <div className="p-4 pt-20 pb-24">
            <h1 className="text-2xl font-bold text-white">Welcome, {user?.name || 'Agent'}!</h1>
            <p className="text-gray-400">Summary for {new Date().toLocaleDateString('en-TT', { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
            
            <UpcomingFollowups leads={leads} />

            <Card className="my-4 text-center">
                <p className="text-gray-400 text-lg">Today's Total Points</p>
                <p className="text-6xl font-bold text-amber-400 my-2">{dailyPointsData.totalWithBonus}</p>
                <div className="flex items-center justify-center space-x-2">
                    {achievement.icon}
                    <p className="text-xl font-semibold text-white">{achievement.level}</p>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center"><Trophy className="w-5 h-5 mr-2 text-yellow-400"/> Weekly Leaderboard</h3>
                    <ul className="space-y-2">
                        {leaderboard.slice(0, 5).map((u, index) => (
                            <li key={u.id} className={`flex items-center justify-between p-2 rounded-lg ${u.id === userId ? 'bg-amber-500/20' : ''}`}>
                                <div className="flex items-center">
                                    <span className="font-bold text-lg w-8">{index + 1}</span>
                                    <img src={u.photoURL || `https://placehold.co/40x40/374151/ECF0F1?text=${u.name ? u.name.charAt(0) : 'A'}`} alt={u.name} className="w-10 h-10 rounded-full mr-3"/>
                                    <span>{u.name}</span>
                                </div>
                                <span className="font-bold text-amber-400">{u.points} pts</span>
                            </li>
                        ))}
                         {leaderboard.length === 0 && <p className="text-gray-400 text-center py-4">No leaderboard data yet.</p>}
                    </ul>
                </Card>
                <Card>
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center"><Clock className="w-5 h-5 mr-2 text-blue-400"/> Time Clock</h3>
                    {!isClockedIn ? (
                        <div className="text-center">
                            <p className="text-gray-300 mb-4">Ready to start your day?</p>
                            <button onClick={handleClockIn} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center">
                               <LogIn className="w-5 h-5 mr-2"/> Clock In
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-300">You are clocked in. Great work today!</p>
                            <button onClick={onClockOut} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center">
                                <LogOut className="w-5 h-5 mr-2"/> Clock Out & End Day
                            </button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
