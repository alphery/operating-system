import React, { Component } from 'react';
import ERPDatabase from '../util components/database';

export class UserManager extends Component {
    constructor() {
        super();
        this.state = {
            users: [],
            showModal: false,
            activeUser: null,
            newUser: { username: '', password: '', displayName: '', permissions: 'restricted' } // simple permission selector
        }
    }

    componentDidMount() {
        this.refreshData();
    }

    refreshData = () => {
        this.setState({ users: ERPDatabase.getSystemUsers() });
    }

    handleInputChange = (e) => {
        this.setState({
            newUser: { ...this.state.newUser, [e.target.name]: e.target.value }
        });
    }

    saveUser = () => {
        const u = this.state.newUser;
        if (!u.username || !u.password) return;

        // Map simple permission selection to actual array
        let perms = [];
        if (u.permissions === 'admin') {
            perms = ["all_apps"];
        } else if (u.permissions === 'employee') {
            perms = ["dashboard", "mail", "projects", "crm", "people", "chrome", "settings", "trash", "users"];
        } else {
            // Guest/Restricted
            perms = ["dashboard", "projects", "chrome", "finance", "settings", "trash"];
        }

        const userObj = {
            username: u.username,
            password: u.password,
            displayName: u.displayName || u.username,
            permissions: perms,
            image: "./themes/Yaru/system/user-home.png"
        };

        if (this.state.activeUser) {
            ERPDatabase.updateSystemUser({ ...this.state.activeUser, ...userObj });
        } else {
            ERPDatabase.addSystemUser(userObj);
        }

        this.setState({ showModal: false, activeUser: null, newUser: { username: '', password: '', displayName: '', permissions: 'restricted' } });
        this.refreshData();
    }

    openEdit = (user) => {
        // Determine permission type for UI
        let permType = 'restricted';
        if (user.permissions.includes('all_apps')) permType = 'admin';
        else if (user.permissions.includes('mail')) permType = 'employee';

        this.setState({
            activeUser: user,
            newUser: {
                username: user.username,
                password: user.password,
                displayName: user.displayName,
                permissions: permType
            },
            showModal: true
        });
    }

    deleteUser = (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            ERPDatabase.deleteSystemUser(id);
            this.refreshData();
        }
    }

    render() {
        const { users, showModal, newUser } = this.state;

        return (
            <div className="w-full h-full flex flex-col bg-gray-100 font-sans text-gray-800">
                {/* Header */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-600 text-white p-2 rounded-full">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        </div>
                        <h1 className="font-bold text-xl">User Management</h1>
                    </div>
                    <button onClick={() => this.setState({ showModal: true, activeUser: null, newUser: { username: '', password: '', displayName: '', permissions: 'restricted' } })}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2">
                        <span>+ Add User</span>
                    </button>
                </div>

                {/* List */}
                <div className="p-8 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map(user => (
                            <div key={user.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border border-gray-200 flex flex-col items-center text-center relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition space-x-2">
                                    <button onClick={() => this.openEdit(user)} className="text-blue-500 hover:bg-blue-50 p-1 rounded">Edit</button>
                                    {user.username !== 'admin' && (
                                        <button onClick={() => this.deleteUser(user.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">Delete</button>
                                    )}
                                </div>
                                <img src={user.image} alt="Avatar" className="w-20 h-20 rounded-full mb-4 border-4 border-gray-100" />
                                <h3 className="font-bold text-lg text-gray-800">{user.displayName}</h3>
                                <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                    ${user.permissions.includes('all_apps') ? 'bg-pink-100 text-pink-700' :
                                        user.permissions.includes('mail') ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {user.permissions.includes('all_apps') ? 'Administrator' :
                                        user.permissions.includes('mail') ? 'Employee Team' : 'Guest Access'}
                                </span>
                                <div className="mt-4 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                                    Pass: {user.password}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-96 p-6 animate-in zoom-in duration-200">
                            <h3 className="text-xl font-bold mb-4 text-gray-800">{this.state.activeUser ? 'Edit User' : 'Create New User'}</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                    <input name="displayName" value={newUser.displayName} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none" placeholder="e.g. John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username (Login ID)</label>
                                    <input name="username" value={newUser.username} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none" placeholder="e.g. johnd" disabled={!!this.state.activeUser} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input name="password" value={newUser.password} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none" placeholder="secret123" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Access Level</label>
                                    <select name="permissions" value={newUser.permissions} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-pink-500 outline-none bg-white">
                                        <option value="restricted">Guest (Restricted)</option>
                                        <option value="employee">Employee (Standard)</option>
                                        <option value="admin">Administrator (Full Access)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => this.setState({ showModal: false })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button onClick={this.saveUser} className="px-5 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 font-medium">Save User</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export const displayUserManager = () => <UserManager />;
