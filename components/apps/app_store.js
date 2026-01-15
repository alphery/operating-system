
import React, { Component, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Helper to get user context
function AppStoreWithAuth(props) {
    const { user, updateUserData } = useAuth();
    return <AppStore user={user} updateUserData={updateUserData} {...props} />;
}

// --- CONSTANTS & MOCK DATA ---
const CATEGORIES = [
    { id: 'all', label: 'Discover', icon: '🔍' },
    { id: 'productivity', label: 'Work', icon: '💼' },
    { id: 'development', label: 'Develop', icon: '👨‍💻' },
    { id: 'utility', label: 'Utilities', icon: '🛠️' },
    { id: 'social', label: 'Social', icon: '💬' },
    { id: 'entertainment', label: 'Play', icon: '🎮' },
];

const MOCK_METADATA = {
    'chrome': { rating: 4.8, downloads: '5B+', category: 'utility', description: 'Fast, secure, and customizable browser.', screens: ['bg-blue-100', 'bg-blue-50'] },
    'vscode': { rating: 4.9, downloads: '100M+', category: 'development', description: 'Code Editing. Redefined.', screens: ['bg-gray-800', 'bg-gray-900'] },
    'terminal': { rating: 4.7, downloads: '1B+', category: 'utility', description: 'The command line for everyone.', screens: ['bg-black', 'bg-gray-800'] },
    'todo': { rating: 4.5, downloads: '50M+', category: 'productivity', description: 'Manage your tasks efficiently.', screens: ['bg-yellow-100', 'bg-yellow-50'] },
    'settings': { rating: 4.0, downloads: 'System', category: 'utility', description: 'Control center for your OS.', screens: ['bg-gray-200', 'bg-white'] },
    'calculator': { rating: 4.6, downloads: '1B+', category: 'utility', description: 'Simple and powerful calculator.', screens: ['bg-orange-100', 'bg-orange-50'] },
    'about-vivek': { rating: 5.0, downloads: '1M+', category: 'social', description: 'Learn about the developer.', screens: ['bg-indigo-100', 'bg-indigo-50'] },
    'weather': { rating: 4.7, downloads: '500M+', category: 'utility', description: 'Real-time weather updates.', screens: ['bg-blue-200', 'bg-blue-100'] },
    'calendar': { rating: 4.6, downloads: '500M+', category: 'productivity', description: 'Stay organized every day.', screens: ['bg-red-100', 'bg-red-50'] },
    // Defaults for others
    'default': { rating: 4.2, downloads: '10M+', category: 'utility', description: 'An amazing application for your daily needs.', screens: ['bg-gray-100', 'bg-gray-50'] }
};

class AppStore extends Component {
    constructor(props) {
        super(props);
        this.state = {
            apps: [],
            disabled_apps: [], // Initialize empty, will populate in mount
            activeCategory: 'all',
            searchQuery: '',
            view: 'browse', // 'browse' | 'details'
            selectedApp: null,
            installing: {}, // { appId: progress% }
            hasError: false
        }
        this._isMounted = false;
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("AppStore Crashed:", error, errorInfo);
    }

    componentDidMount() {
        this._isMounted = true;
        if (typeof window !== 'undefined') {
            const apps = window.ALL_APPS || [];
            try {
                this.setState({
                    apps: apps,
                    disabled_apps: this.getDisabledApps()
                });
            } catch (e) {
                console.error("AppStore Mount Error:", e);
            }
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    componentDidUpdate(prevProps) {
        const prevUid = prevProps.user ? prevProps.user.uid : null;
        const currUid = this.props.user ? this.props.user.uid : null;

        if (prevUid !== currUid) {
            this.setState({ disabled_apps: this.getDisabledApps() });
        }

        if (this.state.apps.length === 0 && window.ALL_APPS && window.ALL_APPS.length > 0) {
            this.setState({ apps: window.ALL_APPS });
        }
    }

    getUserId = () => {
        return (this.props.user && this.props.user.uid) ? this.props.user.uid : 'guest';
    }

    getDisabledApps = () => {
        const userId = this.getUserId();
        const key = `disabled_apps_${userId}`;
        try {
            const data = localStorage.getItem(key);
            console.log(`[AppStore] Reading disabled apps for ${userId}:`, data);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error parsing disabled apps:", e);
            return [];
        }
    }

    installApp = (app) => {
        if (this.state.installing[app.id]) return;

        this.setState(prev => ({ installing: { ...prev.installing, [app.id]: 0 } }));

        let progress = 0;
        const interval = setInterval(() => {
            if (!this._isMounted) {
                clearInterval(interval);
                return;
            }
            progress += Math.random() * 30 + 15; // Faster animation
            if (progress >= 100) {
                clearInterval(interval);
                this.setState(prev => {
                    const newInstalling = { ...prev.installing };
                    delete newInstalling[app.id];
                    return { installing: newInstalling };
                });
                this.updateAppStorage(app.id, false); // false = enable/install app
            } else {
                this.setState(prev => ({ installing: { ...prev.installing, [app.id]: progress } }));
            }
        }, 150);
    }

    uninstallApp = (app) => {
        // Add uninstalling animation state
        if (this.state.installing[app.id]) return; // Reuse installing for uninstalling animation

        this.setState(prev => ({ installing: { ...prev.installing, [app.id]: 0 } }));

        let progress = 0;
        const interval = setInterval(() => {
            if (!this._isMounted) {
                clearInterval(interval);
                return;
            }
            progress += Math.random() * 30 + 15; // Faster animation
            if (progress >= 100) {
                clearInterval(interval);
                this.setState(prev => {
                    const newInstalling = { ...prev.installing };
                    delete newInstalling[app.id];
                    return { installing: newInstalling };
                });
                this.updateAppStorage(app.id, true); // true = disable/uninstall app
            } else {
                this.setState(prev => ({ installing: { ...prev.installing, [app.id]: progress } }));
            }
        }, 150);
    }

    updateAppStorage = (appId, disable) => {
        try {
            const userId = this.getUserId();
            let disabled = this.getDisabledApps();

            console.log(`[AppStore] Updating storage for ${userId}. App: ${appId}, Disable via Uninstal: ${disable}`);

            if (disable) {
                if (!disabled.includes(appId)) disabled.push(appId);
            } else {
                disabled = disabled.filter(id => id !== appId);
            }

            const key = `disabled_apps_${userId}`;
            localStorage.setItem(key, JSON.stringify(disabled));

            if (this._isMounted) {
                this.setState({ disabled_apps: disabled });
            }

            // Dispatch event for other components (Desktop, Dock)
            console.log(`[AppStore] Dispatching app_status_changed event for ${userId}`);
            const event = new CustomEvent('app_status_changed', { detail: { userId: userId } });
            window.dispatchEvent(event);

            // Sync with Firestore if user is authenticated
            if (this.props.user && this.props.updateUserData) {
                this.props.updateUserData({ disabledApps: disabled })
                    .catch(err => console.warn("Failed to sync disabled apps to cloud:", err));
            }

        } catch (e) {
            console.error("Error updating app storage:", e);
        }
    }

    getMetadata = (appId) => {
        return MOCK_METADATA[appId] || MOCK_METADATA['default'];
    }

    openDetails = (app) => {
        this.setState({ view: 'details', selectedApp: app });
    }

    renderStars(rating) {
        return (
            <div className="flex text-yellow-400 text-xs">
                {[...Array(5)].map((_, i) => (
                    <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
                ))}
                <span className="text-gray-400 ml-1">({rating})</span>
            </div>
        );
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full flex items-center justify-center flex-col p-4 bg-slate-50">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
                    <button onClick={() => this.setState({ hasError: false })} className="text-blue-600 hover:underline">Try Reloading</button>
                </div>
            );
        }

        if (!this.state.apps) return <div className="p-4">Loading Apps...</div>;

        const { apps, disabled_apps, activeCategory, searchQuery, view, selectedApp, installing } = this.state;

        // Enrich apps with metadata
        const enrichedApps = apps.map(app => ({
            ...app,
            ...this.getMetadata(app.id)
        }));

        // Filter
        let displayApps = enrichedApps;
        if (searchQuery) {
            displayApps = displayApps.filter(app => app.title.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (activeCategory !== 'all') {
            displayApps = displayApps.filter(app => app.category === activeCategory);
        }

        // Permission-based app filtering
        const user = this.props.user;
        const userData = this.props.userData;

        // System apps that are always visible
        const systemApps = ['app-store', 'settings', 'messenger', 'trash'];

        // Apply permission filtering
        if (user && userData) {
            const isSuperAdmin = userData.role === 'super_admin';

            if (!isSuperAdmin) {
                // Regular users: Check allowedApps
                if (userData.allowedApps !== undefined && userData.allowedApps !== null) {
                    // User has specific app permissions
                    if (Array.isArray(userData.allowedApps)) {
                        displayApps = displayApps.filter(app =>
                            systemApps.includes(app.id) || userData.allowedApps.includes(app.id)
                        );
                    } else if (userData.allowedApps.length === 0) {
                        // Empty array: Only system apps
                        displayApps = displayApps.filter(app => systemApps.includes(app.id));
                    }
                }
                // If allowedApps is undefined/null: Show all apps (backward compatibility)
            }
            // Super Admin: Show all apps (no filtering)
        }
        // Guest/unauthenticated: Show all apps (no filtering)

        // Featured Apps (random selection for 'all')
        const featuredApps = enrichedApps.filter(a => ['vscode', 'spotify', 'discord', 'chrome'].includes(a.id) || a.rating > 4.7).slice(0, 3);


        return (
            <div className="flex h-full w-full bg-slate-50 font-sans select-none text-slate-900 overflow-hidden">
                {/* --- Sidebar --- */}
                <div className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col p-4 z-20">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold font-mono">A</div>
                        <h1 className="text-lg font-bold tracking-tight">App Store</h1>
                    </div>

                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search apps..."
                            value={searchQuery}
                            onChange={(e) => this.setState({ searchQuery: e.target.value, activeCategory: 'all', view: 'browse' })}
                            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                        />
                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                    </div>

                    <div className="space-y-1 overflow-y-auto">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => this.setState({ activeCategory: cat.id, view: 'browse', searchQuery: '' })}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeCategory === cat.id && !searchQuery
                                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-200/50'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="flex-1 overflow-y-auto bg-white relative">
                    {view === 'browse' ? (
                        <div className="p-8 max-w-6xl mx-auto">
                            {/* Hero Carousel */}
                            {activeCategory === 'all' && !searchQuery && (
                                <div className="mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {featuredApps.map((app, i) => (
                                        <div
                                            key={app.id}
                                            onClick={() => this.openDetails(app)}
                                            className={`relative h-48 rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 ${i === 0 ? 'md:col-span-2 bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-100'}`}
                                        >
                                            <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 ${app.screens[0]} opacity-30 mix-blend-overlay`}></div>
                                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10 bg-gradient-to-t from-black/60 to-transparent">
                                                <h3 className="text-2xl font-bold leading-none">{app.title}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {searchQuery ? `Results for "${searchQuery}"` : CATEGORIES.find(c => c.id === activeCategory)?.label || 'All Apps'}
                                </h2>
                                <span className="text-sm text-slate-400 font-medium">{displayApps.length} Apps</span>
                            </div>

                            {/* Apps Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {displayApps.map(app => {
                                    const isInstalling = installing[app.id] !== undefined;
                                    const progress = installing[app.id] || 0;
                                    const isInstalled = !disabled_apps.includes(app.id);
                                    const isSystem = systemApps.includes(app.id);

                                    return (
                                        <div key={app.id} className="bg-white rounded-xl p-4 border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full relative overflow-hidden">
                                            {isInstalling && (
                                                <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-200" style={{ width: `${progress}%` }}></div>
                                            )}
                                            <div className="flex items-start justify-between mb-4 cursor-pointer" onClick={() => this.openDetails(app)}>
                                                <div className="flex items-center gap-3">
                                                    <img src={app.icon} alt={app.title} className="w-14 h-14 object-contain transition-transform group-hover:scale-110" />
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 leading-tight">{app.title}</h3>
                                                        <span className="text-xs text-slate-500 capitalize">{app.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-auto flex items-center justify-between">
                                                {this.renderStars(app.rating)}
                                                <div className="flex gap-2">
                                                    {isInstalled && !isSystem && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); this.uninstallApp(app); }}
                                                            className="px-2 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 transition-colors"
                                                            title="Uninstall"
                                                        >🗑️</button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); if (!isInstalled) this.installApp(app); }}
                                                        disabled={isSystem || isInstalling}
                                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all transform active:scale-95 ${isSystem ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                                                            isInstalling ? 'bg-slate-100 text-slate-500 cursor-wait' :
                                                                isInstalled ? 'bg-slate-50 text-slate-600 border border-slate-200 cursor-default' :
                                                                    'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                                            }`}
                                                    >
                                                        {isSystem ? 'System' : isInstalling ? '...' : isInstalled ? 'OWNED' : 'GET'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>
                    ) : (
                        /* --- Details View --- */
                        <div className="animate-fade-in bg-white min-h-full">
                            <div className="h-64 relative bg-slate-900 text-white overflow-hidden">
                                <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${selectedApp.screens[0].replace('bg-', 'from-').replace('100', '900')} to-slate-900`}></div>
                                <button onClick={() => this.setState({ view: 'browse' })} className="absolute top-6 left-6 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-20">←</button>
                                <div className="absolute -bottom-12 left-10 flex items-end gap-6 z-10 w-full max-w-4xl">
                                    <img src={selectedApp.icon} alt={selectedApp.title} className="w-32 h-32 rounded-3xl bg-white shadow-2xl p-2 md:p-0 object-contain" />
                                    <div className="mb-4 text-shadow">
                                        <h1 className="text-4xl font-bold mb-1">{selectedApp.title}</h1>
                                        <div className="flex items-center gap-4 text-sm opacity-90">
                                            <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm capitalize">{selectedApp.category}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-16 px-10 max-w-5xl mx-auto pb-20">
                                <div className="flex flex-col md:flex-row gap-12">
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-3xl font-bold text-slate-800">{selectedApp.rating}</span>
                                                    <div className="text-yellow-400 text-xl">★★★★☆</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                {!systemApps.includes(selectedApp.id) && !disabled_apps.includes(selectedApp.id) && (
                                                    <button
                                                        onClick={() => this.uninstallApp(selectedApp)}
                                                        className="px-6 py-3 rounded-full text-base font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
                                                    >Uninstall</button>
                                                )}
                                                <button
                                                    onClick={() => !disabled_apps.includes(selectedApp.id) ? {} : this.installApp(selectedApp)}
                                                    disabled={systemApps.includes(selectedApp.id) || installing[selectedApp.id] !== undefined || (!disabled_apps.includes(selectedApp.id))}
                                                    className={`px-10 py-3 rounded-full text-base font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${systemApps.includes(selectedApp.id) ? 'bg-slate-100 text-slate-400' :
                                                        !disabled_apps.includes(selectedApp.id) ? 'bg-slate-100 text-slate-400 cursor-default shadow-none' :
                                                            'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {!disabled_apps.includes(selectedApp.id) ? 'Already Installed' : 'INSTALL'}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-3">About this app</h3>
                                            <p className="text-slate-600 leading-relaxed text-lg">{selectedApp.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .text-shadow { text-shadow: 0 4px 12px rgba(0,0,0,0.5); }
                    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                `}</style>
            </div>
        );
    }
}

export const displayAppStore = () => {
    return <AppStoreWithAuth />;
}

export default AppStore;
