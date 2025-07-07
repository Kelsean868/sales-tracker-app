import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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


const App = () => {
    const [authReady, setAuthReady] = useState(false);
    const [userReady, setUserReady] = useState(false);
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [activeScreen, setActiveScreen] = useState('DASHBOARD');
    
    const [leads, setLeads] = useState([]);
    const [clients, setClients] = useState([]);
    const [activities, setActivities] = useState([]);
    const [contacts, setContacts] = useState([]);

    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isAddLeadModalOpen, setAddLeadModalOpen] = useState(false);
    const [isLeadDetailModalOpen, setLeadDetailModalOpen] = useState(false);
    const [isClientModalOpen, setClientModalOpen] = useState(false);
    const [isLogActivityModalOpen, setLogActivityModalOpen] = useState(false);
    const [isPolicyModalOpen, setPolicyModalOpen] = useState(false);
    const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);

    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedClient, ] = useState(null);
    const [activityTarget, ] = useState(null);
    const [selectedPolicy, ] = useState(null);

    // Effect 1: Handle Auth State
    useEffect(() => {
        console.log("DEBUG: App.js - Auth Effect Running");
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log("DEBUG: App.js - onAuthStateChanged fired.");
            if (firebaseUser && !firebaseUser.isAnonymous) {
                console.log("DEBUG: App.js - User is LOGGED IN. UID:", firebaseUser.uid);
                setUserId(firebaseUser.uid);
            } else {
                console.log("DEBUG: App.js - User is LOGGED OUT.");
                setUser(null);
                setUserId(null);
                setAuthReady(true);
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect 2: Handle User Document Loading
    useEffect(() => {
        console.log("DEBUG: App.js - User Doc Effect Running. Current userId:", userId);
        if (!userId) {
            if(authReady) setUserReady(true);
            return;
        };

        const userDocRef = doc(db, 'users', userId);
        const unsubUser = onSnapshot(userDocRef, async (docSnapshot) => {
            console.log("DEBUG: App.js - User document snapshot received.");
            if (!docSnapshot.exists()) {
                console.log("DEBUG: App.js - User document does NOT exist. Creating it...");
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
                    console.error("DEBUG: App.js - Error creating user document:", error);
                }
            } else {
                const userData = { uid: docSnapshot.id, ...docSnapshot.data() };
                console.log("DEBUG: App.js - User document EXISTS. User role:", userData.role);
                setUser(userData);
            }
            setAuthReady(true);
            setUserReady(true);
        });
        return () => unsubUser();
    }, [userId, authReady]);

    // Effect 3: Handle Data Fetching
    useEffect(() => {
        console.log(`DEBUG: App.js - Data Fetching Effect Running. User Ready: ${userReady}, User ID: ${userId}`);
        if (!userReady || !userId) return;

        console.log("DEBUG: App.js - Conditions met. Fetching sub-collections...");
        const collections = {
            leads: collection(db, 'users', userId, 'leads'),
            clients: collection(db, 'users', userId, 'clients'),
            activities: collection(db, 'users', userId, 'activities'),
            contacts: collection(db, 'users', userId, 'contacts'),
        };
        const unsubscribes = Object.entries(collections).map(([key, collectionRef]) => {
            const q = query(collectionRef);
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                switch (key) {
                    case 'leads': setLeads(data); break;
                    case 'clients': setClients(data); break;
                    case 'activities': setActivities(data); break;
                    case 'contacts': setContacts(data); break;
                    default: break;
                }
            }, (error) => console.error(`DEBUG: App.js - Error fetching ${key}:`, error));
        });
        return () => unsubscribes.forEach(unsub => unsub());
    }, [userReady, userId]);

    const handleAddLead = async (leadData) => {
        if (!userId) return;
        try {
            await addDoc(collection(db, 'users', userId, 'leads'), {
                ...leadData,
                createdAt: serverTimestamp(),
                userId: userId,
            });
        } catch (error) {
            console.error("Error adding lead: ", error);
        }
    };

    const handleCreateUser = async (newUserData) => {
        console.log("DEBUG: App.js - handleCreateUser called.");
        try {
            const addUserFunction = httpsCallable(functions, 'addUser');
            const result = await addUserFunction(newUserData);
            console.log("Cloud Function result:", result.data);
            alert("User created successfully!");
        } catch (error) {
            console.error("DEBUG: App.js - Error calling addUser function:", error);
            alert(`Error: ${error.message}`);
        }
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
            case 'DASHBOARD': return <Dashboard activities={activities} leads={leads} />;
            case 'LEADS': return <LeadsScreen leads={leads} onSelectLead={handleSelectLead} />;
            case 'PORTFOLIO': return <PortfolioScreen clients={clients} />;
            case 'AGENDA': return <AgendaScreen activities={activities} />;
            case 'CONTACTS': return <ContactsScreen contacts={contacts} />;
            case 'LEADERBOARD': return <LeaderboardScreen />;
            case 'REPORTS': return <ReportsScreen />;
            case 'GOALS': return <GoalsScreen activities={activities} userId={userId} />;
            default: return <Dashboard activities={activities} leads={leads}/>;
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
            <SpeedDial onAddLead={() => setAddLeadModalOpen(true)} />
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
                onOpenEditUserModal={() => {}}
            />
            <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setAddLeadModalOpen(false)} onAddLead={handleAddLead} />
            <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setAddUserModalOpen(false)} onAddUser={handleCreateUser} />
            <LeadDetailModal isOpen={isLeadDetailModalOpen} onClose={() => {setLeadDetailModalOpen(false); setSelectedLead(null);}} lead={selectedLead} />
            <ClientModal isOpen={isClientModalOpen} onClose={() => setClientModalOpen(false)} client={selectedClient} />
            <LogActivityModal isOpen={isLogActivityModalOpen} onClose={() => setLogActivityModalOpen(false)} relatedTo={activityTarget} onLogActivity={() => {}}/>
            <PolicyModal isOpen={isPolicyModalOpen} onClose={() => setPolicyModalOpen(false)} policy={selectedPolicy} clientId={selectedClient?.id} />
        </div>
    );
};

export default App;
