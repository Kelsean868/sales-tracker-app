import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp, Timestamp, getDoc, deleteDoc, getDocs, where, orderBy, limit, runTransaction, increment, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Import Components (We will create these files next)
import TopHeader from './components/ui/TopHeader';
import BottomNav from './components/ui/BottomNav';
import SpeedDial from './components/ui/SpeedDial';
import Dashboard from './components/screens/Dashboard';
import LeadsScreen from './components/screens/LeadsScreen';
import PortfolioScreen from './components/screens/PortfolioScreen';
import AgendaScreen from './components/screens/AgendaScreen';
import ContactsScreen from './components/screens/ContactsScreen';
import LeaderboardScreen from './components/screens/LeaderboardScreen';
import ReportsScreen from './components/screens/ReportsScreen';
import GoalsScreen from './components/screens/GoalsScreen';
import ProfileScreen from './components/screens/ProfileScreen';

// Import Modals
import AddActivityModal from './components/modals/AddActivityModal';
import AddLeadModal from './components/modals/AddLeadModal';
import LeadDetailModal from './components/modals/LeadDetailModal';
import ClientModal from './components/modals/ClientModal';
import PolicyModal from './components/modals/PolicyModal';
import LostLeadModal from './components/modals/LostLeadModal';
import ContactModal from './components/modals/ContactModal';
import CallingSessionModal from './components/modals/CallingSessionModal';
import ClockOutModal from './components/modals/ClockOutModal';
import UniversalSearchModal from './components/modals/UniversalSearchModal';

