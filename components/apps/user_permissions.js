import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, getDocs } from 'firebase/firestore';

/**
 * User Permissions Manager Component
 * Admin-only interface to manage which users can access which projects and apps
 */
export function UserPermissionsManager() {
    const { user, userData } = useAuth();
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [allApps, setAllApps] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Available apps in the system
    const SYSTEM_APPS = [
        { id: 'projects', name: 'Alphery Projects', icon: '📋', category: 'Productivity' },
        { id: 'users', name: 'Alphery Users', icon: '👥', category: 'Admin' },
        { id: 'user-permissions', name: 'User Permissions', icon: '🔐', category: 'Admin' },
        { id: 'chrome', name: 'Chrome Browser', icon: '🌐', category: 'Utility' },
        { id: 'vscode', name: 'VS Code', icon: '💻', category: 'Development' },
        { id: 'terminal', name: 'Terminal', icon: '⌨️', category: 'Development' },
        { id: 'calc', name: 'Calculator', icon: '🔢', category: 'Utility' },
        { id: 'calendar', name: 'Calendar', icon: '📅', category: 'Productivity' },
        { id: 'weather', name: 'Weather', icon: '🌤️', category: 'Utility' },
        { id: 'todo', name: 'To-Do List', icon: '✓', category: 'Productivity' },
        { id: 'files', name: 'File Manager', icon: '📁', category: 'Utility' },
        { id: 'gedit', name: 'Text Editor', icon: '📝', category: 'Utility' },
    ];

    // Check if current user is super admin
    const isSuperAdmin = userData && userData.role === 'super_admin';

    useEffect(() => {
        if (!db || !isSuperAdmin) {
            setLoading(false);
            return;
        }

        // Load all approved users
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, where('approvalStatus', '==', 'approved'));

        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
            setLoading(false);
        });

        // Load all projects
        const projectsRef = collection(db, 'projects');
        const unsubscribeProjects = onSnapshot(projectsRef, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProjects(projectsData);
        });

        setAllApps(SYSTEM_APPS);

        return () => {
            unsubscribeUsers();
            unsubscribeProjects();
        };
    }, [isSuperAdmin]);

    const handleUserSelect = (user) => {
        setSelectedUser({
            ...user,
            allowedProjects: user.allowedProjects || [],
            allowedApps: user.allowedApps || []
        });
    };

    const toggleProjectAccess = (projectId) => {
        if (!selectedUser) return;

        const currentAllowed = selectedUser.allowedProjects || [];
        const newAllowed = currentAllowed.includes(projectId)
            ? currentAllowed.filter(id => id !== projectId)
            : [...currentAllowed, projectId];

        setSelectedUser({
            ...selectedUser,
            allowedProjects: newAllowed
        });
    };

    const toggleAppAccess = (appId) => {
        if (!selectedUser) return;

        const currentAllowed = selectedUser.allowedApps || [];
        const newAllowed = currentAllowed.includes(appId)
            ? currentAllowed.filter(id => id !== appId)
            : [...currentAllowed, appId];

        setSelectedUser({
            ...selectedUser,
            allowedApps: newAllowed
        });
    };

    const savePermissions = async () => {
        if (!selectedUser || !db) return;

        setSaving(true);
        try {
            const userRef = doc(db, 'users', selectedUser.id);
            await updateDoc(userRef, {
                allowedProjects: selectedUser.allowedProjects || [],
                allowedApps: selectedUser.allowedApps || []
            });

            alert('Permissions updated successfully!');
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('Failed to save permissions. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Not authorized
    if (!isSuperAdmin) {
        return (
            <div className="p-8 bg-white rounded-lg shadow">
                <div className="flex items-center justify-center flex-col gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">🔒</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                    <p className="text-slate-600 text-center">
                        Only super administrators can manage user permissions.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50 p-6 overflow-hidden flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h1 className="text-2xl font-bold text-slate-900">👥 User Permissions Manager</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Control which users can access which projects and apps
                    </p>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Users List */}
                    <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
                        <div className="p-4">
                            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
                                Users ({users.length})
                            </h2>
                            <div className="space-y-2">
                                {users.map(u => {
                                    const isSelected = selectedUser && selectedUser.id === u.id;
                                    const isAdmin = u.role === 'super_admin';

                                    return (
                                        <button
                                            key={u.id}
                                            onClick={() => handleUserSelect(u)}
                                            className={`w-full p-3 rounded-lg border  transition-all text-left ${isSelected
                                                ? 'bg-blue-50 border-blue-300 shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {u.displayName ? u.displayName[0].toUpperCase() : '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-slate-900 truncate">
                                                        {u.displayName || 'Unknown User'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 truncate">
                                                        {u.email}
                                                    </div>
                                                    {isAdmin && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                                                            SUPER ADMIN
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Permissions Editor */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedUser ? (
                            <div className="space-y-6">
                                {/* User Info */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                                            {selectedUser.displayName ? selectedUser.displayName[0].toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">
                                                {selectedUser.displayName || 'Unknown User'}
                                            </h3>
                                            <p className="text-sm text-slate-600">{selectedUser.email}</p>
                                            {selectedUser.role === 'super_admin' && (
                                                <p className="text-xs text-purple-600 font-bold mt-1">
                                                    ⭐ Super Admin - Has access to everything
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Projects Access */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        📋 Alphery Projects Access
                                    </h3>
                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        {projects.length === 0 ? (
                                            <p className="text-slate-500 text-center py-8">No projects available</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {projects.map(project => {
                                                    const hasAccess = (selectedUser.allowedProjects || []).includes(project.id);
                                                    const isAdminUser = selectedUser.role === 'super_admin';

                                                    return (
                                                        <label
                                                            key={project.id}
                                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${hasAccess || isAdminUser
                                                                ? 'bg-green-50 border-green-300'
                                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={hasAccess || isAdminUser}
                                                                disabled={isAdminUser}
                                                                onChange={() => toggleProjectAccess(project.id)}
                                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="font-semibold text-slate-900">
                                                                    {project.name || project.title || 'Untitled Project'}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {project.type || 'No type'} • {project.status || 'Unknown status'}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Apps Access */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        🎯 App Store Access
                                    </h3>
                                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {allApps.map(app => {
                                                const hasAccess = (selectedUser.allowedApps || []).includes(app.id);
                                                const isAdminUser = selectedUser.role === 'super_admin';

                                                return (
                                                    <label
                                                        key={app.id}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${hasAccess || isAdminUser
                                                            ? 'bg-blue-50 border-blue-300'
                                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={hasAccess || isAdminUser}
                                                            disabled={isAdminUser}
                                                            onChange={() => toggleAppAccess(app.id)}
                                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">{app.icon}</span>
                                                                <span className="font-medium text-slate-900 text-sm truncate">
                                                                    {app.name}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-slate-500">{app.category}</div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                {selectedUser.role !== 'super_admin' && (
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="px-6 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={savePermissions}
                                            disabled={saving}
                                            className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving ? 'Saving...' : 'Save Permissions'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-4xl">👈</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Select a User</h3>
                                    <p className="text-slate-600">Choose a user from the list to manage their permissions</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserPermissionsManager;
