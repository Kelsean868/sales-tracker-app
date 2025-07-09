import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, addDoc, serverTimestamp, setDoc, collectionGroup, where, updateDoc } from 'firebase/firestore';
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
import PolicyModal from './components/modals/PolicyModal';
import AddUserModal from './components/modals/AddUserModal';
import EditUserModal from './components/modals/EditUserModal';
import UniversalSearchModal from './components/modals/UniversalSearchModal';
import AddPersonModal from './components/modals/AddPersonModal';
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

    // Selected item states
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [activityTarget, setActivityTarget] = useState(null);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [userToEdit, setUserToEdit] = useState(null);

    const { addToast } = useNotification();
    
    // --- Data Fetching Logic ---
    const fetchAdminData = useCallback(() => {
        const getAdminData = httpsCallable(functions, 'getAdminDashboardData');
        getAdminData()
            .then(result => {
                const { data } = result;
                setLeads(data.leads || []);
                setClients(data.clients || []);
                setActivities(data.activities || []);
                setContacts(data.contacts || []);
                setAllUsers(data.allUsers || []);
                setTeams(data.teams || []);
                setUnits(data.units || []);
                setBranches(data.branches || []);
                setPolicies(data.policies || []);
            })
            .catch(error => {
                console.error("Error fetching admin data:", error);
                addToast(`Could not load admin dashboard: ${error.message}`, "error");
            });
    }, [addToast]);


    // --- Authentication and User Data Effect ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser && !firebaseUser.isAnonymous) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setUser({ uid: docSnapshot.id, ...docSnapshot.data() });
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

    // --- Data Fetching Effect ---
    useEffect(() => {
        if (!user) {
            return;
        }

        const managementRoles = ['super_admin', 'admin'];

        if (managementRoles.includes(user.role)) {
            fetchAdminData();
            return;
        }

        let unsubscribes = [];
        const createListener = (q, setter) => {
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setter(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
            }, (error) => {
                console.error(`Error in listener:`, error);
            });
            unsubscribes.push(unsubscribe);
        };

        createListener(query(collection(db, 'users', user.uid, 'leads')), setLeads);
        createListener(query(collection(db, 'users', user.uid, 'contacts')), setContacts);
        createListener(query(collection(db, 'users', user.uid, 'clients')), setClients);
        createListener(query(collection(db, 'users', user.uid, 'activities')), setActivities);
        createListener(query(collection(db, 'users', user.uid, 'policies')), setPolicies);
        
        createListener(query(collection(db, 'users')), setAllUsers);
        createListener(query(collection(db, 'teams')), setTeams);
        createListener(query(collection(db, 'units')), setUnits);
        createListener(query(collection(db, 'branches')), setBranches);

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [user, fetchAdminData]);

    // --- Handler Functions ---
    const handleAddLead = async (leadData) => {
        if (!user || !user.uid) return;
        try {
            await addDoc(collection(db, 'users', user.uid, 'leads'), {
                ...leadData,
                createdAt: serverTimestamp(),
                userId: user.uid,
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

    const handleAddPolicy = async (policyData) => {
        if (!user || !user.uid) return;
        try {
            const dataToSave = {
                ...policyData,
                agentId: user.uid,
                teamId: user.teamId || null,
                unitId: user.unitId || null,
                branchId: user.branchId || null,
            };

            if (policyData.id) {
                const policyRef = doc(db, 'users', user.uid, 'policies', policyData.id);
                await setDoc(policyRef, dataToSave, { merge: true });
                addToast('Policy updated successfully!', 'success');
            } else {
                await addDoc(collection(db, 'users', user.uid, 'policies'), dataToSave);
                addToast('Policy added successfully!', 'success');
            }

            setPolicyModalOpen(false);
            const managementRoles = ['super_admin', 'admin'];
            if (managementRoles.includes(user.role)) {
                fetchAdminData();
            }
        } catch (error) {
            console.error("Error saving policy: ", error);
            addToast('Failed to save policy.', 'error');
        }
    };
    
    const handleAddContact = async (contactData) => {
        if (!user || !user.uid) return;
        try {
            const docRef = await addDoc(collection(db, 'users', user.uid, 'contacts'), {
                ...contactData,
                createdAt: serverTimestamp(),
                userId: user.uid,
            });
            addToast('Contact added successfully!', 'success');
            return { id: docRef.id, ...contactData };
        } catch (error) {
            console.error("Error adding contact: ", error);
            addToast('Failed to add contact.', 'error');
            return null;
        }
    };

    const handleLogActivity = async (activityData) => {
        const targetUserId = activityData.logForUserId;
        if (!targetUserId) {
            addToast('Could not determine user to log activity for.', 'error');
            return;
        }
        const targetUser = allUsers.find(u => u.id === targetUserId);
        try {
            await addDoc(collection(db, 'users', targetUserId, 'activities'), {
                type: activityData.type,
                details: activityData.details,
                relatedTo: activityData.relatedTo,
                isScheduled: activityData.isScheduled,
                scheduledTimestamp: activityData.scheduledTimestamp,
                timestamp: serverTimestamp(),
                userId: targetUserId,
                points: ACTIVITY_POINTS[activityData.type] || 0,
                teamId: targetUser?.teamId || null,
                unitId: targetUser?.unitId || null,
                branchId: targetUser?.branchId || null,
                loggedBy: user.uid,
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

    const handleConvertToClient = async (lead) => {
        try {
            const convertToClientFunction = httpsCallable(functions, 'convertToClient');
            await convertToClientFunction({ leadId: lead.id, userId: lead.userId });
            addToast("Lead successfully converted to client!", 'success');
            setLeadDetailModalOpen(false); // Close the modal on success
            
            const managementRoles = ['super_admin', 'admin'];
            if (managementRoles.includes(user.role)) {
                fetchAdminData();
            }
        } catch (error) {
            console.error("Error converting lead to client:", error);
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleUpdateClient = async (clientId, clientData) => {
        if (!user || !user.uid) return;
        try {
            const clientRef = doc(db, 'users', user.uid, 'clients', clientId);
            await updateDoc(clientRef, clientData);
            addToast('Client updated successfully!', 'success');
            const managementRoles = ['super_admin', 'admin'];
            if (managementRoles.includes(user.role)) {
                fetchAdminData();
            }
        } catch (error) {
            console.error("Error updating client:", error);
            addToast('Failed to update client.', 'error');
        }
    };

    const handleLogout = () => {
        signOut(auth).catch(error => {
            console.error("Error signing out:", error);
            addToast("Failed to sign out.", 'error');
        });
    };

    const handleOpenEditUserModal = (userToEdit) => {
        setUserToEdit(userToEdit);
        setEditUserModalOpen(true);
    };

    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        setLeadDetailModalOpen(true);
    };

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setClientModalOpen(true);
    };
    
    const handleSelectPolicy = (policy) => {
        setSelectedPolicy(policy);
        setPolicyModalOpen(true);
    };

    const handleUpdateUser = useCallback((updatedUserData) => {
        setUser(updatedUserData);
    }, []);

    const handleSearchClick = () => setSearchModalOpen(true);
    const handleCloseSearch = () => setSearchModalOpen(false);
    
    const handleOpenPolicyModal = (policy = null) => {
        setSelectedPolicy(policy);
        setPolicyModalOpen(true);
    };

    const renderActiveScreen = () => {
        switch (activeScreen) {
            case 'DASHBOARD': return <Dashboard activities={activities} leads={leads} currentUser={user} />;
            case 'LEADS': return <LeadsScreen leads={leads} onSelectLead={handleSelectLead} allUsers={allUsers} currentUser={user} />;
            case 'PORTFOLIO': return <PortfolioScreen clients={clients} policies={policies} onSelectClient={handleSelectClient} onSelectPolicy={handleOpenPolicyModal}/>;
            case 'AGENDA': return <AgendaScreen activities={activities} />;
            case 'CONTACTS': return <ContactsScreen contacts={contacts} />;
            case 'LEADERBOARD': return <LeaderboardScreen allUsers={allUsers} activities={activities} />;
            case 'REPORTS': return <ReportsScreen activities={activities} leads={leads} allUsers={allUsers} currentUser={user} />;
            case 'GOALS': return <GoalsScreen activities={activities} userId={user?.uid} currentUser={user} allUsers={allUsers} />;
            default: return <Dashboard activities={activities} leads={leads} currentUser={user} />;
        }
    };

    if (loading) {
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
            <TopHeader user={user} onProfileClick={() => setProfileOpen(true)} onSearchClick={handleSearchClick} />
            <main className="p-4 pb-20">{renderActiveScreen()}</main>
            <SpeedDial 
                onAddLead={() => setAddLeadModalOpen(true)} 
                onAddContact={() => setAddContactModalOpen(true)}
                onAddActivity={() => setLogActivityModalOpen(true)} 
            />
            <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

            <ProfileScreen 
                isOpen={isProfileOpen} 
                onClose={() => setProfileOpen(false)}
                user={user}
                userId={user.uid}
                onUpdateUser={handleUpdateUser}
                db={db}
                storage={storage}
                onOpenAddUserModal={() => setAddUserModalOpen(true)}
                onOpenEditUserModal={handleOpenEditUserModal}
                addToast={addToast}
                onLogout={handleLogout}
            />
            <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setAddLeadModalOpen(false)} onAddLead={handleAddLead} />
            <AddContactModal isOpen={isAddContactModalOpen} onClose={() => setAddContactModalOpen(false)} onAddContact={handleAddContact} />
            <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setAddUserModalOpen(false)} onAddUser={handleCreateUser} />
             <AddPersonModal 
                isOpen={isAddPersonModalOpen} 
                onClose={() => setAddPersonModalOpen(false)} 
                onSave={handleAddContact} 
            />
            <EditUserModal 
                isOpen={isEditUserModalOpen}
                onClose={() => setEditUserModalOpen(false)}
                onSave={handleEditUser}
                userToEdit={userToEdit}
                teams={teams}
                units={units}
                branches={branches}
            />
            <LeadDetailModal 
                isOpen={isLeadDetailModalOpen} 
                onClose={() => {setLeadDetailModalOpen(false); setSelectedLead(null);}} 
                lead={selectedLead}
                onConvertToClient={handleConvertToClient}
            />
            <ClientModal 
                isOpen={isClientModalOpen} 
                onClose={() => setClientModalOpen(false)} 
                client={selectedClient} 
                policies={policies}
                onAddPolicy={() => handleOpenPolicyModal(null)}
                onSelectPolicy={handleOpenPolicyModal}
                onUpdateClient={handleUpdateClient}
            />
            <LogActivityModal 
                isOpen={isLogActivityModalOpen} 
                onClose={() => setLogActivityModalOpen(false)} 
                relatedTo={activityTarget} 
                onLogActivity={handleLogActivity}
                currentUser={user}
                allUsers={allUsers}
            />
            <PolicyModal 
              isOpen={isPolicyModalOpen} 
              onClose={() => setPolicyModalOpen(false)} 
              policy={selectedPolicy} 
              client={selectedClient}
              clientId={selectedClient?.id} 
              onAddPolicy={handleAddPolicy}
              contacts={contacts}
              onAddNewPerson={() => setAddPersonModalOpen(true)}
              ageCalculationType={user?.settings?.ageCalculation || 'ageNextBirthday'}
            />
            <UniversalSearchModal 
                isOpen={isSearchModalOpen} 
                onClose={handleCloseSearch}
                onSelectLead={handleSelectLead}
                onSelectClient={handleSelectClient}
                onSelectPolicy={handleSelectPolicy}
            />
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
