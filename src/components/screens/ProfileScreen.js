import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Edit, Save, X, UploadCloud, Clock, ShieldCheck, PlusCircle, Building, Users, Briefcase, LogOut, User, GitCompare, Palette, Thermometer, Calendar, ExternalLink, FileText, Shield, HelpCircle } from 'lucide-react';
import { USER_ROLES } from '../../constants';
import { themes } from '../../themes';

const ProfileScreen = ({ 
    isOpen, 
    onClose, 
    user, 
    userId, 
    onUpdateUser, 
    storage, 
    onOpenAddUserModal, 
    onOpenEditUserModal, 
    addToast, 
    onLogout,
    allUsers,
    teams,
    units,
    branches,
    regions,
    onNavigateToScreen // Fixed: Added this prop
}) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [settings, setSettings] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [newOrgUnit, setNewOrgUnit] = useState({ name: '', type: '' });

    const auth = getAuth();
    const functions = getFunctions();

    const managementRoles = [
        USER_ROLES.SUPER_ADMIN, 
        USER_ROLES.ADMIN, 
        USER_ROLES.REGIONAL_MANAGER,
        USER_ROLES.BRANCH_MANAGER,
        USER_ROLES.UNIT_MANAGER
    ];
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
        ageCalculation: 'ageNextBirthday',
        notifications: {
            dailySummaryEmail: true,
            upcomingFollowupPush: true,
        },
        defaultReportRange: 'weekly',
        weekStartsOn: 'Sunday', 
        temperatureUnit: 'Celsius',
        ...user?.settings,
    }), [user]);

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

    const handleSettingsChange = async (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        const keys = name.split('.');
        
        const newSettings = JSON.parse(JSON.stringify(settings));
        let current = newSettings;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = current[keys[i]] || {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = val;
        setSettings(newSettings);
        
        try {
            const userDocRef = doc(getFirestore(), 'users', userId);
            await updateDoc(userDocRef, { settings: newSettings });
            onUpdateUser({ ...user, settings: newSettings });
            addToast('Setting updated!', 'success');
        } catch (error) {
            console.error("Error updating setting:", error);
            addToast('Failed to update setting.', 'error');
        }
    };

    const handleThemeChange = async (themeKey) => {
        const newSettings = { ...settings, theme: themeKey };
        setSettings(newSettings);
        
        const root = window.document.documentElement;
        const theme = themes[themeKey];
        
        Object.keys(theme.colors).forEach(key => {
            root.style.setProperty(key, theme.colors[key]);
        });
        
        try {
            const userDocRef = doc(getFirestore(), 'users', userId);
            await updateDoc(userDocRef, { settings: newSettings });
            onUpdateUser({ ...user, settings: newSettings });
            addToast('Theme updated!', 'success');
        } catch (error) {
            console.error("Error updating theme:", error);
            addToast('Failed to update theme.', 'error');
        }
    };

    const handleSaveProfile = async () => {
        if (!userId) return;
        const userDocRef = doc(getFirestore(), 'users', userId);
        try {
            await updateDoc(userDocRef, profileData);
            onUpdateUser({ ...user, ...profileData });
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
            const userDocRef = doc(getFirestore(), 'users', userId);
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
            const createOrgUnit = httpsCallable(functions, 'createOrgUnit');
            await createOrgUnit({
                name: newOrgUnit.name,
                type: newOrgUnit.type,
            });
            addToast(`${newOrgUnit.type.charAt(0).toUpperCase() + newOrgUnit.type.slice(1)} created!`, 'success');
            setNewOrgUnit({ name: '', type: '' });
        } catch (error) {
            console.error("Error creating organizational unit:", error);
            addToast(`Failed to create ${newOrgUnit.type}: ${error.message}`, 'error');
        }
    };

    // Fixed: Handle navigation link clicks
    const handleNavigationClick = (screen) => {
        onClose(); // Close the profile modal
        if (onNavigateToScreen) {
            onNavigateToScreen(screen);
        } else {
            addToast('Navigation feature coming soon!', 'info');
        }
    };

    if (!isOpen) return null;
    
    const InfoField = ({ label, value, name, isEditing, onChange, type = 'text' }) => (
        <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{label}</label>
            {isEditing ? (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
            ) : (
                <div className="p-2 bg-gray-800 text-white rounded-md min-h-[40px] flex items-center">
                    {value || 'N/A'}
                </div>
            )}
        </div>
    );

    const renderProfileTab = () => (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full hover:bg-amber-600 transition-colors"
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <UploadCloud className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePictureUpload}
                        className="hidden"
                    />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-white">
                        {isEditing ? profileData.name : user?.name}
                    </h3>
                    <p className="text-gray-400 capitalize">
                        {(user?.role || 'sales_person').replace(/_/g, ' ').toLowerCase()}
                    </p>
                </div>
            </div>

            <InfoField
                label="Full Name"
                value={profileData.name}
                name="name"
                isEditing={isEditing}
                onChange={handleProfileChange}
            />
            <InfoField
                label="Phone"
                value={profileData.phone}
                name="phone"
                isEditing={isEditing}
                onChange={handleProfileChange}
            />
            <InfoField
                label="Company"
                value={profileData.company}
                name="company"
                isEditing={isEditing}
                onChange={handleProfileChange}
            />
            <InfoField
                label="Company Address"
                value={profileData.companyAddress}
                name="companyAddress"
                isEditing={isEditing}
                onChange={handleProfileChange}
            />
            <InfoField
                label="Branch"
                value={profileData.branch}
                name="branch"
                isEditing={isEditing}
                onChange={handleProfileChange}
            />
            
            <div className="flex justify-end space-x-2">
                {isEditing ? (
                    <>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                        >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                        </button>
                        <button
                            onClick={handleSaveProfile}
                            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                    </button>
                )}
            </div>
        </div>
    );
    
    const renderAccountTab = () => (
        <div className="space-y-4">
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="p-2 bg-gray-800 text-white rounded-md">{user?.email}</div>
            </div>
            
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Password</label>
                <button
                    onClick={handlePasswordReset}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Reset Password
                </button>
            </div>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Theme</label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(themes).map(([key, theme]) => (
                            <button
                                key={key}
                                onClick={() => handleThemeChange(key)}
                                className={`p-3 rounded-md border transition-colors ${
                                    settings.theme === key
                                        ? 'border-amber-500 bg-amber-500/10'
                                        : 'border-gray-600 hover:border-gray-500'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: theme.colors['--primary'] }}
                                    ></div>
                                    <span className="text-sm capitalize">{key}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4">Preferences</h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Age Display</label>
                    <select
                        name="ageCalculation"
                        value={settings.ageCalculation}
                        onChange={handleSettingsChange}
                        className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="ageNextBirthday">Age Next Birthday</option>
                        <option value="ageNow">Current Age</option>
                    </select>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">First Day of the Week</label>
                    <select
                        name="weekStartsOn"
                        value={settings.weekStartsOn}
                        onChange={handleSettingsChange}
                        className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="Sunday">Sunday</option>
                        <option value="Monday">Monday</option>
                    </select>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Temperature Unit</label>
                    <select
                        name="temperatureUnit"
                        value={settings.temperatureUnit}
                        onChange={handleSettingsChange}
                        className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="Celsius">Celsius</option>
                        <option value="Fahrenheit">Fahrenheit</option>
                    </select>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                
                <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            name="notifications.dailySummaryEmail"
                            checked={settings.notifications?.dailySummaryEmail}
                            onChange={handleSettingsChange}
                            className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                        />
                        <span>Email me a daily summary report</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            name="notifications.upcomingFollowupPush"
                            checked={settings.notifications?.upcomingFollowupPush}
                            onChange={handleSettingsChange}
                            className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                        />
                        <span>Push notifications for upcoming follow-ups</span>
                    </label>
                </div>
            </div>
        </div>
    );
    
    const renderManagementTab = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">User Management</h3>
                
                <div className="mb-4">
                    <button
                        onClick={onOpenAddUserModal}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add User</span>
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Organization</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map(u => (
                                <tr key={u.uid} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                                    <td className="px-6 py-4">{u.email}</td>
                                    <td className="px-6 py-4 capitalize">{(u.role || 'sales_person').replace(/_/g, ' ').toLowerCase()}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs space-y-1">
                                            {u.regionId && <div>Region: {u.regionId}</div>}
                                            {u.branchId && <div>Branch: {u.branchId}</div>}
                                            {u.unitId && <div>Unit: {u.unitId}</div>}
                                            {u.teamId && <div>Team: {u.teamId}</div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => onOpenEditUserModal(u)}
                                            className="text-blue-600 hover:text-blue-500 mr-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4">Organizational Units</h3>
                
                <form onSubmit={handleCreateOrgUnit} className="mb-6 p-4 bg-gray-700 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">New Unit Name</label>
                            <input
                                type="text"
                                value={newOrgUnit.name}
                                onChange={(e) => setNewOrgUnit(prev => ({...prev, name: e.target.value}))}
                                placeholder="e.g., North Star Unit"
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Type</label>
                            <select
                                value={newOrgUnit.type}
                                onChange={(e) => setNewOrgUnit(prev => ({...prev, type: e.target.value}))}
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2"
                            >
                                <option value="">Select Type</option>
                                <option value="region">Region</option>
                                <option value="branch">Branch</option>
                                <option value="unit">Unit</option>
                                <option value="team">Team</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Create</span>
                    </button>
                </form>
                
                <div className="grid grid-cols-2 gap-4">
                    <OrgUnitList title="Regions" items={regions} icon={<Building className="w-4 h-4" />} />
                    <OrgUnitList title="Branches" items={branches} icon={<GitCompare className="w-4 h-4" />} />
                    <OrgUnitList title="Units" items={units} icon={<Users className="w-4 h-4" />} />
                    <OrgUnitList title="Teams" items={teams} icon={<Briefcase className="w-4 h-4" />} />
                </div>
            </div>
        </div>
    );

    const OrgUnitList = ({ title, items, icon }) => (
        <div className="bg-gray-800 p-4 rounded-md">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
                {icon}
                <span>{title}</span>
            </h4>
            <ul className="space-y-1">
                {items.map(item => (
                    <li key={item.id} className="text-sm text-gray-400">
                        • {item.name}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 text-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold">Profile & Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex">
                    <div className="w-1/4 bg-gray-800 p-4 space-y-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                                activeTab === 'profile' ? 'bg-amber-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                                activeTab === 'account' ? 'bg-amber-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Account</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                                activeTab === 'settings' ? 'bg-amber-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <Palette className="w-4 h-4" />
                            <span>Settings</span>
                        </button>
                        {canManage && (
                            <button
                                onClick={() => setActiveTab('management')}
                                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                                    activeTab === 'management' ? 'bg-amber-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                <span>Management</span>
                            </button>
                        )}
                        
                        {/* Fixed: Links Section with proper navigation */}
                        <div className="pt-4 border-t border-gray-700">
                            <h5 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Links</h5>
                            <button
                                onClick={() => handleNavigationClick('COMPANY_OVERVIEW')}
                                className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 text-gray-300 hover:bg-gray-700"
                            >
                                <Building className="w-4 h-4" />
                                <span>Company Overview</span>
                            </button>
                            <button
                                onClick={() => handleNavigationClick('PRIVACY_POLICY')}
                                className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 text-gray-300 hover:bg-gray-700"
                            >
                                <Shield className="w-4 h-4" />
                                <span>Privacy Policy</span>
                            </button>
                            <button
                                onClick={() => handleNavigationClick('TERMS_OF_SERVICE')}
                                className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 text-gray-300 hover:bg-gray-700"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Terms of Service</span>
                            </button>
                            <button
                                onClick={() => handleNavigationClick('HELP_SUPPORT')}
                                className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 text-gray-300 hover:bg-gray-700"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span>Help & Support</span>
                            </button>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700">
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-3 py-2 rounded-md transition-colors flex items-center space-x-2 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'profile' && renderProfileTab()}
                        {activeTab === 'account' && renderAccountTab()}
                        {activeTab === 'settings' && renderSettingsTab()}
                        {activeTab === 'management' && canManage && renderManagementTab()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
