import React, { Component } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext-new';

// Wrapper to use hooks
function UserManagerWithAuth(props) {
    const { user, platformUser, currentTenant } = useAuth();
    return <UserManager user={user} userData={platformUser} currentTenant={currentTenant} {...props} />;
}

class UserManager extends Component {
    constructor() {
        super();
        this.state = {
            users: [],
            filter: 'all', // all, pending, approved, rejected
            loading: true,
            showPermissionsModal: false,
            showAddUserModal: false,
            newEmail: '',
            newDisplayName: '',
            selectedUser: null,
            availableApps: [] // Will be populated from window.ALL_APPS
        };
        this.unsubscribe = null;
    }

    componentDidMount() {
        this.loadUsers();
        // Load available apps from global
        if (typeof window !== 'undefined' && window.ALL_APPS) {
            this.setState({ availableApps: window.ALL_APPS });
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    loadUsers = () => {
        if (!db) {
            console.warn('Firestore not available. User Manager requires Firebase.');
            this.setState({ loading: false, users: [] });
            return;
        }

        const usersRef = collection(db, 'users');

        this.unsubscribe = onSnapshot(usersRef, (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort: pending first, then by creation date
            users.sort((a, b) => {
                if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
                if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            this.setState({ users, loading: false });
        }, (error) => {
            console.error('Error loading users:', error);
            this.setState({ loading: false });
        });
    }

    addUser = async () => {
        const { newEmail, newDisplayName } = this.state;
        const { user, userData } = this.props;

        if (!newEmail || !newEmail.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        if (!db) return;

        try {
            const isSuperAdmin = userData && userData.isGod;

            // Set role: if super admin adds, default to Projects. If Tenant adds, forced to Projects.
            const role = 'user';
            const userEmail = user.email || user.username;
            const parentUserId = isSuperAdmin ? null : userEmail;

            await setDoc(doc(db, 'users', newEmail.toLowerCase()), {
                email: newEmail.toLowerCase(),
                displayName: newDisplayName || 'User',
                role: role,
                parentUserId: parentUserId,
                approvalStatus: 'approved', // Pre-approved because we are adding them manually
                createdAt: new Date().toISOString(),
                allowedApps: null, // Default to all or customize later
            });

            alert(`User ${newEmail} added to whitelist successfully.`);
            this.setState({ showAddUserModal: false, newEmail: '', newDisplayName: '' });
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Failed to add user to whitelist');
        }
    }

    rejectUser = async (userId) => {
        if (!window.confirm('Are you sure you want to reject this user?')) return;

        if (!db) {
            alert('Firebase not configured. Cannot reject users in demo mode.');
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                approvalStatus: 'rejected'
            });
        } catch (error) {
            console.error('Error rejecting user:', error);
            alert('Failed to reject user');
        }
    }

    // Simplified Revoke - just delete from whitelist or set status
    // Simplified Revoke - uses the actual document ID (can be UID or email)
    revokeUser = async (userId, userEmail) => {
        if (!window.confirm(`Are you sure you want to revoke access for ${userEmail}? They will be kicked out immediately.`)) return;
        if (!db) return;

        try {
            // We use the 'id' which is doc.id from loadUsers
            await deleteDoc(doc(db, 'users', userId));
            alert(`Access revoked for ${userEmail}`);
        } catch (error) {
            console.error('Error revoking user:', error);
            alert('Failed to revoke access. Please try again.');
        }
    }

    deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;

        if (!db) {
            alert('Firebase not configured. Cannot delete users in demo mode.');
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    }

    changeUserRole = async (userId, newRole) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole
            });
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update user role');
        }
    }

    openPermissionsModal = (user) => {
        this.setState({ showPermissionsModal: true, selectedUser: user });
    }

    closePermissionsModal = () => {
        this.setState({ showPermissionsModal: false, selectedUser: null });
    }

    updateUserPermissions = async (userId, allowedApps) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'users', userId), {
                allowedApps: allowedApps
            });
            this.closePermissionsModal();
        } catch (error) {
            console.error('Error updating permissions:', error);
            alert('Failed to update app permissions');
        }
    }

    getFilteredUsers = () => {
        const { users } = this.state;
        const { user, userData } = this.props;

        const userEmail = user.email || user.username;
        const isSuperAdmin = userData && userData.isGod;
        const isTenantAdmin = !!this.props.currentTenant;

        let visibleUsers = users;

        if (isSuperAdmin) {
            // Super Admin sees everything that HAS an email and is either approved or a valid tenant
            visibleUsers = users.filter(u => u.email && u.email.includes('@'));
        } else if (isTenantAdmin) {
            // Tenant sees only users tagged under them that are approved
            const myId = user.uid;
            const myEmail = user.email || user.username;
            visibleUsers = users.filter(u =>
                (u.parentUserId === myId || u.parentUserId === myEmail) &&
                u.email &&
                u.email.includes('@')
            );
        } else {
            return [];
        }

        // STRICT FILTER: Only show explicitly approved/whitelisted users.
        // This ensures no "New User" or "Pending" attempts are ever shown.
        return visibleUsers.filter(u => u.approvalStatus === 'approved');
    }

    setParentAdmin = async (userId, parentId) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'users', userId), {
                parentUserId: parentId
            });
            alert('Parent Admin assigned successfully');
        } catch (error) {
            console.error('Error setting parent:', error);
            alert('Failed to set parent admin');
        }
    }

    render() {
        const { loading, filter } = this.state;
        const { user, userData } = this.props;

        const userEmail = user.email || user.username;
        const isSuperAdmin = userData && userData.isGod;
        const isTenantAdmin = !!this.props.currentTenant;

        // Check if authorized
        if (!isSuperAdmin && !isTenantAdmin) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h3>
                        <p className="text-sm text-gray-500">This panel is only accessible to Alphery Administrators.</p>
                    </div>
                </div>
            );
        }

        if (loading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[#0f172a]">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400 font-medium tracking-wide">Initializing Secure Access...</p>
                    </div>
                </div>
            );
        }

        const filteredUsers = this.getFilteredUsers();
        const pendingCount = filteredUsers.filter(u => u.approvalStatus === 'pending').length;
        const approvedCount = filteredUsers.filter(u => u.approvalStatus === 'approved').length;
        const rejectedCount = filteredUsers.filter(u => u.approvalStatus === 'rejected').length;

        return (
            <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white font-sans selection:bg-pink-500/30">
                {/* Header */}
                <div className="h-20 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 shadow-2xl z-20">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-pink-500 to-violet-600 text-white p-2.5 rounded-xl shadow-lg shadow-pink-500/20 ring-1 ring-white/20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl tracking-tight text-white drop-shadow-sm">Alphery Access</h1>
                            <p className="text-xs text-gray-400 font-medium tracking-wide">SECURE IDENTITY MANAGEMENT</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border ${isSuperAdmin ? 'bg-pink-500/10 border-pink-500/50 text-pink-400' : 'bg-blue-500/10 border-blue-500/50 text-blue-400'}`}>
                            {isSuperAdmin ? 'God Mode' : 'Tenant Admin'}
                        </div>
                        <button
                            onClick={() => this.setState({ showAddUserModal: true })}
                            className="bg-white text-gray-900 hover:bg-gray-100 px-5 py-2 rounded-xl shadow-xl shadow-white/5 font-bold flex items-center gap-2 transform active:scale-95 transition-all duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            Authorize User
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-fullblur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-2">Total Users</p>
                                <p className="text-3xl font-black text-white">{this.state.users.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 text-blue-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-violet-500/20"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-xs text-violet-300 font-bold uppercase tracking-wider mb-2">My Team</p>
                                <p className="text-3xl font-black text-white">{filteredUsers.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center border border-violet-500/30 text-violet-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Whitelisted Members</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto px-8 pb-8">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 p-[2px]">
                                            <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-white font-bold text-lg">{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{user.displayName || (user.email ? user.email.split('@')[0] : 'New User')}</h3>
                                            <p className="text-xs text-gray-400 break-all">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/30">
                                        Approved
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs border ${(user.role === 'super_admin' || user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com') ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                                        {(user.role === 'super_admin' || user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com') ? 'Super Admin' :
                                            user.role === 'TENANT' ? 'Tenant Admin' : (user.role === 'team' ? 'Team Member' : 'Project User')}
                                    </span>
                                </div>

                                {/* Permissions Button */}
                                {user.role !== 'super_admin' && user.email !== 'alpherymail@gmail.com' && user.email !== 'aksnetlink@gmail.com' && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => this.openPermissionsModal(user)}
                                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-blue-300 rounded-xl text-xs font-bold uppercase tracking-wide transition flex items-center justify-center gap-2"
                                        >
                                            Manage Permissions ({user.allowedApps ? user.allowedApps.length : 'All'})
                                        </button>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                < div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 justify-end" >
                                    {/* Role Selection */}
                                    {
                                        user.approvalStatus === 'approved' && (isSuperAdmin || user.parentUserId === this.props.user.email) && (
                                            <select
                                                value={user.role === 'team' ? 'team' : 'user'}
                                                onChange={(e) => this.changeUserRole(user.id, e.target.value)}
                                                className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-gray-300 outline-none focus:border-blue-500/50 flex-1"
                                            >
                                                <option value="user" className="bg-slate-800">Projects Role</option>
                                                <option value="team" className="bg-slate-800">Team Role</option>
                                            </select>
                                        )
                                    }

                                    {/* Revoke */}
                                    {
                                        user.approvalStatus === 'approved' &&
                                        (isSuperAdmin || user.parentUserId === this.props.user.email) &&
                                        user.role !== 'super_admin' &&
                                        user.email !== 'alpherymail@gmail.com' &&
                                        user.email !== 'aksnetlink@gmail.com' && (
                                            <button onClick={() => this.revokeUser(user.id, user.email)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg font-bold text-xs uppercase tracking-wide">Revoke</button>
                                        )
                                    }
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-black/20 text-gray-400 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">User Identity</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Email Address</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">App Access</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Tenant Owner</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 p-[2px]">
                                                    <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                                                        {user.photoURL ? (
                                                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-white font-bold text-sm">{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-bold text-white tracking-tight">{user.displayName || (user.email ? user.email.split('@')[0] : 'New User')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 font-medium">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                                                ${(user.role === 'super_admin' || user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com') ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' :
                                                    user.role === 'TENANT' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                {(user.role === 'super_admin' || user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com') ? 'Super Admin' :
                                                    user.role === 'TENANT' ? 'Tenant Admin' : (user.role === 'team' ? 'Team' : 'User')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                                <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Approved</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(user.role === 'super_admin' || user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com') ? (
                                                <span className="text-xs text-gray-500 font-medium italic">Full System Access</span>
                                            ) : (
                                                <button
                                                    onClick={() => this.openPermissionsModal(user)}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-blue-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 group-hover:border-blue-500/30"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                    </svg>
                                                    {user.allowedApps ? `Custom (${user.allowedApps.length})` : 'All Apps'}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isSuperAdmin ? (
                                                <select
                                                    className="text-xs bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 w-full text-gray-300 outline-none focus:border-blue-500/50"
                                                    value={user.parentUserId || ''}
                                                    onChange={(e) => this.setParentAdmin(user.id, e.target.value)}
                                                >
                                                    <option value="" className="bg-slate-800">Unassigned</option>
                                                    {this.state.users.filter(u => u.role === 'TENANT').map(tenant => (
                                                        <option key={tenant.id} value={tenant.email} className="bg-slate-800">{tenant.email}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-xs text-gray-500 font-mono">
                                                    {this.state.users.find(u => u.id === user.parentUserId || u.email === user.parentUserId)?.email || user.parentUserId || '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-white">
                                                {/* Role Selection */}
                                                {user.approvalStatus === 'approved' && (isSuperAdmin || user.parentUserId === this.props.user.email) && (
                                                    <select
                                                        value={user.role || 'user'}
                                                        onChange={(e) => this.changeUserRole(user.id, e.target.value)}
                                                        className="px-2 py-1 text-xs bg-black/30 border border-white/10 rounded-md text-gray-300 outline-none"
                                                    >
                                                        <option value="user" className="bg-slate-800">Prj</option>
                                                        <option value="team" className="bg-slate-800">Team</option>
                                                        {isSuperAdmin && <option value="TENANT" className="bg-slate-800">Admin</option>}
                                                    </select>
                                                )}

                                                {/* Revoke */}
                                                {(isSuperAdmin || user.parentUserId === this.props.user.email) &&
                                                    user.role !== 'super_admin' &&
                                                    !['alpherymail@gmail.com', 'aksnetlink@gmail.com'].includes(user.email) && (
                                                        <button
                                                            onClick={() => this.revokeUser(user.id, user.email)}
                                                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition"
                                                            title="Revoke Access"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                </div>
                                <p className="text-gray-400 font-medium">No users found in whitelist</p>
                            </div>
                        )}
                    </div>
                </div >

                {/* App Permissions Modal */}
                {
                    this.state.showPermissionsModal && this.state.selectedUser && (
                        <AppPermissionsModal
                            user={this.state.selectedUser}
                            availableApps={this.state.availableApps}
                            onClose={this.closePermissionsModal}
                            onSave={this.updateUserPermissions}
                        />
                    )
                }


                {/* Add User Whitelist Modal */}
                {
                    this.state.showAddUserModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md">
                            <div className="bg-[#1e293b] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 ring-1 ring-white/10">
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                                    <h3 className="text-2xl font-bold relative z-10">Authorize New User</h3>
                                    <p className="text-emerald-100 text-sm opacity-90 relative z-10 mt-1">Grant secure access to your organization.</p>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="user@example.com"
                                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition"
                                            value={this.state.newEmail}
                                            onChange={(e) => this.setState({ newEmail: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Display Name (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Alex Smith"
                                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition"
                                            value={this.state.newDisplayName}
                                            onChange={(e) => this.setState({ newDisplayName: e.target.value })}
                                        />
                                    </div>
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex gap-3 leading-relaxed">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>User will be whitelisted immediately. They can log in using Google or Email. Default role: <strong>Project User</strong>.</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-black/20 border-t border-white/5 flex gap-3">
                                    <button
                                        onClick={() => this.setState({ showAddUserModal: false })}
                                        className="flex-1 py-3 text-gray-400 font-bold hover:text-white hover:bg-white/5 rounded-xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={this.addUser}
                                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-200"
                                    >
                                        Confirm Access
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }
}

// App Permissions Modal Component
function AppPermissionsModal({ user, availableApps, onClose, onSave }) {
    const [selectedApps, setSelectedApps] = React.useState(user.allowedApps || []);
    const [grantAllAccess, setGrantAllAccess] = React.useState(!user.allowedApps || user.allowedApps === null);

    const systemApps = ['app-store', 'settings', 'messenger', 'trash'];
    const categories = {
        utility: [],
        productivity: [],
        development: [],
        social: [],
        entertainment: [],
        other: []
    };

    // Categorize apps
    availableApps.forEach(app => {
        const category = app.category || 'other';
        if (categories[category]) {
            categories[category].push(app);
        } else {
            categories.other.push(app);
        }
    });

    const toggleApp = (appId) => {
        if (grantAllAccess) return; // Can't toggle if all access is granted

        if (selectedApps.includes(appId)) {
            setSelectedApps(selectedApps.filter(id => id !== appId));
        } else {
            setSelectedApps([...selectedApps, appId]);
        }
    };

    const handleSave = () => {
        // If granting all access, set to null (backward compatible)
        // Otherwise, set to selected apps array
        onSave(user.id, grantAllAccess ? null : selectedApps);
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#0f172a] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/10 ring-1 ring-white/5 animate-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-white/10 text-white p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 tracking-tight">App Permissions</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-blue-200/60 text-sm font-medium uppercase tracking-wider">Managing access for:</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded text-sm text-blue-100 font-mono">{user.displayName || user.email}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition border border-white/10 text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* All Access Toggle */}
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <label className="flex items-center gap-4 cursor-pointer group">
                        <div className={`w-12 h-7 rounded-full px-1 flex items-center transition-colors duration-300 ${grantAllAccess ? 'bg-blue-500' : 'bg-gray-700'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${grantAllAccess ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <input
                            type="checkbox"
                            checked={grantAllAccess}
                            onChange={(e) => setGrantAllAccess(e.target.checked)}
                            className="hidden"
                        />
                        <div>
                            <div className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">Grant Full System Access</div>
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">User can install & access any application</div>
                        </div>
                    </label>
                </div>

                {/* App Selection */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {grantAllAccess ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-white mb-2">Unrestricted Access</p>
                            <p className="text-sm text-gray-400">This user has full authority to access all {availableApps.length} system applications.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* System Apps (Always included) */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2 tracking-widest pl-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Core System Utilities
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {availableApps.filter(app => systemApps.includes(app.id)).map(app => (
                                        <div key={app.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl opacity-50 cursor-not-allowed">
                                            <img src={app.icon} alt={app.title} className="w-10 h-10 object-contain grayscale opacity-70" />
                                            <div>
                                                <span className="text-sm font-bold text-gray-400 block">{app.title}</span>
                                                <span className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Required</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Categorized Apps */}
                            {Object.entries(categories).map(([category, apps]) => {
                                if (apps.length === 0 || apps.every(app => systemApps.includes(app.id))) return null;
                                const nonSystemApps = apps.filter(app => !systemApps.includes(app.id));
                                if (nonSystemApps.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h3 className="text-xs font-bold text-blue-400 uppercase mb-4 capitalize tracking-widest pl-1 border-l-2 border-blue-500/50 pl-3">{category} Suite</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {nonSystemApps.map(app => {
                                                const isSelected = selectedApps.includes(app.id);
                                                return (
                                                    <div
                                                        key={app.id}
                                                        onClick={() => toggleApp(app.id)}
                                                        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden ${isSelected
                                                            ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600 group-hover:border-gray-500'
                                                            }`}>
                                                            {isSelected && (
                                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <img src={app.icon} alt={app.title} className={`w-10 h-10 object-contain transition-transform group-hover:scale-110 ${isSelected ? '' : 'grayscale-[0.3]'}`} />
                                                        <span className={`text-sm font-bold truncate flex-1 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{app.title}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-black/20 border-t border-white/10 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">
                        {grantAllAccess ? (
                            <span>All <strong className="text-white">{availableApps.length}</strong> apps available</span>
                        ) : (
                            <span>Selected <strong className="text-white">{selectedApps.length + systemApps.length}</strong> apps</span>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl font-bold transition text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20 text-sm tracking-wide"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const displayUserManager = () => {
    return <UserManagerWithAuth />;
};
