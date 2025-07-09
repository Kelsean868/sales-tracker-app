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
import { getFirestore, doc, onSnapshot, collection, query, addDoc, serverTimestamp, setDoc, where, updateDoc, orderBy, limit } from 'firebase/firestore';
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
import { ACTIVITY_POINTS, USER_ROLES } from './constants';


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

// --- Temporary Auth Screen Component ---
const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAuthAction = async (authFunction) => {
        try {
            const userCredential = await authFunction(auth, email, password);
            // Force a refresh of the user's ID token to get new custom claims
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

    const { addToast } = useNotification();
    
    const fetchAdminData = useCallback(async () => {
        try {
            // Ensure the user's token has the latest claims.
            if (auth.currentUser) {
                const idTokenResult = await getIdTokenResult(auth.currentUser, true);
                console.log("Custom claims from fetchAdminData:", JSON.stringify(idTokenResult.claims, null, 2));
            }
            const getAdminData = httpsCallable(functions, 'getAdminDashboardData');
            const result = await getAdminData();
            const { data } = result;
            console.log("Data received in fetchAdminData:", JSON.stringify(data, null, 2));
            setLeads(data.leads || []);
            setClients(data.clients || []);
            setActivities(data.activities || []);
            setContacts(data.contacts || []);
            setAllUsers(data.allUsers || []);
            setTeams(data.teams || []);
            setUnits(data.units || []);
            setBranches(data.branches || []);
            setPolicies(data.policies || []);
        } catch (error) {
            console.error("Error fetching admin data:", error);
            addToast(`Could not load admin dashboard: ${error.message}`, "error");
        }
    }, [addToast, functions]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && !firebaseUser.isAnonymous) {
                try {
                    const idTokenResult = await getIdTokenResult(firebaseUser, true); // Force refresh
                    console.log("Custom claims from onAuthStateChanged:", JSON.stringify(idTokenResult.claims, null, 2));
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

    useEffect(() => {
        if (!user) return;

        // Check user's last work status to be sure
        const workHistoryRef = collection(db, 'workHistory');
        const q = query(
            workHistoryRef,
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const unsubscribeWorkHistory = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const lastEvent = snapshot.docs[0].data();
                setClockedIn(lastEvent.type === 'clock_in');
            } else {
                setClockedIn(false);
            }
        });

        const adminRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN];
        if (adminRoles.includes(user.role)) {
            fetchAdminData();
            return () => unsubscribeWorkHistory();
        }

        const dataCollections = {
            leads: setLeads,
            clients: setClients,
            contacts: setContacts,
            activities: setActivities,
            policies: setPolicies,
        };

        const hierarchyFieldMap = {
            [USER_ROLES.SALES_PERSON]: 'userId',
            [USER_ROLES.TEAM_LEAD]: 'teamId',
            [USER_ROLES.UNIT_MANAGER]: 'unitId',
            [USER_ROLES.BRANCH_MANAGER]: 'branchId',
            [USER_ROLES.REGIONAL_MANAGER]: 'regionId',
        };

        const idField = hierarchyFieldMap[user.role];
        const idValue = user[idField] || user.uid;

        let unsubscribes = [unsubscribeWorkHistory];
        
        Object.entries(dataCollections).forEach(([collectionName, setter]) => {
            const q = query(collection(db, collectionName), where(idField, '==', idValue));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setter(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
            }, (error) => console.error(`Error fetching ${collectionName}:`, error));
            unsubscribes.push(unsubscribe);
        });

        // Listen to global collections
        const globalCollections = { users: setAllUsers, teams: setTeams, units: setUnits, branches: setBranches };
        Object.entries(globalCollections).forEach(([collectionName, setter]) => {
            const q = query(collection(db, collectionName));
            const unsubscribe = onSnapshot(q, (snapshot) => setter(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
            unsubscribes.push(unsubscribe);
        });
        
        return () => unsubscribes.forEach(unsub => unsub());
    }, [user, fetchAdminData]);

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
            await addDoc(collection(db, 'workHistory'), {
                userId: user.uid,
                type: 'clock_in',
                timestamp: serverTimestamp(),
            });
            await updateDoc(doc(db, 'users', user.uid), {
                workStatus: 'available'
            });
            addToast('Clocked in successfully!', 'success');
        } catch (error) {
            console.error("Error clocking in: ", error);
            addToast(`Failed to clock in: ${error.message}`, 'error');
        }
    };

    const handleClockOut = async (summaryNotes) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'workHistory'), {
                userId: user.uid,
                type: 'clock_out',
                timestamp: serverTimestamp(),
                summaryNotes: summaryNotes,
            });
            await updateDoc(doc(db, 'users', user.uid), {
                workStatus: 'unavailable'
            });
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
            const activityRef = doc(db, 'activities', activity.id);
            await updateDoc(activityRef, {
                status: 'completed',
                outcome: outcome,
                notes: notes,
                completedTimestamp: serverTimestamp(),
            });
            addToast(`Call logged as ${outcome}`, 'success');
        } catch (error) {
            console.error('Error logging call outcome: ', error);
            addToast(`Failed to log call: ${error.message}`, 'error');
        }
    };
    
    const handleRescheduleActivity = (activity) => {
        // For now, just log it. A proper reschedule modal would be needed.
        console.log("Reschedule activity:", activity);
        setCallingSessionModalOpen(false); // Close session to avoid conflicts
        addToast("Rescheduling not implemented yet. Opening Log Activity instead.", "info");
        setLogActivityModalOpen(true);
        setActivityTarget(activity);
    };


    const handleAddLead = async (leadData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'leads'), {
                ...leadData,
                ...getOrgIds(user),
                createdAt: serverTimestamp(),
            });
            addToast('Lead added successfully!', 'success');
        } catch (error) {
            console.error("Error adding lead: ", error);
            addToast(`Failed to add lead: ${error.message}`, 'error');
        }
    };
    
    const handleUpdateLead = async (leadData) => {
        if (!user) return;
        try {
            const leadRef = doc(db, 'leads', leadData.id);
            await updateDoc(leadRef, leadData);
            addToast('Lead updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating lead: ", error);
            addToast(`Failed to update lead: ${error.message}`, 'error');
        }
    };

    const handleAddPolicy = async (policyData) => {
        if (!user) return;
        try {
            const dataToSave = {
                ...policyData,
                ...getOrgIds(user),
            };

            if (policyData.id) {
                const policyRef = doc(db, 'policies', policyData.id);
                await setDoc(policyRef, dataToSave, { merge: true });
                addToast('Policy updated successfully!', 'success');
            } else {
                await addDoc(collection(db, 'policies'), dataToSave);
                addToast('Policy added successfully!', 'success');
            }
            setPolicyModalOpen(false);
        } catch (error) {
            console.error("Error saving policy: ", error);
            addToast(`Failed to save policy: ${error.message}`, 'error');
        }
    };
    
    const handleAddContact = async (contactData) => {
        if (!user) return null;
        try {
            const docRef = await addDoc(collection(db, 'contacts'), {
                ...contactData,
                ...getOrgIds(user),
                createdAt: serverTimestamp(),
            });
            addToast('Contact added successfully!', 'success');
            return { id: docRef.id, ...contactData };
        } catch (error) {
            console.error("Error adding contact: ", error);
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
            await addDoc(collection(db, 'activities'), {
                type: activityData.type,
                details: activityData.details,
                relatedTo: activityData.relatedTo,
                isScheduled: activityData.isScheduled,
                scheduledTimestamp: activityData.scheduledTimestamp,
                timestamp: serverTimestamp(),
                points: ACTIVITY_POINTS[activityData.type] || 0,
                ...getOrgIds(targetUser),
                loggedBy: user.uid,
            });
            addToast('Activity logged successfully!', 'success');
        } catch (error) {
            console.error("Error logging activity: ", error);
            addToast(`Failed to log activity: ${error.message}`, 'error');
        }
    };

    const handleCreateUser = async (newUserData) => {
        const addUserFunction = httpsCallable(functions, 'addUser');
        try {
            await addUserFunction(newUserData);
            addToast("User created successfully!", 'success');
        } catch (error) {
            console.error("Error calling addUser function:", error);
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleEditUser = async (uidToEdit, updates) => {
        const editUserFunction = httpsCallable(functions, 'editUser');
        try {
            await editUserFunction({ uidToEdit, updates });
            if (auth.currentUser) {
                await getIdTokenResult(auth.currentUser, true);
            }
            addToast("User updated successfully! Claims refreshed.", 'success');
        } catch (error) {
            console.error("Error calling editUser function:", error);
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleConvertToClient = async (lead) => {
        const convertToClientFunction = httpsCallable(functions, 'convertToClient');
        try {
            await convertToClientFunction({ leadId: lead.id, userId: lead.userId });
            addToast("Lead successfully converted to client!", 'success');
            setLeadDetailModalOpen(false);
        } catch (error) {
            console.error("Error converting lead to client:", error);
            addToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleUpdateClient = async (clientId, clientData) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            await updateDoc(clientRef, clientData);
            addToast('Client updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating client:", error);
            addToast(`Failed to update client: ${error.message}`, 'error');
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
            case 'DASHBOARD': return <Dashboard activities={activities} leads={leads} policies={policies} clients={clients} currentUser={user} allUsers={allUsers} />;
            case 'LEADS': return <LeadsScreen leads={leads} onSelectLead={handleSelectLead} allUsers={allUsers} currentUser={user} onUpdateLead={handleUpdateLead} />;
            case 'PORTFOLIO': return <PortfolioScreen clients={clients} policies={policies} onSelectClient={handleSelectClient} onSelectPolicy={handleOpenPolicyModal}/>;
            case 'AGENDA': return <AgendaScreen activities={activities} currentUser={user} allUsers={allUsers} onStartCallingSession={handleStartCallingSession} />;
            case 'CONTACTS': return <ContactsScreen contacts={contacts} />;
            case 'LEADERBOARD': return <LeaderboardScreen allUsers={allUsers} activities={activities} currentUser={user} />;
            case 'REPORTS': return <ReportsScreen activities={activities} leads={leads} policies={policies} allUsers={allUsers} currentUser={user} />;
            case 'GOALS': return <GoalsScreen activities={activities} userId={user?.uid} currentUser={user} allUsers={allUsers} />;
            default: return <Dashboard activities={activities} leads={leads} policies={policies} clients={clients} currentUser={user} allUsers={allUsers} />;
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
            <TopHeader 
                user={user} 
                onProfileClick={() => setProfileOpen(true)} 
                onSearchClick={handleSearchClick}
                isClockedIn={isClockedIn}
                onClockIn={handleClockIn}
                onClockOut={() => setClockOutModalOpen(true)}
            />
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
                onUpdateLead={handleUpdateLead}
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
            <ClockOutModal
                isOpen={isClockOutModalOpen}
                onClose={() => setClockOutModalOpen(false)}
                onClockOut={handleClockOut}
                user={user}
                activities={activities}
            />
            <CallingSessionModal
                isOpen={isCallingSessionModalOpen}
                onClose={() => setCallingSessionModalOpen(false)}
                activities={callingSessionActivities}
                onLogCall={handleLogCallOutcome}
                onReschedule={handleRescheduleActivity}
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