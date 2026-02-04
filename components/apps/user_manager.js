import React, { Component } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

// Wrapper to use hooks
function UserManagerWithAuth(props) {
    const { user, userData } = useAuth();
    return <UserManager user={user} userData={userData} {...props} />;
}

class UserManager extends Component {
    constructor() {
        super();
        this.state = {
            users: [],
            filter: 'all', // all, pending, approved, rejected
            loading: true,
            showPermissionsModal: false,
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

    approveUser = async (userId) => {
        if (!db) {
            alert('Firebase not configured. Cannot approve users in demo mode.');
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                approvalStatus: 'approved'
            });
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
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

    revokeUser = async (userId) => {
        if (!window.confirm('Are you sure you want to revoke access? User will lose access to the OS immediately.')) return;

        if (!db) {
            alert('Firebase not configured. Cannot revoke users in demo mode.');
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                approvalStatus: 'pending'
            });
        } catch (error) {
            console.error('Error revoking user:', error);
            alert('Failed to revoke user access');
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
        const { users, filter } = this.state;
        if (filter === 'all') return users;
        return users.filter(u => u.approvalStatus === filter);
    }

    render() {
        const { loading, filter } = this.state;
        const { userData } = this.props;

        // Check if super admin
        if (!userData || (userData.role !== 'super_admin' && user.email !== 'alpherymail@gmail.com' && user.email !== 'aksnetlink@gmail.com')) {
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
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading access data...</p>
                    </div>
                </div>
            );
        }

        const filteredUsers = this.getFilteredUsers();
        const pendingCount = this.state.users.filter(u => u.approvalStatus === 'pending').length;
        const approvedCount = this.state.users.filter(u => u.approvalStatus === 'approved').length;
        const rejectedCount = this.state.users.filter(u => u.approvalStatus === 'rejected').length;

        return (
            <div className="w-full h-full flex flex-col bg-gray-50 text-gray-800 font-sans">
                {/* Header */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-600 text-white p-2 rounded-lg shadow">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-gray-800">Alphery Access Control</h1>
                            <p className="text-xs text-gray-500">Master permission management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-semibold">
                            Super Admin
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 md:p-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Total Users</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{this.state.users.length}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Pending</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{pendingCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Approved</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{approvedCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Rejected</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{rejectedCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 pb-4">
                    <div className="bg-white rounded-lg shadow p-2 flex gap-2 overflow-x-auto no-scrollbar">
                        {['all', 'pending', 'approved', 'rejected'].map(f => (
                            <button
                                key={f}
                                onClick={() => this.setState({ filter: f })}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition capitalize whitespace-nowrap
                                    ${filter === f ? 'bg-pink-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white font-bold text-lg">{(user.displayName || user.email)[0].toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{user.displayName || 'Anonymous'}</h3>
                                            <p className="text-sm text-gray-500 break-all">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                        ${user.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                            user.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'}`}>
                                        {user.approvalStatus || 'pending'}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-600">
                                    <span className={`px-2 py-1 rounded border ${user.role === 'super_admin' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200'}`}>
                                        Role: {(user.role === 'super_admin' || user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com') ? 'Super Admin' : (user.role === 'team' ? 'Team' : 'Projects')}
                                    </span>
                                    <span className="px-2 py-1 rounded bg-gray-50 border border-gray-200">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Permissions Button */}
                                {user.role !== 'super_admin' && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => this.openPermissionsModal(user)}
                                            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                            </svg>
                                            Manage App Permissions ({user.allowedApps ? user.allowedApps.length : 'All'})
                                        </button>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                                    {/* Role Selection */}
                                    {user.approvalStatus === 'approved' && user.role !== 'super_admin' && (
                                        <select
                                            value={user.role === 'team' ? 'team' : 'user'}
                                            onChange={(e) => this.changeUserRole(user.id, e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white flex-1"
                                        >
                                            <option value="user">Projects Role</option>
                                            <option value="team">Team Role</option>
                                        </select>
                                    )}

                                    {/* Approve/Reject */}
                                    {(!user.approvalStatus || user.approvalStatus === 'pending') && user.role !== 'super_admin' && (
                                        <>
                                            <button onClick={() => this.approveUser(user.id)} className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded font-medium text-sm">Approve</button>
                                            <button onClick={() => this.rejectUser(user.id)} className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded font-medium text-sm">Reject</button>
                                        </>
                                    )}

                                    {/* Revoke */}
                                    {user.approvalStatus === 'approved' && user.role !== 'super_admin' && (
                                        <button onClick={() => this.revokeUser(user.id)} className="px-4 py-1.5 bg-orange-500 text-white rounded font-medium text-sm">Revoke Access</button>
                                    )}

                                    {/* Delete */}
                                    {user.approvalStatus === 'rejected' && user.role !== 'super_admin' && (
                                        <button onClick={() => this.deleteUser(user.id)} className="flex-1 px-3 py-1.5 bg-gray-500 text-white rounded font-medium text-sm">Delete</button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-gray-400">No users found</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">App Access</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 overflow-hidden flex items-center justify-center">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white font-bold">{(user.displayName || user.email)[0].toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900">{user.displayName || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {(user.role === 'super_admin' || user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com') ? 'Super Admin' : (user.role === 'team' ? 'Team' : 'Projects')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                ${user.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                                    user.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {user.approvalStatus || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'super_admin' ? (
                                                <span className="text-xs text-gray-500">All Apps</span>
                                            ) : (
                                                <button
                                                    onClick={() => this.openPermissionsModal(user)}
                                                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition flex items-center gap-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                    </svg>
                                                    {user.allowedApps ? `${user.allowedApps.length} Apps` : 'All Apps'}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Role Selection for Approved Users */}
                                                {user.approvalStatus === 'approved' && user.role !== 'super_admin' && (
                                                    <select
                                                        value={user.role === 'team' ? 'team' : 'user'}
                                                        onChange={(e) => this.changeUserRole(user.id, e.target.value)}
                                                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white mr-2"
                                                    >
                                                        <option value="user">Projects</option>
                                                        <option value="team">Team</option>
                                                    </select>
                                                )}

                                                {/* Show approve/reject for pending users OR users without status (old accounts) */}
                                                {(!user.approvalStatus || user.approvalStatus === 'pending') && user.role !== 'super_admin' && (
                                                    <>
                                                        <button
                                                            onClick={() => this.approveUser(user.id)}
                                                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => this.rejectUser(user.id)}
                                                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {/* Show revoke for approved users */}
                                                {user.approvalStatus === 'approved' && user.role !== 'super_admin' && (
                                                    <button
                                                        onClick={() => this.revokeUser(user.id)}
                                                        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                                {/* Show delete for rejected users */}
                                                {user.approvalStatus === 'rejected' && user.role !== 'super_admin' && (
                                                    <button
                                                        onClick={() => this.deleteUser(user.id)}
                                                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-gray-400">No users found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* App Permissions Modal */}
                {this.state.showPermissionsModal && this.state.selectedUser && (
                    <AppPermissionsModal
                        user={this.state.selectedUser}
                        availableApps={this.state.availableApps}
                        onClose={this.closePermissionsModal}
                        onSave={this.updateUserPermissions}
                    />
                )}
            </div>
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">App Permissions</h2>
                            <p className="text-blue-100 text-sm">{user.displayName || user.email}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* All Access Toggle */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={grantAllAccess}
                            onChange={(e) => setGrantAllAccess(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                            <div className="font-semibold text-gray-800">Grant Access to All Apps</div>
                            <div className="text-xs text-gray-500">User can install any app from the App Store</div>
                        </div>
                    </label>
                </div>

                {/* App Selection */}
                <div className="flex-1 overflow-y-auto p-6">
                    {grantAllAccess ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium">Full App Access Granted</p>
                            <p className="text-sm text-gray-400 mt-1">User can access all {availableApps.length} apps</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* System Apps (Always included) */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    System Apps (Always Available)
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {availableApps.filter(app => systemApps.includes(app.id)).map(app => (
                                        <div key={app.id} className="flex items-center gap-3 p-3 bg-gray-100 border border-gray-200 rounded-lg opacity-60">
                                            <img src={app.icon} alt={app.title} className="w-8 h-8 object-contain" />
                                            <span className="text-sm font-medium text-gray-600">{app.title}</span>
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
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3 capitalize">{category}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {nonSystemApps.map(app => {
                                                const isSelected = selectedApps.includes(app.id);
                                                return (
                                                    <div
                                                        key={app.id}
                                                        onClick={() => toggleApp(app.id)}
                                                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <img src={app.icon} alt={app.title} className="w-8 h-8 object-contain" />
                                                        <span className="text-sm font-medium text-gray-700 truncate flex-1">{app.title}</span>
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
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        {grantAllAccess ? (
                            <span>All {availableApps.length} apps available</span>
                        ) : (
                            <span>{selectedApps.length + systemApps.length} apps selected ({systemApps.length} system + {selectedApps.length} custom)</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-md"
                        >
                            Save Permissions
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
