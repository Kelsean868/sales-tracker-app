import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, addDoc, serverTimestamp, setDoc, collectionGroup, where } from 'firebase/firestore';
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
import LeadDetailModal from './components/modals/LeadDetailModal';
import ClientModal from './components/modals/ClientModal';
import LogActivityModal from './components/modals/LogActivityModal';
import PolicyModal from './components/modals/PolicyModal';
import AddUserModal from './components/modals/AddUserModal';
import EditUserModal from './components/modals/EditUserModal';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { ACTIVITY_POINTS } from './constants';


const firebaseConfig = {
  apiKey: "AIzaSyCf7Ev0nCJ-bZn23xLxKuWeUeZ9_082au4",
  authDomain: "sales-tracker-v2-b378d.firebaseapp.com",
  projectId: "sales-tracker-v2-b378d",
  storageBucket: "sales-tracker-v2-b378d.appspot.com",
  messagingSenderId: "859629513373",
  appId: "1:859629513373:web:348c574ab854c393ba0274",
  measurementId: "G-FCBL089CL3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// --- Temporary Auth Screen Component ---
const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
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
                    <button onClick={handleSignIn} className="w-full p-3 bg-blue-600 rounded-md font-semibold hover:bg-blue-700">Sign In</button>
                    <button onClick={handleSignUp} className="w-full p-3 bg-green-600 rounded-md font-semibold hover:bg-green-700">Sign Up</button>
                </div>
            </div>
        </div>
    );
};


