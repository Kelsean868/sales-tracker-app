import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Edit, Save, X, UploadCloud, Clock, ShieldCheck, PlusCircle, Building, Users, Briefcase, LogOut, User, GitCompare, Palette, Thermometer, Calendar } from 'lucide-react';
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
    regions
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
                <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 flex items-center"><Palette className="mr-2" /> Appearance</h3>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
                    <div className="grid grid-cols-3 gap-4">
                        {Object.entries(themes).map(([key, theme]) => (
                             <button
                                key={key}
                                onClick={() => handleThemeChange(key)}
                                className={`p-4 rounded-lg border-2 ${settings.theme === key ? 'border-amber-500' : 'border-gray-600'} transition-all`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold">{theme.name}</span>
                                    {settings.theme === key && <ShieldCheck className="w-5 h-5 text-amber-500" />}
                                </div>
                                <div className="flex gap-1">
                                    <div className="w-1/4 h-8 rounded" style={{ backgroundColor: theme.colors['--background'] }}></div>
                                    <div className="w-1/4 h-8 rounded" style={{ backgroundColor: theme.colors['--primary'] }}></div>
                                    <div className="w-1/4 h-8 rounded" style={{ backgroundColor: theme.colors['--secondary'] }}></div>
                                    <div className="w-1/4 h-8 rounded" style={{ backgroundColor: theme.colors['--accent'] }}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">Preferences</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Age Display</label>
                    <div className="flex items-center space-x-2 bg-gray-700 p-1 rounded-lg">
                        <button 
                            onClick={() => handleSettingsChange({target: {name: 'ageCalculation', value: 'ageNextBirthday'}})}
                            className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${settings.ageCalculation === 'ageNextBirthday' ? 'bg-amber-500 text-gray-900' : 'text-white'}`}
                        >
                            Age Next Birthday
                        </button>
                         <button 
                            onClick={() => handleSettingsChange({target: {name: 'ageCalculation', value: 'currentAge'}})}
                            className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${settings.ageCalculation === 'currentAge' ? 'bg-amber-500 text-gray-900' : 'text-white'}`}
                        >
                            Current Age
                        </button>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center"><Calendar className="mr-2"/>First Day of the Week</label>
                    <select
                        name="weekStartsOn"
                        value={settings.weekStartsOn}
                        onChange={handleSettingsChange}
                        className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="Sunday">Sunday</option>
                        <option value="Monday">Monday</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center"><Thermometer className="mr-2"/>Temperature Unit</label>
                    <select
                        name="temperatureUnit"
                        value={settings.temperatureUnit}
                        onChange={handleSettingsChange}
                        className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="Celsius">Celsius</option>
                        <option value="Fahrenheit">Fahrenheit</option>
                    </select>
                </div>
            </div>
            <div className="space-y-4">
                 <h3 className="text-lg font-semibold border-b border-gray-700 pb-2">Notifications</h3>
                 <div className="flex items-center justify-between">
                    <label htmlFor="dailySummaryEmail" className="text-white">Email me a daily summary report</label>
                    <input type="checkbox" id="dailySummaryEmail" name="notifications.dailySummaryEmail" checked={settings.notifications?.dailySummaryEmail || false} onChange={handleSettingsChange} className="h-6 w-6 rounded text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500"/>
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="upcomingFollowupPush" className="text-white">Push notifications for upcoming follow-ups</label>
                    <input type="checkbox" id="upcomingFollowupPush" name="notifications.upcomingFollowupPush" checked={settings.notifications?.upcomingFollowupPush || false} onChange={handleSettingsChange} className="h-6 w-6 rounded text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500"/>
                </div>
            </div>
        </div>
    );
    
    const renderManagementTab = () => (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2" /> User Management
            </h3>
            <button
              onClick={onOpenAddUserModal}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <PlusCircle className="mr-2 w-4 h-4" />
              Add User
            </button>
            
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Organization</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-700">
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{(u.role || 'sales_person').replace(/_/g, ' ').toLowerCase()}</td>
                      <td className="p-3">
                        <div className="text-sm">
                          {u.regionId && `Region: ${u.regionId}`}
                          {u.branchId && `Branch: ${u.branchId}`}
                          {u.unitId && `Unit: ${u.unitId}`}
                          {u.teamId && `Team: ${u.teamId}`}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => onOpenEditUserModal(u)}
                          className="text-blue-400 hover:text-blue-300 mr-2"
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
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Building className="mr-2" /> Organizational Units
            </h3>
            
            <form onSubmit={handleCreateOrgUnit} className="mb-6 bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Unit Name</label>
                  <input
                    type="text"
                    value={newOrgUnit.name}
                    onChange={(e) => setNewOrgUnit(prev => ({...prev, name: e.target.value}))}
                    placeholder="e.g., North Star Unit"
                    className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
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
                
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <PlusCircle className="mr-2 w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>
            </form>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <OrgUnitList title="Regions" items={regions} icon={<Building className="w-4 h-4" />} />
              <OrgUnitList title="Branches" items={branches} icon={<Building className="w-4 h-4" />} />
              <OrgUnitList title="Units" items={units} icon={<Briefcase className="w-4 h-4" />} />
              <OrgUnitList title="Teams" items={teams} icon={<Users className="w-4 h-4" />} />
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
                        {activeTab === 'profile' && (
                            isEditing ? (
                                <button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center">
                                    <Save className="w-5 h-5 mr-2"/> Save Profile
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center">
                                    <Edit className="w-5 h-5 mr-2"/> Edit Profile
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
                            <li><button onClick={() => setActiveTab('settings')} className={`w-full text-left p-2 rounded-md flex items-center ${activeTab === 'settings' ? 'bg-amber-500 text-gray-900 font-bold' : 'hover:bg-gray-700'}`}><GitCompare className="w-5 h-5 mr-2"/>Settings</button></li>
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
