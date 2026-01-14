import React, { Component } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export class Projects extends Component {
    constructor() {
        super();
        this.state = {
            // SECTION NAVIGATION
            activeSection: 'Projects', // Quotations, Projects, Documents, Process

            // PROJECTS
            projects: [],
            tasks: [],
            teamMembers: [],
            view: 'table', // table, kanban, list, analytics
            showModal: false,
            showTaskModal: false,
            showTeamModal: false,
            activeProject: null,
            activeTask: null,
            selectedProject: null,

            // QUOTATIONS
            quotations: [],
            showQuotationModal: false,
            activeQuotation: null,
            newQuotation: {
                title: '',
                client: '',
                type: 'Service',
                status: 'Planned',
                approvedBy: '',
                timeline: '',
                description: ''
            },

            // DOCUMENTS
            documents: [],
            showDocumentModal: false,
            activeDocument: null,
            newDocument: {
                title: '',
                type: 'Contract',
                projectId: '',
                uploadedBy: '',
                uploadedDate: '',
                fileUrl: '',
                description: '',
                status: 'Draft'
            },

            // ENTERPRISE FEATURES
            darkMode: localStorage.getItem('darkMode') === 'true',
            favorites: JSON.parse(localStorage.getItem('favoriteProjects') || '[]'),
            newProject: {
                name: '',
                type: 'Development',
                overview: '',
                status: 'Planning',
                timeline: '',
                tagged: [],
                requirements: '',
                modifications: '',
                currentProgress: '',
                pendingChanges: '',
                finisherTimeline: ''
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
        this.subscribeToQuotations();
        this.subscribeToDocuments();
        this.loadTeamMembers();
        this.setupKeyboardShortcuts();
    }

    componentWillUnmount() {
        if (this.unsubscribeProjects) this.unsubscribeProjects();
        if (this.unsubscribeTasks) this.unsubscribeTasks();
        if (this.unsubscribeQuotations) this.unsubscribeQuotations();
        if (this.unsubscribeDocuments) this.unsubscribeDocuments();
        this.removeKeyboardShortcuts();
    }

    // ============ PERMISSION HELPERS ============
    hasProjectAccess = (projectId) => {
        const user = this.props.userData || this.props.user;

        // Super admins have access to all projects
        if (user && user.role === 'super_admin') {
            return true;
        }

        // Regular users need explicit permission
        if (user && user.allowedProjects) {
            return user.allowedProjects.includes(projectId);
        }

        // If no user or no permissions array, deny access
        return false;
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
            const allProjects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter projects based on user permissions
            const user = this.props.userData || this.props.user;
            const isSuperAdmin = user && user.role === 'super_admin';

            let filteredProjects = allProjects;
            if (!isSuperAdmin && user && user.allowedProjects) {
                // Show only projects the user has access to
                filteredProjects = allProjects.filter(p => user.allowedProjects.includes(p.id));
            } else if (!isSuperAdmin && user) {
                // If not admin and no allowedProjects, show nothing
                filteredProjects = [];
            }

            this.setState({ projects: filteredProjects, loading: false });
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

    // ============ QUOTATIONS METHODS ============
    subscribeToQuotations = () => {
        if (!db) {
            console.log('Firebase not configured - Quotations running in demo mode');
            this.setState({ quotations: [] });
            return;
        }

        const quotationsRef = collection(db, 'quotations');
        const q = query(quotationsRef, orderBy('updatedAt', 'desc'));

        this.unsubscribeQuotations = onSnapshot(q, (snapshot) => {
            const quotations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.setState({ quotations });
        }, (error) => {
            console.error('Error loading quotations:', error);
            this.setState({ quotations: [] });
        });
    }

    saveQuotation = async () => {
        if (!db) {
            alert('Firebase not configured. Running in demo mode - quotations cannot be saved.');
            return;
        }

        const q = this.state.newQuotation;
        if (!q.title) return alert('Quotation title is required');

        try {
            if (this.state.activeQuotation) {
                const quotationRef = doc(db, 'quotations', this.state.activeQuotation.id);
                await updateDoc(quotationRef, {
                    ...q,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'quotations'), {
                    ...q,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            this.setState({
                showQuotationModal: false,
                activeQuotation: null,
                newQuotation: {
                    title: '', client: '', type: 'Service', status: 'Planned',
                    approvedBy: '', timeline: '', description: ''
                }
            });
        } catch (error) {
            console.error('Error saving quotation:', error);
            alert('Failed to save quotation.');
        }
    }

    deleteQuotation = async (id, e) => {
        if (!db) {
            alert('Firebase not configured. Running in demo mode.');
            return;
        }

        e.stopPropagation();
        if (!window.confirm("Delete this quotation?")) return;

        try {
            await deleteDoc(doc(db, 'quotations', id));
        } catch (error) {
            console.error('Error deleting quotation:', error);
        }
    }

    openEditQuotation = (quotation) => {
        this.setState({
            activeQuotation: quotation,
            newQuotation: {
                title: quotation.title || '',
                client: quotation.client || '',
                type: quotation.type || 'Service',
                status: quotation.status || 'Planned',
                approvedBy: quotation.approvedBy || '',
                timeline: quotation.timeline || '',
                description: quotation.description || ''
            },
            showQuotationModal: true
        });
    }

    // ============ DOCUMENTS METHODS ============
    subscribeToDocuments = () => {
        if (!db) {
            console.log('Firebase not configured - Documents running in demo mode');
            this.setState({ documents: [] });
            return;
        }

        const documentsRef = collection(db, 'documents');
        const q = query(documentsRef, orderBy('uploadedDate', 'desc'));

        this.unsubscribeDocuments = onSnapshot(q, (snapshot) => {
            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.setState({ documents });
        }, (error) => {
            console.error('Error loading documents:', error);
            this.setState({ documents: [] });
        });
    }

    saveDocument = async () => {
        if (!db) {
            alert('Firebase not configured. Running in demo mode - documents cannot be saved.');
            return;
        }

        const d = this.state.newDocument;
        if (!d.title) return alert('Document title is required');

        try {
            if (this.state.activeDocument) {
                const documentRef = doc(db, 'documents', this.state.activeDocument.id);
                await updateDoc(documentRef, {
                    ...d,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'documents'), {
                    ...d,
                    uploadedDate: new Date().toISOString().split('T')[0],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            this.setState({
                showDocumentModal: false,
                activeDocument: null,
                newDocument: {
                    title: '', type: 'Contract', projectId: '', uploadedBy: '',
                    uploadedDate: '', fileUrl: '', description: '', status: 'Draft'
                }
            });
        } catch (error) {
            console.error('Error saving document:', error);
            alert('Failed to save document.');
        }
    }

    deleteDocument = async (id, e) => {
        if (!db) {
            alert('Firebase not configured. Running in demo mode.');
            return;
        }

        e.stopPropagation();
        if (!window.confirm("Delete this document?")) return;

        try {
            await deleteDoc(doc(db, 'documents', id));
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    }

    openEditDocument = (document) => {
        this.setState({
            activeDocument: document,
            newDocument: {
                title: document.title || '',
                type: document.type || 'Contract',
                projectId: document.projectId || '',
                uploadedBy: document.uploadedBy || '',
                uploadedDate: document.uploadedDate || '',
                fileUrl: document.fileUrl || '',
                description: document.description || '',
                status: document.status || 'Draft'
            },
            showDocumentModal: true
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

    handleQuotationInputChange = (e) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        this.setState({
            newQuotation: { ...this.state.newQuotation, [e.target.name]: value }
        });
    }

    handleDocumentInputChange = (e) => {
        this.setState({
            newDocument: { ...this.state.newDocument, [e.target.name]: e.target.value }
        });
    }

    saveProject = async () => {
        if (!db) {
            alert('Firebase not configured. Running in demo mode - projects cannot be saved.');
            return;
        }

        const p = this.state.newProject;
        const projectTitle = p.name || p.title;

        if (!projectTitle) return alert('Project title is required');

        const projectData = {
            ...p,
            title: projectTitle,
            name: projectTitle
        };

        try {
            if (this.state.activeProject) {
                const projectRef = doc(db, 'projects', this.state.activeProject.id);
                await updateDoc(projectRef, {
                    ...projectData,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'projects'), {
                    ...projectData,
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
                    name: '', type: 'Development', overview: '', status: 'Planning',
                    timeline: '', tagged: [], requirements: '', modifications: '',
                    currentProgress: '', pendingChanges: '', finisherTimeline: ''
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
        // Safely handle old and new project structures
        const safeProject = {
            name: project.name || project.title || '',
            type: project.type || 'Development',
            overview: project.overview || project.description || '',
            status: project.status || 'Planning',
            timeline: project.timeline || '',
            tagged: Array.isArray(project.tagged) ? project.tagged : (Array.isArray(project.tags) ? project.tags : []),
            requirements: project.requirements || '',
            modifications: project.modifications || '',
            currentProgress: project.currentProgress || '',
            pendingChanges: project.pendingChanges || '',
            finisherTimeline: project.finisherTimeline || ''
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

    addTag = () => {
        const tag = this.state.newTag.trim();
        if (tag && !this.state.newProject.tagged.includes(tag)) {
            this.setState({
                newProject: {
                    ...this.state.newProject,
                    tagged: [...this.state.newProject.tagged, tag]
                },
                newTag: ''
            });
        }
    }

    toggleTag = (tag) => {
        this.setState({
            newProject: {
                ...this.state.newProject,
                tagged: this.state.newProject.tagged.filter(t => t !== tag)
            }
        });
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

    // ============ RENDER SECTIONS ============
    renderProjectsTable = () => {
        const statusColors = {
            'Planning': 'bg-slate-100 text-slate-700',
            'In Progress': 'bg-blue-100 text-blue-700',
            'Review': 'bg-purple-100 text-purple-700',
            'Completed': 'bg-emerald-100 text-emerald-700'
        };

        const typeColors = {
            'Development': 'bg-blue-100 text-blue-700',
            'Design': 'bg-purple-100 text-purple-700',
            'Marketing': 'bg-pink-100 text-pink-700',
            'Research': 'bg-orange-100 text-orange-700',
            'Support': 'bg-teal-100 text-teal-700'
        };

        const filteredProjects = this.filterProjects();

        return (
            <div className="p-4 h-full overflow-hidden flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-grow">
                    <div className="overflow-y-auto flex-grow custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[5%] text-center">S.No</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[12%]">Name</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[10%]">Type</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[15%] hidden lg:table-cell">Overview</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[10%]">Status</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[10%] hidden md:table-cell">Timeline</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[10%] hidden xl:table-cell">Tagged</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[12%] whitespace-nowrap hidden 2xl:table-cell">Requirements</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[12%] whitespace-nowrap hidden 2xl:table-cell">Modifications</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[10%] whitespace-nowrap hidden 2xl:table-cell">Current Progress</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[10%] whitespace-nowrap hidden 2xl:table-cell">Pending Changes</th>
                                    <th className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider w-[10%] whitespace-nowrap hidden 2xl:table-cell">Finisher TL</th>
                                    <th className="px-3 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider w-[8%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="px-6 py-20 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-base font-semibold text-slate-900">No projects</p>
                                                    <p className="text-xs text-slate-500 mt-1">Create a new project</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((project, index) => (
                                        <tr key={project.id} onClick={() => this.openEdit(project)} className="group hover:bg-slate-50 cursor-pointer transition-colors duration-200">
                                            <td className="px-3 py-3 align-middle text-center w-[5%]">
                                                <span className="text-slate-500 font-medium text-xs">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 align-middle w-[12%]">
                                                <div className="font-semibold text-slate-900 text-sm truncate" title={project.name || project.title}>
                                                    {project.name || project.title || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle w-[10%]">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide truncate max-w-full ${typeColors[project.type] ? typeColors[project.type].replace('bg-', 'bg-opacity-10 text-') : 'bg-slate-100 text-slate-600'}`}>
                                                    {project.type || 'Dev'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 align-middle hidden lg:table-cell w-[15%]">
                                                <div className="text-slate-500 text-xs truncate" title={project.overview || project.description}>
                                                    {project.overview || project.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle w-[10%]">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${statusColors[project.status]?.split(' ')[0].replace('bg-', 'bg-') || 'bg-slate-400'}`}></div>
                                                    <span className="text-xs font-medium text-slate-700 truncate">{project.status || 'Planning'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle hidden md:table-cell w-[10%]">
                                                <div className="text-slate-500 text-xs truncate">
                                                    {project.timeline || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle hidden xl:table-cell w-[10%]">
                                                <div className="flex flex-wrap gap-1 overflow-hidden h-5">
                                                    {(project.tagged || project.tags || []).slice(0, 2).map(tag => (
                                                        <span key={tag} className="inline-block px-1.5 rounded-[4px] text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[60px]">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle hidden 2xl:table-cell w-[12%]">
                                                <div className="text-slate-400 text-xs truncate" title={project.requirements}>
                                                    {project.requirements || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle hidden 2xl:table-cell w-[12%]">
                                                <div className="text-slate-400 text-xs truncate" title={project.modifications}>
                                                    {project.modifications || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle hidden 2xl:table-cell w-[10%]">
                                                <div className="text-slate-400 text-xs truncate" title={project.currentProgress}>
                                                    {project.currentProgress || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle hidden 2xl:table-cell w-[10%]">
                                                <div className="text-slate-400 text-xs truncate" title={project.pendingChanges}>
                                                    {project.pendingChanges || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle hidden 2xl:table-cell w-[10%]">
                                                <div className="text-slate-400 text-xs truncate" title={project.finisherTimeline}>
                                                    {project.finisherTimeline || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 align-middle text-right w-[8%]">
                                                {this.canEdit() && (
                                                    <button
                                                        onClick={(e) => this.deleteProject(project.id, e)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div >
        );
    }

    renderQuotations = () => {
        const statusColors = {
            'Planned': 'bg-slate-100 text-slate-700',
            'In Progress': 'bg-blue-100 text-blue-700',
            'Sent': 'bg-emerald-100 text-emerald-700'
        };

        const typeColors = {
            'Service': 'bg-purple-100 text-purple-700',
            'Product': 'bg-blue-100 text-blue-700',
            'Consulting': 'bg-orange-100 text-orange-700',
            'Support': 'bg-teal-100 text-teal-700'
        };

        return (
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">S.No</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Approved By</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Timeline</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {this.state.quotations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414  5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <p className="text-lg font-semibold">No quotations yet</p>
                                            <p className="text-sm">Click "New Quotation" to create your first quotation</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                this.state.quotations.map((quotation, index) => (
                                    <tr key={quotation.id} onClick={() => this.openEditQuotation(quotation)} className="hover:bg-slate-50 cursor-pointer transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[quotation.type] || 'bg-slate-100 text-slate-600'}`}>
                                                {quotation.type || 'Service'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[quotation.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {quotation.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900 font-medium">{quotation.approvedBy || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700 font-medium">{quotation.timeline || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {this.canEdit() && (
                                                <button onClick={(e) => this.deleteQuotation(quotation.id, e)} className="text-slate-400 hover:text-red-500 font-medium text-sm transition">
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    renderDocuments = () => {
        const typeColors = {
            'Contract': 'bg-blue-100 text-blue-700',
            'Invoice': 'bg-emerald-100 text-emerald-700',
            'Proposal': 'bg-purple-100 text-purple-700',
            'Report': 'bg-orange-100 text-orange-700'
        };

        return (
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Document</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Uploaded By</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {this.state.documents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                            </svg>
                                            <p className="text-lg font-semibold">No documents yet</p>
                                            <p className="text-sm">Click "New Document" to add your first document</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                this.state.documents.map(document => (
                                    <tr key={document.id} onClick={() => this.openEditDocument(document)} className="hover:bg-slate-50 cursor-pointer transition">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{document.title}</div>
                                            <p className="text-xs text-slate-500 mt-1">{document.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[document.type] || 'bg-slate-100 text-slate-600'}`}>
                                                {document.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {this.state.projects.find(p => p.id === document.projectId)?.title || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{document.uploadedBy || '-'}</td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">{document.uploadedDate || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            {this.canEdit() && (
                                                <button onClick={(e) => this.deleteDocument(document.id, e)} className="text-slate-400 hover:text-red-500 font-medium text-sm transition">
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    renderProcess = () => {
        return (
            <div className="w-full h-full flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="relative inline-block mb-8">
                        <div className="w-32 h-32 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xl animate-bounce">
                            ⚡
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        Coming Soon!
                    </h2>

                    <p className="text-slate-600 text-lg mb-6">
                        The Process section is under development and will be available soon with powerful workflow automation features.
                    </p>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
                        <h3 className="font-bold text-slate-800 mb-3">What's Coming:</h3>
                        <ul className="text-left text-slate-600 space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">✓</span>
                                <span>Automated workflow templates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">✓</span>
                                <span>Process visualization and tracking</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">✓</span>
                                <span>Team collaboration tools</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">✓</span>
                                <span>Performance analytics</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
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

    canEdit = () => {
        const { userData, user } = this.props;
        const currentUser = userData || user;
        return currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'team');
    }

    render() {
        const { view, showModal, showTaskModal, newProject, newTask, loading, teamMembers, selectedProject, tasks } = this.state;
        const columns = ['Planning', 'In Progress', 'Review', 'Completed'];
        const priorities = ['Low', 'Medium', 'High', 'Urgent'];
        const filteredProjects = this.filterProjects();


        if (loading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 relative overflow-hidden">
                    {/* Animated Background Gradient */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    {/* Loader Content */}
                    <div className="text-center z-10">
                        {/* Premium Spinner - Apple Style */}
                        <div className="relative inline-flex items-center justify-center mb-8">
                            {/* Outer Ring */}
                            <div className="absolute w-24 h-24 border-4 border-slate-200 rounded-full"></div>

                            {/* Animated Ring 1 */}
                            <div className="absolute w-24 h-24 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>

                            {/* Animated Ring 2 */}
                            <div className="absolute w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>

                            {/* Animated Ring 3 */}
                            <div className="absolute w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>

                            {/* Center Orb */}
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 rounded-full animate-pulse shadow-2xl"></div>

                            {/* Glow Effect */}
                            <div className="absolute w-24 h-24 bg-gradient-to-br from-emerald-400 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                        </div>

                        {/* Loading Text */}
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                                Alphery Projects
                            </h3>
                            <p className="text-slate-600 font-medium animate-pulse" style={{ animationDelay: '0.2s' }}>
                                Loading your workspace...
                            </p>

                            {/* Animated Dots */}
                            <div className="flex justify-center gap-2 mt-4">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>

                        {/* Progress Hint */}
                        <div className="mt-8">
                            <div className="w-64 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Particles */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                        <div className="absolute bottom-1/4 left-2/3 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 font-sans overflow-hidden" style={{ position: 'relative' }}>
                {/* Header */}
                <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between px-4 py-2 gap-3">
                        {/* Left: Logo and Section Dropdown */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-2 rounded-xl shadow-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>

                            {/* Section Dropdown */}
                            <div className="relative">
                                <select
                                    value={this.state.activeSection}
                                    onChange={(e) => this.setState({ activeSection: e.target.value })}
                                    className="appearance-none bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 text-slate-800 font-bold text-base px-4 py-2 pr-9 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:border-emerald-300 transition shadow-sm"
                                >
                                    <option value="Quotations">📋 Quotations</option>
                                    <option value="Projects">🚀 Projects</option>
                                    <option value="Documents">📁 Documents</option>
                                    <option value="Process">⚙️ Process</option>
                                </select>
                                <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
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

                            {/* View Toggle - Only for Projects */}
                            {this.state.activeSection === 'Projects' && (
                                <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-semibold">
                                    {['table', 'kanban', 'list', 'analytics'].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => this.setState({ view: v })}
                                            className={`px-4 py-1.5 rounded-md transition capitalize ${view === v ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Dynamic New Button */}
                            {this.state.activeSection === 'Projects' && this.canEdit() && (
                                <button
                                    onClick={() => this.setState({
                                        showModal: true,
                                        activeProject: null,
                                        newProject: {
                                            name: '', type: 'Development', overview: '', status: 'Planning',
                                            timeline: '', tagged: [], requirements: '', modifications: '',
                                            currentProgress: '', pendingChanges: '', finisherTimeline: ''
                                        }
                                    })}
                                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-semibold transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    New Project
                                </button>
                            )}

                            {this.state.activeSection === 'Quotations' && this.canEdit() && (
                                <button
                                    onClick={() => this.setState({
                                        showQuotationModal: true,
                                        activeQuotation: null,
                                        newQuotation: {
                                            title: '', client: '', type: 'Service', status: 'Planned',
                                            approvedBy: '', timeline: '', description: ''
                                        }
                                    })}
                                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-semibold transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    New Quotation
                                </button>
                            )}

                            {this.state.activeSection === 'Documents' && this.canEdit() && (
                                <button
                                    onClick={() => this.setState({
                                        showDocumentModal: true,
                                        activeDocument: null,
                                        newDocument: {
                                            title: '', type: 'Contract', projectId: '', uploadedBy: '',
                                            uploadedDate: '', fileUrl: '', description: '', status: 'Draft'
                                        }
                                    })}
                                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-semibold transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    New Document
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters - Only for Projects */}
                {this.state.activeSection === 'Projects' && view !== 'analytics' && (
                    <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-slate-200 flex gap-4">
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
                )
                }

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {this.state.activeSection === 'Quotations' ? this.renderQuotations() :
                        this.state.activeSection === 'Documents' ? this.renderDocuments() :
                            this.state.activeSection === 'Process' ? this.renderProcess() :
                                view === 'table' ? this.renderProjectsTable() :
                                    view === 'analytics' ? this.renderAnalytics() : view === 'kanban' ? (
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
                {
                    showModal && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[90%] animate-in fade-in zoom-in duration-200">
                                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
                                    <h3 className="text-xl font-bold text-slate-800">{this.state.activeProject ? 'Edit Project' : 'Create New Project'}</h3>
                                    <button onClick={() => this.setState({ showModal: false })} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                                </div>

                                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Project Name *</label>
                                            <input name="name" value={newProject.name} onChange={this.handleInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Type</label>
                                            <select name="type" value={newProject.type} onChange={this.handleInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white">
                                                <option value="Development">Development</option>
                                                <option value="Design">Design</option>
                                                <option value="Marketing">Marketing</option>
                                                <option value="Research">Research</option>
                                                <option value="Support">Support</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Status</label>
                                            <select name="status" value={newProject.status} onChange={this.handleInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white">
                                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Timeline</label>
                                            <input name="timeline" placeholder="e.g., 3 months" value={newProject.timeline} onChange={this.handleInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Overview</label>
                                        <textarea name="overview" rows="3" value={newProject.overview} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none bg-white"></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Requirements</label>
                                        <textarea name="requirements" rows="3" value={newProject.requirements} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none bg-white"></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Modifications</label>
                                        <textarea name="modifications" rows="3" value={newProject.modifications} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none bg-white"></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Current Progress</label>
                                        <textarea name="currentProgress" rows="2" value={newProject.currentProgress} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none bg-white"></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Pending Changes</label>
                                        <textarea name="pendingChanges" rows="2" value={newProject.pendingChanges} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none bg-white"></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Finisher Timeline</label>
                                        <input name="finisherTimeline" value={newProject.finisherTimeline} onChange={this.handleInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white" />
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Tagged</label>
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
                                            {newProject.tagged && newProject.tagged.map(tag => (
                                                <span key={tag} onClick={() => this.toggleTag(tag)}
                                                    className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-purple-200 transition">
                                                    {tag} ×
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                                    <button onClick={() => this.setState({ showModal: false })} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition">
                                        Cancel
                                    </button>
                                    {this.canEdit() && (
                                        <button onClick={this.saveProject} className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg shadow-lg hover:shadow-xl font-semibold transition transform hover:scale-105 active:scale-95">
                                            {this.state.activeProject ? 'Update Project' : 'Create Project'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Quotation Modal */}
                {
                    this.state.showQuotationModal && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[90%] animate-in fade-in zoom-in duration-200">
                                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                                    <h3 className="text-xl font-bold text-slate-800">{this.state.activeQuotation ? 'Edit Quotation' : 'Create New Quotation'}</h3>
                                    <button onClick={() => this.setState({ showQuotationModal: false })} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                                </div>

                                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Quotation Title *</label>
                                            <input name="title" value={this.state.newQuotation.title} onChange={this.handleQuotationInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Client</label>
                                            <input name="client" value={this.state.newQuotation.client} onChange={this.handleQuotationInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Type</label>
                                            <select name="type" value={this.state.newQuotation.type} onChange={this.handleQuotationInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                                                <option value="Service">Service</option>
                                                <option value="Product">Product</option>
                                                <option value="Consulting">Consulting</option>
                                                <option value="Support">Support</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Status</label>
                                            <select name="status" value={this.state.newQuotation.status} onChange={this.handleQuotationInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                                                <option value="Planned">Planned</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Sent">Sent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Timeline</label>
                                            <input name="timeline" placeholder="e.g., 2 weeks" value={this.state.newQuotation.timeline} onChange={this.handleQuotationInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Approved By</label>
                                        <input name="approvedBy" placeholder="Enter approver name" value={this.state.newQuotation.approvedBy} onChange={this.handleQuotationInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Description</label>
                                        <textarea name="description" rows="3" value={this.state.newQuotation.description} onChange={this.handleQuotationInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none bg-white"></textarea>
                                    </div>
                                </div>

                                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                                    <button onClick={() => this.setState({ showQuotationModal: false })} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition">
                                        Cancel
                                    </button>
                                    {this.canEdit() && (
                                        <button onClick={this.saveQuotation} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-xl font-semibold transition transform hover:scale-105 active:scale-95">
                                            {this.state.activeQuotation ? 'Update Quotation' : 'Create Quotation'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Document Modal */}
                {
                    this.state.showDocumentModal && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[90%] animate-in fade-in zoom-in duration-200">
                                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
                                    <h3 className="text-xl font-bold text-slate-800">{this.state.activeDocument ? 'Edit Document' : 'Add New Document'}</h3>
                                    <button onClick={() => this.setState({ showDocumentModal: false })} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                                </div>

                                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Document Title *</label>
                                            <input name="title" value={this.state.newDocument.title} onChange={this.handleDocumentInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Type</label>
                                            <select name="type" value={this.state.newDocument.type} onChange={this.handleDocumentInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white">
                                                <option value="Contract">Contract</option>
                                                <option value="Invoice">Invoice</option>
                                                <option value="Proposal">Proposal</option>
                                                <option value="Report">Report</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Related Project</label>
                                            <select name="projectId" value={this.state.newDocument.projectId} onChange={this.handleDocumentInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white">
                                                <option value="">None</option>
                                                {this.state.projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Uploaded By</label>
                                            <input name="uploadedBy" value={this.state.newDocument.uploadedBy} onChange={this.handleDocumentInputChange}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">File URL</label>
                                        <input name="fileUrl" value={this.state.newDocument.fileUrl} onChange={this.handleDocumentInputChange}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition bg-white" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Description</label>
                                        <textarea name="description" rows="3" value={this.state.newDocument.description} onChange={this.handleDocumentInputChange}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition resize-none bg-white"></textarea>
                                    </div>
                                </div>

                                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                                    <button onClick={() => this.setState({ showDocumentModal: false })} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition">
                                        Cancel
                                    </button>
                                    {this.canEdit() && (
                                        <button onClick={this.saveDocument} className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg shadow-lg hover:shadow-xl font-semibold transition transform hover:scale-105 active:scale-95">
                                            {this.state.activeDocument ? 'Update Document' : 'Add Document'}
                                        </button>
                                    )}
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
