import React, { Component } from 'react';
import { io } from 'socket.io-client';
import FocusMode from './crm/FocusMode';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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
            quotes: [],

            // UI State
            selectedOpportunity: null,
            selectedContact: null,
            selectedActivity: null,
            showModal: null, // 'create-opp', 'details-opp', 'edit-opp', 'create-quote', 'create-activity', 'activity-details', 'app-builder'
            filterStage: 'all',
            searchQuery: '',
            noteInput: '', // For creating new notes

            // Dashboard Stats
            stats: {
                totalRevenue: 0,
                wonDeals: 0,
                activeOpportunities: 0,
                activitiesThisWeek: 0
            }
        };

        this.socket = null;
    }

    componentDidMount() {
        this.connectSocket();
        this.fetchAllData();
    }

    componentWillUnmount() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    connectSocket = () => {
        this.socket = io(API_BASE_URL);
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
        try {
            const [opportunities, quotes, activities] = await Promise.all([
                fetch(`${API_BASE_URL}/clients`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/quotations`).then(r => r.ok ? r.json() : []).catch(() => []),
                fetch(`${API_BASE_URL}/activities`).then(r => r.ok ? r.json() : []).catch(() => [])
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
        if (!opportunities) return {
            totalRevenue: 0,
            wonDeals: 0,
            activeOpportunities: 0,
            activitiesThisWeek: 0
        };

        return {
            totalRevenue: opportunities
                .filter(o => o.status === 'Won')
                .reduce((sum, o) => sum + (o.value || 0), 0),
            wonDeals: opportunities.filter(o => o.status === 'Won').length,
            activeOpportunities: opportunities.filter(o =>
                o.status !== 'Won' && o.status !== 'Lost'
            ).length,
            activitiesThisWeek: opportunities.length * 2 // Mock data
        };
    };

    createOpportunity = async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        try {
            await fetch(`${API_BASE_URL}/clients/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            this.fetchAllData();
        } catch (error) {
            console.error('Error updating opportunity:', error);
        }
    };

    deleteOpportunity = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/clients/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting opportunity:', error);
        }
    };

    createQuote = async (data) => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        try {
            const response = await fetch(`${API_BASE_URL}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        try {
            const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
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
        try {
            await fetch(`${API_BASE_URL}/activities/${id}`, { method: 'DELETE' });
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

    render() {
        const { activeView } = this.state;

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
                `}</style>
            </div>
        );
    }

    renderSidebar() {
        const { activeView } = this.state;
        const menuItems = [
            { id: 'focus', label: 'Focus Mode', icon: '🎯' },
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'pipeline', label: 'Pipeline', icon: '📉' },
            { id: 'contacts', label: 'Contacts', icon: '👥' },
            { id: 'activities', label: 'Activities', icon: '📅' },
            { id: 'quotes', label: 'Quotations', icon: '📄' },
            { id: 'reports', label: 'Reports', icon: '📈' },
            { id: 'settings', label: 'App Studio', icon: '⚙️' } // NEW: Entity Studio
        ];

        return (
            <aside className="crm-sidebar">
                <div className="sidebar-header">
                    <div className="crm-logo">
                        <span className="logo-icon">💼</span>
                        <span className="logo-text">CRM Pro</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => this.setState({ activeView: item.id })}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <style jsx>{`
                .crm-sidebar {
                    width: 260px;
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(20px);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    z-index: 100;
                }

                .sidebar-header {
                    padding: 32px 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .crm-logo {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .logo-icon {
                    font-size: 32px;
                    filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
                }

                .logo-text {
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .sidebar-nav {
                    padding: 20px 16px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .nav-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 18px;
                    background: transparent;
                    border: none;
                    border-radius: 14px;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 2px;
                    font-size: 15px;
                    font-weight: 600;
                    text-align: left;
                }

                .nav-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: white;
                    transform: translateX(4px);
                }

                .nav-item.active {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    box-shadow: 0 8px 20px -6px rgba(139, 92, 246, 0.6);
                }

                .nav-icon {
                    font-size: 20px;
                }
            `}</style>
            </aside>
        );
    }

    renderTopBar() {
        const { searchQuery } = this.state;

        return (
            <header className="crm-topbar">
                <div className="topbar-search">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search opportunities, contacts, activities..."
                        value={searchQuery}
                        onChange={(e) => this.setState({ searchQuery: e.target.value })}
                    />
                </div>
                <div className="topbar-actions">
                    <button
                        className="btn-primary"
                        onClick={() => this.setState({ showModal: 'create-opp' })}
                    >
                        <span>➕</span>
                        New Opportunity
                    </button>
                    <button className="btn-icon">
                        <span>🔔</span>
                    </button>
                    <button className="btn-icon">
                        <span>⚙️</span>
                    </button>
                </div>
                <style jsx>{`
                .crm-topbar {
                    height: 80px;
                    background: rgba(255, 255, 255, 0.6);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 24px;
                    padding: 0 40px;
                    z-index: 50;
                    position: sticky;
                    top: 0;
                }

                .topbar-search {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: white;
                    border: 1px solid rgba(0,0,0,0.05);
                    border-radius: 16px;
                    padding: 0 20px;
                    max-width: 600px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                    transition: all 0.2s ease;
                }
                
                .topbar-search:focus-within {
                    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.1);
                    border-color: rgba(139, 92, 246, 0.3);
                    transform: translateY(-1px);
                }

                .topbar-search input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 14px 0;
                    font-size: 15px;
                    outline: none;
                    color: #1f2937;
                }

                .search-icon {
                    font-size: 20px;
                    opacity: 0.4;
                }

                .topbar-actions {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .btn-primary {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    border: none;
                    border-radius: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 14px;
                    box-shadow: 0 8px 20px -6px rgba(99, 102, 241, 0.5);
                    transition: all 0.3s;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 24px -8px rgba(99, 102, 241, 0.6);
                }

                .btn-icon {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border: 1px solid rgba(0,0,0,0.05);
                    border-radius: 14px;
                    cursor: pointer;
                    font-size: 20px;
                    transition: all 0.2s;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                }

                .btn-icon:hover {
                    background: #f8fafc;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.05);
                }
            `}</style>
            </header>
        );
    }

    renderDashboard() {
        const { stats, opportunities } = this.state;

        const statCards = [
            { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: '#10b981' },
            { label: 'Won Deals', value: stats.wonDeals, icon: '🏆', color: '#8b5cf6' },
            { label: 'Active Opportunities', value: stats.activeOpportunities, icon: '🎯', color: '#f59e0b' },
            { label: 'Activities This Week', value: stats.activitiesThisWeek, icon: '📅', color: '#3b82f6' }
        ];

        const recentOpportunities = opportunities.slice(0, 5);

        return (
            <div className="dashboard">
                <h1 className="page-title">Sales Dashboard</h1>

                <div className="stats-grid">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className="stat-card" style={{ '--accent-color': stat.color }}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-content">
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-value">{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dashboard-grid">
                    <div className="card">
                        <h3 className="card-title">Pipeline Overview</h3>
                        {this.renderPipelineChart()}
                    </div>

                    <div className="card">
                        <h3 className="card-title">Recent Opportunities</h3>
                        <div className="opportunities-list">
                            {recentOpportunities.map(opp => (
                                <div key={opp.id} className="opportunity-item">
                                    <div className="opp-info">
                                        <div className="opp-name">{opp.name}</div>
                                        <div className="opp-company">{opp.company || 'No company'}</div>
                                    </div>
                                    <div className="opp-value">${opp.value?.toLocaleString() || 0}</div>
                                    <div className={`opp-status status-${(opp.status || 'New').toLowerCase()}`}>
                                        {opp.status || 'New'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .dashboard {
                        animation: fadeIn 0.3s;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .page-title {
                        font-size: 32px;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 24px;
                    }

                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 32px;
                    }

                    .stat-card {
                        background: white;
                        border-radius: 16px;
                        padding: 24px;
                        display: flex;
                        gap: 16px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s;
                        border: 1px solid transparent;
                    }

                    .stat-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
                        border-color: var(--accent-color);
                    }

                    .stat-icon {
                        width: 56px;
                        height: 56px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 28px;
                        background: linear-gradient(135deg, var(--accent-color)20, var(--accent-color)10);
                        border-radius: 12px;
                    }

                    .stat-content {
                        flex: 1;
                    }

                    .stat-label {
                        font-size: 13px;
                        color: #6b7280;
                        font-weight: 500;
                        margin-bottom: 4px;
                    }

                    .stat-value {
                        font-size: 28px;
                        font-weight: 700;
                        color: #1f2937;
                    }

                    .dashboard-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 24px;
                    }

                    .card {
                        background: white;
                        border-radius: 16px;
                        padding: 24px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }

                    .card-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 20px;
                    }

                    .opportunities-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .opportunity-item {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 12px;
                        background: #f9fafb;
                        border-radius: 8px;
                        transition: all 0.2s;
                    }

                    .opportunity-item:hover {
                        background: #f3f4f6;
                    }

                    .opp-info {
                        flex: 1;
                    }

                    .opp-name {
                        font-weight: 600;
                        color: #1f2937;
                        font-size: 14px;
                    }

                    .opp-company {
                        font-size: 12px;
                        color: #6b7280;
                        margin-top: 2px;
                    }

                    .opp-value {
                        font-weight: 700;
                        color: #10b981;
                        font-size: 14px;
                    }

                    .opp-status {
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                    }

                    .status-new { background: #dbeafe; color: #1e40af; }
                    .status-qualified { background: #e0e7ff; color: #4338ca; }
                    .status-proposition { background: #fef3c7; color: #92400e; }
                    .status-won { background: #d1fae5; color: #065f46; }
                    .status-lost { background: #fee2e2; color: #991b1b; }
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
        const { opportunities, filterStage } = this.state;
        const stages = ['New', 'Qualified', 'Proposition', 'Negotiation', 'Won', 'Lost'];

        const filteredOpps = filterStage === 'all'
            ? opportunities
            : opportunities.filter(o => o.status === filterStage);

        return (
            <div className="pipeline-view">
                <div className="pipeline-header">
                    <h1 className="page-title">Sales Pipeline</h1>
                    <div className="pipeline-filters">
                        <button
                            className={`filter-btn ${filterStage === 'all' ? 'active' : ''}`}
                            onClick={() => this.setState({ filterStage: 'all' })}
                        >
                            All Stages
                        </button>
                        {stages.map(stage => (
                            <button
                                key={stage}
                                className={`filter-btn ${filterStage === stage ? 'active' : ''}`}
                                onClick={() => this.setState({ filterStage: stage })}
                            >
                                {stage}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="kanban-board">
                    {stages.map(stage => {
                        const stageOpps = opportunities.filter(o => o.status === stage);
                        const stageValue = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);

                        return (
                            <div
                                key={stage}
                                className="kanban-column"
                                onDragOver={this.onDragOver}
                                onDrop={(e) => this.onDrop(e, stage)}
                            >
                                <div className="column-header">
                                    <div className="column-title">
                                        <span>{stage}</span>
                                        <span className="column-count">{stageOpps.length}</span>
                                    </div>
                                    <div className="column-value">${stageValue.toLocaleString()}</div>
                                </div>
                                <div className="column-content">
                                    {stageOpps.map(opp => this.renderOpportunityCard(opp, stage))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <style jsx>{`
                    .pipeline-view { animation: fadeIn 0.3s; height: 100%; display: flex; flex-direction: column; }
                    .pipeline-header { margin-bottom: 24px; flex-shrink: 0; }
                    .pipeline-filters { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
                    .filter-btn { padding: 8px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
                    .filter-btn:hover { border-color: #8b5cf6; color: #8b5cf6; }
                    .filter-btn.active { background: #8b5cf6; color: white; border-color: #8b5cf6; }
                    .kanban-board { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; overflow-x: auto; padding-bottom: 20px; flex: 1; min-height: 0; }
                    .kanban-column { background: #f9fafb; border-radius: 12px; padding: 16px; min-width: 300px; display: flex; flex-direction: column; height: 100%; }
                    .column-header { margin-bottom: 16px; flex-shrink: 0; }
                    .column-title { display: flex; align-items: center; justify-content: space-between; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
                    .column-count { background: #e5e7eb; color: #4b5563; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
                    .column-value { font-size: 14px; color: #10b981; font-weight: 700; }
                    .column-content { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1; min-height: 100px; }
                `}</style>
            </div>
        );
    }

    renderOpportunityCard(opp, stage) {
        const priorityColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

        return (
            <div
                key={opp.id}
                className="opp-card"
                draggable
                onDragStart={(e) => this.onDragStart(e, opp.id)}
                onClick={() => this.setState({ selectedOpportunity: opp, showModal: 'details-opp' })}
            >
                <div className="opp-card-header">
                    <div className="opp-card-title">{opp.name}</div>
                    <div className="opp-priority-dot" style={{ background: priorityColors[opp.priority] || '#6b7280' }} />
                </div>
                {opp.company && <div className="opp-card-company"><span>🏢</span> {opp.company}</div>}
                <div className="opp-card-value">${opp.value?.toLocaleString() || 0}</div>
                {opp.email && <div className="opp-card-contact"><span>✉️</span> {opp.email}</div>}
                <div className="opp-card-actions">
                    <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); this.setState({ selectedOpportunity: opp, showModal: 'edit-opp' }); }}>
                        <span>✏️</span>
                    </button>
                </div>
                <style jsx>{`
                    .opp-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); cursor: grab; transition: all 0.2s; border: 2px solid transparent; }
                    .opp-card:active { cursor: grabbing; }
                    .opp-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-color: #8b5cf6; transform: translateY(-2px); }
                    .opp-card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; }
                    .opp-card-title { font-weight: 600; color: #1f2937; font-size: 14px; flex: 1; }
                    .opp-priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                    .opp-card-company { font-size: 12px; color: #6b7280; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
                    .opp-card-value { font-size: 18px; font-weight: 700; color: #10b981; margin-bottom: 8px; }
                    .opp-card-contact { font-size: 11px; color: #9ca3af; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
                    .opp-card-actions { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
                    .card-action-btn { flex: 1; padding: 6px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
                    .card-action-btn:hover { background: #f3f4f6; border-color: #d1d5db; }
                `}</style>
            </div>
        );
    }

    renderContacts() {
        // Use opportunities as contacts for now since they contain contact info
        const contacts = this.state.opportunities;

        return (
            <div className="contacts-view">
                <div className="view-header">
                    <h1 className="page-title">Contacts</h1>
                    <button className="btn-primary" onClick={() => this.setState({ showModal: 'create-opp' })}>
                        Add Contact
                    </button>
                </div>

                <div className="contacts-grid">
                    {contacts.map(contact => (
                        <div key={contact.id} className="contact-card">
                            <div className="contact-avatar">
                                {contact.name.charAt(0)}
                            </div>
                            <div className="contact-info">
                                <h3>{contact.name}</h3>
                                <p className="contact-company">{contact.company || 'No Company'}</p>
                                <div className="contact-details">
                                    {contact.email && <p>✉️ {contact.email}</p>}
                                    {contact.phone && <p>📞 {contact.phone}</p>}
                                </div>
                            </div>
                            <div className="contact-tags">
                                <span className={`status-tag ${(contact.status || 'New').toLowerCase()}`}>{contact.status || 'New'}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <style jsx>{`
                    .contacts-view { animation: fadeIn 0.3s; }
                    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                    .contacts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                    .contact-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; gap: 16px; align-items: start; transition: transform 0.2s; }
                    .contact-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    .contact-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
                    .contact-info { flex: 1; }
                    .contact-info h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; color: #1f2937; }
                    .contact-company { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
                    .contact-details p { font-size: 12px; color: #4b5563; margin-bottom: 4px; }
                    .status-tag { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #f3f4f6; color: #374151; }
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
        return (
            <div className="settings-studio">
                <div className="studio-header">
                    <div className="header-text">
                        <h2>System Configuration</h2>
                        <p>Manage your business entities and modules</p>
                    </div>
                    <button className="primary-btn" onClick={() => this.setState({ showModal: 'app-builder' })}>+ Create New Module</button>
                </div>

                <div className="studio-grid">
                    <div className="studio-card active">
                        <div className="studio-icon">💼</div>
                        <div className="studio-info">
                            <h3>CRM Core</h3>
                            <p> Leads, Deals, Contacts</p>
                        </div>
                        <span className="status-badge">Active</span>
                    </div>

                    <div className="studio-card">
                        <div className="studio-icon">🏥</div>
                        <div className="studio-info">
                            <h3>Hospital Management</h3>
                            <p>Patients, Doctors, Wards</p>
                        </div>
                        <button className="secondary-btn">Install</button>
                    </div>

                    <div className="studio-card">
                        <div className="studio-icon">🏭</div>
                        <div className="studio-info">
                            <h3>Manufacturing</h3>
                            <p>Orders, BoM, Inventory</p>
                        </div>
                        <button className="secondary-btn">Install</button>
                    </div>

                    <div className="studio-card new-entity">
                        <div className="dashed-border">
                            <span className="plus">+</span>
                            <span>Build Custom Entity</span>
                        </div>
                    </div>
                </div>

                <div className="db-schema-preview">
                    <h3>Current Data Schema (Live)</h3>
                    <div className="schema-visualizer">
                        <div className="schema-node">
                            <div className="node-head">Tenant</div>
                            <div className="node-body">
                                <div>id: uuid</div>
                                <div>name: string</div>
                            </div>
                        </div>
                        <div className="connection">───</div>
                        <div className="schema-node highlight">
                            <div className="node-head">Entity: Deal</div>
                            <div className="node-body">
                                <div>value: money</div>
                                <div>stage: enum</div>
                                <div>probability: calc</div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .settings-studio { padding: 0 10px; animation: slideUp 0.4s ease; }
                    .studio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                    .studio-header h2 { font-size: 24px; font-weight: 800; color: #1f2937; margin: 0; }
                    .studio-header p { color: #6b7280; margin-top: 4px; }
                    
                    .studio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; margin-bottom: 48px; }
                    
                    .studio-card {
                        background: white;
                        border-radius: 16px;
                        padding: 24px;
                        border: 1px solid rgba(0,0,0,0.05);
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        transition: all 0.2s;
                    }
                    .studio-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -3px rgba(0,0,0,0.1); }
                    
                    .studio-icon { font-size: 32px; background: #f3f4f6; width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
                    .studio-info h3 { font-size: 16px; font-weight: 700; color: #1f2937; margin: 0 0 4px 0; }
                    .studio-info p { font-size: 13px; color: #6b7280; margin: 0; }
                    
                    .status-badge { align-self: flex-start; background: #d1fae5; color: #059669; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
                    .secondary-btn { padding: 8px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; font-weight: 600; cursor: pointer; color: #4b5563; }
                    
                    .new-entity { background: transparent; border: none; box-shadow: none; cursor: pointer; }
                    .dashed-border {
                        border: 2px dashed #e5e7eb;
                        border-radius: 16px;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: #9ca3af;
                        gap: 12px;
                        min-height: 200px;
                        transition: all 0.2s;
                    }
                    .dashed-border:hover { border-color: #8b5cf6; color: #8b5cf6; background: rgba(139, 92, 246, 0.02); }
                    .plus { font-size: 32px; font-weight: 300; }

                    .primary-btn {
                        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
                    }

                    .db-schema-preview { background: #111827; border-radius: 16px; padding: 32px; color: white; }
                    .db-schema-preview h3 { color: #9ca3af; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
                    
                    .schema-visualizer { display: flex; align-items: center; gap: 20px; font-family: monospace; }
                    .schema-node { background: #1f2937; border-radius: 8px; border: 1px solid #374151; min-width: 150px; }
                    .node-head { padding: 8px 12px; background: #374151; font-weight: 700; border-radius: 7px 7px 0 0; font-size: 12px; }
                    .node-body { padding: 12px; font-size: 11px; color: #d1d5db; display: flex; flex-direction: column; gap: 4px; }
                    .connection { color: #4b5563; }
                    .highlight { border-color: #8b5cf6; box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
                    .highlight .node-head { background: #8b5cf6; color: white; }

                    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
                            <input type="text" placeholder="e.g. Patient, Property, Ticket" className="glass-input" />
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
                        <button className="save-btn">🚀 Deploy Module</button>
                    </div>
                </div>
                <style jsx>{`
                    .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); width: 600px; }
                    .builder-intro { background: #f0fdf4; color: #15803d; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; line-height: 1.4; }
                    .icon-grid { display: flex; gap: 10px; margin-top: 8px; }
                    .icon-btn { width: 40px; height: 40px; font-size: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; }
                    .icon-btn:hover { border-color: #8b5cf6; background: #f5f3ff; }
                    
                    .field-designer { margin-top: 20px; }
                    .blueprint-area { background: #111827; border-radius: 12px; padding: 16px; margin-top: 8px; }
                    .field-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #374151; color: white; font-family: monospace; font-size: 13px; }
                    .field-row.rigid { color: #6b7280; font-style: italic; }
                    .field-row.ghost { color: #8b5cf6; border: 1px dashed #4b5563; border-radius: 6px; justify-content: center; cursor: pointer; margin-top: 8px; }
                    .type { color: #fcd34d; }
                `}</style>
            </div>
        );
    }

    renderCreateOpportunityModal() {
        return (
            <div className="modal-overlay" onClick={() => this.setState({ showModal: null })}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Create New Opportunity</h2>
                        <button onClick={() => this.setState({ showModal: null })}>✕</button>
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
                    }}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Opportunity Name *</label>
                                <input type="text" name="name" required placeholder="e.g., Enterprise Software Deal" />
                            </div>
                            <div className="form-group">
                                <label>Company</label>
                                <input type="text" name="company" placeholder="e.g., Acme Corp" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" placeholder="contact@company.com" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" name="phone" placeholder="+1 234 567 8900" />
                            </div>
                            <div className="form-group">
                                <label>Expected Revenue *</label>
                                <input type="number" name="value" required placeholder="50000" step="0.01" />
                            </div>
                            <div className="form-group">
                                <label>Stage</label>
                                <select name="status">
                                    <option value="New">New</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposition">Proposition</option>
                                    <option value="Negotiation">Negotiation</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select name="priority">
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
                </div>
                <style jsx>{`
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
                    .form-group select {
                        padding: 10px 12px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                        background: white;
                        transition: all 0.2s;
                    }

                    .form-group input:focus,
                    .form-group select:focus {
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
                        transition: all 0.2s;
                    }

                    .btn-secondary:hover {
                        background: #e5e7eb;
                    }
                `}</style>
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
                            color: #6b7280;
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
