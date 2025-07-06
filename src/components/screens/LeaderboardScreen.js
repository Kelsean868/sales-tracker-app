import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import Card from '../ui/Card';

const LeaderboardScreen = ({ userId, db, appId }) => {
    const [metric, setMetric] = useState('points'); // points, apiSubmitted, applicationsSubmitted
    const [timeframe, setTimeframe] = useState('weekly'); // daily, weekly, monthly, yearly
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const now = new Date();
        const getWeek = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        let periodId = '';
        switch (timeframe) {
            case 'daily': periodId = now.toISOString().split('T')[0]; break;
            case 'weekly': periodId = `${now.getFullYear()}-W${getWeek(now)}`; break;
            case 'monthly': periodId = `${now.getFullYear()}-${now.getMonth() + 1}`; break;
            case 'yearly': periodId = `${now.getFullYear()}`; break;
            default: break;
        }

        const leaderboardRef = collection(db, `artifacts/${appId}/public/data/leaderboards_${timeframe}/${periodId}/scores`);
        const q = query(leaderboardRef, orderBy(metric, 'desc'), limit(10));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLeaderboardData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => { 
            console.error("Leaderboard fetch error:", error); 
            setLeaderboardData([]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [metric, timeframe, db, appId]);

    const formatValue = (value) => {
        if (metric === 'apiSubmitted') {
            return `$${(value || 0).toLocaleString()}`;
        }
        return (value || 0).toLocaleString();
    };

    const getTitle = () => `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} ${metric === 'points' ? 'Activity Points' : metric === 'apiSubmitted' ? 'API Submitted' : 'Apps Submitted'}`;

    return (
        <div className="p-4 pt-20 pb-24">
            <h1 className="text-2xl font-bold text-white mb-4">Leaderboards</h1>
            <Card>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Metric</label>
                        <div className="flex gap-2">
                           <button onClick={() => setMetric('points')} className={`w-full p-2 rounded-md text-sm font-semibold ${metric === 'points' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>Points</button>
                           <button onClick={() => setMetric('apiSubmitted')} className={`w-full p-2 rounded-md text-sm font-semibold ${metric === 'apiSubmitted' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>API</button>
                           <button onClick={() => setMetric('applicationsSubmitted')} className={`w-full p-2 rounded-md text-sm font-semibold ${metric === 'applicationsSubmitted' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>Apps</button>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                        <div className="flex gap-2">
                           <button onClick={() => setTimeframe('daily')} className={`w-full p-2 rounded-md text-sm font-semibold ${timeframe === 'daily' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>Daily</button>
                           <button onClick={() => setTimeframe('weekly')} className={`w-full p-2 rounded-md text-sm font-semibold ${timeframe === 'weekly' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>Weekly</button>
                           <button onClick={() => setTimeframe('monthly')} className={`w-full p-2 rounded-md text-sm font-semibold ${timeframe === 'monthly' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>Monthly</button>
                           <button onClick={() => setTimeframe('yearly')} className={`w-full p-2 rounded-md text-sm font-semibold ${timeframe === 'yearly' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700'}`}>YTD</button>
                        </div>
                    </div>
                </div>
            </Card>
             <Card className="my-4">
                <h3 className="text-xl font-bold text-white mb-3 text-center">{getTitle()}</h3>
                {loading ? (
                    <p className="text-center text-gray-400">Loading...</p>
                ) : (
                    <ul className="space-y-2">
                        {leaderboardData.length > 0 ? leaderboardData.map((u, index) => (
                            <li key={u.id} className={`flex items-center justify-between p-3 rounded-lg ${u.id === userId ? 'bg-amber-500/20 border-l-4 border-amber-400' : ''}`}>
                                <div className="flex items-center">
                                    <span className="font-bold text-lg w-8">{index + 1}</span>
                                    <img src={u.photoURL || `https://placehold.co/40x40/374151/ECF0F1?text=${u.name ? u.name.charAt(0) : 'A'}`} alt={u.name} className="w-10 h-10 rounded-full mr-3"/>
                                    <span>{u.name}</span>
                                </div>
                                <span className="font-bold text-amber-400 text-lg">{formatValue(u[metric])}</span>
                            </li>
                        )) : <p className="text-center text-gray-400">No data for this period yet.</p>}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default LeaderboardScreen;
