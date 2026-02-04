import React, { Component } from 'react';
import { io } from 'socket.io-client';
import FocusMode from './crm/FocusMode';

// REMOVED DEFAULT API_BASE_URL to prefer State Logic
// const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default class CRM extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // Navigation
            activeView: 'focus', // Default to Focus Mode for impact

            // Data
            opportunities: [],
            contacts: [],
            activities: [],
            quotes: [],

            // UI State
            selectedOpportunity: null,
            selectedContact: null,
            selectedActivity: null,
            showModal: null, // 'create-opp', 'details-opp', 'edit-opp', 'create-quote', 'create-activity', 'activity-details', 'app-builder'
            filterStage: 'all',
            searchQuery: '',
            noteInput: '', // For creating new notes
            newModuleName: '', // For Entity Builder

            // Dashboard Stats
            stats: {
                totalRevenue: 0,
                wonDeals: 0,
                activeOpportunities: 0,
                activitiesThisWeek: 0
            }
        };

        this.socket = null;
        this.state = {
            ...this.state,
            isAuthenticated: true, // Forcing true for now to show the design, user can still logout
            authToken: 'demo',
            backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://alphery-os-backend.onrender.com',
            authError: null,
            isLoading: false
        };
    }

    componentDidMount() {
        const storedToken = localStorage.getItem('crm_auth_token');
        let storedUrl = localStorage.getItem('crm_backend_url');

        // Force production URL if stored URL is localhost or missing
        if (!storedUrl || storedUrl.includes('localhost')) {
            storedUrl = 'https://alphery-os-backend.onrender.com';
            localStorage.setItem('crm_backend_url', storedUrl);
        }

        this.setState({ backendUrl: storedUrl });

        const tokenToUse = storedToken || this.state.authToken;
        if (tokenToUse) {
            this.setState({ isAuthenticated: true, authToken: tokenToUse }, () => {
                this.connectSocket();
                this.fetchAllData();
            });
        }
    }

    componentWillUnmount() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    connectSocket = () => {
        const { backendUrl, authToken } = this.state;
        if (!backendUrl || !authToken) return;
        if (this.socket && this.socket.connected) return;

        this.socket = io(backendUrl, {
            extraHeaders: {
                Authorization: `Bearer ${authToken}`
            },
            transports: ['websocket', 'polling'] // Force try both
        });
        this.socket.on('connect', () => {
            console.log('🔥 CRM connected to backend');
            this.socket.emit('join-tenant', 'default-tenant');
        });

        // Realtime listeners
        this.socket.on('client:created', (opportunity) => {
            this.setState(prev => ({
                opportunities: [...prev.opportunities, opportunity]
            }));
        });

        this.socket.on('client:updated', (updated) => {
            this.setState(prev => ({
                opportunities: prev.opportunities.map(opp =>
                    opp.id === updated.id ? updated : opp
                )
            }));
        });

        this.socket.on('client:deleted', (id) => {
            this.setState(prev => ({
                opportunities: prev.opportunities.filter(opp => opp.id !== id)
            }));
        });
    };

    fetchAllData = async () => {
        const { backendUrl, authToken } = this.state;
        if (!backendUrl || !authToken) return;

        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };

        try {
            const [opportunities, quotes, activities] = await Promise.all([
                fetch(`${backendUrl}/clients`, { headers }).then(r => {
                    if (r.status === 401) throw new Error('Unauthorized');
                    return r.ok ? r.json() : [];
                }).catch(() => []),
                fetch(`${backendUrl}/quotations`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${backendUrl}/activities`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
            ]);

            const stats = this.calculateStats(opportunities);

            // Sanitize opportunities
            const sanitizedOpportunities = (opportunities || []).map(o => ({
                ...o,
                status: o.status || 'New',
                priority: o.priority || 'Medium',
                value: o.value || 0
            }));

            this.setState({
                opportunities: sanitizedOpportunities,
                quotes: quotes || [],
                activities: activities || [],
                stats
            });
        } catch (error) {
            console.error('Error fetching CRM data:', error);
        }
    };

    calculateStats = (opportunities) => {
        if (!opportunities || opportunities.length === 0) return {
            totalRevenue: 0,
            wonDeals: 0,
            activeOpportunities: 0,
            activitiesThisWeek: 0
        };

        const { activities } = this.state;
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

        return {
            totalRevenue: opportunities
                .filter(o => o.status === 'Won')
                .reduce((sum, o) => sum + (o.value || 0), 0),
            wonDeals: opportunities.filter(o => o.status === 'Won').length,
            activeOpportunities: opportunities.filter(o =>
                o.status !== 'Won' && o.status !== 'Lost'
            ).length,
            activitiesThisWeek: (activities || []).filter(a => new Date(a.createdAt) >= startOfWeek).length
        };
    };

    createOpportunity = async (data) => {
        const { backendUrl, authToken } = this.state;
        try {
            const response = await fetch(`${backendUrl}/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    ...data,
                    tenantId: 'default-tenant'
                })
            });
            const newOpp = await response.json();
            this.setState({ showModal: null });
            this.fetchAllData();
        } catch (error) {
            console.error('Error creating opportunity:', error);
        }
    };

    updateOpportunity = async (id, updates) => {
        const { backendUrl, authToken } = this.state;
        try {
            await fetch(`${backendUrl}/clients/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(updates)
            });
            this.fetchAllData();
        } catch (error) {
            console.error('Error updating opportunity:', error);
        }
    };

    deleteOpportunity = async (id) => {
        const { backendUrl, authToken } = this.state;
        try {
            await fetch(`${backendUrl}/clients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        } catch (error) {
            console.error('Error deleting opportunity:', error);
        }
    };

    createQuote = async (data) => {
        const { backendUrl, authToken } = this.state;
        try {
            const response = await fetch(`${backendUrl}/quotations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });
            const newQuote = await response.json();
            this.setState({ showModal: null });
            this.fetchAllData();
        } catch (error) {
            console.error('Error creating quote:', error);
        }
    };

    // --- ACTIVITIES MANAGEMENT ---
    // --- ACTIVITIES MANAGEMENT (REAL API) ---
    createActivity = async (data) => {
        const { backendUrl, authToken } = this.state;
        try {
            const response = await fetch(`${backendUrl}/activities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });
            const newActivity = await response.json();
            this.setState({
                activities: [...this.state.activities, newActivity],
                showModal: null
            });
        } catch (error) {
            console.error('Error creating activity:', error);
        }
    };

    updateActivity = async (id, data) => {
        const { backendUrl, authToken } = this.state;
        try {
            const response = await fetch(`${backendUrl}/activities/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });
            const updated = await response.json();
            this.setState(prevState => ({
                activities: prevState.activities.map(a => a.id === id ? updated : a)
            }));
        } catch (error) {
            console.error('Error updating activity:', error);
            // Optimistic rollback could go here
        }
    };

    deleteActivity = async (id) => {
        const { backendUrl, authToken } = this.state;
        try {
            await fetch(`${backendUrl}/activities/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            this.setState(prevState => ({
                activities: prevState.activities.filter(a => a.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting activity:', error);
        }
    };

    handleCreateNote = async () => {
        const { noteInput, selectedOpportunity } = this.state;
        if (!noteInput.trim() || !selectedOpportunity) return;

        await this.createActivity({
            title: 'Note',
            type: 'Note',
            notes: noteInput,
            clientId: selectedOpportunity.id,
            status: 'Completed',
            dueDate: new Date().toISOString()
        });
        this.setState({ noteInput: '' });
    };

    completeActivity = (id) => {
        this.updateActivity(id, { status: 'Completed', completedAt: new Date().toISOString() });
    };

    deployNewModule = async () => {
        const { newModuleName } = this.state;
        if (!newModuleName.trim()) return alert('Please enter a module name');

        try {
            // Simulate API call for now or call real endpoint if ready
            // const response = await fetch(`${API_BASE_URL}/api/entity/schema`, { ... });

            // For UI feedback immediately:
            const newModule = {
                name: newModuleName,
                icon: '🚀',
                description: 'Custom Module',
                active: true
            };

            // In a real app, this would refresh the list from backend
            alert(`🚀 Module "${newModuleName}" deployed successfully! Database schema generated.`);
            this.setState({ showModal: null, newModuleName: '' });
        } catch (error) {
            console.error('Error deploying module:', error);
            alert('Failed to deploy module');
        }
    };

    handleLogin = async (e) => {
        e.preventDefault();
        const { backendUrl } = this.state;
        // Basic validation
        if (!backendUrl) return;

        // Save URL preference
        localStorage.setItem('crm_backend_url', backendUrl);

        this.setState({ isLoading: true, authError: null });

        try {
            // Check if backend is reachable
            // const res = await fetch(`${backendUrl}/api/health`).catch(() => null);

            // Allow bypassing auth for DEMO purposes if the user types 'demo' as token
            const tokenInput = document.getElementById('api-token-input')?.value;

            if (tokenInput) {
                this.setState({
                    isAuthenticated: true,
                    authToken: tokenInput,
                    isLoading: false
                }, () => {
                    localStorage.setItem('crm_auth_token', tokenInput);
                    this.connectSocket();
                    this.fetchAllData();
                });
            } else {
                // If no token, maybe we can try to hit a login endpoint if one existed
                // const res = await fetch(`${backendUrl}/auth/login`, ...);
                throw new Error("Please enter a valid Access Token.");
            }
        } catch (err) {
            this.setState({
                authError: 'Connection Failed: ' + err.message,
                isLoading: false
            });
        }
    };

    renderLoginScreen() {
        const { backendUrl, authError, isLoading } = this.state;
        return (
            <div className="login-container">
                <div className="login-box">
                    <div className="login-logo">
                        <span className="logo-icon">💼</span>
                        <span className="logo-text">CRM Pro</span>
                    </div>
                    <p className="login-desc">Connect to your Enterprise ERP Backend</p>

                    {authError && <div className="error-banner">{authError}</div>}

                    <form onSubmit={this.handleLogin}>
                        <div className="form-group">
                            <label>Backend Server URL</label>
                            <input
                                type="text"
                                className="glass-input"
                                value={backendUrl}
                                onChange={(e) => this.setState({ backendUrl: e.target.value })}
                                placeholder="https://api.example.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Access Token (JWT)</label>
                            <input
                                id="api-token-input"
                                type="text"
                                className="glass-input"
                                placeholder="Paste your JWT Token here..."
                            />
                            <p className="help-text">Use the token from your backend login response.</p>
                        </div>
                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? 'Connecting...' : 'Connect System'}
                        </button>
                    </form>
                </div>
                <style jsx>{`
                    .login-container {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: radial-gradient(circle at center, #eef2ff 0%, #e0e7ff 100%);
                    }
                    .login-box {
                        background: white;
                        padding: 40px;
                        border-radius: 24px;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        width: 420px;
                        text-align: center;
                    }
                    .login-logo {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        margin-bottom: 12px;
                    }
                    .logo-icon { font-size: 40px; }
                    .logo-text { 
                        font-size: 28px; 
                        font-weight: 800; 
                        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    .login-desc { color: #6b7280; margin-bottom: 32px; font-size: 14px; }
                    
                    .form-group { text-align: left; margin-bottom: 20px; }
                    .form-group label { display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; }
                    .help-text { font-size: 11px; color: #9ca3af; margin-top: 6px; }
                    
                    .glass-input {
                        width: 100%;
                        padding: 12px 16px;
                        border-radius: 12px;
                        border: 2px solid #e5e7eb;
                        font-size: 14px;
                        transition: all 0.2s;
                        background: #f9fafb;
                        color: #1f2937;
                    }
                    .glass-input:focus {
                        border-color: #6366f1;
                        background: white;
                        outline: none;
                    }
                    
                    .login-btn {
                        width: 100%;
                        padding: 14px;
                        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: transform 0.2s;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    }
                    .login-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
                    }
                    .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                    .error-banner {
                        background: #fee2e2;
                        color: #991b1b;
                        padding: 12px;
                        border-radius: 8px;
                        font-size: 13px;
                        margin-bottom: 24px;
                        border: 1px solid #fecaca;
                    }
                `}</style>
            </div>
        );
    }

    render() {
        const { activeView, isAuthenticated } = this.state;

        if (!isAuthenticated) {
            return this.renderLoginScreen();
        }

        return (
            <div className="crm-container">
                {this.renderSidebar()}
                <div className="crm-main">
                    {this.renderTopBar()}
                    <div className="crm-content">
                        {activeView === 'focus' && (
                            <FocusMode
                                activities={this.state.activities}
                                opportunities={this.state.opportunities}
                                onCompleteActivity={this.completeActivity}
                            />
                        )}
                        {activeView === 'dashboard' && this.renderDashboard()}
                        {activeView === 'pipeline' && this.renderPipeline()}
                        {activeView === 'contacts' && this.renderContacts()}
                        {activeView === 'activities' && this.renderActivities()}
                        {activeView === 'quotes' && this.renderQuotes()}
                        {activeView === 'settings' && this.renderSettings()}
                        {activeView === 'reports' && this.renderReports()}
                    </div>
                </div>
                {this.renderModals()}
                <style jsx>{`
                    .crm-container {
                        display: flex;
                        height: 100%;
                        background: #f5f7fa;
                        background: radial-gradient(circle at top right, #eef2ff 0%, #f5f7fa 40%, #fff 100%);
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }

                    .crm-main {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    .crm-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 24px;
                    }

                    /* --- SHARED MODAL STYLES --- */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        backdrop-filter: blur(4px);
                        animation: fadeIn 0.2s;
                    }

                    .modal-content {
                        background: white;
                        border-radius: 16px;
                        padding: 32px;
                        max-width: 600px;
                        width: 90%;
                        max-height: 90vh;
                        overflow-y: auto;
                        animation: slideUp 0.3s;
                    }

                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 24px;
                    }

                    .modal-header h2 {
                        font-size: 24px;
                        font-weight: 700;
                        color: #1f2937;
                    }

                    .modal-header button {
                        width: 32px;
                        height: 32px;
                        border: none;
                        background: #f3f4f6;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 18px;
                        transition: all 0.2s;
                    }

                    .modal-header button:hover {
                        background: #e5e7eb;
                    }

                    .form-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 24px;
                    }

                    .form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .form-group label {
                        font-size: 13px;
                        font-weight: 600;
                        color: #374151;
                    }

                    .form-group input,
                    .form-group select,
                    .form-group textarea {
                        padding: 10px 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                        background: #ffffff !important;
                        color: #1f2937 !important;
                        transition: all 0.2s;
                    }

                    .form-group input::placeholder,
                    .form-group textarea::placeholder {
                        color: #9ca3af !important;
                    }

                    .form-group select option {
                        color: #111827;
                        background: white;
                    }

                    .form-group input:focus,
                    .form-group select:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: #8b5cf6;
                        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                    }

                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                    }

                    .btn-secondary {
                        padding: 10px 20px;
                        background: #f3f4f6;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                        color: #374151;
                        transition: all 0.2s;
                    }

                    .btn-secondary:hover {
                        background: #e5e7eb;
                        color: #1f2937;
                    }
                `}</style>
            </div>
        );
    }

    renderSidebar() {
        const { activeView } = this.state;

        const mainMenu = [
            { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
            { id: 'contacts', label: 'Clients', icon: 'users' },
            { id: 'pipeline', label: 'Orders', icon: 'shopping-bag' },
            { id: 'quotes', label: 'Billing', icon: 'file-text' },
            { id: 'reports', label: 'Reports', icon: 'bar-chart' },
            { id: 'utilities', label: 'Utilities', icon: 'tool' },
            { id: 'addons', label: 'Addons', icon: 'plus-square', badge: 'New' },
            { id: 'settings', label: 'Settings', icon: 'settings' },
            { id: 'support', label: 'Support', icon: 'headphones' },
        ];

        const secondaryMenu = [
            { id: 'library', label: 'Library Product', icon: 'box' },
            { id: 'invoices', label: 'Invoices', icon: 'file-plus' },
            { id: 'automation', label: 'Automation', icon: 'cpu' },
        ];

        return (
            <aside className="crm-sidebar">
                <div className="sidebar-header">
                    <div className="user-profile">
                        <div className="avatar-container">
                            <img src="./themes/Yaru/system/user-home.png" alt="User" className="avatar" />
                        </div>
                        <div className="user-info">
                            <h3 className="brand-name">HostoGo Tech</h3>
                            <p className="user-name">Muhammd Salim</p>
                        </div>
                    </div>
                </div>

                <div className="sidebar-section">
                    <div className="section-label">Main Menu</div>
                    <nav className="sidebar-nav">
                        {mainMenu.map(item => (
                            <button
                                key={item.id}
                                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                                onClick={() => this.setState({ activeView: item.id })}
                            >
                                <span className="nav-icon-wrapper">
                                    <i className={`fe fe-${item.icon}`}></i>
                                </span>
                                <span className="nav-label">{item.label}</span>
                                {item.badge && <span className="nav-badge">{item.badge}</span>}
                                {item.notification && <span className="nav-notif">{item.notification}</span>}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="sidebar-section secondary">
                    <nav className="sidebar-nav">
                        {secondaryMenu.map(item => (
                            <button
                                key={item.id}
                                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                                onClick={() => this.setState({ activeView: item.id })}
                            >
                                <span className="nav-icon-wrapper">
                                    <i className={`fe fe-${item.icon}`}></i>
                                </span>
                                <span className="nav-label">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <style jsx>{`
                .crm-sidebar {
                    width: 280px;
                    background: #ffffff;
                    border-right: 1px solid #f0f0f0;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    z-index: 100;
                    overflow-y: auto;
                    transition: all 0.3s ease;
                }

                .sidebar-header {
                    padding: 32px 24px;
                    margin-bottom: 8px;
                }

                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .avatar-container {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #eef2ff;
                }

                .avatar {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                }

                .brand-name {
                    font-size: 15px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                    letter-spacing: -0.2px;
                }

                .user-name {
                    font-size: 12px;
                    color: #94a3b8;
                    margin: 0;
                    font-weight: 500;
                }

                .sidebar-section {
                    padding: 0 16px;
                    margin-bottom: 24px;
                }

                .sidebar-section.secondary {
                    margin-top: auto;
                    border-top: 1px solid #f8fafc;
                    padding-top: 24px;
                    margin-bottom: 24px;
                }

                .section-label {
                    padding: 0 16px 12px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .nav-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    border-radius: 12px;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 14px;
                    font-weight: 600;
                    text-align: left;
                    position: relative;
                }

                .nav-item:hover {
                    background: #f8fafc;
                    color: #0f172a;
                }

                .nav-item.active {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                .nav-item.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 15%;
                    height: 70%;
                    width: 3px;
                    background: #2563eb;
                    border-radius: 0 4px 4px 0;
                }

                .nav-icon-wrapper {
                    font-size: 18px;
                    width: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .nav-badge {
                    margin-left: auto;
                    padding: 2px 8px;
                    background: #dcfce7;
                    color: #16a34a;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                }

                .nav-notif {
                    margin-left: auto;
                    width: 20px;
                    height: 20px;
                    background: #f97316;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 700;
                }
                .nav-icon {
                    font-size: 20px;
                }
            `}</style>
            </aside>
        );
    }

    renderTopBar() {
        const { searchQuery, activeView } = this.state;

        // Dynamic title based on view
        const getTitle = () => {
            switch (activeView) {
                case 'dashboard': return 'Support / Support Overview';
                case 'contacts': return 'Management / Clients';
                case 'pipeline': return 'Sales / Orders';
                case 'quotes': return 'Accounting / Billing';
                default: return 'Management / CRM Pro';
            }
        };

        return (
            <header className="crm-topbar">
                <div className="topbar-left">
                    <button className="btn-icon collapse-btn">
                        <i className="fe fe-menu"></i>
                    </button>
                    <div className="breadcrumb">
                        {getTitle()}
                    </div>
                </div>

                <div className="topbar-right">
                    <div className="topbar-search">
                        <i className="fe fe-search search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search something..."
                            value={searchQuery}
                            onChange={(e) => this.setState({ searchQuery: e.target.value })}
                        />
                    </div>

                    <div className="action-buttons">
                        <button className="btn-icon">
                            <i className="fe fe-bell"></i>
                            <span className="btn-badge"></span>
                        </button>
                        <button className="btn-icon">
                            <i className="fe fe-message-square"></i>
                        </button>

                        <div className="user-dropdown">
                            <img src="./themes/Yaru/system/user-home.png" alt="User" className="top-avatar" />
                            <span className="user-name">Kristin KR</span>
                            <i className="fe fe-chevron-down"></i>
                        </div>

                        <button
                            className="btn-add-new"
                            onClick={() => this.setState({ showModal: 'create-opp' })}
                        >
                            <i className="fe fe-plus"></i>
                            Add New
                        </button>
                    </div>
                </div>

                <style jsx>{`
                .crm-topbar {
                    height: 80px;
                    background: #ffffff;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 32px;
                    z-index: 50;
                    position: sticky;
                    top: 0;
                }

                .topbar-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .breadcrumb {
                    font-size: 14px;
                    font-weight: 600;
                    color: #94a3b8;
                }

                .topbar-right {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                }

                .topbar-search {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 10px 16px;
                    width: 300px;
                }

                .search-icon {
                    color: #94a3b8;
                    font-size: 16px;
                }

                .topbar-search input {
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 13px;
                    color: #0f172a;
                    width: 100%;
                }

                .action-buttons {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .btn-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 10px;
                    color: #64748b;
                    cursor: pointer;
                    position: relative;
                    font-size: 18px;
                    transition: all 0.2s;
                }

                .btn-icon:hover {
                    background: #f8fafc;
                    color: #0f172a;
                }

                .btn-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    border: 2px solid #fff;
                }

                .user-dropdown {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 6px 12px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .user-dropdown:hover {
                    background: #f8fafc;
                }

                .top-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: #f1f5f9;
                }

                .user-dropdown .user-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #0f172a;
                }

                .user-dropdown .fe-chevron-down {
                    font-size: 12px;
                    color: #94a3b8;
                }

                .btn-add-new {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: #0f172a;
                    color: #ffffff;
                    border: none;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-add-new:hover {
                    background: #1e293b;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
                }
            `}</style>
            </header>
        );
    }

    renderDashboard() {
        const { stats } = this.state;

        const statCards = [
            { label: 'All tickets', value: stats.activeOpportunities, icon: 'layers', color: '#2563eb' },
            { label: 'Client replies', value: stats.wonDeals, icon: 'message-circle', color: '#8b5cf6' },
            { label: 'Staff replies', value: stats.activitiesThisWeek, icon: 'corner-down-right', color: '#10b981' },
            { label: 'Tickets without reply', value: stats.activitiesThisWeek, icon: 'alert-circle', color: '#f59e0b' }
        ];

        return (
            <div className="dashboard">
                <div className="stats-header-grid">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className="modern-stat-card">
                            <div className="stat-info">
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value.toLocaleString()}</span>
                            </div>
                            <div className="stat-icon-circle" style={{ color: stat.color }}>
                                <i className={`fe fe-${stat.icon}`}></i>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dashboard-main-grid">
                    <div className="analytics-card spline-container">
                        <div className="card-top">
                            <div className="card-info">
                                <span className="card-label">Ticket reply time</span>
                                <span className="card-main-val">1,679</span>
                            </div>
                            <div className="chart-legend">
                                <span className="legend-item"><span className="dot" style={{ background: '#10b981' }}></span> High</span>
                                <span className="legend-item"><span className="dot" style={{ background: '#2563eb' }}></span> Medium</span>
                            </div>
                        </div>
                        <div className="chart-wrapper">
                            {this.renderSplineChart()}
                        </div>
                    </div>

                    <div className="analytics-card status-container">
                        <div className="card-top">
                            <div className="card-info">
                                <span className="card-label">Ticket priority</span>
                            </div>
                        </div>
                        <div className="donut-wrapper">
                            {this.renderDonutChart()}
                            <div className="donut-stats">
                                <span className="total-val">{(this.state.opportunities || []).length}</span>
                                <span className="total-label">Total active tickets</span>
                            </div>
                        </div>
                        <div className="donut-legend">
                            <div className="legend-col">
                                <span className="legend-item"><span className="dot" style={{ background: '#ef4444' }}></span> High ({(this.state.opportunities || []).filter(o => o.priority === 'High').length})</span>
                                <span className="legend-item"><span className="dot" style={{ background: '#f59e0b' }}></span> Medium ({(this.state.opportunities || []).filter(o => o.priority === 'Medium').length})</span>
                            </div>
                            <div className="legend-col">
                                <span className="legend-item"><span className="dot" style={{ background: '#10b981' }}></span> Low ({(this.state.opportunities || []).filter(o => o.priority === 'Low').length})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-bottom-grid">
                    <div className="analytics-card bar-container">
                        <div className="card-header-flex">
                            <span className="card-label">Average tickets created</span>
                            <button className="btn-full-view">Full View <i className="fe fe-arrow-up-right"></i></button>
                        </div>
                        <div className="bar-chart-stats">
                            <div className="bar-stat-item">
                                <span className="dot green"></span>
                                <div className="bar-stat-info">
                                    <span className="bs-label">Avg. Ticket Solved</span>
                                    <span className="bs-val">1,654</span>
                                </div>
                            </div>
                            <div className="bar-stat-item">
                                <span className="dot light-blue"></span>
                                <div className="bar-stat-info">
                                    <span className="bs-label">Avg. Ticket Created</span>
                                    <span className="bs-val">4,567</span>
                                </div>
                            </div>
                        </div>
                        <div className="bar-chart-wrapper">
                            {this.renderBarChart()}
                        </div>
                    </div>

                    <div className="analytics-card list-container">
                        <div className="card-header-flex">
                            <span className="card-label">Recent tickets</span>
                            <button className="btn-full-view">View all <i className="fe fe-arrow-up-right"></i></button>
                        </div>
                        <div className="tickets-mini-list">
                            {this.renderRecentTickets()}
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .dashboard {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                        padding-bottom: 40px;
                        animation: fadeIn 0.4s ease;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .stats-header-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 20px;
                    }

                    .modern-stat-card {
                        background: #ffffff;
                        border-radius: 20px;
                        padding: 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border: 1px solid #f0f0f0;
                        transition: all 0.3s;
                    }

                    .modern-stat-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(0,0,0,0.03);
                        border-color: #e2e8f0;
                    }

                    .stat-info { display: flex; flex-direction: column; gap: 8px; }
                    .stat-label { font-size: 13px; font-weight: 600; color: #64748b; }
                    .stat-value { font-size: 24px; font-weight: 800; color: #0f172a; }

                    .stat-icon-circle {
                        width: 44px; height: 44px;
                        background: #f8fafc;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                    }

                    .dashboard-main-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr;
                        gap: 24px;
                    }

                    .dashboard-bottom-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 24px;
                    }

                    .analytics-card {
                        background: #ffffff;
                        border-radius: 24px;
                        padding: 28px;
                        border: 1px solid #f0f0f0;
                    }

                    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                    .card-info { display: flex; flex-direction: column; gap: 4px; }
                    .card-label { font-size: 14px; font-weight: 700; color: #0f172a; }
                    .card-main-val { font-size: 28px; font-weight: 800; color: #0f172a; }

                    .chart-legend { display: flex; gap: 16px; }
                    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #64748b; }
                    .dot { width: 8px; height: 8px; border-radius: 50%; }
                    .dot.blue { background: #2563eb; }
                    .dot.orange { background: #f97316; }
                    .dot.purple { background: #8b5cf6; }
                    .dot.pink { background: #ec4899; }
                    .dot.green { background: #10b981; }
                    .dot.light-blue { background: #bae6fd; }

                    .chart-wrapper { width: 100%; height: 200px; }

                    .donut-wrapper {
                        position: relative;
                        width: 200px; height: 200px;
                        margin: 0 auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .donut-stats {
                        position: absolute;
                        top: 50%; left: 50%;
                        transform: translate(-50%, -50%);
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                    }

                    .total-val { font-size: 22px; font-weight: 800; color: #0f172a; }
                    .total-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; width: 80px; }

                    .donut-legend {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                        margin-top: 24px;
                    }
                    .legend-col { display: flex; flex-direction: column; gap: 8px; }

                    .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                    .btn-full-view {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        padding: 6px 14px;
                        border-radius: 10px;
                        font-size: 12px;
                        font-weight: 700;
                        color: #0f172a;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .bar-chart-stats { display: flex; gap: 32px; margin-bottom: 24px; }
                    .bar-stat-item { display: flex; align-items: flex-start; gap: 10px; }
                    .bar-stat-info { display: flex; flex-direction: column; }
                    .bs-label { font-size: 11px; font-weight: 600; color: #94a3b8; }
                    .bs-val { font-size: 18px; font-weight: 800; color: #0f172a; }

                    .bar-chart-wrapper { height: 180px; width: 100%; }

                    .tickets-mini-list { display: flex; flex-direction: column; gap: 16px; }
                `}</style>
            </div>
        );
    }

    renderSplineChart() {
        const { opportunities } = this.state;
        const total = opportunities.length || 1;
        const won = opportunities.filter(o => o.status === 'Won').length;
        const lost = opportunities.filter(o => o.status === 'Lost').length;

        // Simple dynamic spline based on ratios
        const wonRatio = (won / total) * 150;
        const lostRatio = (lost / total) * 150;

        return (
            <svg viewBox="0 0 800 200" className="spline-svg">
                <defs>
                    <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 0 }} />
                    </linearGradient>
                    <linearGradient id="gradGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="800" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#f1f5f9" strokeWidth="1" />

                <path d={`M0,180 Q200,${180 - wonRatio} 400,${150 - wonRatio} T800,${100 - wonRatio} L800,200 L0,200 Z`} fill="url(#gradBlue)" />
                <path d={`M0,160 Q200,${160 - lostRatio} 400,${130 - lostRatio} T800,${80 - lostRatio} L800,200 L0,200 Z`} fill="url(#gradGreen)" />

                <path d={`M0,180 Q200,${180 - wonRatio} 400,${150 - wonRatio} T800,${100 - wonRatio}`} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                <path d={`M0,160 Q200,${160 - lostRatio} 400,${130 - lostRatio} T800,${80 - lostRatio}`} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                <style jsx>{`
                    .spline-svg { width: 100%; height: 100%; overflow: visible; transition: all 1.5s ease; }
                `}</style>
            </svg>
        );
    }

    renderDonutChart() {
        const { opportunities } = this.state;
        const total = opportunities.length || 1;
        const high = opportunities.filter(o => o.priority === 'High').length;
        const medium = opportunities.filter(o => o.priority === 'Medium').length;
        const low = opportunities.filter(o => o.priority === 'Low').length;

        // Circumference is ~251
        const highPerc = (high / total) * 251;
        const medPerc = (medium / total) * 251;
        const lowPerc = (low / total) * 251;

        return (
            <svg viewBox="0 0 100 100" className="donut-svg">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                {high > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="10" strokeDasharray={`${highPerc} 251`} strokeDashoffset="0" strokeLinecap="round" />}
                {medium > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="10" strokeDasharray={`${medPerc} 251`} strokeDashoffset={`-${highPerc}`} strokeLinecap="round" />}
                {low > 0 && <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray={`${lowPerc} 251`} strokeDashoffset={`-${highPerc + medPerc}`} strokeLinecap="round" />}
                <style jsx>{`
                    .donut-svg { width: 100%; height: 100%; transform: rotate(-90deg); transition: all 1s ease; }
                `}</style>
            </svg>
        );
    }

    renderBarChart() {
        const { opportunities } = this.state;
        const stages = ['New', 'Qualified', 'Proposition', 'Negotiation', 'Won', 'Lost'];
        const total = opportunities.length || 1;
        const data = stages.map(s => (opportunities.filter(o => o.status === s).length / total) * 100 + 10);

        return (
            <div className="bar-chart">
                {data.map((h, i) => (
                    <div key={i} className="bar-group">
                        <div className="bar-bg">
                            <div className="bar-val" style={{ height: `${h}%`, background: i % 2 === 0 ? '#10b981' : '#bae6fd' }}></div>
                        </div>
                        <span className="bar-label">{stages[i].charAt(0)}</span>
                    </div>
                ))}
                <style jsx>{`
                    .bar-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 100%; width: 100%; gap: 8px; }
                    .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; }
                    .bar-bg { width: 10px; flex: 1; background: #f8fafc; border-radius: 6px; position: relative; overflow: hidden; display: flex; align-items: flex-end; }
                    .bar-val { width: 100%; transition: height 0.6s ease; }
                    .bar-label { font-size: 10px; font-weight: 600; color: #94a3b8; }
                `}</style>
            </div>
        );
    }

    renderRecentTickets() {
        const { opportunities } = this.state;
        const recentOnes = (opportunities || []).slice(0, 5);

        const priorityColors = { High: '#fee2e2', Medium: '#fef3c7', Low: '#f1f5f9' };
        const priorityText = { High: '#ef4444', Medium: '#f59e0b', Low: '#64748b' };

        return (
            <div className="tickets-list">
                {recentOnes.length === 0 ? (
                    <div className="empty-state-mini">No recent tickets</div>
                ) : recentOnes.map(ticket => (
                    <div key={ticket.id} className="ticket-item" onClick={() => this.setState({ selectedOpportunity: ticket, showModal: 'details-opp' })}>
                        <div className="ticket-user-info">
                            <div className="ticket-avatar">{ticket.name.charAt(0)}</div>
                            <div className="ticket-main">
                                <span className="ticket-user-name">{ticket.name}</span>
                                <span className="ticket-subject">{ticket.company || 'New Inquiry'}</span>
                            </div>
                        </div>
                        <div className="ticket-meta">
                            <span className="ticket-date">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                            <span className="priority-badge" style={{ background: priorityColors[ticket.priority] || '#f1f5f9', color: priorityText[ticket.priority] || '#64748b' }}>
                                {ticket.priority}
                            </span>
                        </div>
                    </div>
                ))}
                <style jsx>{`
                    .tickets-list { display: flex; flex-direction: column; gap: 12px; }
                    .ticket-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px;
                        border-radius: 12px;
                        transition: background 0.2s;
                    }
                    .ticket-item:hover { background: #f8fafc; }
                    .ticket-user-info { display: flex; align-items: center; gap: 12px; }
                    .ticket-avatar {
                        width: 32px; height: 32px;
                        background: #f1f5f9;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: 700;
                        color: #64748b;
                    }
                    .ticket-main { display: flex; flex-direction: column; gap: 2px; }
                    .ticket-user-name { font-size: 13px; font-weight: 700; color: #0f172a; }
                    .ticket-subject { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
                    .ticket-meta { display: flex; align-items: center; gap: 12px; }
                    .ticket-date { font-size: 11px; color: #94a3b8; font-weight: 600; }
                    .priority-badge {
                        padding: 4px 10px;
                        border-radius: 6px;
                        font-size: 10px;
                        font-weight: 700;
                    }
                `}</style>
            </div>
        );
    }

    renderPipelineChart() {
        const { opportunities } = this.state;
        const stages = ['New', 'Qualified', 'Proposition', 'Negotiation', 'Won'];

        const stageData = stages.map(stage => ({
            stage,
            count: opportunities.filter(o => o.status === stage).length,
            value: opportunities
                .filter(o => o.status === stage)
                .reduce((sum, o) => sum + (o.value || 0), 0)
        }));

        const maxValue = Math.max(...stageData.map(s => s.value), 1);

        return (
            <div className="pipeline-chart">
                {stageData.map((data, idx) => (
                    <div key={idx} className="chart-bar">
                        <div className="bar-label">{data.stage}</div>
                        <div className="bar-container">
                            <div
                                className="bar-fill"
                                style={{
                                    width: `${(data.value / maxValue) * 100}%`,
                                    background: `hsl(${270 - idx * 30}, 70%, 60%)`
                                }}
                            />
                        </div>
                        <div className="bar-stats">
                            <span className="bar-count">{data.count}</span>
                            <span className="bar-value">${data.value.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
                <style jsx>{`
                    .pipeline-chart {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .chart-bar {
                        display: grid;
                        grid-template-columns: 100px 1fr 120px;
                        align-items: center;
                        gap: 12px;
                    }

                    .bar-label {
                        font-size: 13px;
                        font-weight: 600;
                        color: #4b5563;
                    }

                    .bar-container {
                        height: 32px;
                        background: #f3f4f6;
                        border-radius: 8px;
                        overflow: hidden;
                        position: relative;
                    }

                    .bar-fill {
                        height: 100%;
                        border-radius: 8px;
                        transition: width 0.5s ease;
                        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
                    }

                    .bar-stats {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                    }

                    .bar-count {
                        font-size: 14px;
                        font-weight: 700;
                        color: #1f2937;
                    }

                    .bar-value {
                        font-size: 12px;
                        color: #10b981;
                        font-weight: 600;
                    }
                `}</style>
            </div>
        );
    }

    // --- DRAG AND DROP HANDLERS ---
    onDragStart = (e, id) => {
        e.dataTransfer.setData('id', id);
    };

    onDragOver = (e) => {
        e.preventDefault();
    };

    onDrop = async (e, newStage) => {
        const id = e.dataTransfer.getData('id');
        const opportunity = this.state.opportunities.find(o => o.id === id);

        if (opportunity && opportunity.status !== newStage) {
            // Optimistic update
            const updatedOpp = { ...opportunity, status: newStage };
            this.setState(prev => ({
                opportunities: prev.opportunities.map(o => o.id === id ? updatedOpp : o)
            }));

            // API Call
            await this.updateOpportunity(id, { status: newStage });
        }
    };

    renderPipeline() {
        const { opportunities } = this.state;
        const stages = ['New', 'Qualified', 'Proposition', 'Negotiation', 'Won', 'Lost'];

        return (
            <div className="pipeline-modern">
                <div className="pipeline-header-modern">
                    <div className="pipeline-title">
                        <h1>Sales Pipeline</h1>
                        <p>Track your deals through different stages</p>
                    </div>
                </div>

                <div className="kanban-scroll-modern">
                    <div className="kanban-container-modern">
                        {stages.map(stage => {
                            const stageOpps = opportunities.filter(o => o.status === stage);
                            const stageColor = {
                                New: '#2563eb', Qualified: '#8b5cf6', Proposition: '#f97316',
                                Negotiation: '#f59e0b', Won: '#10b981', Lost: '#ef4444'
                            }[stage];

                            return (
                                <div
                                    key={stage}
                                    className="kanban-col-modern"
                                    onDragOver={this.onDragOver}
                                    onDrop={(e) => this.onDrop(e, stage)}
                                >
                                    <div className="col-header-modern">
                                        <div className="col-title-top">
                                            <span className="dot" style={{ background: stageColor }}></span>
                                            <span className="col-label">{stage}</span>
                                            <span className="col-count">{stageOpps.length}</span>
                                        </div>
                                        <div className="col-total-val">
                                            ${stageOpps.reduce((sum, o) => sum + (o.value || 0), 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="col-cards-modern">
                                        {stageOpps.map(opp => this.renderOpportunityCard(opp))}
                                        <button className="btn-add-card" onClick={() => this.setState({ showModal: 'create-opp' })}>
                                            <i className="fe fe-plus"></i> Add card
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <style jsx>{`
                    .pipeline-modern {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        animation: fadeIn 0.4s ease;
                    }

                    .pipeline-header-modern { margin-bottom: 24px; }
                    .pipeline-title h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
                    .pipeline-title p { font-size: 14px; color: #64748b; margin-top: 4px; }

                    .kanban-scroll-modern {
                        flex: 1;
                        overflow-x: auto;
                        padding-bottom: 20px;
                        margin: 0 -10px;
                    }

                    .kanban-container-modern {
                        display: flex;
                        gap: 20px;
                        padding: 0 10px;
                        height: 100%;
                    }

                    .kanban-col-modern {
                        min-width: 320px;
                        width: 320px;
                        background: #f8fafc;
                        border-radius: 20px;
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        padding: 16px;
                    }

                    .col-header-modern { margin-bottom: 20px; }
                    .col-title-top { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
                    .col-title-top .dot { width: 8px; height: 8px; border-radius: 50%; }
                    .col-label { font-size: 14px; font-weight: 700; color: #0f172a; flex: 1; }
                    .col-count { font-size: 12px; font-weight: 700; color: #64748b; background: #ffffff; padding: 2px 8px; border-radius: 8px; }
                    .col-total-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-left: 18px; }

                    .col-cards-modern {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        overflow-y: auto;
                        flex: 1;
                        padding-right: 4px;
                    }

                    .col-cards-modern::-webkit-scrollbar { width: 4px; }
                    .col-cards-modern::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

                    .btn-add-card {
                        background: #ffffff;
                        border: 1px dashed #e2e8f0;
                        padding: 12px;
                        border-radius: 12px;
                        color: #64748b;
                        font-weight: 600;
                        font-size: 13px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.2s;
                    }

                    .btn-add-card:hover { border-color: #2563eb; color: #2563eb; background: #f8faff; }
                `}</style>
            </div>
        );
    }

    renderOpportunityCard(opp) {
        return (
            <div
                key={opp.id}
                className="opp-card-modern"
                draggable
                onDragStart={(e) => this.onDragStart(e, opp.id)}
                onClick={() => this.setState({ selectedOpportunity: opp, showModal: 'details-opp' })}
            >
                <div className="opp-tags-modern">
                    <span className={`opp-tag-priority ${opp.priority?.toLowerCase() || 'medium'}`}>{opp.priority || 'Medium'}</span>
                </div>
                <h3 className="opp-name-modern">{opp.name}</h3>
                <div className="opp-company-modern">{opp.company || 'Private Customer'}</div>

                <div className="opp-footer-modern">
                    <div className="opp-val-box-modern">
                        <span className="opp-val-label">Value</span>
                        <span className="opp-val-amount">${(opp.value || 0).toLocaleString()}</span>
                    </div>
                    <div className="opp-meta-modern">
                        <img src="./themes/Yaru/system/user-home.png" alt="Owner" className="owner-avatar" />
                    </div>
                </div>

                <style jsx>{`
                    .opp-card-modern {
                        background: #ffffff;
                        border-radius: 16px;
                        padding: 16px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        cursor: grab;
                        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                        border: 1px solid #f1f5f9;
                        flex-shrink: 0;
                    }

                    .opp-card-modern:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                        border-color: #e2e8f0;
                    }

                    .opp-tags-modern { display: flex; gap: 6px; margin-bottom: 10px; }
                    .opp-tag-priority {
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: 2px 8px;
                        border-radius: 6px;
                    }
                    .opp-tag-priority.high { background: #fee2e2; color: #ef4444; }
                    .opp-tag-priority.medium { background: #fef3c7; color: #d97706; }
                    .opp-tag-priority.low { background: #dcfce7; color: #16a34a; }

                    .opp-name-modern {
                        font-size: 14px;
                        font-weight: 700;
                        color: #0f172a;
                        margin: 0 0 4px 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .opp-company-modern {
                        font-size: 12px;
                        color: #64748b;
                        margin-bottom: 16px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .opp-footer-modern {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        padding-top: 12px;
                        border-top: 1px solid #f8fafc;
                    }

                    .opp-val-box-modern { display: flex; flex-direction: column; }
                    .opp-val-label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
                    .opp-val-amount { font-size: 14px; font-weight: 800; color: #10b981; }

                    .owner-avatar {
                        width: 24px; height: 24px;
                        border-radius: 6px;
                        border: 1.5px solid #ffffff;
                        box-shadow: 0 0 0 1px #e2e8f0;
                    }
                `}</style>
            </div>
        );
    }

    renderContacts() {
        // Using real database data from this.state.opportunities

        return (
            <div className="contacts-view-modern">
                <div className="view-header-modern">
                    <div className="view-title-area">
                        <h1>Clients Management</h1>
                        <p>Manage your clients and their tickets efficiently</p>
                    </div>
                    <div className="view-actions-modern">
                        <div className="search-box-modern">
                            <i className="fe fe-search"></i>
                            <input type="text" placeholder="Search client..." />
                        </div>
                        <button className="btn-secondary-modern"><i className="fe fe-download"></i></button>
                        <button className="btn-secondary-modern"><i className="fe fe-filter"></i> Filter</button>
                        <button className="btn-secondary-modern"><i className="fe fe-columns"></i> Columns</button>
                        <button className="btn-primary-modern"><i className="fe fe-plus"></i> Add Team</button>
                    </div>
                </div>

                <div className="table-container-modern">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" /></th>
                                <th>Client Name <i className="fe fe-chevron-down"></i></th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Priority</th>
                                <th>Type</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.opportunities.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>No clients found in the database.</td></tr>
                            ) : this.state.opportunities.map(contact => (
                                <tr key={contact.id}>
                                    <td><input type="checkbox" /></td>
                                    <td>
                                        <div className="cell-user">
                                            <div className="cell-avatar">{contact.name.charAt(0)}</div>
                                            <span className="cell-name">{contact.name}</span>
                                        </div>
                                    </td>
                                    <td>{contact.email}</td>
                                    <td>{contact.company || 'Private'}</td>
                                    <td>
                                        <span className={`status-pill pill-${contact.status.toLowerCase().replace(' ', '-')}`}>
                                            {contact.status}
                                        </span>
                                    </td>
                                    <td>{new Date(contact.updatedAt || contact.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`priority-tag text-${contact.priority.toLowerCase()}`}>
                                            <span className={`dot bg-${contact.priority.toLowerCase()}`}></span>
                                            {contact.priority}
                                        </span>
                                    </td>
                                    <td>{contact.value > 0 ? 'Enterprise' : 'Lead'}</td>
                                    <td>
                                        <div className="cell-actions">
                                            <button className="action-btn" onClick={() => this.setState({ selectedOpportunity: contact, showModal: 'edit-opp' })}><i className="fe fe-edit-2"></i></button>
                                            <button className="action-btn delete"><i className="fe fe-trash-2"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="table-footer-modern">
                        <span className="rows-count">Showing 1 to 6 of 50 entries</span>
                        <div className="pagination-modern">
                            <button className="p-btn"><i className="fe fe-chevron-left"></i></button>
                            <button className="p-btn active">1</button>
                            <button className="p-btn">2</button>
                            <button className="p-btn">3</button>
                            <button className="p-btn"><i className="fe fe-chevron-right"></i></button>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .contacts-view-modern {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                        animation: fadeIn 0.4s ease;
                    }

                    .view-header-modern {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .view-title-area h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
                    .view-title-area p { font-size: 14px; color: #64748b; margin: 4px 0 0; }

                    .view-actions-modern {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .search-box-modern {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        padding: 8px 14px;
                        border-radius: 12px;
                        width: 240px;
                    }

                    .search-box-modern i { color: #94a3b8; }
                    .search-box-modern input { border: none; outline: none; font-size: 13px; color: #0f172a; width: 100%; }

                    .btn-secondary-modern {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        padding: 10px 16px;
                        border-radius: 12px;
                        font-size: 13px;
                        font-weight: 700;
                        color: #475569;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.2s;
                    }

                    .btn-secondary-modern:hover { background: #f8fafc; border-color: #cbd5e1; }

                    .btn-primary-modern {
                        background: #0f172a;
                        color: #ffffff;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 12px;
                        font-size: 13px;
                        font-weight: 700;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.2s;
                    }

                    .btn-primary-modern:hover { background: #1e293b; transform: translateY(-1px); }

                    .table-container-modern {
                        background: #ffffff;
                        border-radius: 20px;
                        border: 1px solid #f0f0f0;
                        overflow: hidden;
                    }

                    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
                    .modern-table th {
                        padding: 16px 20px;
                        background: #f8fafc;
                        font-size: 12px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    .modern-table td {
                        padding: 16px 20px;
                        border-bottom: 1px solid #f1f5f9;
                        font-size: 14px;
                        color: #475569;
                    }

                    .cell-user { display: flex; align-items: center; gap: 12px; }
                    .cell-avatar {
                        width: 32px; height: 32px;
                        background: #f1f5f9;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        color: #2563eb;
                    }
                    .cell-name { font-weight: 700; color: #0f172a; }

                    .status-pill {
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 700;
                    }

                    .pill-in-progress { background: #dcfce7; color: #16a34a; }
                    .pill-pending { background: #fef3c7; color: #d97706; }
                    .pill-solved { background: #e0f2fe; color: #0369a1; }
                    .pill-open { background: #fee2e2; color: #dc2626; }

                    .priority-tag { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; }
                    .priority-tag .dot { width: 6px; height: 6px; border-radius: 50%; }
                    .dot.bg-high { background: #ef4444; }
                    .dot.bg-medium { background: #f59e0b; }
                    .dot.bg-low { background: #64748b; }
                    .text-high { color: #ef4444; }
                    .text-medium { color: #f59e0b; }
                    .text-low { color: #64748b; }

                    .cell-actions { display: flex; gap: 8px; }
                    .action-btn {
                        width: 32px; height: 32px;
                        display: flex; align-items: center; justify-content: center;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        color: #64748b;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .action-btn:hover { background: #ffffff; color: #2563eb; border-color: #2563eb; }
                    .action-btn.delete:hover { border-color: #ef4444; color: #ef4444; }

                    .table-footer-modern {
                        padding: 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: #ffffff;
                    }

                    .rows-count { font-size: 13px; color: #94a3b8; font-weight: 600; }

                    .pagination-modern { display: flex; gap: 8px; }
                    .p-btn {
                        width: 36px; height: 36px;
                        display: flex; align-items: center; justify-content: center;
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        font-size: 13px;
                        font-weight: 700;
                        color: #475569;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .p-btn.active { background: #0f172a; color: #ffffff; border-color: #0f172a; }
                    .p-btn:hover:not(.active) { background: #f8fafc; }
                `}</style>
            </div>
        );
    }

    renderActivities() {
        return (
            <div className="activities-view">
                <div className="view-header">
                    <h1 className="page-title">Upcoming Activities</h1>
                    <button className="btn-primary" onClick={() => this.setState({ showModal: 'create-activity' })}>Schedule Activity</button>
                </div>
                <div className="activities-list">
                    <div className="activity-group">
                        <h3>Today</h3>
                        <div className="activity-item">
                            <div className="activity-time">10:00 AM</div>
                            <div className="activity-content">
                                <h4>Meeting with Acme Corp</h4>
                                <p>Discuss proposal details</p>
                            </div>
                            <div className="activity-type meeting">🎥 Meeting</div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-time">2:00 PM</div>
                            <div className="activity-content">
                                <h4>Call with John Doe</h4>
                                <p>Follow up on contract</p>
                            </div>
                            <div className="activity-type call">📞 Call</div>
                        </div>
                    </div>
                </div>
                <style jsx>{`
                    .activities-view { animation: fadeIn 0.3s; }
                    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                    .activity-group h3 { font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 16px; }
                    .activity-item { display: flex; gap: 20px; background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); align-items: center; }
                    .activity-time { font-weight: 600; color: #1f2937; width: 80px; }
                    .activity-content { flex: 1; }
                    .activity-content h4 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
                    .activity-content p { font-size: 13px; color: #6b7280; }
                    .activity-type { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
                    .activity-type.meeting { background: #e0e7ff; color: #4338ca; }
                    .activity-type.call { background: #fee2e2; color: #991b1b; }
                `}</style>
            </div>
        );
    }

    renderQuotes() {
        const { quotes } = this.state;

        return (
            <div className="quotes-view">
                <h1 className="page-title">Quotations</h1>
                <div className="quotes-grid">
                    {quotes.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📄</span>
                            <h3>No quotations yet</h3>
                            <p>Create your first quotation to get started</p>
                            <button className="btn-primary" onClick={() => this.setState({ showModal: 'create-quote' })}>
                                Create Quotation
                            </button>
                        </div>
                    ) : (
                        quotes.map(quote => (
                            <div key={quote.id} className="quote-card">
                                <div className="quote-header">
                                    <h3>{quote.title}</h3>
                                    <span className={`quote-status status-${(quote.status || 'Draft').toLowerCase()}`}>
                                        {quote.status || 'Draft'}
                                    </span>
                                </div>
                                <div className="quote-total">${quote.total.toLocaleString()}</div>
                            </div>
                        ))
                    )}
                </div>
                <style jsx>{`
                    .quotes-view { animation: fadeIn 0.3s; }
                    .quotes-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 20px;
                    }
                    .quote-card {
                        background: white;
                        padding: 20px;
                        border-radius: 12px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }
                    .quote-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: start;
                        margin-bottom: 12px;
                    }
                    .quote-header h3 {
                        font-size: 16px;
                        color: #1f2937;
                        font-weight: 600;
                    }
                    .quote-total {
                        font-size: 24px;
                        font-weight: 700;
                        color: #10b981;
                    }
                    .empty-state {
                        text-align: center;
                        padding: 100px 20px;
                        background: white;
                        border-radius: 16px;
                        grid-column: 1 / -1;
                    }
                    .empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
                    .empty-state h3 { font-size: 20px; color: #1f2937; margin-bottom: 8px; }
                    .empty-state p { color: #6b7280; margin-bottom: 24px; }
                `}</style>
            </div>
        );
    }

    renderReports() {
        return (
            <div className="reports-view">
                <h1 className="page-title">Reports & Analytics</h1>
                <div className="coming-soon">
                    <span className="coming-soon-icon">📈</span>
                    <h2>Reports Module</h2>
                    <p>Detailed analytics and insights coming soon</p>
                </div>
                <style jsx>{`
                    .reports-view { animation: fadeIn 0.3s; }
                    .coming-soon {
                        text-align: center;
                        padding: 80px 20px;
                        background: white;
                        border-radius: 16px;
                    }
                    .coming-soon-icon { font-size: 64px; display: block; margin-bottom: 16px; }
                    .coming-soon h2 { font-size: 24px; color: #1f2937; margin-bottom: 8px; }
                    .coming-soon p { color: #6b7280; }
                `}</style>
            </div>
        );
    }

    renderSettings() {
        const modules = [
            { id: 'crm', name: 'CRM Core', desc: 'Leads, Deals, Contacts', icon: '💼', status: 'Active', color: '#6366f1' },
            { id: 'hospital', name: 'Hospital Management', desc: 'Patients, Doctors, Wards', icon: '🏥', status: 'Available', color: '#10b981' },
            { id: 'inventory', name: 'Inventory & Stock', desc: 'Warhouses, SKU, Shipments', icon: '📦', status: 'Active', color: '#f59e0b' },
            { id: 'pos', name: 'Point of Sale', desc: 'Retail, Orders, Payments', icon: '🛒', status: 'Install', color: '#ec4899' },
            { id: 'hr', name: 'HR Management', desc: 'Employees, Payroll, Leave', icon: '👥', status: 'Active', color: '#8b5cf6' },
            { id: 'marketing', name: 'Marketing Hub', desc: 'Email, Campaigns, Social', icon: '📣', status: 'Available', color: '#06b6d4' },
        ];

        return (
            <div className="studio-container-modern">
                <div className="studio-header-modern">
                    <div className="header-info-modern">
                        <h1>Entity Studio</h1>
                        <p>Deploy and manage business modules for your enterprise</p>
                    </div>
                    <button className="btn-create-module" onClick={() => this.setState({ showModal: 'app-builder' })}>
                        <i className="fe fe-cpu"></i> Advanced Designer
                    </button>
                </div>

                <div className="module-grid-modern">
                    {modules.map(mod => (
                        <div key={mod.id} className="module-card-modern">
                            <div className="module-card-top">
                                <div className="module-icon-box" style={{ background: `${mod.color}15`, color: mod.color }}>
                                    {mod.icon}
                                </div>
                                <div className={`status-tag-modern ${mod.status.toLowerCase()}`}>
                                    {mod.status}
                                </div>
                            </div>
                            <div className="module-card-content">
                                <h3>{mod.name}</h3>
                                <p>{mod.desc}</p>
                            </div>
                            <div className="module-card-footer">
                                <button className="btn-manage">Manage</button>
                                <button className="btn-config"><i className="fe fe-settings"></i></button>
                            </div>
                        </div>
                    ))}
                    <div className="module-card-modern add-new" onClick={() => this.setState({ showModal: 'app-builder' })}>
                        <div className="add-icon">+</div>
                        <h3>Create New Module</h3>
                        <p>Build a custom entity from scratch</p>
                    </div>
                </div>

                <style jsx>{`
                    .studio-container-modern {
                        padding: 20px 0;
                        animation: fadeIn 0.4s ease;
                    }

                    .studio-header-modern {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 32px;
                    }

                    .header-info-modern h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
                    .header-info-modern p { font-size: 15px; color: #64748b; margin-top: 6px; }

                    .btn-create-module {
                        background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 14px;
                        font-weight: 700;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        cursor: pointer;
                        box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);
                    }

                    .module-grid-modern {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 24px;
                    }

                    .module-card-modern {
                        background: #ffffff;
                        border-radius: 24px;
                        padding: 24px;
                        border: 1px solid #f0f0f0;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .module-card-modern:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
                        border-color: #e2e8f0;
                    }

                    .module-card-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }

                    .module-icon-box {
                        width: 54px; height: 54px;
                        border-radius: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 26px;
                    }

                    .status-tag-modern {
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .status-tag-modern.active { background: #dcfce7; color: #16a34a; }
                    .status-tag-modern.available { background: #f1f5f9; color: #64748b; }
                    .status-tag-modern.install { background: #e0e7ff; color: #4338ca; }

                    .module-card-content h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
                    .module-card-content p { font-size: 13px; color: #94a3b8; margin-top: 4px; line-height: 1.5; }

                    .module-card-footer {
                        display: flex;
                        gap: 10px;
                        margin-top: auto;
                    }

                    .btn-manage {
                        flex: 1;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        padding: 10px;
                        border-radius: 10px;
                        font-size: 13px;
                        font-weight: 700;
                        color: #0f172a;
                        cursor: pointer;
                        transition: background 0.2s;
                    }

                    .btn-manage:hover { background: #f1f5f9; }

                    .btn-config {
                        width: 40px;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        cursor: pointer;
                        color: #64748b;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .module-card-modern.add-new {
                        border: 2px dashed #e2e8f0;
                        background: transparent;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        text-align: center;
                    }

                    .module-card-modern.add-new:hover {
                        border-color: #2563eb;
                        background: #f8faff;
                    }

                    .add-icon {
                        width: 48px; height: 48px;
                        background: #f1f5f9;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        color: #94a3b8;
                        margin-bottom: 8px;
                    }

                    .module-card-modern.add-new h3 { color: #64748b; }
                `}</style>
            </div>
        );
    }

    renderModals() {
        const { showModal, selectedOpportunity, selectedActivity } = this.state;

        if (!showModal) return null;

        return (
            <>
                {showModal === 'create-opp' && this.renderCreateOpportunityModal()}
                {showModal === 'details-opp' && selectedOpportunity && this.renderOpportunityDetailsModal()}
                {showModal === 'edit-opp' && selectedOpportunity && this.renderEditOpportunityModal()}
                {showModal === 'create-quote' && this.renderCreateQuoteModal()}
                {showModal === 'create-activity' && this.renderCreateActivityModal()}
                {showModal === 'activity-details' && selectedActivity && this.renderActivityDetailsModal()}
                {showModal === 'app-builder' && this.renderAppBuilderModal()}
            </>
        );
    }

    renderAppBuilderModal() {
        return (
            <div className="modal-overlay" onClick={(e) => {
                if (e.target.className === 'modal-overlay') this.setState({ showModal: null });
            }}>
                <div className="modal glass-modal">
                    <div className="modal-header">
                        <h2>🧱 Entity Builder</h2>
                        <button className="close-btn" onClick={() => this.setState({ showModal: null })}>×</button>
                    </div>
                    <div className="modal-body">
                        <div className="builder-intro">
                            <p>Define a new business object. The internal engine will automatically generate the Database Schema, API Endpoints, and UI Views.</p>
                        </div>

                        <div className="form-group">
                            <label>Module Name (Singular)</label>
                            <input
                                type="text"
                                placeholder="e.g. Patient, Property, Ticket"
                                className="glass-input"
                                value={this.state.newModuleName}
                                onChange={(e) => this.setState({ newModuleName: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Module Icon</label>
                            <div className="icon-grid">
                                {['📦', '🚑', '🎓', '🏗️', '⚖️', '🚗'].map(icon => (
                                    <button key={icon} className="icon-btn">{icon}</button>
                                ))}
                            </div>
                        </div>

                        <div className="field-designer">
                            <label>Fields Blueprint</label>
                            <div className="blueprint-area">
                                <div className="field-row rigid">id (UUID)</div>
                                <div className="field-row rigid">created_at (DateTime)</div>
                                <div className="field-row">
                                    <span>Name</span> <span className="type">Text</span>
                                </div>
                                <div className="field-row ghost">
                                    <span>+ Add Field</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="cancel-btn" onClick={() => this.setState({ showModal: null })}>Cancel</button>
                        <button className="save-btn" onClick={this.deployNewModule}>🚀 Deploy Module</button>
                    </div>
                </div>
                <style jsx>{`
                    .glass-modal { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); width: 600px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); border-radius: 16px; overflow: hidden; }
                    .builder-intro { background: #f0fdf4; color: #15803d; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; line-height: 1.4; border: 1px solid #bbf7d0; }
                    .icon-grid { display: flex; gap: 10px; margin-top: 8px; }
                    .icon-btn { width: 40px; height: 40px; font-size: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; }
                    .icon-btn:hover { border-color: #8b5cf6; background: #f5f3ff; transform: scale(1.1); }
                    
                    .field-designer { margin-top: 20px; }
                    .blueprint-area { background: #1f2937; border-radius: 12px; padding: 16px; margin-top: 8px; border: 1px solid #374151; }
                    .field-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #374151; color: #e5e7eb; font-family: monospace; font-size: 13px; }
                    .field-row.rigid { color: #9ca3af; font-style: italic; }
                    .field-row.ghost { color: #a78bfa; border: 1px dashed #4b5563; border-radius: 6px; justify-content: center; cursor: pointer; margin-top: 8px; transition: all 0.2s; }
                    .field-row.ghost:hover { background: rgba(139, 92, 246, 0.1); border-color: #8b5cf6; }
                    .type { color: #fcd34d; }

                    .glass-input {
                        width: 100%;
                        padding: 12px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        background: white;
                        color: #1f2937; /* Dark text for visibility */
                        font-size: 14px;
                        outline: none;
                        transition: all 0.2s;
                    }
                    .glass-input:focus {
                        border-color: #8b5cf6;
                        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                    }
                    
                    .modal-header { padding: 20px 24px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
                    .modal-header h2 { font-size: 20px; font-weight: 700; color: #1f2937; margin: 0; }
                    .close-btn { background: transparent; border: none; font-size: 24px; color: #9ca3af; cursor: pointer; }
                    
                    .modal-body { padding: 24px; }
                    .form-group { margin-bottom: 20px; }
                    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
                    
                    .modal-footer { padding: 20px 24px; background: #f9fafb; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #f3f4f6; }
                    .cancel-btn { padding: 10px 20px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; font-weight: 600; color: #4b5563; cursor: pointer; }
                    .save-btn { padding: 10px 20px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
                    .save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4); }
                `}</style>
            </div>
        );
    }

    renderCreateOpportunityModal() {
        return (
            <div className="modal-overlay" onClick={() => this.setState({ showModal: null })}>
                <div className="modal-content glass-effect" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Create New Opportunity</h2>
                        <button className="close-btn" onClick={() => this.setState({ showModal: null })}>✕</button>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        this.createOpportunity({
                            name: formData.get('name'),
                            company: formData.get('company'),
                            email: formData.get('email'),
                            phone: formData.get('phone'),
                            value: parseFloat(formData.get('value')) || 0,
                            status: formData.get('status'),
                            priority: formData.get('priority')
                        });
                        this.setState({ showModal: null });
                    }}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Opportunity Name *</label>
                                <input className="input-field" type="text" name="name" required placeholder="e.g., Enterprise Software Deal" />
                            </div>
                            <div className="form-group">
                                <label>Company</label>
                                <input className="input-field" type="text" name="company" placeholder="e.g., Acme Corp" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input className="input-field" type="email" name="email" placeholder="contact@company.com" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input className="input-field" type="tel" name="phone" placeholder="+1 234 567 8900" />
                            </div>
                            <div className="form-group">
                                <label>Expected Revenue *</label>
                                <input className="input-field" type="number" name="value" required placeholder="50000" step="0.01" />
                            </div>
                            <div className="form-group">
                                <label>Stage</label>
                                <select className="input-field" name="status">
                                    <option value="New">New</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposition">Proposition</option>
                                    <option value="Negotiation">Negotiation</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select className="input-field" name="priority">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => this.setState({ showModal: null })}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                Create Opportunity
                            </button>
                        </div>
                    </form>
                    <style jsx>{`
                        .glass-effect {
                            background: rgba(30, 30, 30, 0.95);
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            border-radius: 16px;
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                            color: white;
                            padding: 24px;
                            width: 100%;
                            max-width: 600px;
                        }
                        .modal-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 24px;
                            border-bottom: 1px solid rgba(255,255,255,0.1);
                            padding-bottom: 16px;
                        }
                        .modal-header h2 {
                            font-size: 1.25rem;
                            font-weight: 600;
                            margin: 0;
                        }
                        .close-btn {
                            background: none;
                            border: none;
                            color: #9ca3af;
                            font-size: 1.5rem;
                            cursor: pointer;
                            padding: 4px;
                            border-radius: 4px;
                            transition: all 0.2s;
                        }
                        .close-btn:hover {
                            color: white;
                            background: rgba(255,255,255,0.1);
                        }
                        .form-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 16px;
                            margin-bottom: 24px;
                        }
                        .form-group {
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                        }
                        .form-group label {
                            font-size: 0.875rem;
                            color: #9ca3af;
                            font-weight: 500;
                        }
                        .input-field {
                            background: rgba(0, 0, 0, 0.3);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            border-radius: 8px;
                            padding: 10px 12px;
                            color: white;
                            font-size: 0.95rem;
                            width: 100%;
                            transition: all 0.2s;
                        }
                        .input-field:focus {
                            outline: none;
                            border-color: #2563eb;
                            background: rgba(0, 0, 0, 0.5);
                        }
                        .modal-actions {
                            display: flex;
                            justify-content: flex-end;
                            gap: 12px;
                            padding-top: 16px;
                            border-top: 1px solid rgba(255,255,255,0.1);
                        }
                        .btn-secondary {
                            background: rgba(255, 255, 255, 0.05);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        }
                        .btn-secondary:hover {
                            background: rgba(255, 255, 255, 0.1);
                        }
                        .btn-primary {
                            background: #2563eb;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                        }
                        .btn-primary:hover {
                            background: #1d4ed8;
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    renderOpportunityDetailsModal() {
        const { selectedOpportunity } = this.state;

        return (
            <div className="modal-overlay" onClick={() => this.setState({ showModal: null, selectedOpportunity: null })}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{selectedOpportunity.name}</h2>
                        <button onClick={() => this.setState({ showModal: null, selectedOpportunity: null })}>✕</button>
                    </div>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Company</span>
                            <span className="detail-value">{selectedOpportunity.company || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Status</span>
                            <span className={`opp-status status-${(selectedOpportunity.status || 'New').toLowerCase()}`}>
                                {selectedOpportunity.status || 'New'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Value</span>
                            <span className="detail-value">${selectedOpportunity.value?.toLocaleString() || 0}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Priority</span>
                            <span className="detail-value">{selectedOpportunity.priority}</span>
                        </div>
                        {selectedOpportunity.email && (
                            <div className="detail-item">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{selectedOpportunity.email}</span>
                            </div>
                        )}
                        {selectedOpportunity.phone && (
                            <div className="detail-item">
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">{selectedOpportunity.phone}</span>
                            </div>
                        )}
                        <div className="detail-section">
                            <label>Expected Revenue</label>
                            <div className="value highlight">${selectedOpportunity.value?.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* NEW: NOTES SECTION (REAL) */}
                    <div className="notes-section">
                        <h3>📜 Smart Notes & Timeline</h3>
                        <div className="timeline">
                            {this.state.activities
                                .filter(a => a.clientId === selectedOpportunity.id)
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .map((act, i) => (
                                    <div key={act.id || i} className="timeline-item">
                                        <div className={`timeline-dot ${act.type === 'Note' ? 'active' : ''}`}></div>
                                        <div className="timeline-content">
                                            <p><strong>{act.type}:</strong> {act.type === 'Note' ? act.notes : act.title}</p>
                                            <span className="timeline-date">{new Date(act.createdAt || act.dueDate).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            <div className="timeline-item input-item">
                                <div className="timeline-dot active"></div>
                                <div className="timeline-input-area">
                                    <textarea
                                        placeholder="Type a note (e.g. 'Sent contract via email')..."
                                        className="note-input"
                                        value={this.state.noteInput}
                                        onChange={(e) => this.setState({ noteInput: e.target.value })}
                                    ></textarea>
                                    <button className="add-note-btn" onClick={this.handleCreateNote}>Add Note</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button
                            className="btn-danger"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this opportunity?')) {
                                    this.deleteOpportunity(selectedOpportunity.id);
                                    this.setState({ showModal: null, selectedOpportunity: null });
                                }
                            }}
                        >
                            Delete
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => this.setState({ showModal: 'editOpportunity' })}
                        >
                            Edit
                        </button>
                    </div>
                    <style jsx>{`
                        .details-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            margin-bottom: 24px;
                        }

                        .detail-item {
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                        }

                        .detail-label {
                            font-size: 13px;
                            color: #4b5563;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }

                        .detail-value {
                            font-size: 16px;
                            color: #111827;
                            font-weight: 600;
                        

.note-input {
                            width: 100%;
                            min-height: 80px;
                            padding: 12px;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            font-size: 14px;
                            resize: vertical;
                            color: #111827;
                            background: white;
                        }

                        .note-input::placeholder {
                            color: #9ca3af;
                        }

                        .btn-danger {
                            padding: 10px 20px;
                            background: #ef4444;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s;
                        }

                        .btn-danger:hover {
                            background: #dc2626;
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    renderEditOpportunityModal() {
        const { selectedOpportunity } = this.state;

        return (
            <div className="modal-overlay" onClick={() => this.setState({ showModal: null })}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Edit Opportunity</h2>
                        <button onClick={() => this.setState({ showModal: null })}>✕</button>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        this.updateOpportunity(selectedOpportunity.id, {
                            name: formData.get('name'),
                            company: formData.get('company'),
                            email: formData.get('email'),
                            phone: formData.get('phone'),
                            value: parseFloat(formData.get('value')) || 0,
                            status: formData.get('status'),
                            priority: formData.get('priority')
                        });
                        this.setState({ showModal: null, selectedOpportunity: null });
                    }}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Opportunity Name *</label>
                                <input type="text" name="name" required defaultValue={selectedOpportunity.name} />
                            </div>
                            <div className="form-group">
                                <label>Company</label>
                                <input type="text" name="company" defaultValue={selectedOpportunity.company || ''} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" defaultValue={selectedOpportunity.email || ''} />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" name="phone" defaultValue={selectedOpportunity.phone || ''} />
                            </div>
                            <div className="form-group">
                                <label>Expected Revenue *</label>
                                <input type="number" name="value" required defaultValue={selectedOpportunity.value || 0} step="0.01" />
                            </div>
                            <div className="form-group">
                                <label>Stage</label>
                                <select name="status" defaultValue={selectedOpportunity.status}>
                                    <option value="New">New</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposition">Proposition</option>
                                    <option value="Negotiation">Negotiation</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select name="priority" defaultValue={selectedOpportunity.priority}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => this.setState({ showModal: null })}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    renderCreateQuoteModal() {
        const { opportunities } = this.state;

        return (
            <div className="modal-overlay" onClick={() => this.setState({ showModal: null })}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Create New Quotation</h2>
                        <button onClick={() => this.setState({ showModal: null })}>✕</button>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        this.createQuote({
                            title: formData.get('title'),
                            clientId: formData.get('clientId'),
                            total: parseFloat(formData.get('total')) || 0,
                            items: JSON.stringify([{ description: 'Service', price: parseFloat(formData.get('total')) }]),
                            status: 'Draft'
                        });
                    }}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Quotation Title *</label>
                                <input type="text" name="title" required placeholder="Web Development Project" />
                            </div>
                            <div className="form-group">
                                <label>Client *</label>
                                <select name="clientId" required>
                                    <option value="">Select a client...</option>
                                    {opportunities.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Total Amount *</label>
                                <input type="number" name="total" required placeholder="0.00" step="0.01" />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => this.setState({ showModal: null })}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                Create Quotation
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    renderCreateActivityModal() {
        const { opportunities } = this.state;

        return (
            <div className="modal-overlay" onClick={() => this.setState({ showModal: null })}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Schedule Activity</h2>
                        <button onClick={() => this.setState({ showModal: null })}>✕</button>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        this.createActivity({
                            title: formData.get('title'),
                            description: formData.get('description'),
                            type: formData.get('type'),
                            clientId: formData.get('clientId'),
                            dueDate: formData.get('dueDate'),
                            status: 'Pending'
                        });
                    }}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Title *</label>
                                <input type="text" name="title" required placeholder="Meeting with client" />
                            </div>
                            <div className="form-group">
                                <label>Type *</label>
                                <select name="type" required>
                                    <option value="Meeting">Meeting</option>
                                    <option value="Call">Call</option>
                                    <option value="Email">Email</option>
                                    <option value="Task">Task</option>
                                    <option value="Follow-up">Follow-up</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Client</label>
                                <select name="clientId">
                                    <option value="">None</option>
                                    {opportunities.map(opp => (
                                        <option key={opp.id} value={opp.id}>{opp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Due Date *</label>
                                <input type="datetime-local" name="dueDate" required />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Description</label>
                                <textarea name="description" rows="3" placeholder="Activity details..."></textarea>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => this.setState({ showModal: null })}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                Schedule Activity
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    renderActivityDetailsModal() {
        const { selectedActivity, opportunities } = this.state;
        const client = opportunities.find(o => o.id === selectedActivity.clientId);

        return (
            <div className="modal-overlay" onClick={() => this.setState({ showModal: null, selectedActivity: null })}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{selectedActivity.title}</h2>
                        <button onClick={() => this.setState({ showModal: null, selectedActivity: null })}>✕</button>
                    </div>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Type</span>
                            <span className="detail-value">{selectedActivity.type}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Status</span>
                            <span className={`detail-value status-${selectedActivity.status?.toLowerCase()}`}>
                                {selectedActivity.status}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Due Date</span>
                            <span className="detail-value">
                                {new Date(selectedActivity.dueDate).toLocaleString()}
                            </span>
                        </div>
                        {client && (
                            <div className="detail-item">
                                <span className="detail-label">Client</span>
                                <span className="detail-value">{client.name}</span>
                            </div>
                        )}
                        {selectedActivity.description && (
                            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="detail-label">Description</span>
                                <span className="detail-value">{selectedActivity.description}</span>
                            </div>
                        )}
                    </div>
                    <div className="modal-actions">
                        {selectedActivity.status !== 'Completed' && (
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    this.completeActivity(selectedActivity.id);
                                    this.setState({ showModal: null, selectedActivity: null });
                                }}
                            >
                                Mark as Complete
                            </button>
                        )}
                        <button
                            className="btn-danger"
                            onClick={() => {
                                if (confirm('Delete this activity?')) {
                                    this.deleteActivity(selectedActivity.id);
                                    this.setState({ showModal: null, selectedActivity: null });
                                }
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export function displayProject() {
    return <CRM />;
}
