import React, { Component } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';

export class Projects extends Component {
    constructor() {
        super();
        this.state = {
            projects: [],
            tasks: [],
            teamMembers: [],
            view: 'kanban', // kanban, list, calendar, analytics
            showModal: false,
            showTaskModal: false,
            showTeamModal: false,
            activeProject: null,
            activeTask: null,
            selectedProject: null,
            // ENTERPRISE FEATURES
            darkMode: localStorage.getItem('darkMode') === 'true',
            favorites: JSON.parse(localStorage.getItem('favoriteProjects') || '[]'),
            newProject: {
                title: '',
                client: '',
                status: 'Planning',
                priority: 'Medium',
                startDate: '',
                endDate: '',
                description: '',
                progress: 0,
                budget: 0,
                spent: 0,
                tags: [],
                assignedTo: [],
                hoursEstimated: 0,
                hoursLogged: 0
            },
            newTask: {
                title: '',
                description: '',
                assignedTo: '',
                priority: 'Medium',
                status: 'To Do',
                dueDate: '',
                hoursEstimated: 0
            },
            newTag: '',
            searchQuery: '',
            filterStatus: 'All',
            filterPriority: 'All',
            loading: true
        };
        this.unsubscribeProjects = null;
        this.unsubscribeTasks = null;
    }

    componentDidMount() {
        this.subscribeToProjects();
        this.subscribeToTasks();
        this.loadTeamMembers();
        this.setupKeyboardShortcuts();
    }

    componentWillUnmount() {
        if (this.unsubscribeProjects) this.unsubscribeProjects();
        if (this.unsubscribeTasks) this.unsubscribeTasks();
        this.removeKeyboardShortcuts();
    }

    // ============ ENTERPRISE FEATURES ============
    setupKeyboardShortcuts = () => {
        document.addEventListener('keydown', this.handleKeyPress);
    }

