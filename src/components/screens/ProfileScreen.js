import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getFirestore, doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { User, Edit, Save, X, UploadCloud, Clock, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { USER_ROLES } from '../../constants';
import Card from '../ui/Card';

const ProfileScreen = ({ isOpen, onClose, user, userId, onUpdateUser, db, appId }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [settings, setSettings] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [allUsers, setAllUsers] = useState([]);
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
        if (isOpen) {
            setProfileData(initialProfileState);
            setSettings(initialSettingsState);
            setIsEditing(false);
            
            if (canManage) {
                const usersCollectionRef = collection(db, `users`);
                getDocs(usersCollectionRef).then(snapshot => {
                    setAllUsers(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
                }).catch(error => console.error("Error fetching users:", error));
            }
        }
    }, [isOpen, initialProfileState, initialSettingsState, user, canManage, db]);

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
        const userDocRef = doc(db, `users`, userId);
        try {
            const dataToUpdate = {
                ...profileData,
                settings: settings,
            };
            await updateDoc(userDocRef, dataToUpdate);
            onUpdateUser({ ...user, ...dataToUpdate });
            setIsEditing(false);
            alert("Profile saved successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to save profile.");
        }
    };

    const handlePasswordReset = () => {
        if (user?.email) {
            sendPasswordResetEmail(auth, user.email)
                .then(() => {
                    alert('Password reset email sent! Please check your inbox.');
                })
                .catch((error) => {
                    console.error("Error sending password reset email:", error);
                    alert(`Error: ${error.message}`);
                });
        }
    };
    
    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const storageRef = ref(storage, `users/${userId}/profilePicture`);
        
        try {
            try { await deleteObject(storageRef); } catch (error) { /* Ignore if it doesn't exist */ }

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            const userDocRef = doc(db, `users`, userId);
            await updateDoc(userDocRef, { photoURL: downloadURL });
            onUpdateUser({ ...user, photoURL: downloadURL });

        } catch (error) {
            console.error("Error uploading profile picture:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;
    
    const InfoField = ({ label, value, name, isEditing, onChange, type = 'text' }) => (
        <div>
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            {isEditing ? (
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="w-full mt-1 bg-gray-700 text-white border-gray-600 rounded-md p-2"
                />
            ) : (
                <p className="text-white text-lg font-semibold">{value || 'N/A'}</p>
            )}
        </div>
    );

    const renderProfileTab = () => (
        <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <img src={user.photoURL || `https://placehold.co/128x128/374151/ECF0F1?text=${user.name ? user.name.charAt(0) : 'A'}`} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-600" />
                    <button onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors">
                        {isUploading ? <Clock className="w-5 h-5 animate-spin"/> : <UploadCloud className="w-5 h-5"/>}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handlePictureUpload} accept="image/*" className="hidden" />
                </div>
                 <h2 className="text-2xl font-bold">{profileData.name}</h2>
                 <p className="text-gray-400 capitalize">{(user.role || 'sales_person').replace(/_/g, ' ').toLowerCase()}</p>
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
                <p className="text-white text-lg font-semibold bg-gray-700/50 p-2 rounded-md">{user.email}</p>
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
                    <select name="theme" value={settings.theme || 'dark'} onChange={handleSettingsChange} className="w-full bg-gray-700 text-white p-2 rounded-md">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Default Leads View</label>
                    <select name="defaultLeadsView" value={settings.defaultLeadsView || 'pipeline'} onChange={handleSettingsChange} className="w-full bg-gray-700 text-white p-2 rounded-md">
                        <option value="pipeline">Pipeline</option>
                        <option value="list">List</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Default Report Range</label>
                    <select name="defaultReportRange" value={settings.defaultReportRange || 'weekly'} onChange={handleSettingsChange} className="w-full bg-gray-700 text-white p-2 rounded-md">
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
                    <input type="checkbox" id="dailySummaryEmail" name="notifications.dailySummaryEmail" checked={settings.notifications?.dailySummaryEmail} onChange={handleSettingsChange} className="h-6 w-6 rounded text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500"/>
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="upcomingFollowupPush" className="text-white">Push notifications for upcoming follow-ups</label>
                    <input type="checkbox" id="upcomingFollowupPush" name="notifications.upcomingFollowupPush" checked={settings.notifications?.upcomingFollowupPush} onChange={handleSettingsChange} className="h-6 w-6 rounded text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500"/>
                </div>
            </div>
        </div>
    );
    
    const renderManagementTab = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">User Management</h2>
            <div className="bg-gray-900/50 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-700">
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
                                <td className="p-3"><button className="text-blue-400 hover:underline">Edit</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4" onClick={onClose}>
            <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700">
                    <h1 className="text-2xl font-bold">Profile & Settings</h1>
                    <div className="flex items-center gap-4">
                        {isEditing ? (
                            <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center">
                                <Save className="w-5 h-5 mr-2"/> Save Changes
                            </button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center">
                                <Edit className="w-5 h-5 mr-2"/> Edit
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                    </div>
                </header>
                <div className="flex-grow flex overflow-hidden">
                    <nav className="w-1/4 border-r border-gray-700 p-4">
                        <ul className="space-y-2">
                            <li><button onClick={() => setActiveTab('profile')} className={`w-full text-left p-2 rounded-md ${activeTab === 'profile' ? 'bg-amber-500 text-gray-900' : 'hover:bg-gray-700'}`}>Profile</button></li>
                            <li><button onClick={() => setActiveTab('account')} className={`w-full text-left p-2 rounded-md ${activeTab === 'account' ? 'bg-amber-500 text-gray-900' : 'hover:bg-gray-700'}`}>Account</button></li>
                            <li><button onClick={() => setActiveTab('settings')} className={`w-full text-left p-2 rounded-md ${activeTab === 'settings' ? 'bg-amber-500 text-gray-900' : 'hover:bg-gray-700'}`}>Settings</button></li>
                            {canManage && <li><button onClick={() => setActiveTab('management')} className={`w-full text-left p-2 rounded-md flex items-center ${activeTab === 'management' ? 'bg-amber-500 text-gray-900' : 'hover:bg-gray-700'}`}><ShieldCheck className="w-5 h-5 mr-2"/>Management</button></li>}
                        </ul>
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
