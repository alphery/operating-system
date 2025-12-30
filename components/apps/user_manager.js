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
            loading: true
        };
        this.unsubscribe = null;
    }

    componentDidMount() {
        this.loadUsers();
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    loadUsers = () => {
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

        try {
            await deleteDoc(doc(db, 'users', userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
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
        if (!userData || userData.role !== 'super_admin') {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h3>
                        <p className="text-sm text-gray-500">This panel is only accessible to administrators</p>
                    </div>
                </div>
            );
        }

        if (loading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading users...</p>
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-gray-800">User Management</h1>
                            <p className="text-xs text-gray-500">Admin Panel</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-semibold">
                            Super Admin
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 p-6">
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
                    <div className="bg-white rounded-lg shadow p-2 flex gap-2">
                        {['all', 'pending', 'approved', 'rejected'].map(f => (
                            <button
                                key={f}
                                onClick={() => this.setState({ filter: f })}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition capitalize
                                    ${filter === f ? 'bg-pink-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
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
                                                {user.role === 'super_admin' ? 'Super Admin' : 'User'}
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
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
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
                                                        Revoke Access
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
            </div>
        );
    }
}

export const displayUserManager = () => {
    return <UserManagerWithAuth />;
};
