
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
    'chrome': { rating: 4.8, downloads: '5B+', category: 'utility', description: 'Browse the web with blazing speed. Experience powerful performance, seamless syncing, and built-in security features that keep you safe online.', screens: ['bg-blue-100', 'bg-blue-50'] },
    'vscode': { rating: 4.9, downloads: '100M+', category: 'development', description: 'The world\'s most popular code editor. Built-in Git integration, IntelliSense, debugging, and thousands of extensions to supercharge your development workflow.', screens: ['bg-gray-800', 'bg-gray-900'] },
    'terminal': { rating: 4.7, downloads: '1B+', category: 'utility', description: 'Powerful command-line interface with full system access. Execute shell commands, automate tasks, and unlock advanced system capabilities.', screens: ['bg-black', 'bg-gray-800'] },
    'todo': { rating: 4.5, downloads: '50M+', category: 'productivity', description: 'Never miss a task again. Create, organize, and track your to-do lists with an intuitive interface. Perfect for personal and professional task management.', screens: ['bg-yellow-100', 'bg-yellow-50'] },
    'settings': { rating: 4.0, downloads: 'System', category: 'utility', description: 'Customize every aspect of your OS. Control system preferences, personalize appearance, manage accounts, and configure advanced settings all in one place.', screens: ['bg-gray-200', 'bg-white'] },
    'calc': { rating: 4.6, downloads: '1B+', category: 'utility', description: 'More than just a calculator. Perform basic arithmetic, scientific calculations, and complex math operations with a beautiful, easy-to-use interface.', screens: ['bg-orange-100', 'bg-orange-50'] },
    'about-ajith': { rating: 5.0, downloads: '1M+', category: 'social', description: 'Discover the story behind Alphery OS. Meet the creator, explore the vision, and learn about the journey of building this innovative operating system.', screens: ['bg-indigo-100', 'bg-indigo-50'] },
    'weather': { rating: 4.7, downloads: '500M+', category: 'utility', description: 'Beautiful real-time weather forecasts. Get accurate temperature, humidity, wind speed, and 5-day predictions with stunning animated backgrounds.', screens: ['bg-blue-200', 'bg-blue-100'] },
    'calendar': { rating: 4.6, downloads: '500M+', category: 'productivity', description: 'Never miss an important date. Organize your schedule, set reminders, manage events, and plan your days with our elegant calendar interface.', screens: ['bg-red-100', 'bg-red-50'] },
    'gedit': { rating: 4.5, downloads: '200M+', category: 'productivity', description: 'Simple yet powerful text editing. Create and edit documents with syntax highlighting, find & replace, and all essential text editing features.', screens: ['bg-green-100', 'bg-green-50'] },
    'messenger': { rating: 4.8, downloads: '2B+', category: 'social', description: 'Stay connected with friends and team. Real-time messaging, file sharing, and seamless communication powered by Firebase.', screens: ['bg-blue-100', 'bg-blue-50'] },
    'files': { rating: 4.7, downloads: '1B+', category: 'utility', description: 'Manage your files with elegance. Browse folders, preview documents, organize files, and access your entire filesystem with a beautiful interface.', screens: ['bg-purple-100', 'bg-purple-50'] },
    'trash': { rating: 4.3, downloads: 'System', category: 'utility', description: 'Your digital safety net. Recover accidentally deleted files or permanently remove them. Keep your system clean and organized.', screens: ['bg-gray-100', 'bg-gray-50'] },
    'projects': { rating: 4.6, downloads: '50M+', category: 'productivity', description: 'Professional project management made easy. Track tasks, collaborate with teams, manage deadlines, and deliver projects on time.', screens: ['bg-teal-100', 'bg-teal-50'] },
    'users': { rating: 4.4, downloads: '100M+', category: 'utility', description: 'Comprehensive user administration. Manage accounts, assign permissions, track activity, and maintain complete control over system access.', screens: ['bg-indigo-100', 'bg-indigo-50'] },
    'user-permissions': { rating: 4.3, downloads: '20M+', category: 'utility', description: 'Advanced permission management system. Control app access, define user roles, and ensure security across your organization.', screens: ['bg-red-100', 'bg-red-50'] },
    'about-alphery': { rating: 4.9, downloads: '5M+', category: 'utility', description: 'System information at your fingertips. View detailed specs about your device including CPU, RAM, graphics, and OS version.', screens: ['bg-slate-100', 'bg-slate-50'] },
    // Defaults for others
    'default': { rating: 4.2, downloads: '10M+', category: 'utility', description: 'An amazing application designed to enhance your productivity and make your digital life easier.', screens: ['bg-gray-100', 'bg-gray-50'] }
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
            hasError: false,
            containerWidth: 800 // Default to desktop-ish
        }
        this.containerRef = React.createRef();
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

            // Observe container resize for responsive layout (window vs screen)
            this.resizeObserver = new ResizeObserver(entries => {
                if (this._isMounted && entries[0]) {
                    this.setState({ containerWidth: entries[0].contentRect.width });
                }
            });

            if (this.containerRef.current) {
                this.resizeObserver.observe(this.containerRef.current);
            }
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    componentDidUpdate(prevProps) {
        const prevUid = prevProps.user ? prevProps.user.uid : null;
        const currUid = this.props.user ? this.props.user.uid : null;

        if (prevUid !== currUid) {
            this.setState({ disabled_apps: this.getDisabledApps() });
        }

        // Re-render when allowedApps changes (permission updates)
        const prevAllowedApps = prevProps.userData?.allowedApps;
        const currAllowedApps = this.props.userData?.allowedApps;

        if (JSON.stringify(prevAllowedApps) !== JSON.stringify(currAllowedApps)) {
            console.log('[AppStore] Permission changes detected, re-rendering...');
            this.forceUpdate(); // Force re-render to apply new filters
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
        // Updated to _v3 to match Desktop component and ensure clean state
        const key = `disabled_apps_${userId}_v3`;
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

            const key = `disabled_apps_${userId}_v3`;
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

        // Permission-based app filtering - DISABLED
        // Now ALL apps are visible in App Store for everyone
        // Permission checking happens when opening the app (see window.tsx)
        const user = this.props.user;
        const userData = this.props.userData;

        // System apps that cannot be uninstalled
        const systemApps = ['app-store', 'settings', 'messenger', 'trash'];

        // Note: No filtering applied here anymore. 
        // All apps are discoverable and installable. 
        // Access control is strictly enforced at runtime (window open).
        // Guest/unauthenticated: Show all apps (no filtering)

        // Featured Apps (random selection for 'all')
        const featuredApps = enrichedApps.filter(a => ['vscode', 'spotify', 'discord', 'chrome'].includes(a.id) || a.rating > 4.7).slice(0, 3);

        // Container-based responsiveness
        const isMobile = this.state.containerWidth < 768;

        return (
            <div ref={this.containerRef} className="flex h-full w-full bg-slate-50 font-sans select-none text-slate-900 overflow-hidden">
                {/* --- Sidebar --- */}
                {/* --- Sidebar --- */}
                {!isMobile && (
                    <div className="flex w-64 bg-slate-100 border-r border-slate-200 flex-col p-4 z-20 flex-shrink-0">
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
                )}

                {/* --- Main Content --- */}
                <div className="flex-1 overflow-y-auto bg-white relative text-left">
                    {/* Mobile Header & Nav */}
                    {isMobile && (
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-slate-100 p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold font-mono">A</div>
                                <span className="font-bold text-slate-800">App Store</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search apps..."
                                    value={searchQuery}
                                    onChange={(e) => this.setState({ searchQuery: e.target.value, activeCategory: 'all', view: 'browse' })}
                                    className="w-full bg-slate-100 border-none rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50"
                                />
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => this.setState({ activeCategory: cat.id, view: 'browse', searchQuery: '' })}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${activeCategory === cat.id && !searchQuery
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span>{cat.icon}</span>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'browse' ? (
                        <div className="p-4 md:p-8 max-w-6xl mx-auto">
                            {/* Hero Carousel */}
                            {activeCategory === 'all' && !searchQuery && (
                                <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                                    {featuredApps.map((app, i) => (
                                        <div
                                            key={app.id}
                                            onClick={() => this.openDetails(app)}
                                            className={`relative h-48 rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 ${i === 0 ? 'bg-gradient-to-r from-indigo-500 to-purple-600 col-span-full md:col-span-2' : 'bg-gray-100'}`}
                                        >
                                            <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 ${app.screens[0]} opacity-30 mix-blend-overlay`}></div>
                                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10 bg-gradient-to-t from-black/60 to-transparent">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={app.icon}
                                                        alt={app.title}
                                                        className={`${i === 0 ? 'w-20 h-20' : 'w-12 h-12'} object-contain drop-shadow-lg transition-transform group-hover:scale-110`}
                                                    />
                                                    <div>
                                                        <h3 className={`${i === 0 ? 'text-3xl' : 'text-xl'} font-bold leading-none mb-1`}>{app.title}</h3>
                                                        {i === 0 && <p className="text-white/80 text-sm line-clamp-1">{app.description}</p>}
                                                    </div>
                                                </div>
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
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
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
                                <div className="absolute -bottom-16 left-10 flex items-end gap-6 z-10 w-full max-w-4xl">
                                    <img src={selectedApp.icon} alt={selectedApp.title} className="w-32 h-32 rounded-3xl shadow-2xl object-contain bg-white/10 backdrop-blur-sm p-2" />
                                    <div className="mb-6 text-shadow pr-40">
                                        <h1 className="text-4xl font-bold mb-2 truncate max-w-2xl">{selectedApp.title}</h1>
                                        <div className="flex items-center gap-4 text-sm opacity-90">
                                            <span className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm capitalize font-medium">{selectedApp.category}</span>
                                            <span className="text-white/80">{selectedApp.downloads} downloads</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-20 px-10 max-w-5xl mx-auto pb-20">
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