// Import Constants
import { firebaseConfig, appId, USER_ROLES, activityTypes, bonusChecks, getAchievement } from './constants';


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Modals State
    const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
    const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
    const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [isLostLeadModalOpen, setIsLostLeadModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isCallingSessionActive, setIsCallingSessionActive] = useState(false);
    const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
    const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState(false);
    const [isProfileScreenOpen, setIsProfileScreenOpen] = useState(false);


    // Data State
    const [activities, setActivities] = useState([]);
    const [allLeads, setAllLeads] = useState([]);
    const [visibleLeads, setVisibleLeads] = useState([]);
    const [clients, setClients] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [weather, setWeather] = useState(null);
    const [callQueue, setCallQueue] = useState([]);

    // Daily State
    const [dailySummary, setDailySummary] = useState(null);
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState(null);
    
    // Context State for Modals
    const [selectedLead, setSelectedLead] = useState(null);
    const [activityContact, setActivityContact] = useState(null);
    const [activityToEdit, setActivityToEdit] = useState(null);
    const [leadToConvert, setLeadToConvert] = useState(null);
    const [leadToMarkAsLost, setLeadToMarkAsLost] = useState(null);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [policyToEdit, setPolicyToEdit] = useState(null);
    const [contactToEdit, setContactToEdit] = useState(null);
    const [primaryClientForPolicy, setPrimaryClientForPolicy] = useState(null);
    const [activityDefaultValues, setActivityDefaultValues] = useState({});

    
    // Auth Effect
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const uid = firebaseUser.uid;
                setUserId(uid);
                const userDocRef = doc(db, `users`, uid);
                const unsubDoc = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setUser({id: doc.id, ...doc.data()});
                    } else {
                        // This is a new user, create their document
                        const newUser = {
                            id: uid,
                            email: firebaseUser.email || `anonymous-${uid.slice(0,5)}@example.com`,
                            name: firebaseUser.displayName || 'New Agent',
                            role: firebaseUser.email === 'admin@example.com' ? USER_ROLES.SUPER_ADMIN : USER_ROLES.SALES_PERSON,
                            created_date: serverTimestamp(),
                            settings: {
                                theme: 'dark',
                                defaultLeadsView: 'pipeline',
                                notifications: {
                                    dailySummaryEmail: true,
                                    upcomingFollowupPush: true,
                                },
                                defaultReportRange: 'weekly',
                            }
                        };
                        setDoc(userDocRef, newUser).then(() => setUser(newUser));
                    }
                });
                setIsAuthReady(true);
                return () => unsubDoc();
            } else { 
                setUser(null); 
                setUserId(null); 
                setIsAuthReady(true);
            }
        });

        const signIn = async () => {
             try {
                await signInAnonymously(auth);
            } catch (error) { console.error("Firebase sign-in error:", error); }
        };
        if (!auth.currentUser) signIn();
        return () => unsubscribe();
    }, []);

    // Data Fetching Effects
    useEffect(() => {
        if (!isAuthReady || !userId) return;
        
        const unsubActivities = onSnapshot(query(collection(db, `users/${userId}/activities`), orderBy("createdTimestamp", "desc")), (snapshot) => setActivities(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubLeads = onSnapshot(query(collection(db, `users/${userId}/leads`), where("status", "in", ["active", "archived"])), (snapshot) => {
            setAllLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubClients = onSnapshot(collection(db, `users/${userId}/clients`), (snapshot) => {
            setClients(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubPolicies = onSnapshot(collection(db, `users/${userId}/policies`), (snapshot) => {
            setPolicies(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubContacts = onSnapshot(query(collection(db, `users/${userId}/contacts`), orderBy("fullName", "asc")), (snapshot) => {
            setContacts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const dateString = new Date().toISOString().split('T')[0];
        const summaryDocRef = doc(db, `users/${userId}/daily_summaries`, dateString);
        const unsubSummary = onSnapshot(summaryDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setDailySummary(data);
                if (data.clockInTime && !data.clockOutTime) {
                    setClockInTime(data.clockInTime);
                    setIsClockedIn(true);
                } else {
                    setClockInTime(null);
                    setIsClockedIn(false);
                }
            } else {
                setDailySummary(null);
                setIsClockedIn(false);
                setClockInTime(null);
            }
        });

        return () => { unsubActivities(); unsubLeads(); unsubClients(); unsubPolicies(); unsubContacts(); unsubSummary(); };
    }, [isAuthReady, userId]);

    // Weather Fetching Effect
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch('https://wttr.in/Trinidad?format=j1');
                if (!response.ok) throw new Error('Weather data not available');
                const data = await response.json();
                setWeather({
                    temp: data.current_condition[0].temp_C,
                    desc: data.current_condition[0].weatherDesc[0].value,
                });
            } catch (error) {
                console.error("Could not fetch weather:", error);
                setWeather(null); // Set to null if fetch fails
            }
        };
        fetchWeather();
    }, []);

    // Derived State and Calculations
    const todaysActivities = useMemo(() => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        
        return activities.filter(act => {
            if (!act.scheduledTimestamp) return false;
            const actDate = act.scheduledTimestamp.toDate();
            return actDate >= startOfDay && actDate <= endOfDay;
        });
    }, [activities]);

    const dailyPointsData = useMemo(() => {
        const potentialPoints = todaysActivities.reduce((sum, act) => sum + (act.points || 0), 0);
        const completedToday = todaysActivities.filter(act => act.status === 'completed');
        const actualPoints = completedToday.reduce((sum, act) => sum + act.points, 0);
        const earnedBonuses = bonusChecks(completedToday);
        const bonusPoints = earnedBonuses.reduce((sum, bonus) => sum + bonus.points, 0);
        
        return {
            potential: potentialPoints,
            actual: actualPoints,
            totalWithBonus: actualPoints + bonusPoints,
        };
    }, [todaysActivities]);

    useEffect(() => {
        const now = new Date();
        const processedLeads = [];
        const leadsToUpdate = [];

        allLeads.forEach(lead => {
            if (lead.status === 'archived' && lead.resurfaceDate && lead.resurfaceDate.toDate() <= now) {
                leadsToUpdate.push({ id: lead.id, updates: { status: 'active', tags: arrayUnion(`Reactivated on ${now.toLocaleDateString()}`) } });
                processedLeads.push({ ...lead, status: 'active' });
            } else if (lead.status === 'active') {
                processedLeads.push(lead);
            }
        });

        setVisibleLeads(processedLeads);

        if (leadsToUpdate.length > 0) {
            const updatePromises = leadsToUpdate.map(item => {
                const leadDocRef = doc(db, `users/${userId}/leads`, item.id);
                return updateDoc(leadDocRef, item.updates);
            });
            Promise.all(updatePromises)
                .then(() => console.log(`${leadsToUpdate.length} leads have been reactivated.`))
                .catch(e => console.error("Error reactivating leads:", e));
        }
    }, [allLeads, userId]);


    const handleSelectLead = (leadId) => { 
        const lead = allLeads.find(l => l.id === leadId);
        if(lead) {
            setSelectedLead(lead); 
            setIsLeadDetailModalOpen(true); 
        }
    };
    const handleCloseLeadDetail = () => { setIsLeadDetailModalOpen(false); setSelectedLead(null); };

    const handleOpenLogActivity = useCallback((contact = null, defaultValues = {}) => {
        setActivityContact(contact);
        setActivityDefaultValues(defaultValues);
        setActivityToEdit(null);
        setIsAddActivityModalOpen(true);
    }, []);
    
    const handleRescheduleActivity = useCallback((activity) => {
        setActivityToEdit(activity);
        setActivityContact(null);
        setActivityDefaultValues({});
        setIsAddActivityModalOpen(true);
    }, []);

    const handleCloseAddActivity = () => {
        setIsAddActivityModalOpen(false);
        setActivityContact(null);
        setActivityToEdit(null);
    };
    
    const handleToggleActivityStatus = async (activity, currentStatus) => {
        if (!userId || !user) return;
        
        const activityDocRef = doc(db, `users/${userId}/activities`, activity.id);
        const newStatus = currentStatus === 'completed' ? 'open' : 'completed';
        
        try {
            await updateDoc(activityDocRef, { status: newStatus });

            const pointsChange = newStatus === 'completed' ? activity.points : -activity.points;
            const apiChange = newStatus === 'completed' ? (activity.api || 0) : -(activity.api || 0);
            const appChange = newStatus === 'completed' && activity.summaryKey === 'applications' ? 1 : (currentStatus === 'completed' && activity.summaryKey === 'applications' ? -1 : 0);

            if (pointsChange !== 0 || apiChange !== 0 || appChange !== 0) {
                await updateLeaderboardAggregates(userId, user, pointsChange, apiChange, appChange);
            }
        } catch (error) {
            console.error("Error updating activity status:", error);
        }
    };
    
    const handleDeleteActivity = async (activityId) => {
        if (!userId || !activityId) return;
        const activityDocRef = doc(db, `users/${userId}/activities`, activityId);
        try { 
            const activitySnap = await getDoc(activityDocRef);
            if (activitySnap.exists()) {
                const activityData = activitySnap.data();
                // Only subtract points if the activity was completed
                if (activityData.status === 'completed') {
                    const pointsToSubtract = activityData.points;
                    const apiToSubtract = activityData.api || 0;
                    const appsToSubtract = activityData.summaryKey === 'applications' ? 1 : 0;
                    await updateLeaderboardAggregates(userId, user, -pointsToSubtract, -apiToSubtract, -appsToSubtract);
                }
                await deleteDoc(activityDocRef);
            }
        } catch (error) { console.error("Error deleting activity: ", error); }
    };
    
    const handleConvertToClient = (leadId) => {
        const lead = allLeads.find(l => l.id === leadId);
        if (lead) {
            setLeadToConvert(lead);
            setClientToEdit(null);
            setIsClientModalOpen(true);
        }
    };

    const handleLoseLead = (leadId) => {
        const lead = allLeads.find(l => l.id === leadId);
        if (lead) {
            setLeadToMarkAsLost(lead);
            setIsLostLeadModalOpen(true);
        }
    };
    
    const handleAddNewClient = () => {
        setLeadToConvert(null);
        setClientToEdit(null);
        setIsClientModalOpen(true);
    };

    const handleEditClient = (client) => {
        setClientToEdit(client);
        setLeadToConvert(null);
        setIsClientModalOpen(true);
    };
    
    const handleAddPolicy = (client) => {
        setPrimaryClientForPolicy(client);
        setPolicyToEdit(null);
        setIsPolicyModalOpen(true);
    };
    
    const handleEditPolicy = (policy) => {
        setPolicyToEdit(policy);
        setPrimaryClientForPolicy(null);
        setIsPolicyModalOpen(true);
    };

    const handleViewClient = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setIsClientModalOpen(false);
            setTimeout(() => {
                handleEditClient(client);
            }, 100);
        }
    };

    const handleOpenAddContact = () => {
        setContactToEdit(null);
        setIsContactModalOpen(true);
    };

    const handleOpenEditContact = (contact) => {
        setContactToEdit(contact);
        setIsContactModalOpen(true);
    };

    const handleCloseContactModal = () => {
        setIsContactModalOpen(false);
        setContactToEdit(null);
    };

    const handleCloseClientModal = () => {
        setIsClientModalOpen(false);
        setLeadToConvert(null);
        setClientToEdit(null);
    };
    
    const handleClosePolicyModal = () => {
        setIsPolicyModalOpen(false);
        setPolicyToEdit(null);
        setPrimaryClientForPolicy(null);
        if (clientToEdit) {
            handleEditClient(clientToEdit);
        }
    };

    const handleConfirmClockOut = async (nextDayPlan) => {
        if (!userId) return;
        const dateString = new Date().toISOString().split('T')[0];
        const summaryDocRef = doc(db, `users/${userId}/daily_summaries`, dateString);
        try {
            await updateDoc(summaryDocRef, { 
                clockOutTime: serverTimestamp(),
                nextDayPlan: nextDayPlan 
            }, { merge: true });
            setIsClockOutModalOpen(false);
        } catch (error) {
            console.error("Error clocking out: ", error);
        }
    };

    const handleViewFromSearch = (type, item) => {
        switch (type) {
            case 'Leads':
                handleSelectLead(item.id);
                break;
            case 'Clients':
                handleEditClient(item);
                break;
            case 'Contacts':
                handleOpenEditContact(item);
                break;
            case 'Policies':
                handleEditPolicy(item);
                break;
            default:
                break;
        }
    };

    const handleStartCallingSession = (calls) => {
        setCallQueue(calls);
        setIsCallingSessionActive(true);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard user={user} activities={activities} userId={userId} onClockOut={() => setIsClockOutModalOpen(true)} leads={visibleLeads} onDeleteActivity={handleDeleteActivity} isClockedIn={isClockedIn} dailyPointsData={dailyPointsData} />;
            case 'leads': return <LeadsScreen leads={visibleLeads} userId={userId} onSelectLead={handleSelectLead} onConvertToClient={handleConvertToClient} onLoseLead={handleLoseLead} />;
            case 'portfolio': return <PortfolioScreen clients={clients} policies={policies} onEditClient={handleEditClient} onAddPolicy={handleAddPolicy} onEditPolicy={handleEditPolicy} />;
            case 'agenda': return <AgendaScreen activities={activities} clients={clients} contacts={contacts} leads={allLeads} onToggleActivityStatus={handleToggleActivityStatus} onViewClient={handleViewClient} onViewLead={handleSelectLead} onRescheduleActivity={handleRescheduleActivity} onStartCallingSession={handleStartCallingSession} />;
            case 'contacts': return <ContactsScreen contacts={contacts} onAddContact={handleOpenAddContact} onEditContact={handleOpenEditContact} />;
            case 'leaderboard': return <LeaderboardScreen userId={userId} />;
            case 'reports': return <ReportsScreen userId={userId} activities={activities} clients={clients} />;
            case 'goals': return <GoalsScreen userId={userId} activities={activities} />;
            default: return <Dashboard user={user} activities={activities} userId={userId} onClockOut={() => setIsClockOutModalOpen(true)} leads={visibleLeads} onDeleteActivity={handleDeleteActivity} isClockedIn={isClockedIn} dailyPointsData={dailyPointsData} />;
        }
    };

    if (!isAuthReady) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading Application...</div>;
    if (!user) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Authenticating... Please wait.</div>;

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans pb-20" style={{ fontFamily: theme.fonts.body, backgroundColor: theme.colors.background }}>
            <TopHeader 
                onSearchClick={() => setIsUniversalSearchOpen(true)}
                onClockOut={() => setIsClockOutModalOpen(true)}
                isClockedIn={isClockedIn}
                clockInTime={clockInTime}
                dailyPointsData={dailyPointsData}
                weather={weather}
                user={user}
                onProfileClick={() => setIsProfileScreenOpen(true)}
            />
            <main className="max-w-4xl mx-auto">{renderContent()}</main>
            
            <SpeedDial 
                onAddActivity={() => handleOpenLogActivity(null, {})} 
                onAddLead={() => setIsAddLeadModalOpen(true)}
                onAddClient={handleAddNewClient}
                onAddContact={handleOpenAddContact}
            />
            
            <UniversalSearchModal 
                isOpen={isUniversalSearchOpen}
                onClose={() => setIsUniversalSearchOpen(false)}
                allData={{ leads: allLeads, clients, contacts, policies }}
                onView={handleViewFromSearch}
            />
            
            <ProfileScreen
                isOpen={isProfileScreenOpen}
                onClose={() => setIsProfileScreenOpen(false)}
                user={user}
                userId={userId}
                onUpdateUser={setUser}
            />

            <CallingSessionModal 
                isOpen={isCallingSessionActive}
                onClose={() => setIsCallingSessionActive(false)}
                callQueue={callQueue}
                userId={userId}
                leads={allLeads}
                clients={clients}
                onCallComplete={() => {}} // Placeholder
                onScheduleFollowUp={handleOpenLogActivity}
            />

            <AddActivityModal 
                isOpen={isAddActivityModalOpen} 
                onClose={handleCloseAddActivity} 
                userId={userId} 
                user={user} 
                associatedContact={activityContact} 
                leads={allLeads} 
                clients={clients} 
                contacts={contacts} 
                activityToEdit={activityToEdit}
                defaultValues={activityDefaultValues}
            />
            <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setIsAddLeadModalOpen(false)} userId={userId} clients={clients} contacts={contacts} leads={allLeads} />
            <ContactModal isOpen={isContactModalOpen} onClose={handleCloseContactModal} userId={userId} contactToEdit={contactToEdit} onLogActivity={handleOpenLogActivity} />
            <LeadDetailModal isOpen={isLeadDetailModalOpen} onClose={handleCloseLeadDetail} lead={selectedLead} userId={userId} onLogActivity={handleOpenLogActivity} onToggleActivityStatus={handleToggleActivityStatus} activities={activities} onViewReferrer={() => {}}/>
            <ClientModal 
                isOpen={isClientModalOpen} 
                onClose={handleCloseClientModal} 
                userId={userId} 
                leadToConvert={leadToConvert} 
                clientToEdit={clientToEdit} 
                policies={policies}
                clients={clients}
                onEditPolicy={handleEditPolicy}
                onViewClient={handleViewClient}
                onLogActivity={handleOpenLogActivity}
                onToggleActivityStatus={handleToggleActivityStatus}
                activities={activities}
                onViewReferrer={() => {}}
            />
            <PolicyModal 
                isOpen={isPolicyModalOpen} 
                onClose={handleClosePolicyModal} 
                userId={userId} 
                clients={clients} 
                primaryClient={primaryClientForPolicy} 
                policies={policies}
                policyToEdit={policyToEdit}
            />
            <LostLeadModal
                isOpen={isLostLeadModalOpen}
                onClose={() => setIsLostLeadModalOpen(false)}
                userId={userId}
                lead={leadToMarkAsLost}
            />
            <ClockOutModal 
                isOpen={isClockOutModalOpen} 
                onClose={() => setIsClockOutModalOpen(false)} 
                onConfirm={handleConfirmClockOut}
                todaysActivities={todaysActivities.filter(act => act.status === 'completed')}
                userId={userId}
            />

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
}
