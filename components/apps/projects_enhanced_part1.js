// ALPHERY PROJECTS - ENTERPRISE EDITION
// Complete business-grade project management system

import React, { Component } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, arrayUnion } from 'firebase/firestore';

export class Projects extends Component {
    constructor() {
        super();
        this.state = {
            projects: [],
            tasks: [],
            teamMembers: [],
            comments: [],
            view: 'kanban',
            showModal: false,
            showTaskModal: false,
            showCommentModal: false,
            activeProject: null,
            activeTask: null,
            selectedProject: null,
            darkMode: localStorage.getItem('darkMode') === 'true',
            favorites: JSON.parse(localStorage.getItem('favoriteProjects') || '[]'),
            newProject: {
                title: '', client: '', status: 'Planning', priority: 'Medium',
                startDate: '', endDate: '', description: '', progress: 0,
                budget: 0, spent: 0, tags: [], assignedTo: [],
                hoursEstimated: 0, hoursLogged: 0, isFavorite: false,
                dependencies: [], files: []
            },
            newTask: {
                title: '', description: '', assignedTo: '', priority: 'Medium',
                status: 'To Do', dueDate: '', hoursEstimated: 0, dependencies: []
            },
            newComment: { text: '', mentions: [] },
            newTag: '',
            searchQuery: '',
            filterStatus: 'All',
            filterPriority: 'All',
            filterAssignee: 'All',
            showFilters: false,
            sortBy: 'updatedAt',
            loading: true,
            timerActive: false,
            timerTaskId: null,
            timerStart: null,
            timerElapsed: 0
        };
        this.unsubscribeProjects = null;
        this.unsubscribeTasks = null;
        this.timerInterval = null;
    }

    componentDidMount() {
        this.subscribeToProjects();
        this.subscribeToTasks();
        this.loadTeamMembers();
        this.setupKeyboardShortcuts();

        // Restore timer if was running
        const savedTimer = localStorage.getItem('activeTimer');
        if (savedTimer) {
            const timer = JSON.parse(savedTimer);
            this.setState({
                timerActive: true,
                timerTaskId: timer.taskId,
                timerStart: timer.start,
                timerElapsed: Date.now() - timer.start
            }, this.startTimer);
        }
    }

    componentWillUnmount() {
        if (this.unsubscribeProjects) this.unsubscribeProjects();
        if (this.unsubscribeTasks) this.unsubscribeTasks();
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.removeKeyboardShortcuts();
    }

    // ============ KEYBOARD SHORTCUTS ============
    setupKeyboardShortcuts = () => {
        document.addEventListener('keydown', this.handleKeyPress);
    }

    removeKeyboardShortcuts = () => {
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    handleKeyPress = (e) => {
        // Cmd/Ctrl shortcuts
        if (e.metaKey || e.ctrlKey) {
            switch (e.key) {
                case 'n': // Create new project
                    e.preventDefault();
                    this.setState({ showModal: true, activeProject: null });
                    break;
                case 'k': // Search
                    e.preventDefault();
                    document.querySelector('input[placeholder*="Search"]')?.focus();
                    break;
                case 'd': // Toggle dark mode
                    e.preventDefault();
                    this.toggleDarkMode();
                    break;
                case 'e': // Export to Excel
                    e.preventDefault();
                    this.exportToExcel();
                    break;
                default:
                    break;
            }
        }

        // View shortcuts (no modifier)
        if (!e.metaKey && !e.ctrlKey && !e.target.matches('input, textarea')) {
            switch (e.key) {
                case '1':
                    this.setState({ view: 'kanban' });
                    break;
                case '2':
                    this.setState({ view: 'list' });
                    break;
                case '3':
                    this.setState({ view: 'analytics' });
                    break;
                default:
                    break;
            }
        }
    }

    // ============ DARK MODE ============
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

    // ============ FAVORITES ============
    toggleFavorite = (projectId, e) => {
        if (e) e.stopPropagation();
        const favorites = this.state.favorites.includes(projectId)
            ? this.state.favorites.filter(id => id !== projectId)
            : [...this.state.favorites, projectId];

        this.setState({ favorites });
        localStorage.setItem('favoriteProjects', JSON.stringify(favorites));
    }

    // ============ EXPORT TO EXCEL ============
    exportToExcel = () => {
        const data = this.filterProjects().map(p => ({
            'Project': p.title,
            'Client': p.client || '',
            'Status': p.status,
            'Priority': p.priority,
            'Progress': `${p.progress || 0}%`,
            'Budget': `$${p.budget || 0}`,
            'Spent': `$${p.spent || 0}`,
            'Start Date': p.startDate,
            'End Date': p.endDate,
            'Hours Estimated': p.hoursEstimated || 0,
            'Hours Logged': p.hoursLogged || 0,
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

    // ============ TIME TRACKING ============
    startTimer = () => {
        if (!this.state.timerTaskId) return;

        this.timerInterval = setInterval(() => {
            this.setState(prev => ({
                timerElapsed: Date.now() - prev.timerStart
            }));
        }, 1000);

        // Save to localStorage
        localStorage.setItem('activeTimer', JSON.stringify({
            taskId: this.state.timerTaskId,
            start: this.state.timerStart
        }));
    }

    toggleTimer = (taskId) => {
        if (this.state.timerActive && this.state.timerTaskId === taskId) {
            // Stop timer
            this.stopTimer();
        } else {
            // Start new timer
            this.setState({
                timerActive: true,
                timerTaskId: taskId,
                timerStart: Date.now(),
                timerElapsed: 0
            }, this.startTimer);
        }
    }

    stopTimer = async () => {
        if (this.timerInterval) clearInterval(this.timerInterval);

        // Log the time
        const hours = this.state.timerElapsed / (1000 * 60 * 60);
        const task = this.state.tasks.find(t => t.id === this.state.timerTaskId);

        if (task && task.projectId) {
            const project = this.state.projects.find(p => p.id === task.projectId);
            if (project) {
                await updateDoc(doc(db, 'projects', project.id), {
                    hoursLogged: (project.hoursLogged || 0) + hours
                });
            }
        }

        this.setState({
            timerActive: false,
            timerTaskId: null,
            timerStart: null,
            timerElapsed: 0
        });
        localStorage.removeItem('activeTimer');
    }

    formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }

    // ============ COMMENTS SYSTEM ============
    addComment = async (projectId, text) => {
        if (!text.trim()) return;

        try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                comments: arrayUnion({
                    id: Date.now().toString(),
                    text,
                    author: 'Current User', // Replace with actual user
                    timestamp: Date.now(),
                    mentions: this.extractMentions(text)
                })
            });
            this.setState({ newComment: { text: '', mentions: [] }, showCommentModal: false });
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    }

    extractMentions = (text) => {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[1]);
        }
        return mentions;
    }

