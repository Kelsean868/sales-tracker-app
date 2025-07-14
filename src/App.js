import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    getIdTokenResult
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, addDoc, serverTimestamp, setDoc, updateDoc, orderBy, limit, startAfter, Timestamp, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Import Components & Modals
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
import AddLeadModal from './components/modals/AddLeadModal';
import AddContactModal from './components/modals/AddContactModal';
import LeadDetailModal from './components/modals/LeadDetailModal';
import ClientModal from './components/modals/ClientModal';
import LogActivityModal from './components/modals/LogActivityModal';
import ClockOutModal from './components/modals/ClockOutModal';
import CallingSessionModal from './components/modals/CallingSessionModal';
import PolicyModal from './components/modals/PolicyModal';
import AddUserModal from './components/modals/AddUserModal';
import EditUserModal from './components/modals/EditUserModal';
import UniversalSearchModal from './components/modals/UniversalSearchModal';
import AddPersonModal from './components/modals/AddPersonModal';
import { NotificationProvider, useNotification } from './context/NotificationContext';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAuthAction = async (authFunction) => {
        try {
            const userCredential = await authFunction(auth, email, password);
            if (userCredential.user) {
                await getIdTokenResult(userCredential.user, true);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center p-4">
            <h1 className="text-3xl font-bold mb-6 text-amber-400">Sales Tracker</h1>
            <div className="w-full max-w-sm space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 focus:ring-amber-500 focus:border-amber-500"/>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 focus:ring-amber-500 focus:border-amber-500"/>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex space-x-4">
                    <button onClick={() => handleAuthAction(signInWithEmailAndPassword)} className="w-full p-3 bg-blue-600 rounded-md font-semibold hover:bg-blue-700">Sign In</button>
                    <button onClick={() => handleAuthAction(createUserWithEmailAndPassword)} className="w-full p-3 bg-green-600 rounded-md font-semibold hover:bg-green-700">Sign Up</button>
                </div>
            </div>
        </div>
    );
};

const AppContent = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeScreen, setActiveScreen] = useState('DASHBOARD');
    
    // Data states
    const [allUsers, setAllUsers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [clients, setClients] = useState([]);
    const [activities, setActivities] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [teams, setTeams] = useState([]);
    const [units, setUnits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [regions, setRegions] = useState([]);

    // Modal states
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
    const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);
    const [isLeadDetailModalOpen, setLeadDetailModalOpen] = useState(false);
    const [isClientModalOpen, setClientModalOpen] = useState(false);
    const [isLogActivityModalOpen, setLogActivityModalOpen] = useState(false);
    const [isPolicyModalOpen, setPolicyModalOpen] = useState(false);
    const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
    const [isSearchModalOpen, setSearchModalOpen] = useState(false);
    const [isAddPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [isClockOutModalOpen, setClockOutModalOpen] = useState(false);
    const [isCallingSessionModalOpen, setCallingSessionModalOpen] = useState(false);

    // App logic states
    const [isClockedIn, setClockedIn] = useState(false);
    const [callingSessionActivities, setCallingSessionActivities] = useState([]);

    // Selected item states
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [activityTarget, setActivityTarget] = useState(null);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [userToEdit, setUserToEdit] = useState(null);
    
    // Pagination states
    const [lastLead, setLastLead] = useState(null);
    const [lastClient, setLastClient] = useState(null);
    const [lastPolicy, setLastPolicy] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const { addToast } = useNotification();
    
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && !firebaseUser.isAnonymous) {
                try {
                    await getIdTokenResult(firebaseUser, true); 
                } catch (error) {
                    console.error("Error getting token result in onAuthStateChanged:", error);
                }
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = { uid: docSnapshot.id, ...docSnapshot.data() };
                        setUser(userData);
                        setClockedIn(userData.workStatus === 'available');
                    } else {
                        setUser(null); 
                    }
                    setLoading(false);
                });
                return () => unsubscribeUserDoc();
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    const fetchMoreData = useCallback(async (collectionName) => {
        if (loadingMore) return;
        setLoadingMore(true);

        let lastDoc, setLastDoc, setData;
        if (collectionName === 'leads') { lastDoc = lastLead; setLastDoc = setLastLead; setData = setLeads; }
        else if (collectionName === 'clients') { lastDoc = lastClient; setLastDoc = setLastClient; setData = setClients; }
        else if (collectionName === 'policies') { lastDoc = lastPolicy; setLastDoc = setLastPolicy; setData = setPolicies; }
        else { setLoadingMore(false); return; }

        try {
            const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(25));
            const documentSnapshots = await getDocs(q);
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length-1];
            if(lastVisible) setLastDoc(lastVisible);

            const newDocs = documentSnapshots.docs.map(d => ({id: d.id, ...d.data()}));
            setData(prevData => [...prevData, ...newDocs]);
        } catch (error) {
            console.error(`Error fetching more ${collectionName}:`, error);
        } finally {
            setLoadingMore(false);
        }
    }, [lastLead, lastClient, lastPolicy, loadingMore]);

    useEffect(() => {
        if (!user) return;

        const transformTimestamp = (item, key) => {
            if (item[key] && item[key].seconds) {
                return { ...item, [key]: new Timestamp(item[key].seconds, item[key].nanoseconds).toDate() };
            }
            return item;
        };

        const paginatedCollections = { leads: setLeads, clients: setClients, policies: setPolicies };
        const nonPaginatedCollections = {
            contacts: (data) => setContacts(data.map(item => transformTimestamp(item, 'createdAt'))),
            activities: (data) => setActivities(data.map(item => transformTimestamp(item, 'timestamp'))),
        };
        const globalCollections = { users: setAllUsers, teams: setTeams, units: setUnits, branchs: setBranches, regions: setRegions };

        let unsubscribes = [];

        Object.entries(paginatedCollections).forEach(([collectionName, setter]) => {
            const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(25));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
                setter(data.map(item => transformTimestamp(item, 'createdAt')));
                const lastVisible = snapshot.docs[snapshot.docs.length-1];
                if(lastVisible){
                    if (collectionName === 'leads') setLastLead(lastVisible);
                    if (collectionName === 'clients') setLastClient(lastVisible);
                    if (collectionName === 'policies') setLastPolicy(lastVisible);
                }
            }, (error) => console.error(`Error fetching ${collectionName}:`, error));
            unsubscribes.push(unsubscribe);
        });
        
        Object.entries(nonPaginatedCollections).forEach(([collectionName, setter]) => {
            const q = query(collection(db, collectionName));
            const unsubscribe = onSnapshot(q, (snapshot) => setter(snapshot.docs.map(d => ({id: d.id, ...d.data()}))), (error) => console.error(`Error fetching ${collectionName}:`, error));
            unsubscribes.push(unsubscribe);
        });

        Object.entries(globalCollections).forEach(([collectionName, setter]) => {
            const q = query(collection(db, collectionName));
            const unsubscribe = onSnapshot(q, (snapshot) => setter(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
            unsubscribes.push(unsubscribe);
        });
        
        return () => unsubscribes.forEach(unsub => unsub());
    }, [user]);

    const getOrgIds = (targetUser) => ({
        userId: targetUser.uid,
        teamId: targetUser.teamId || null,
        unitId: targetUser.unitId || null,
        branchId: targetUser.branchId || null,
        regionId: targetUser.regionId || null,
    });
    
    const handleClockIn = async () => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'workHistory'), { userId: user.uid, type: 'clock_in', timestamp: serverTimestamp() });
            await updateDoc(doc(db, 'users', user.uid), { workStatus: 'available' });
            addToast('Clocked in successfully!', 'success');
        } catch (error) {
            addToast(`Failed to clock in: ${error.message}`, 'error');
        }
    };

    const handleClockOut = async (clockOutData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'workHistory'), {
                userId: user.uid,
                type: 'clock_out',
                timestamp: serverTimestamp(),
                ...clockOutData,
            });
            await updateDoc(doc(db, 'users', user.uid), { workStatus: 'unavailable' });
            setClockOutModalOpen(false);
            addToast('Clocked out successfully!', 'success');
        } catch (error) {
            console.error("Error clocking out: ", error);
            addToast(`Failed to clock out: ${error.message}`, 'error');
        }
    };

    const handleStartCallingSession = (activitiesForSession) => {
        setCallingSessionActivities(activitiesForSession);
        setCallingSessionModalOpen(true);
    };

    const handleLogCallOutcome = async (activity, outcome, notes) => {
        try {
            await updateDoc(doc(db, 'activities', activity.id), { status: 'completed', outcome, notes, completedTimestamp: serverTimestamp() });
            addToast(`Call logged as ${outcome}`, 'success');
        } catch (error) {
            addToast(`Failed to log call: ${error.message}`, 'error');
        }
    };
    
    const handleRescheduleActivity = (activity) => {
        setCallingSessionModalOpen(false);
        addToast("Rescheduling not implemented. Opening Log Activity instead.", "info");
        setLogActivityModalOpen(true);
        setActivityTarget(activity);
    };

    const handleAddLead = async (leadData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'leads'), { ...leadData, ...getOrgIds(user), createdAt: serverTimestamp() });
            addToast('Lead added successfully!', 'success');
        } catch (error) {
            addToast(`Failed to add lead: ${error.message}`, 'error');
        }
    };
    
    const handleUpdateLead = async (leadData) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'leads', leadData.id), leadData);
            addToast('Lead updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update lead: ${error.message}`, 'error');
        }
    };

    const handleAddPolicy = async (policyData) => {
        if (!user) return;
        try {
            const dataToSave = { ...policyData, ...getOrgIds(user), policyNumber_lowercase: policyData.policyNumber.toLowerCase() };
            if (policyData.id) {
                await setDoc(doc(db, 'policies', policyData.id), dataToSave, { merge: true });
                addToast('Policy updated successfully!', 'success');
            } else {
                await addDoc(collection(db, 'policies'), { ...dataToSave, createdAt: serverTimestamp() });
                addToast('Policy added successfully!', 'success');
            }
            setPolicyModalOpen(false);
        } catch (error) {
            addToast(`Failed to save policy: ${error.message}`, 'error');
        }
    };
    
    const handleAddContact = async (contactData) => {
        if (!user) return null;
        try {
            const docRef = await addDoc(collection(db, 'contacts'), { ...contactData, ...getOrgIds(user), createdAt: serverTimestamp() });
            addToast('Contact added successfully!', 'success');
            return { id: docRef.id, ...contactData };
        } catch (error) {
            addToast(`Failed to add contact: ${error.message}`, 'error');
            return null;
        }
    };

    const handleLogActivity = async (activityData) => {
        const targetUserId = activityData.logForUserId || user.uid;
        const targetUser = allUsers.find(u => u.id === targetUserId);
        if (!targetUser) {
            addToast('Target user not found.', 'error');
            return;
        }

        try {
            const dataToSave = {
                type: activityData.type,
                details: activityData.details,
                relatedTo: activityData.relatedTo,
                isScheduled: activityData.isScheduled,
                scheduledTimestamp: activityData.scheduledTimestamp,
                points: activityData.points,
                apiValue: activityData.apiValue || null,
                timestamp: serverTimestamp(),
                ...getOrgIds(targetUser),
                loggedBy: user.uid,
            };

            await addDoc(collection(db, 'activities'), dataToSave);
            addToast('Activity logged successfully!', 'success');
        } catch (error) {
            console.error("Error logging activity: ", error);
            addToast(`Failed to log activity: ${error.message}`, 'error');
        }
    };

    const handleCreateUser = async (newUserData) => {
        try {
            await httpsCallable(functions, 'addUser')(newUserData);
            addToast("User created successfully!", 'success');
        } catch (error) {
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleEditUser = async (uidToEdit, updates) => {
        try {
            await httpsCallable(functions, 'editUser')({ uidToEdit, updates });
            if (auth.currentUser) await getIdTokenResult(auth.currentUser, true);
            addToast("User updated successfully! Claims refreshed.", 'success');
        } catch (error) {
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleConvertToClient = async (lead) => {
        try {
            await httpsCallable(functions, 'convertToClient')({ leadId: lead.id, userId: lead.userId });
            addToast("Lead successfully converted to client!", 'success');
            setLeadDetailModalOpen(false);
        } catch (error) {
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleUpdateClient = async (clientId, clientData) => {
        try {
            await updateDoc(doc(db, 'clients', clientId), clientData);
            addToast('Client updated successfully!', 'success');
        } catch (error) {
            addToast(`Failed to update client: ${error.message}`, 'error');
        }
    };

    const handleLogout = () => signOut(auth).catch(error => addToast("Failed to sign out.", 'error'));
    
    const handleOpenEditUserModal = (userToEdit) => { setUserToEdit(userToEdit); setEditUserModalOpen(true); };
    const handleSelectLead = (lead) => { setSelectedLead(lead); setLeadDetailModalOpen(true); };
    const handleSelectClient = (client) => { setSelectedClient(client); setClientModalOpen(true); };
    const handleSelectPolicy = (policy) => { setSelectedPolicy(policy); setPolicyModalOpen(true); };
    const handleUpdateUser = useCallback((updatedUserData) => setUser(updatedUserData), []);
    const handleSearchClick = () => setSearchModalOpen(true);
    const handleCloseSearch = () => setSearchModalOpen(false);
    const handleOpenPolicyModal = (policy = null) => { setSelectedPolicy(policy); setPolicyModalOpen(true); };

    const renderActiveScreen = () => {
        const screens = {
            'DASHBOARD': <Dashboard activities={activities} leads={leads} policies={policies} clients={clients} currentUser={user} allUsers={allUsers} />,
            'LEADS': <LeadsScreen leads={leads} onSelectLead={handleSelectLead} allUsers={allUsers} currentUser={user} onUpdateLead={handleUpdateLead} fetchMoreData={() => fetchMoreData('leads')} loadingMore={loadingMore} />,
            'PORTFOLIO': <PortfolioScreen clients={clients} policies={policies} onSelectClient={handleSelectClient} onSelectPolicy={handleOpenPolicyModal} fetchMoreData={fetchMoreData} loadingMore={loadingMore}/>,
            'AGENDA': <AgendaScreen activities={activities} currentUser={user} allUsers={allUsers} onStartCallingSession={handleStartCallingSession} />,
            'CONTACTS': <ContactsScreen contacts={contacts} />,
            'LEADERBOARD': <LeaderboardScreen allUsers={allUsers} activities={activities} currentUser={user} />,
            'REPORTS': <ReportsScreen activities={activities} leads={leads} policies={policies} allUsers={allUsers} currentUser={user} />,
            'GOALS': <GoalsScreen activities={activities} userId={user?.uid} currentUser={user} allUsers={allUsers} />,
        };
        return screens[activeScreen] || screens['DASHBOARD'];
    };

    if (loading) return <div className="bg-gray-900 text-white min-h-screen flex justify-center items-center"><p>Initializing...</p></div>;
    if (!user) return <AuthScreen />;

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <TopHeader user={user} onProfileClick={() => setProfileOpen(true)} onSearchClick={handleSearchClick} isClockedIn={isClockedIn} onClockIn={handleClockIn} onClockOut={() => setClockOutModalOpen(true)} />
            <main className="p-4 pb-20">{renderActiveScreen()}</main>
            <SpeedDial onAddLead={() => setAddLeadModalOpen(true)} onAddContact={() => setAddContactModalOpen(true)} onAddActivity={() => setLogActivityModalOpen(true)} />
            <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

            <ProfileScreen 
                isOpen={isProfileOpen} 
                onClose={() => setProfileOpen(false)} 
                user={user} 
                userId={user.uid} 
                onUpdateUser={handleUpdateUser} 
                storage={storage} 
                onOpenAddUserModal={() => setAddUserModalOpen(true)} 
                onOpenEditUserModal={handleOpenEditUserModal} 
                addToast={addToast} 
                onLogout={handleLogout}
                allUsers={allUsers}
                teams={teams}
                units={units}
                branches={branches}
                regions={regions}
            />
            <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setAddLeadModalOpen(false)} onAddLead={handleAddLead} />
            <AddContactModal isOpen={isAddContactModalOpen} onClose={() => setAddContactModalOpen(false)} onAddContact={handleAddContact} />
            <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setAddUserModalOpen(false)} onAddUser={handleCreateUser} />
            <AddPersonModal isOpen={isAddPersonModalOpen} onClose={() => setAddPersonModalOpen(false)} onSave={handleAddContact} />
            <EditUserModal isOpen={isEditUserModalOpen} onClose={() => setEditUserModalOpen(false)} onSave={handleEditUser} userToEdit={userToEdit} teams={teams} units={units} branches={branches} />
            <LeadDetailModal isOpen={isLeadDetailModalOpen} onClose={() => {setLeadDetailModalOpen(false); setSelectedLead(null);}} lead={selectedLead} onConvertToClient={handleConvertToClient} onUpdateLead={handleUpdateLead} />
            <ClientModal isOpen={isClientModalOpen} onClose={() => setClientModalOpen(false)} client={selectedClient} policies={policies} onAddPolicy={() => handleOpenPolicyModal(null)} onSelectPolicy={handleOpenPolicyModal} onUpdateClient={handleUpdateClient} />
            <LogActivityModal isOpen={isLogActivityModalOpen} onClose={() => setLogActivityModalOpen(false)} relatedTo={activityTarget} onLogActivity={handleLogActivity} currentUser={user} allUsers={allUsers} />
            <ClockOutModal isOpen={isClockOutModalOpen} onClose={() => setClockOutModalOpen(false)} onClockOut={handleClockOut} user={user} activities={activities} />
            <CallingSessionModal isOpen={isCallingSessionModalOpen} onClose={() => setCallingSessionModalOpen(false)} activities={callingSessionActivities} onLogCall={handleLogCallOutcome} onReschedule={handleRescheduleActivity} />
            <PolicyModal isOpen={isPolicyModalOpen} onClose={() => setPolicyModalOpen(false)} policy={selectedPolicy} client={selectedClient} clientId={selectedClient?.id} onAddPolicy={handleAddPolicy} contacts={contacts} onAddNewPerson={() => setAddPersonModalOpen(true)} ageCalculationType={user?.settings?.ageCalculation || 'ageNextBirthday'} />
            <UniversalSearchModal isOpen={isSearchModalOpen} onClose={handleCloseSearch} onSelectLead={handleSelectLead} onSelectClient={handleSelectClient} onSelectPolicy={handleSelectPolicy} />
        </div>
    );
};

const App = () => (
    <NotificationProvider>
        <AppContent />
    </NotificationProvider>
);

export default App;
