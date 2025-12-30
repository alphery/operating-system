import React, { Component } from 'react';
import ERPDatabase from '../util components/database';
import SessionManager from '../util components/session';

export class HRM extends Component {
    constructor() {
        super();
        this.state = {
            view: 'directory',
            employees: [],
            searchQuery: '',
            showModal: false,
            activeEmp: null, // For editing
            newEmp: { name: '', role: '', dept: '', img: '' },
            isAdmin: false // Permission check
        }
    }

    componentDidMount() {
        this.refreshData();
        this.checkPermission();
    }

    checkPermission = () => {
        // Check if current user is admin
        // We can get current user from SessionManager 
        const currentUser = SessionManager.getUserId();
        if (currentUser === 'admin') {
            this.setState({ isAdmin: true });
        } else {
            // Or check permissions list from DB system users if complex
            // For now, simple check is enough based on login content
            const users = ERPDatabase.getSystemUsers();
            const user = users.find(u => u.username === currentUser);
            if (user && user.permissions.includes('all_apps')) {
                this.setState({ isAdmin: true });
            }
        }
    }

    refreshData = () => {
        this.setState({ employees: ERPDatabase.getEmployees() });
    }

    handleInputChange = (e) => {
        this.setState({
            newEmp: { ...this.state.newEmp, [e.target.name]: e.target.value }
        });
    }

    handleSaveEmployee = () => {
        const { name, role, dept, img } = this.state.newEmp;
        if (!name || !role) return;

        if (this.state.activeEmp) {
            // Update
            ERPDatabase.updateEmployee({ ...this.state.activeEmp, name, role, dept, img });
        } else {
            // New
            ERPDatabase.addEmployee({ name, role, dept, img });
        }

        this.setState({
            showModal: false,
            activeEmp: null,
            newEmp: { name: '', role: '', dept: '', img: '' }
        });
        this.refreshData();
    }

    openEdit = (emp) => {
        this.setState({
            showModal: true,
            activeEmp: emp,
            newEmp: { name: emp.name, role: emp.role, dept: emp.dept, img: emp.img || '' }
        });
    }

    handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to remove this employee?")) {
            ERPDatabase.deleteEmployee(id);
            this.refreshData();
        }
    }

    render() {
        const filteredEmployees = this.state.employees.filter(emp =>
            emp.name.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
            emp.dept.toLowerCase().includes(this.state.searchQuery.toLowerCase())
        );

        const { isAdmin } = this.state;

        return (
            <div className="w-full h-full flex flex-col bg-slate-50 text-slate-800 relative select-none">
                {/* Header */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-600 text-white p-1.5 rounded">HR</div>
                        <h1 className="font-bold text-lg">People Connect</h1>
                    </div>
                    <div className="flex gap-4 text-sm font-medium text-slate-500">
                        <button className="hover:text-purple-600 text-purple-600 border-b-2 border-purple-600">Directory</button>
                        <button className="hover:text-purple-600">Org Chart</button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-700">Employee Directory ({filteredEmployees.length})</h2>
                        <div className="space-x-4 flex">
                            <input
                                value={this.state.searchQuery}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                className="px-3 py-1.5 border border-slate-300 rounded shadow-sm text-sm focus:border-purple-500 outline-none w-64"
                                placeholder="Search employees..." />

                            {isAdmin && (
                                <button
                                    onClick={() => this.setState({ showModal: true, activeEmp: null, newEmp: { name: '', role: '', dept: '', img: '' } })}
                                    className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 shadow-sm flex items-center gap-2">
                                    <span>+ Add Employee</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredEmployees.map((emp) => (
                            <div key={emp.id} className="bg-white rounded-lg p-6 shadow hover:shadow-md transition border border-slate-100 flex flex-col items-center text-center relative group">
                                {isAdmin && (
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                                        <button onClick={() => this.openEdit(emp)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        </button>
                                        <button onClick={(e) => this.handleDelete(emp.id, e)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                )}

                                <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 overflow-hidden border-4 border-slate-50 shadow-sm">
                                    {emp.img ? (
                                        <img src={emp.img} alt={emp.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400 bg-slate-100 uppercase">{emp.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <h3 className="font-bold text-slate-800 text-lg">{emp.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-mono mb-1">ID: {emp.id}</p>
                                    <div className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-1">{emp.role}</div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">{emp.dept}</p>
                                </div>

                                <div className="mt-5 w-full">
                                    <button
                                        onClick={() => {
                                            const sysUsers = ERPDatabase.getSystemUsers();
                                            // Try to match Employee to System User by Name or generated username
                                            const targetUser = sysUsers.find(u => u.displayName === emp.name || u.username === emp.name.toLowerCase().replace(/\s/g, ''));

                                            if (targetUser) {
                                                SessionManager.setItem('messenger_target_user', targetUser.username);
                                                if (this.props.openApp) this.props.openApp('messenger');
                                            } else {
                                                // Fallback if no account found (simulated)
                                                console.warn("No system user found for employee:", emp.name);
                                                if (this.props.openApp) this.props.openApp('messenger');
                                            }
                                        }}
                                        className="w-full text-sm bg-white border border-slate-300 py-1.5 rounded hover:bg-slate-50 text-slate-600 shadow-sm transition flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                        Message
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {this.state.showModal && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-96 p-6 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">{this.state.activeEmp ? 'Edit Employee' : 'Add New Employee'}</h3>
                            <div className="space-y-4">
                                {this.state.activeEmp && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Employee ID</label>
                                        <input disabled value={this.state.activeEmp.id} className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                    <input name="name" value={this.state.newEmp.name} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role / Job Title</label>
                                    <input name="role" value={this.state.newEmp.role} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Product Designer" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                                    <input name="dept" value={this.state.newEmp.dept} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Design" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Profile Image URL</label>
                                    <input name="img" value={this.state.newEmp.img} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://..." />
                                    <p className="text-[10px] text-gray-400 mt-1">Leave blank for default avatar</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button onClick={() => this.setState({ showModal: false })} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                                <button onClick={this.handleSaveEmployee} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md transform active:scale-95 transition font-medium">
                                    {this.state.activeEmp ? 'Save Changes' : 'Add Employee'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export const displayHRM = (openApp) => {
    return <HRM openApp={openApp} />;
};