    // ============ FIREBASE SUBSCRIPTIONS ============
    subscribeToProjects = () => {
        if (!db) {
            this.setState({ loading: false });
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
        if (!db) return;

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
            this.setState({ teamMembers: [] });
            return;
        }

        const usersRef = collection(db, 'users');
        onSnapshot(usersRef, (snapshot) => {
            const teamMembers = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(user => user.approvalStatus === 'approved')
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
            this.setState({ teamMembers: [] });
        });
    }

    // ============ PROJECT CRUD ============
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
            alert('Firebase not configured');
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
                    files: [],
                    activity: [{
                        type: 'created',
                        timestamp: Date.now(),
                        user: 'Current User'
                    }]
                });
            }

            this.setState({
                showModal: false,
                activeProject: null,
                newProject: {
                    title: '', client: '', status: 'Planning', priority: 'Medium',
                    startDate: '', endDate: '', description: '', progress: 0,
                    budget: 0, spent: 0, tags: [], assignedTo: [],
                    hoursEstimated: 0, hoursLogged: 0, dependencies: [], files: []
                }
            });
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to save project. Please try again.');
        }
    }

    saveTask = async () => {
        if (!db) {
            alert('Firebase not configured');
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
                completed: false,
                timeEntries: []
            });

            this.setState({
                showTaskModal: false,
                newTask: {
                    title: '', description: '', assignedTo: '', priority: 'Medium',
                    status: 'To Do', dueDate: '', hoursEstimated: 0, dependencies: []
                }
            });
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task.');
        }
    }

    openEdit = (project) => {
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
            hoursLogged: project.hoursLogged || 0,
            dependencies: Array.isArray(project.dependencies) ? project.dependencies : [],
            files: Array.isArray(project.files) ? project.files : []
        };

        this.setState({
            activeProject: project,
            newProject: safeProject,
            showModal: true
        });
    }

    deleteProject = async (id, e) => {
        if (!db) return;

        e.stopPropagation();
        if (!window.confirm("Delete this project and all its tasks?")) return;

        try {
            await deleteDoc(doc(db, 'projects', id));
            const projectTasks = this.state.tasks.filter(t => t.projectId === id);
            for (const task of projectTasks) {
                await deleteDoc(doc(db, 'tasks', task.id));
            }
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    }

    // ============ ANALYTICS ============
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
            overdue: projects.filter(p => p.endDate && new Date(p.endDate) < new Date()).length
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

        if (this.state.filterAssignee !== 'All') {
            filtered = filtered.filter(p => p.assignedTo?.includes(this.state.filterAssignee));
        }

        // Sort
        filtered.sort((a, b) => {
            switch (this.state.sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'priority':
                    const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                case 'progress':
                    return (b.progress || 0) - (a.progress || 0);
                default:
                    return 0;
            }
        });

        return filtered;
    }

// Continue in next message due to length...
// This is Part 1 of the enhanced Projects component
