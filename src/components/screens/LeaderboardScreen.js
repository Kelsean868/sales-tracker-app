import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, getFirestore } from 'firebase/firestore';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../ui/Card';

const LeaderboardScreen = ({ currentUser }) => {
    const [period, setPeriod] = useState('weekly');
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('company');
    const [expandedRows, setExpandedRows] = useState({});
    const db = getFirestore();

    useEffect(() => {
        setLoading(true);
        const leaderboardRef = collection(db, 'leaderboard');
        const q = query(leaderboardRef, orderBy(period, 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeaderboardData(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [period, db]);

    const userHierarchy = useMemo(() => {
        const hierarchy = {};
        leaderboardData.forEach(user => {
            if (user.managerId) {
                if (!hierarchy[user.managerId]) {
                    hierarchy[user.managerId] = [];
                }
                hierarchy[user.managerId].push(user);
            }
        });
        return hierarchy;
    }, [leaderboardData]);

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderUserRow = (user, index, isSubordinate = false) => (
        <React.Fragment key={user.id}>
            <tr 
                className={`hover:bg-gray-700/80 ${isSubordinate ? 'bg-gray-800' : 'bg-gray-700/50'}`} 
                onClick={() => userHierarchy[user.id] && toggleRow(user.id)}
            >
                <td className="p-3 text-center">{index + 1}</td>
                <td className="p-3 flex items-center">
                    <img
                        src={user.photoURL || `https://placehold.co/40x40/374151/ECF0F1?text=${user.name ? user.name.charAt(0) : 'A'}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="ml-4">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{(user.role || '').replace(/_/g, ' ')}</p>
                    </div>
                </td>
                <td className="p-3 text-center">
                    <div className="flex items-center justify-center">
                        <Trophy className="text-yellow-500 mr-2" size={18} />
                        <span className="font-bold text-lg">{(user[period] || 0).toLocaleString()}</span>
                    </div>
                </td>
                <td className="p-3 text-center">
                    {userHierarchy[user.id] ? (
                        expandedRows[user.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                    ) : null}
                </td>
            </tr>
            {expandedRows[user.id] && userHierarchy[user.id] && (
                <tr>
                    <td colSpan="4" className="p-0">
                        <div className="p-4 pl-12 bg-gray-800">
                            <table className="w-full">
                                <tbody>
                                    {userHierarchy[user.id].map((subordinate, subIndex) => renderUserRow(subordinate, subIndex, true))}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );

    const filteredData = useMemo(() => {
        if (view === 'company') {
            return leaderboardData.filter(u => !u.managerId); // Start with top-level users
        }
        
        const getSubordinates = (managerId) => {
            let subordinates = userHierarchy[managerId] || [];
            let all = [...subordinates];
            subordinates.forEach(s => {
                all = [...all, ...getSubordinates(s.id)];
            });
            return all;
        }

        if (view === 'branch' && currentUser.role === 'branch_manager') {
            return getSubordinates(currentUser.uid);
        }
        if (view === 'unit' && currentUser.role === 'unit_manager') {
            return getSubordinates(currentUser.uid);
        }
        if (view === 'team') { // for team leads or managers looking at their direct reports
             return userHierarchy[currentUser.uid] || [];
        }
        
        return leaderboardData.filter(u => u.managerId === currentUser.uid);

    }, [view, leaderboardData, currentUser, userHierarchy]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                <div className="flex items-center space-x-2">
                    <select onChange={(e) => setView(e.target.value)} value={view} className="bg-gray-800 rounded-lg p-2 text-sm">
                        <option value="company">Company Wide</option>
                        {['branch_manager', 'regional_manager', 'admin', 'super_admin'].includes(currentUser.role) && <option value="branch">My Branch</option>}
                        {['unit_manager', 'branch_manager', 'regional_manager', 'admin', 'super_admin'].includes(currentUser.role) && <option value="unit">My Unit</option>}
                        {['team_lead', 'unit_manager', 'branch_manager'].includes(currentUser.role) &&<option value="team">My Team</option>}
                    </select>
                    <div className="flex items-center bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setPeriod('daily')} className={`px-3 py-1 text-sm rounded-md ${period === 'daily' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}>Daily</button>
                        <button onClick={() => setPeriod('weekly')} className={`px-3 py-1 text-sm rounded-md ${period === 'weekly' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}>Weekly</button>
                        <button onClick={() => setPeriod('monthly')} className={`px-3 py-1 text-sm rounded-md ${period === 'monthly' ? 'bg-amber-500 text-gray-900 font-bold' : 'text-gray-300'}`}>Monthly</button>
                    </div>
                </div>
            </div>

            <Card>
                {loading ? (
                    <p className="text-center p-8">Loading leaderboard...</p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-600">
                                <th className="p-3 text-center w-16">Rank</th>
                                <th className="p-3">User</th>
                                <th className="p-3 text-center w-32">Points</th>
                                <th className="p-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((user, index) => renderUserRow(user, index))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center text-gray-500 py-8">
                                        No activity data for this period or view.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
};

export default LeaderboardScreen;
