import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, updateDoc, collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Edit, Save, X, UploadCloud, Clock, ShieldCheck, PlusCircle, Building, Users, Briefcase, LogOut, User } from 'lucide-react'; // FIX: Added User icon
import { USER_ROLES } from '../../constants';

const ProfileScreen = ({ isOpen, onClose, user, userId, onUpdateUser, db, storage, onOpenAddUserModal, onOpenEditUserModal, addToast, onLogout }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [settings, setSettings] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    const [allUsers, setAllUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [units, setUnits] = useState([]);
    const [branches, setBranches] = useState([]);
    const [newOrgUnit, setNewOrgUnit] = useState({ name: '', type: '' });

    const auth = getAuth();

    const managementRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.UNIT_MANAGER];
    const canManage = user && managementRoles.includes(user.role);

    const initialProfileState = useMemo(() => ({
        name: user?.name || '',
        phone: user?.phone || '',
        company: user?.company || '',
        companyAddress: user?.companyAddress || '',
        branch: user?.branch || '',
    }), [user]);

    const initialSettingsState = useMemo(() => ({
        theme: 'dark',
        defaultLeadsView: 'pipeline',
        notifications: {
            dailySummaryEmail: true,
            upcomingFollowupPush: true,
        },
        defaultReportRange: 'weekly',
        ...user?.settings,
    }), [user]);

    useEffect(() => {
        if (!isOpen || !canManage || !db) {
            return; 
        }

        const collectionsToListen = {
            users: collection(db, 'users'),
            teams: collection(db, 'teams'),
            units: collection(db, 'units'),
            branches: collection(db, 'branches'),
        };

        const unsubscribes = Object.entries(collectionsToListen).map(([key, collectionRef]) => {
            return onSnapshot(query(collectionRef), (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                switch (key) {
                    case 'users': setAllUsers(data); break;
                    case 'teams': setTeams(data); break;
                    case 'units': setUnits(data); break;
                    case 'branches': setBranches(data); break;
                    default: break;
                }
            }, (error) => {
                console.error(`Error fetching real-time ${key}:`, error);
            });
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };

    }, [isOpen, canManage, db]);


    useEffect(() => {
        if (isOpen) {
            setProfileData(initialProfileState);
            setSettings(initialSettingsState);
            setIsEditing(false);
        }
    }, [isOpen, initialProfileState, initialSettingsState]);


    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        const keys = name.split('.');
        
        setSettings(prev => {
            const newSettings = JSON.parse(JSON.stringify(prev));
            let current = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = current[keys[i]] || {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = val;
            return newSettings;
        });
    };

    const handleSave = async () => {
        if (!userId) return;
        const userDocRef = doc(db, `users`, userId);
        try {
            const dataToUpdate = { ...profileData, settings: settings };
            await updateDoc(userDocRef, dataToUpdate);
            onUpdateUser({ ...user, ...dataToUpdate });
            setIsEditing(false);
            addToast('Profile saved!', 'success');
        } catch (error) {
            console.error("Error updating profile:", error);
            addToast('Failed to save profile.', 'error');
        }
    };

    const handlePasswordReset = () => {
        if (user?.email) {
            sendPasswordResetEmail(auth, user.email)
                .then(() => addToast('Password reset email sent.', 'info'))
                .catch((error) => {
                    console.error("Error sending password reset email:", error);
                    addToast('Failed to send reset email.', 'error');
                });
        }
    };
    
    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId || !storage) return;

        setIsUploading(true);
        const storageRef = ref(storage, `users/${userId}/profilePicture`);
        
        try {
            try { await getDownloadURL(storageRef); await deleteObject(storageRef); } catch (error) { /* Ignore */ }
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            const userDocRef = doc(db, `users`, userId);
            await updateDoc(userDocRef, { photoURL: downloadURL });
            onUpdateUser({ ...user, photoURL: downloadURL });
            addToast('Profile picture updated!', 'success');
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            addToast('Image upload failed.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateOrgUnit = async (e) => {
        e.preventDefault();
        if (!newOrgUnit.name || !newOrgUnit.type) {
            addToast('Please provide a name and select a type.', 'error');
            return;
        }
        try {
            await addDoc(collection(db, `${newOrgUnit.type}s`), { 
                name: newOrgUnit.name,
                createdAt: serverTimestamp(),
            });
            addToast(`${newOrgUnit.type.charAt(0).toUpperCase() + newOrgUnit.type.slice(1)} created!`, 'success');
            setNewOrgUnit({ name: '', type: '' });
        } catch (error) {
            console.error("Error creating organizational unit:", error);
            addToast('Failed to create unit.', 'error');
        }
    };

    if (!isOpen) return null;
    
    const InfoField = ({ label, value, name, isEditing, onChange, type = 'text' }) => (
        <div>
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            {isEditing ? (
                <input type={type} name={name} value={value || ''} onChange={onChange} className="w-full mt-1 bg-gray-700 text-white border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
            ) : (
                <p className="text-white text-lg font-semibold">{value || 'N/A'}</p>
            )}
        </div>
    );

    const renderProfileTab = () => (
        <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <img src={user?.photoURL || `https://placehold.co/128x128/374151/ECF0F1?text=${user?.name ? user.name.charAt(0) : 'A'}`} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-600" />
                    <button onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors">
                        {isUploading ? <Clock className="w-5 h-5 animate-spin"/> : <UploadCloud className="w-5 h-5"/>}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handlePictureUpload} accept="image/*" className="hidden" />
                </div>
                 <h2 className="text-2xl font-bold">{isEditing ? profileData.name : user?.name}</h2>
                 <p className="text-gray-400 capitalize">{(user?.role || 'sales_person').replace(/_/g, ' ').toLowerCase()}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Full Name" name="name" value={profileData.name} isEditing={isEditing} onChange={handleProfileChange} />
                <InfoField label="Contact Number" name="phone" value={profileData.phone} isEditing={isEditing} onChange={handleProfileChange} type="tel" />
                <InfoField label="Company" name="company" value={profileData.company} isEditing={isEditing} onChange={handleProfileChange} />
                <InfoField label="Company Address" name="companyAddress" value={profileData.companyAddress} isEditing={isEditing} onChange={handleProfileChange} />
                <InfoField label="Branch / Agency" name="branch" value={profileData.branch} isEditing={isEditing} onChange={handleProfileChange} />
            </div>
        </div>
    );
    
    const renderAccountTab = () => (
        <div className="space-y-6">
             <div>
                <label className="block text-sm font-medium text-gray-400">Email Address</label>
                <p className="text-white text-lg font-semibold bg-gray-700/50 p-2 rounded-md">{user?.email}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                <button onClick={handlePasswordReset} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                    Send Password Reset Email
                </button>
            </div>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">General</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
                    <select name="theme" value={settings.theme || 'dark'} onChange={handleSettingsChange} disabled={!isEditing} className="w-full bg-gray-700 text-white p-2 rounded-md disabled:opacity-50">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Default Leads View</label>
                    <select name="defaultLeadsView" value={settings.defaultLeadsView || 'pipeline'} onChange={handleSettingsChange} disabled={!isEditing} className="w-full bg-gray-700 text-white p-2 rounded-md disabled:opacity-50">
                        <option value="pipeline">Pipeline</option>
                        <option value="list">List</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Default Report Range</label>
                    <select name="defaultReportRange" value={settings.defaultReportRange || 'weekly'} onChange={handleSettingsChange} disabled={!isEditing} className="w-full bg-gray-700 text-white p-2 rounded-md disabled:opacity-50">
                        <option value="weekly">This Week</option>
                        <option value="monthly">This Month</option>
                        <option value="quarterly">This Quarter</option>
                        <option value="ytd">Year to Date</option>
                    </select>
                </div>
            </div>
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">Notifications</h3>
                 <div className="flex items-center justify-between">
                    <label htmlFor="dailySummaryEmail" className="text-white">Email me a daily summary report</label>
                    <input type="checkbox" id="dailySummaryEmail" name="notifications.dailySummaryEmail" checked={settings.notifications?.dailySummaryEmail || false} onChange={handleSettingsChange} disabled={!isEditing} className="h-6 w-6 rounded text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500 disabled:opacity-50"/>
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="upcomingFollowupPush" className="text-white">Push notifications for upcoming follow-ups</label>
                    <input type="checkbox" id="upcomingFollowupPush" name="notifications.upcomingFollowupPush" checked={settings.notifications?.upcomingFollowupPush || false} onChange={handleSettingsChange} disabled={!isEditing} className="h-6 w-6 rounded text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500 disabled:opacity-50"/>
                </div>
            </div>
        </div>
    );
    
    const renderManagementTab = () => (
        <div className="space-y-8">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">User Management</h2>
                    <button onClick={onOpenAddUserModal} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center">
                        <PlusCircle className="w-5 h-5 mr-2"/> Add User
                    </button>
                </div>
                <div className="bg-gray-900/50 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700 sticky top-0">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map(u => (
                                <tr key={u.id} className="border-b border-gray-700">
                                    <td className="p-3 flex items-center gap-3">
                                        <img src={u.photoURL || `https://placehold.co/40x40/374151/ECF0F1?text=${u.name ? u.name.charAt(0) : 'A'}`} alt={u.name} className="w-8 h-8 rounded-full" />
                                        {u.name}
                                    </td>
                                    <td className="p-3 text-gray-400">{u.email}</td>
                                    <td className="p-3 text-gray-400 capitalize">{(u.role || 'sales_person').replace(/_/g, ' ').toLowerCase()}</td>
                                    <td className="p-3">
                                        <button onClick={() => onOpenEditUserModal(u)} className="text-blue-400 hover:underline">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Organizational Units</h2>
                <form onSubmit={handleCreateOrgUnit} className="flex items-end gap-4 mb-6 p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex-grow">
                        <label htmlFor="unitName" className="block text-sm font-medium text-gray-400">New Unit Name</label>
                        <input id="unitName" type="text" value={newOrgUnit.name} onChange={(e) => setNewOrgUnit(prev => ({...prev, name: e.target.value}))} placeholder="e.g., North Star Unit" className="w-full mt-1 bg-gray-700 text-white border-gray-600 rounded-md p-2" />
                    </div>
                    <div>
                        <label htmlFor="unitType" className="block text-sm font-medium text-gray-400">Type</label>
                        <select id="unitType" value={newOrgUnit.type} onChange={(e) => setNewOrgUnit(prev => ({...prev, type: e.target.value}))} className="w-full mt-1 bg-gray-700 text-white border-gray-600 rounded-md p-2 h-[42px]">
                            <option value="">Select Type</option>
                            <option value="branch">Branch</option>
                            <option value="unit">Unit</option>
                            <option value="team">Team</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md h-[42px]">Create</button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <OrgUnitList title="Branches" items={branches} icon={<Building className="w-5 h-5 mr-2"/>} />
                    <OrgUnitList title="Units" items={units} icon={<Briefcase className="w-5 h-5 mr-2"/>} />
                    <OrgUnitList title="Teams" items={teams} icon={<Users className="w-5 h-5 mr-2"/>} />
                </div>
            </div>
        </div>
    );

    const OrgUnitList = ({ title, items, icon }) => (
        <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center">{icon} {title}</h3>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
                {items.map(item => (
                    <li key={item.id} className="bg-gray-700/50 p-2 rounded-md">{item.name}</li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700">
                    <h1 className="text-2xl font-bold">Profile & Settings</h1>
                    <div className="flex items-center gap-4">
                        {activeTab !== 'management' && (
                            isEditing ? (
                                <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center">
                                    <Save className="w-5 h-5 mr-2"/> Save Changes
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center">
                                    <Edit className="w-5 h-5 mr-2"/> Edit
                                </button>
                            )
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                    </div>
                </header>
                <div className="flex-grow flex overflow-hidden">
                    <nav className="w-1/4 border-r border-gray-700 p-4 flex flex-col">
                        <ul className="space-y-2 flex-grow">
                            <li><button onClick={() => setActiveTab('profile')} className={`w-full text-left p-2 rounded-md flex items-center ${activeTab === 'profile' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-700'}`}><User className="w-5 h-5 mr-2"/>Profile</button></li>
                            <li><button onClick={() => setActiveTab('account')} className={`w-full text-left p-2 rounded-md flex items-center ${activeTab === 'account' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-700'}`}><ShieldCheck className="w-5 h-5 mr-2"/>Account</button></li>
                            <li><button onClick={() => setActiveTab('settings')} className={`w-full text-left p-2 rounded-md flex items-center ${activeTab === 'settings' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-700'}`}>Settings</button></li>
                            {canManage && <li><button onClick={() => setActiveTab('management')} className={`w-full text-left p-2 rounded-md flex items-center ${activeTab === 'management' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-700'}`}><Briefcase className="w-5 h-5 mr-2"/>Management</button></li>}
                        </ul>
                        <div>
                            <button onClick={onLogout} className="w-full mt-4 text-left p-2 rounded-md flex items-center text-red-400 hover:bg-red-500/20">
                                <LogOut className="w-5 h-5 mr-2"/> Logout
                            </button>
                        </div>
                    </nav>
                    <main className="w-3/4 p-6 overflow-y-auto">
                        {activeTab === 'profile' && renderProfileTab()}
                        {activeTab === 'account' && renderAccountTab()}
                        {activeTab === 'settings' && renderSettingsTab()}
                        {activeTab === 'management' && canManage && renderManagementTab()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