const AppContent = () => {
    const [authReady, setAuthReady] = useState(false);
    const [userReady, setUserReady] = useState(false);
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [activeScreen, setActiveScreen] = useState('DASHBOARD');
    
    const [allUsers, setAllUsers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [clients, setClients] = useState([]);
    const [activities, setActivities] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [teams, setTeams] = useState([]);
    const [units, setUnits] = useState([]);
    const [branches, setBranches] = useState([]);

    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
    const [isLeadDetailModalOpen, setLeadDetailModalOpen] = useState(false);
    const [isClientModalOpen, setClientModalOpen] = useState(false);
    const [isLogActivityModalOpen, setLogActivityModalOpen] = useState(false);
    const [isPolicyModalOpen, setPolicyModalOpen] = useState(false);
    const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);

    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedClient, ] = useState(null);
    const [activityTarget, setActivityTarget] = useState(null);
    const [selectedPolicy, ] = useState(null);
    const [userToEdit, setUserToEdit] = useState(null);

    const { addToast } = useNotification();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser && !firebaseUser.isAnonymous) {
                setUserId(firebaseUser.uid);
            } else {
                setUser(null);
                setUserId(null);
                setAuthReady(true);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!userId) {
            if(authReady) setUserReady(true);
            return;
        };

        const userDocRef = doc(db, 'users', userId);
        const unsubUser = onSnapshot(userDocRef, async (docSnapshot) => {
            if (!docSnapshot.exists()) {
                const newUser = {
                    uid: userId,
                    email: auth.currentUser.email,
                    name: auth.currentUser.displayName || 'New Agent',
                    role: 'sales_person',
                    createdAt: serverTimestamp()
                };
                try {
                    await setDoc(userDocRef, newUser);
                } catch (error) {
                    console.error("Error creating user document:", error);
                }
            } else {
                setUser({ uid: docSnapshot.id, ...docSnapshot.data() });
            }
            setAuthReady(true);
            setUserReady(true);
        });
        return () => unsubUser();
    }, [userId, authReady]);

    useEffect(() => {
        if (!userReady || !user) return;

        const managementRoles = ['super_admin', 'admin', 'branch_manager', 'unit_manager'];
        let unsubscribes = [];

        if (managementRoles.includes(user.role)) {
            const queries = {
                leads: query(collectionGroup(db, 'leads')),
                activities: query(collectionGroup(db, 'activities')),
                clients: query(collectionGroup(db, 'clients')),
                contacts: query(collectionGroup(db, 'contacts')),
                allUsers: query(collection(db, 'users')),
            };
            unsubscribes.push(onSnapshot(queries.leads, (snapshot) => setLeads(snapshot.docs.map(d => ({id: d.id, ...d.data()})))));
            unsubscribes.push(onSnapshot(queries.activities, (snapshot) => setActivities(snapshot.docs.map(d => ({id: d.id, ...d.data()})))));
            unsubscribes.push(onSnapshot(queries.clients, (snapshot) => setClients(snapshot.docs.map(d => ({id: d.id, ...d.data()})))));
            unsubscribes.push(onSnapshot(queries.contacts, (snapshot) => setContacts(snapshot.docs.map(d => ({id: d.id, ...d.data()})))));
            unsubscribes.push(onSnapshot(queries.allUsers, (snapshot) => setAllUsers(snapshot.docs.map(d => ({id: d.id, ...d.data()})))));

        } else {
            const userCollections = {
                leads: collection(db, 'users', user.uid, 'leads'),
                clients: collection(db, 'users', user.uid, 'clients'),
                activities: collection(db, 'users', user.uid, 'activities'),
                contacts: collection(db, 'users', user.uid, 'contacts'),
            };
            unsubscribes = Object.entries(userCollections).map(([key, collectionRef]) => {
                return onSnapshot(query(collectionRef), (snapshot) => {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    switch (key) {
                        case 'leads': setLeads(data); break;
                        case 'clients': setClients(data); break;
                        case 'activities': setActivities(data); break;
                        case 'contacts': setContacts(data); break;
                        default: break;
                    }
                });
            });
            unsubscribes.push(onSnapshot(query(collection(db, 'users')), (snapshot) => setAllUsers(snapshot.docs.map(d => ({id: d.id, ...d.data()})))));
        }

        const managementCollections = {
            teams: collection(db, 'teams'),
            units: collection(db, 'units'),
            branches: collection(db, 'branches'),
        };
        const mgmtUnsubscribes = Object.entries(managementCollections).map(([key, collectionRef]) => {
            return onSnapshot(query(collectionRef), (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                switch (key) {
                    case 'teams': setTeams(data); break;
                    case 'units': setUnits(data); break;
                    case 'branches': setBranches(data); break;
                    default: break;
                }
            });
        });

        unsubscribes.push(...mgmtUnsubscribes);
        return () => unsubscribes.forEach(unsub => unsub());

    }, [userReady, user]);

    const handleAddLead = async (leadData) => {
        if (!userId || !user) return;
        try {
            await addDoc(collection(db, 'users', userId, 'leads'), {
                ...leadData,
                createdAt: serverTimestamp(),
                userId: userId,
                teamId: user.teamId || null,
                unitId: user.unitId || null,
                branchId: user.branchId || null,
            });
            addToast('Lead added successfully!', 'success');
        } catch (error) {
            console.error("Error adding lead: ", error);
            addToast('Failed to add lead.', 'error');
        }
    };

    const handleLogActivity = async (activityData) => {
        if (!userId || !user) return;
        try {
            const activitiesCollectionRef = collection(db, 'users', userId, 'activities');
            await addDoc(activitiesCollectionRef, {
                ...activityData,
                timestamp: serverTimestamp(),
                userId: userId,
                points: ACTIVITY_POINTS[activityData.type] || 0,
                teamId: user.teamId || null,
                unitId: user.unitId || null,
                branchId: user.branchId || null,
            });
            addToast('Activity logged successfully!', 'success');
        } catch (error) {
            console.error("Error logging activity: ", error);
            addToast('Failed to log activity.', 'error');
        }
    };

    const handleCreateUser = async (newUserData) => {
        try {
            const addUserFunction = httpsCallable(functions, 'addUser');
            await addUserFunction(newUserData);
            addToast("User created successfully!", 'success');
        } catch (error) {
            console.error("Error calling addUser function:", error);
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleEditUser = async (uidToEdit, updates) => {
        try {
            const editUserFunction = httpsCallable(functions, 'editUser');
            await editUserFunction({ uidToEdit, updates });
            addToast("User updated successfully!", 'success');
        } catch (error) {
            console.error("Error calling editUser function:", error);
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleOpenEditUserModal = (userToEdit) => {
        setUserToEdit(userToEdit);
        setEditUserModalOpen(true);
    };

    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        setLeadDetailModalOpen(true);
    };

    const handleUpdateUser = useCallback((updatedUserData) => {
        setUser(updatedUserData);
    }, []);

    const renderActiveScreen = () => {
        switch (activeScreen) {
            case 'DASHBOARD': return <Dashboard activities={activities} leads={leads} currentUser={user} />;
            case 'LEADS': return <LeadsScreen leads={leads} onSelectLead={handleSelectLead} allUsers={allUsers} currentUser={user} />;
            case 'PORTFOLIO': return <PortfolioScreen clients={clients} />;
            case 'AGENDA': return <AgendaScreen activities={activities} />;
            case 'CONTACTS': return <ContactsScreen contacts={contacts} />;
            case 'LEADERBOARD': return <LeaderboardScreen allUsers={allUsers} activities={activities} />;
            case 'REPORTS': return <ReportsScreen activities={activities} leads={leads} />;
            case 'GOALS': return <GoalsScreen activities={activities} userId={userId} />;
            default: return <Dashboard activities={activities} leads={leads} currentUser={user} />;
        }
    };

    if (!userReady) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex justify-center items-center">
                <p>Initializing...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <TopHeader user={user} onProfileClick={() => setProfileOpen(true)} />
            <main className="p-4 pb-20">{renderActiveScreen()}</main>
            <SpeedDial onAddLead={() => setAddLeadModalOpen(true)} onLogActivity={() => setLogActivityModalOpen(true)} />
            <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

            <ProfileScreen 
                isOpen={isProfileOpen} 
                onClose={() => setProfileOpen(false)}
                user={user}
                userId={userId}
                onUpdateUser={handleUpdateUser}
                db={db}
                storage={storage}
                onOpenAddUserModal={() => setAddUserModalOpen(true)}
                onOpenEditUserModal={handleOpenEditUserModal}
                addToast={addToast}
            />
            <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setAddLeadModalOpen(false)} onAddLead={handleAddLead} />
            <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setAddUserModalOpen(false)} onAddUser={handleCreateUser} />
            <EditUserModal 
                isOpen={isEditUserModalOpen}
                onClose={() => setEditUserModalOpen(false)}
                onSave={handleEditUser}
                userToEdit={userToEdit}
                teams={teams}
                units={units}
                branches={branches}
            />
            <LeadDetailModal isOpen={isLeadDetailModalOpen} onClose={() => {setLeadDetailModalOpen(false); setSelectedLead(null);}} lead={selectedLead} />
            <ClientModal isOpen={isClientModalOpen} onClose={() => setClientModalOpen(false)} client={selectedClient} />
            <LogActivityModal isOpen={isLogActivityModalOpen} onClose={() => setLogActivityModalOpen(false)} relatedTo={activityTarget} onLogActivity={handleLogActivity}/>
            <PolicyModal isOpen={isPolicyModalOpen} onClose={() => setPolicyModalOpen(false)} policy={selectedPolicy} clientId={selectedClient?.id} />
        </div>
    );
};

const App = () => {
    return (
        <NotificationProvider>
            <AppContent />
        </NotificationProvider>
    );
};

export default App;