    removeKeyboardShortcuts = () => {
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    handleKeyPress = (e) => {
        if (e.metaKey || e.ctrlKey) {
            switch (e.key) {
                case 'n': // New Project
                    e.preventDefault();
                    this.setState({ showModal: true, activeProject: null });
                    break;
                case 'k': // Search
                    e.preventDefault();
                    document.querySelector('input[placeholder*="Search"]')?.focus();
                    break;
                case 'd': // Dark Mode
                    e.preventDefault();
                    this.toggleDarkMode();
                    break;
                case 'e': // Export
                    e.preventDefault();
                    this.exportToExcel();
                    break;
                default:
                    break;
            }
        }
    }

    toggleDarkMode = () => {
        const darkMode = !this.state.darkMode;
        this.setState({ darkMode });
        localStorage.setItem('darkMode', darkMode);
        if (darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }

    toggleFavorite = (projectId, e) => {
        if (e) e.stopPropagation();
        const favorites = this.state.favorites.includes(projectId)
            ? this.state.favorites.filter(id => id !== projectId)
            : [...this.state.favorites, projectId];
        this.setState({ favorites });
        localStorage.setItem('favoriteProjects', JSON.stringify(favorites));
    }

    exportToExcel = () => {
        const data = this.filterProjects().map(p => ({
            'Project': p.title,
            'Client': p.client || '',
            'Status': p.status,
            'Priority': p.priority,
            'Progress': `${p.progress || 0}%`,
            'Budget': `$${p.budget || 0}`,
            'Spent': `$${p.spent || 0}`,
            'Team': p.assignedTo?.length || 0
        }));

        const csv = [
            Object.keys(data[0]).join(','),
            ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alphery-projects-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    subscribeToProjects = () => {
        if (!db) {
            console.log('Firebase not configured - Projects app running in demo mode');
            this.setState({ loading: false, projects: [] });
            return;
        }

        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, orderBy('updatedAt', 'desc'));

        this.unsubscribeProjects = onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.setState({ projects, loading: false });
        }, (error) => {
            console.error('Error loading projects:', error);
            this.setState({ loading: false });
        });
    }

    subscribeToTasks = () => {
        if (!db) {
            this.setState({ tasks: [] });
            return;
        }

        const tasksRef = collection(db, 'tasks');
        this.unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.setState({ tasks });
        });
    }

    loadTeamMembers = () => {
        if (!db) {
            console.log('Firebase not configured - Using demo team members');
            this.setState({
                teamMembers: [
                    { id: 'demo1', name: 'Demo User 1', email: 'demo1@alphery.com', role: 'Admin', avatar: '👤' },
                    { id: 'demo2', name: 'Demo User 2', email: 'demo2@alphery.com', role: 'User', avatar: '👥' }
                ]
            });
            return;
        }

        // Fetch real users from Firestore (Alphery Users)
        const usersRef = collection(db, 'users');
        onSnapshot(usersRef, (snapshot) => {
            const teamMembers = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(user => user.approvalStatus === 'approved') // Only approved users
                .map(user => ({
                    id: user.id,
                    name: user.displayName || user.email?.split('@')[0] || 'Unknown',
                    email: user.email,
                    role: user.role === 'super_admin' ? 'Admin' : 'User',
                    avatar: user.photoURL || (user.displayName ? user.displayName[0].toUpperCase() : '👤')
                }));

            this.setState({ teamMembers });
        }, (error) => {
            console.error('Error loading team members:', error);
            // Fallback to empty array if error
            this.setState({ teamMembers: [] });
        });
    }

    handleInputChange = (e) => {
        const value = e.target.type === 'range' || e.target.type === 'number'
            ? parseInt(e.target.value) || 0
            : e.target.value;
        this.setState({
            newProject: { ...this.state.newProject, [e.target.name]: value }
        });
    }

    handleTaskInputChange = (e) => {
        const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
        this.setState({
            newTask: { ...this.state.newTask, [e.target.name]: value }
        });
    }

    toggleTag = (tag) => {
        const tags = this.state.newProject.tags.includes(tag)
            ? this.state.newProject.tags.filter(t => t !== tag)
            : [...this.state.newProject.tags, tag];
        this.setState({ newProject: { ...this.state.newProject, tags } });
    }

    addTag = () => {
        const { newTag } = this.state;
        if (!newTag.trim()) return;
        this.toggleTag(newTag.trim());
        this.setState({ newTag: '' });
    }

    toggleAssignee = (memberId) => {
        const assignedTo = this.state.newProject.assignedTo.includes(memberId)
            ? this.state.newProject.assignedTo.filter(id => id !== memberId)
            : [...this.state.newProject.assignedTo, memberId];
        this.setState({ newProject: { ...this.state.newProject, assignedTo } });
    }

    saveProject = async () => {
        if (!db) {
            alert('Firebase not configured. Running in demo mode - projects cannot be saved.');
            return;
        }

        const p = this.state.newProject;
        if (!p.title) return alert('Project title is required');

        try {
            if (this.state.activeProject) {
                const projectRef = doc(db, 'projects', this.state.activeProject.id);
                await updateDoc(projectRef, {
                    ...p,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'projects'), {
                    ...p,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    comments: [],
                    files: []
                });
            }

            this.setState({
                showModal: false,
                activeProject: null,
                newProject: {
                    title: '', client: '', status: 'Planning', priority: 'Medium',
                    startDate: '', endDate: '', description: '', progress: 0,
                    budget: 0, spent: 0, tags: [], assignedTo: [],
                    hoursEstimated: 0, hoursLogged: 0
                }
            });
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to save project. Please try again.');
        }
    }

    saveTask = async () => {
        if (!db) {
            alert('Firebase not configured. Running in demo mode - tasks cannot be saved.');
            return;
        }

        const t = this.state.newTask;
        if (!t.title) return alert('Task title is required');
        if (!this.state.selectedProject) return alert('Please select a project first');

        try {
            await addDoc(collection(db, 'tasks'), {
                ...t,
                projectId: this.state.selectedProject.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                completed: false
            });

            this.setState({
                showTaskModal: false,
                newTask: {
                    title: '', description: '', assignedTo: '', priority: 'Medium',
                    status: 'To Do', dueDate: '', hoursEstimated: 0
                }
            });
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task.');
        }
    }

    openEdit = (project) => {
        // Safely handle old projects that might not have new fields
        const safeProject = {
            title: project.title || '',
            client: project.client || '',
            status: project.status || 'Planning',
            priority: project.priority || 'Medium',
            startDate: project.startDate || '',
            endDate: project.endDate || '',
            description: project.description || '',
            progress: project.progress || 0,
            budget: project.budget || 0,
            spent: project.spent || 0,
            tags: Array.isArray(project.tags) ? project.tags : [],
            assignedTo: Array.isArray(project.assignedTo) ? project.assignedTo : [],
            hoursEstimated: project.hoursEstimated || 0,
            hoursLogged: project.hoursLogged || 0
        };

        this.setState({
            activeProject: project,
            newProject: safeProject,
            showModal: true
        });
    }

    deleteProject = async (id, e) => {
        if (!db) {
            alert('Firebase not configured. Running in demo mode.');
            return;
        }

        e.stopPropagation();
        if (!window.confirm("Delete this project and all its tasks?")) return;

        try {
            await deleteDoc(doc(db, 'projects', id));
            // Delete associated tasks
            const projectTasks = this.state.tasks.filter(t => t.projectId === id);
            for (const task of projectTasks) {
                await deleteDoc(doc(db, 'tasks', task.id));
            }
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    }

    updateStatus = async (project, status) => {
        try {
            await updateDoc(doc(db, 'projects', project.id), {
                status,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    getProjectStats = () => {
        const { projects } = this.state;
        return {
            total: projects.length,
            planning: projects.filter(p => p.status === 'Planning').length,
            inProgress: projects.filter(p => p.status === 'In Progress').length,
            review: projects.filter(p => p.status === 'Review').length,
            completed: projects.filter(p => p.status === 'Completed').length,
            totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
            totalSpent: projects.reduce((sum, p) => sum + (p.spent || 0), 0),
            totalHours: projects.reduce((sum, p) => sum + (p.hoursLogged || 0), 0),
            favorites: this.state.favorites.length,
            overdue: projects.filter(p => p.endDate && new Date(p.endDate) < new Date() && p.status !== 'Completed').length
        };
    }

    filterProjects = () => {
        let filtered = this.state.projects;

        if (this.state.searchQuery) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
                p.client?.toLowerCase().includes(this.state.searchQuery.toLowerCase())
            );
        }

        if (this.state.filterStatus !== 'All') {
            filtered = filtered.filter(p => p.status === this.state.filterStatus);
        }

        if (this.state.filterPriority !== 'All') {
            filtered = filtered.filter(p => p.priority === this.state.filterPriority);
        }

        return filtered;
    }

    renderAnalytics = () => {
        const stats = this.getProjectStats();
        return (
            <div className="grid grid-cols-4 gap-6 p-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Projects</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</p>
                            <p className="text-xs text-emerald-600 mt-1">⭐ {stats.favorites} favorites</p>
                        </div>
                        <div className="bg-emerald-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">In Progress</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.inProgress}</p>
                            <p className="text-xs text-orange-600 mt-1">⚠️ {stats.overdue} overdue</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Budget</p>
                            <p className="text-3xl font-bold text-purple-600 mt-2">${stats.totalBudget.toLocaleString()}</p>
                            <p className="text-xs text-slate-400 mt-1">Spent: ${stats.totalSpent.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Hours Logged</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalHours}h</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Status Breakdown</h3>
                    <div className="space-y-3">
                        {['Planning', 'In Progress', 'Review', 'Completed'].map(status => {
                            const count = stats[status.toLowerCase().replace(' ', '')];
                            const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(0) : 0;
                            return (
                                <div key={status}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">{status}</span>
                                        <span className="font-semibold text-slate-800">{count} ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`}
                                            style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Recent Activity</h3>
                    <div className="space-y-3 text-sm">
                        {this.state.projects.slice(0, 5).map(p => (
                            <div key={p.id} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800">{p.title}</p>
                                    <p className="text-xs text-slate-400">Status: {p.status}</p>
                                </div>
                                <span className="text-xs text-slate-400">{p.progress || 0}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { view, showModal, showTaskModal, newProject, newTask, loading, teamMembers, selectedProject, tasks } = this.state;
        const columns = ['Planning', 'In Progress', 'Review', 'Completed'];
        const priorities = ['Low', 'Medium', 'High', 'Urgent'];
        const filteredProjects = this.filterProjects();

        if (loading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="text-center">
                        <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Loading projects...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 relative font-sans">
                {/* Header */}
                <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-2.5 rounded-xl shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl tracking-tight text-slate-800">Project Hub</h1>
                            <p className="text-xs text-slate-500">Manage your team's projects efficiently</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search projects... (Cmd+K)"
                                value={this.state.searchQuery}
                                onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition w-64 text-sm"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={this.toggleDarkMode}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xl transition hover:scale-110"
                            title="Toggle Dark Mode (Cmd+D)"
                        >
                            {this.state.darkMode ? '🌙' : '☀️'}
                        </button>

                        {/* Export Button */}
                        <button
                            onClick={this.exportToExcel}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow text-sm font-semibold transition flex items-center gap-2"
                            title="Export to Excel (Cmd+E)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Export
                        </button>

                        {/* View Toggle */}
                        <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-semibold">
                            {['kanban', 'list', 'analytics'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => this.setState({ view: v })}
                                    className={`px-4 py-1.5 rounded-md transition capitalize ${view === v ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => this.setState({
                                showModal: true,
                                activeProject: null,
                                newProject: {
                                    title: '', client: '', status: 'Planning', priority: 'Medium',
                                    startDate: '', endDate: '', description: '', progress: 0,
                                    budget: 0, spent: 0, tags: [], assignedTo: [],
                                    hoursEstimated: 0, hoursLogged: 0
                                }
                            })}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-semibold transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            New Project
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {view !== 'analytics' && (
                    <div className="px-6 py-4 bg-white border-b border-slate-200 flex gap-4">
                        <select
                            value={this.state.filterStatus}
                            onChange={(e) => this.setState({ filterStatus: e.target.value })}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="All">All Status</option>
                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={this.state.filterPriority}
                            onChange={(e) => this.setState({ filterPriority: e.target.value })}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="All">All Priorities</option>
                            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {view === 'analytics' ? this.renderAnalytics() : view === 'kanban' ? (
                        <div className="flex gap-6 h-full p-6 min-w-max">
                            {columns.map(col => (
                                <div key={col} className="w-80 flex flex-col bg-white rounded-2xl px-3 py-4 h-full shadow-sm border border-slate-200">
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{col}</h3>
                                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                            {filteredProjects.filter(p => p.status === col).length}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                                        {filteredProjects.filter(p => p.status === col).map(project => (
                                            <div key={project.id} onClick={() => {
                                                this.setState({ selectedProject: project });
                                                this.openEdit(project);
                                            }}
                                                className="bg-gradient-to-br from-white to-slate-50 p-4 rounded-xl shadow hover:shadow-lg transition cursor-pointer border border-slate-100 group">

                                                {/* Priority Badge */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${project.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                                        project.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                                            project.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {project.priority}
                                                    </span>
                                                    <button onClick={(e) => this.deleteProject(project.id, e)} className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>

                                                {/* Title & Client */}
                                                <h4 className="font-bold text-slate-800 mb-1 leading-tight">{project.title}</h4>
                                                {project.client && (
                                                    <p className="text-xs text-emerald-600 font-semibold mb-2">🏢 {project.client}</p>
                                                )}
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description}</p>

                                                {/* Tags */}
                                                {project.tags && project.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {project.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Progress Bar */}
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all" style={{ width: `${project.progress || 0}%` }}></div>
                                                </div>

                                                {/* Meta Info */}
                                                <div className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                        {project.startDate}
                                                    </div>
                                                    <span className="font-bold text-slate-700">{project.progress || 0}%</span>
                                                </div>

                                                {/* Team Avatars */}
                                                {project.assignedTo && Array.isArray(project.assignedTo) && project.assignedTo.length > 0 && (
                                                    <div className="flex -space-x-2 mt-3">
                                                        {project.assignedTo.slice(0, 3).map(memberId => {
                                                            const member = teamMembers.find(m => m.id === memberId);
                                                            return member ? (
                                                                <div key={memberId} title={member.name} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs overflow-hidden">
                                                                    {member.avatar && member.avatar.startsWith('http') ? (
                                                                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span>{member.avatar || '👤'}</span>
                                                                    )}
                                                                </div>
                                                            ) : null;
                                                        })}
                                                        {project.assignedTo.length > 3 && (
                                                            <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">
                                                                +{project.assignedTo.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Project</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Client</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Priority</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Progress</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Budget</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Team</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredProjects.map(project => (
                                            <tr key={project.id} onClick={() => {
                                                this.setState({ selectedProject: project });
                                                this.openEdit(project);
                                            }} className="hover:bg-slate-50 cursor-pointer transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900">{project.title}</div>
                                                    {project.tags && project.tags.length > 0 && (
                                                        <div className="flex gap-1 mt-1">
                                                            {project.tags.slice(0, 2).map(tag => (
                                                                <span key={tag} className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{project.client || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${project.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                                        project.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                                            project.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {project.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                            project.status === 'Review' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {project.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-32">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-slate-600">{project.progress || 0}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="text-slate-900 font-semibold">${(project.budget || 0).toLocaleString()}</div>
                                                    <div className="text-xs text-slate-500">Spent: ${(project.spent || 0).toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-2">
                                                        {project.assignedTo && project.assignedTo.slice(0, 3).map(memberId => {
                                                            const member = teamMembers.find(m => m.id === memberId);
                                                            return member ? (
                                                                <div key={memberId} title={member.name} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-sm">
                                                                    {member.avatar}
                                                                </div>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={(e) => this.deleteProject(project.id, e)} className="text-slate-400 hover:text-red-500 font-medium text-sm transition">
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Project Modal */}
                {showModal && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
                                <h3 className="text-xl font-bold text-slate-800">{this.state.activeProject ? 'Edit Project' : 'Create New Project'}</h3>
                                <button onClick={() => this.setState({ showModal: false })} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                            </div>

                            <div className="p-6 space-y-5 overflow-y-auto flex-1">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Project Title *</label>
                                        <input name="title" value={newProject.title} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Client</label>
                                        <input name="client" value={newProject.client} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>
                                </div>

                                {/* Dates & Priority */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Start Date</label>
                                        <input type="date" name="startDate" value={newProject.startDate} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">End Date</label>
                                        <input type="date" name="endDate" value={newProject.endDate} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Priority</label>
                                        <select name="priority" value={newProject.priority} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white">
                                            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Status & Budget */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Status</label>
                                        <select name="status" value={newProject.status} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white">
                                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Budget ($)</label>
                                        <input type="number" name="budget" value={newProject.budget} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Spent ($)</label>
                                        <input type="number" name="spent" value={newProject.spent || 0} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>
                                </div>

                                {/* Time Tracking */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Estimated Hours</label>
                                        <input type="number" name="hoursEstimated" value={newProject.hoursEstimated || 0} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Hours Logged</label>
                                        <input type="number" name="hoursLogged" value={newProject.hoursLogged || 0} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Description</label>
                                    <textarea name="description" rows="3" value={newProject.description} onChange={this.handleInputChange}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none bg-white"></textarea>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Tags</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Add tag..."
                                            value={this.state.newTag}
                                            onChange={(e) => this.setState({ newTag: e.target.value })}
                                            onKeyPress={(e) => e.key === 'Enter' && this.addTag()}
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white"
                                        />
                                        <button onClick={this.addTag} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition">
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {newProject.tags && newProject.tags.map(tag => (
                                            <span key={tag} onClick={() => this.toggleTag(tag)}
                                                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-purple-200 transition">
                                                {tag} ×
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Team Assignment */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Assign Team</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {teamMembers.map(member => (
                                            <div key={member.id} onClick={() => this.toggleAssignee(member.id)}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition ${newProject.assignedTo.includes(member.id)
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}>
                                                <div className="flex items-center gap-2">
                                                    {member.avatar && member.avatar.startsWith('http') ? (
                                                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-2xl">{member.avatar || '👤'}</span>
                                                    )}
                                                    <div className="text-xs">
                                                        <div className="font-semibold text-slate-800">{member.name}</div>
                                                        <div className="text-slate-500">{member.role}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Progress (Edit Only) */}
                                {this.state.activeProject && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Progress ({newProject.progress || 0}%)</label>
                                        <input type="range" name="progress" min="0" max="100" value={newProject.progress || 0} onChange={this.handleInputChange}
                                            className="w-full accent-emerald-600" />
                                    </div>
                                )}
                            </div>

                            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                                <button onClick={() => this.setState({ showModal: false })} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition">
                                    Cancel
                                </button>
                                <button onClick={this.saveProject} className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg shadow-lg hover:shadow-xl font-semibold transition transform hover:scale-105 active:scale-95">
                                    {this.state.activeProject ? 'Update Project' : 'Create Project'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export const displayProject = () => {
    return <Projects />;
}
