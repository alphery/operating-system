
import React, { Component, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Helper to get user context
function AppStoreWithAuth(props) {
    const { user, userData, updateUserData } = useAuth();
    return <AppStore user={user} userData={userData} updateUserData={updateUserData} {...props} />;
}

// --- CONSTANTS & MOCK DATA ---
const CATEGORIES = [
    { id: 'all', label: 'Explore', icon: '✨' },
    { id: 'productivity', label: 'Productivity', icon: '🚀' },
    { id: 'development', label: 'Dev Tools', icon: '🛠️' },
    { id: 'utility', label: 'Essentials', icon: '💎' },
    { id: 'social', label: 'Connect', icon: '🌈' },
    { id: 'entertainment', label: 'Gaming', icon: '🕹️' },
];

const MOCK_METADATA = {
    'chrome': { rating: 4.8, downloads: '5B+', category: 'utility', price: 'Free', description: 'Experience the fastest, most secure web browser. Chrome brings you the best of Google, with smart tools and speed to help you get things done.', tags: ['Fast', 'Secure', 'Google'], color: 'from-blue-400 to-green-400' },
    'vscode': { rating: 4.9, downloads: '100M+', category: 'development', price: 'Free', description: 'Code editing. Redefined. Visual Studio Code is a lightweight but powerful source code editor which runs on your desktop and is available for Windows, macOS and Linux.', tags: ['Code', 'IDE', 'MS'], color: 'from-blue-600 to-cyan-500' },
    'terminal': { rating: 4.7, downloads: '1B+', category: 'utility', price: 'Free', description: 'The ultimate power tool for developers. A fast, efficient, and powerful terminal emulator that helps you unlock the full potential of your system.', tags: ['Shell', 'Root', 'CLI'], color: 'from-gray-700 to-black' },
    'todo': { rating: 4.5, downloads: '50M+', category: 'productivity', price: 'Free', description: 'Organize your life and your work. Stay focused, organized, and calm with Todoist. The world’s #1 task manager and to-do list app.', tags: ['Tasks', 'Focus'], color: 'from-red-400 to-orange-400' },
    'settings': { rating: 4.0, downloads: 'System', category: 'utility', price: 'Included', description: 'The control center for your OS. Fine-tune your experience, manage system resources, and personalize every detail of your environment.', tags: ['System', 'Config'], color: 'from-slate-400 to-slate-600' },
    'calc': { rating: 4.6, downloads: '1B+', category: 'utility', price: 'Free', description: 'Precision at your fingertips. A masterfully crafted calculator with support for basic, scientific, and complex mathematical expressions.', tags: ['Math', 'Tools'], color: 'from-orange-400 to-yellow-500' },
    'messenger': { rating: 4.8, downloads: '2B+', category: 'social', price: 'Free', description: 'Connect instantly. Share moments, message friends, and collaborate with your team in real-time. Fast, secure, and beautiful.', tags: ['Chat', 'Social'], color: 'from-blue-500 to-purple-500' },
    'files': { rating: 4.7, downloads: '1B+', category: 'utility', price: 'Free', description: 'Your digital filing cabinet. A robust file manager with instant searching, tagging, and preview capabilities for all your media.', tags: ['Storage', 'Files'], color: 'from-purple-500 to-pink-500' },
    'weather': { rating: 4.7, downloads: '500M+', category: 'utility', price: 'Free', description: 'Plan your day with confidence. Hyper-local weather forecasts with stunning visualizations and reliable 10-day accuracy.', tags: ['Local', 'Forecast'], color: 'from-cyan-400 to-blue-500' },
    'default': { rating: 4.2, downloads: '10M+', category: 'utility', price: 'Free', description: 'An amazing application designed to enhance your productivity and make your digital life easier.', tags: ['Apps'], color: 'from-blue-400 to-indigo-500' }
};

class AppStore extends Component {
    constructor(props) {
        super(props);
        this.state = {
            apps: [],
            disabled_apps: [],
            activeCategory: 'all',
            searchQuery: '',
            view: 'browse',
            selectedApp: null,
            installing: {},
            hasError: false,
            containerWidth: 800
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
        if (this.state.apps.length === 0 && window.ALL_APPS && window.ALL_APPS.length > 0) {
            this.setState({ apps: window.ALL_APPS });
        }
    }

    getUserId = () => {
        return (this.props.user && this.props.user.uid) ? this.props.user.uid : 'guest';
    }

    getDisabledApps = () => {
        const userId = this.getUserId();
        const key = `disabled_apps_${userId}_v3`;
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
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
            progress += Math.random() * 20 + 5;
            if (progress >= 100) {
                clearInterval(interval);
                this.setState(prev => {
                    const newInstalling = { ...prev.installing };
                    delete newInstalling[app.id];
                    return { installing: newInstalling };
                });
                this.updateAppStorage(app.id, false);
            } else {
                this.setState(prev => ({ installing: { ...prev.installing, [app.id]: progress } }));
            }
        }, 100);
    }

    uninstallApp = (app) => {
        if (this.state.installing[app.id]) return;
        this.setState(prev => ({ installing: { ...prev.installing, [app.id]: 0 } }));
        let progress = 0;
        const interval = setInterval(() => {
            if (!this._isMounted) {
                clearInterval(interval);
                return;
            }
            progress += Math.random() * 20 + 5;
            if (progress >= 100) {
                clearInterval(interval);
                this.setState(prev => {
                    const newInstalling = { ...prev.installing };
                    delete newInstalling[app.id];
                    return { installing: newInstalling };
                });
                this.updateAppStorage(app.id, true);
            } else {
                this.setState(prev => ({ installing: { ...prev.installing, [app.id]: progress } }));
            }
        }, 100);
    }

    updateAppStorage = (appId, disable) => {
        try {
            const userId = this.getUserId();
            let disabled = this.getDisabledApps();
            if (disable) {
                if (!disabled.includes(appId)) disabled.push(appId);
            } else {
                disabled = disabled.filter(id => id !== appId);
            }
            const key = `disabled_apps_${userId}_v3`;
            localStorage.setItem(key, JSON.stringify(disabled));
            if (this._isMounted) this.setState({ disabled_apps: disabled });
            const event = new CustomEvent('app_status_changed', { detail: { userId: userId } });
            window.dispatchEvent(event);
            if (this.props.user && this.props.updateUserData) {
                this.props.updateUserData({ disabledApps: disabled }).catch(err => console.warn(err));
            }
        } catch (e) {
            console.error(e);
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
            <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-sm">{i < Math.floor(rating) ? '★' : '☆'}</span>
                ))}
                <span className="text-slate-400 text-[10px] ml-1 font-bold">({rating})</span>
            </div>
        );
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full flex items-center justify-center bg-slate-50">
                    <div className="p-8 bg-white rounded-3xl shadow-xl text-center flex flex-col items-center">
                        <div className="text-6xl mb-4">😵</div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h2>
                        <button onClick={() => this.setState({ hasError: false })} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Restart Store</button>
                    </div>
                </div>
            );
        }

        const { apps, disabled_apps, activeCategory, searchQuery, view, selectedApp, installing } = this.state;
        const { user, userData } = this.props;

        // Permissions Filter: System admins see all, others based on allowedApps
        const isSuperAdmin = user && (user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com');
        const allowedAppsList = userData?.allowedApps || null;
        const systemApps = ['app-store', 'settings', 'messenger', 'trash'];

        const enrichedApps = apps
            .filter(app => {
                if (isSuperAdmin || !user) return true; // Super admin and guest see all
                if (systemApps.includes(app.id)) return true; // System apps always visible
                if (allowedAppsList === null) return true; // Default fallback (all visible)
                return allowedAppsList.includes(app.id); // Restricted list
            })
            .map(app => ({ ...app, ...this.getMetadata(app.id) }));

        let displayApps = enrichedApps;
        if (searchQuery) {
            displayApps = displayApps.filter(app => app.title.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (activeCategory !== 'all') {
            displayApps = displayApps.filter(app => app.category === activeCategory);
        }

        let featuredApps = enrichedApps.filter(a => ['vscode', 'chrome', 'messenger', 'files'].includes(a.id));
        if (featuredApps.length === 0 && enrichedApps.length > 0) featuredApps = enrichedApps.slice(0, 3);
        const isMobile = this.state.containerWidth < 768;

        return (
            <div ref={this.containerRef} className="flex h-full w-full bg-[#f4f7fa] font-sans select-none text-slate-900 overflow-hidden relative">
                {/* --- Sidebar Nav --- */}
                {!isMobile && (
                    <div className="w-72 bg-white/40 backdrop-blur-3xl border-r border-white/40 flex flex-col p-6 z-20 flex-shrink-0">
                        <div className="flex items-center gap-4 mb-10 group cursor-pointer" onClick={() => this.setState({ view: 'browse', activeCategory: 'all' })}>
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/30 transform transition group-hover:rotate-6">A</div>
                            <div>
                                <h1 className="text-xl font-black tracking-tighter text-slate-800 leading-none">App Store</h1>
                                <span className="text-[10px] uppercase font-black text-blue-600 tracking-widest">Premium Edition</span>
                            </div>
                        </div>

                        <div className="relative mb-8 group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
                            <input
                                type="text"
                                placeholder="Search everything..."
                                value={searchQuery}
                                onChange={(e) => this.setState({ searchQuery: e.target.value, activeCategory: 'all', view: 'browse' })}
                                className="w-full bg-white/60 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all font-medium"
                            />
                        </div>

                        <nav className="space-y-2 flex-grow overflow-y-auto pr-2 custom-scrollbar pb-6">
                            <p className="px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Categories</p>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => this.setState({ activeCategory: cat.id, view: 'browse', searchQuery: '' })}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden group ${activeCategory === cat.id && !searchQuery
                                        ? 'bg-white text-blue-600 shadow-xl border border-blue-50/50'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-800'
                                        }`}
                                >
                                    <span className={`text-xl transition-transform group-hover:scale-110 ${activeCategory === cat.id ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}>{cat.icon}</span>
                                    {cat.label}
                                    {activeCategory === cat.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-full" />}
                                </button>
                            ))}

                            <div className="mt-8 p-4 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                <p className="text-xs font-bold opacity-80 mb-1">Weekly Digest</p>
                                <h4 className="font-black text-lg leading-tight mb-3">Build better. Faster. ✨</h4>
                                <button className="w-full py-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-xl text-xs font-bold transition-all">Explore Trends</button>
                            </div>
                        </nav>
                    </div>
                )}

                {/* --- Main Area --- */}
                <div className="flex-1 overflow-y-auto bg-[#f0f4f8] scroll-smooth p-6 md:p-10 relative z-10">
                    <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply opacity-70"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply opacity-70"></div>
                    {view === 'browse' ? (
                        <div className="max-w-7xl mx-auto pb-20 relative z-10">
                            {/* Featured Banner */}
                            {(activeCategory === 'all' || activeCategory === 'social') && !searchQuery && featuredApps.length > 0 && (
                                <div className="mb-12 relative h-[400px] rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => this.openDetails(featuredApps[0])}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${featuredApps[0].color} animate-gradient-slow`}></div>
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

                                    <div className="absolute top-12 left-12 max-w-lg z-10">
                                        <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest mb-6 border border-white/20">
                                            <span>🔥</span> Editors Choice
                                        </div>
                                        <h2 className="text-6xl font-black text-white leading-none mb-6 drop-shadow-2xl">
                                            {featuredApps[0].title}
                                        </h2>
                                        <p className="text-white/90 text-xl font-medium mb-8 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            {featuredApps[0].description.split('.')[0]}. Experience the next level of innovation.
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black shadow-2xl hover:scale-105 transition-transform">Get Started</button>
                                            <button className="px-8 py-4 bg-white/20 backdrop-blur-xl text-white border border-white/30 rounded-2xl font-black hover:bg-white/30 transition-all">Watch Preview</button>
                                        </div>
                                    </div>

                                    <img
                                        src={featuredApps[0].icon}
                                        className="absolute -right-10 bottom-0 w-[450px] opacity-20 transform translate-y-20 group-hover:translate-y-10 group-hover:rotate-6 transition-all duration-1000 select-none pointer-events-none"
                                        alt=""
                                    />
                                </div>
                            )}

                            {/* Top Charts Section */}
                            {activeCategory === 'all' && !searchQuery && (
                                <div className="mb-12">
                                    <div className="flex items-center justify-between mb-6 px-2">
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Top Charts</h3>
                                        <button className="text-blue-600 font-bold text-sm hover:underline">See All</button>
                                    </div>
                                    <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 snap-x custom-scrollbar">
                                        {apps.slice(0, 5).map((app, idx) => (
                                            <div key={app.id} onClick={() => this.openDetails(app)} className="snap-start flex-shrink-0 w-80 bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <span className="text-4xl font-black text-blue-200 font-mono italic">#{idx + 1}</span>
                                                    <img src={app.icon} className="w-16 h-16 object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-800 truncate">{app.title}</h4>
                                                        <span className="text-xs font-bold text-slate-400 uppercase">{app.category}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    {this.renderStars(app.rating || 4.5)}
                                                    <button className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors">GET</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section Title */}
                            <div className="flex items-end justify-between mb-8 px-2">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
                                        {searchQuery ? 'Top Results' : activeCategory === 'all' ? 'Popular Downloads' : CATEGORIES.find(c => c.id === activeCategory)?.label}
                                    </h2>
                                    <p className="text-slate-400 font-bold text-sm mt-1">Curated by our expert team of enthusiasts</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
                                    <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
                                    <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
                                </div>
                            </div>

                            {/* Apps Grid */}
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8">
                                {displayApps.map(app => {
                                    const isInstalling = installing[app.id] !== undefined;
                                    const progress = installing[app.id] || 0;
                                    const isInstalled = !disabled_apps.includes(app.id);
                                    const isSystem = systemApps.includes(app.id);

                                    return (
                                        <div
                                            key={app.id}
                                            className="bg-white/60 backdrop-blur-md rounded-[32px] p-6 border border-white/60 shadow-sm hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-white/90 transition-all duration-300 group flex flex-col relative overflow-hidden ring-1 ring-white/50"
                                        >
                                            {isInstalling && (
                                                <div className="absolute inset-x-0 top-0 h-1.5 bg-slate-100/50">
                                                    <div className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.8)]" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-5 mb-6 cursor-pointer" onClick={() => this.openDetails(app)}>
                                                <div className={`w-20 h-20 rounded-[22px] bg-gradient-to-br ${app.color} p-4 shadow-xl shadow-indigo-500/10 flex items-center justify-center transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-500`}>
                                                    <img src={app.icon} className="w-full h-full object-contain filter drop-shadow-md" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-black text-xl text-slate-800 leading-tight truncate">{app.title}</h3>
                                                        {isInstalled && <span className="text-blue-500 text-[10px] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-bold tracking-wide">OWNED</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{app.category}</p>
                                                    {this.renderStars(app.rating)}
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 leading-relaxed">
                                                {app.description}
                                            </p>

                                            <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-slate-200/50 dashed">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-slate-800">{app.price}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isInstalled && !isSystem && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); this.uninstallApp(app); }}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
                                                            title="Uninstall"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isInstalled) {
                                                                /* Logic to open app */
                                                                const event = new CustomEvent('open_app', { detail: app.id });
                                                                window.dispatchEvent(event);
                                                            } else {
                                                                this.installApp(app);
                                                            }
                                                        }}
                                                        disabled={isSystem || isInstalling}
                                                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all transform active:scale-95 shadow-lg flex items-center gap-2 ${isSystem ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' :
                                                            isInstalling ? 'bg-blue-50 text-blue-400 cursor-wait shadow-none' :
                                                                isInstalled ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30' :
                                                                    'bg-slate-900 text-white hover:bg-black hover:shadow-xl'
                                                            }`}
                                                    >
                                                        {isSystem ? <span>SYSTEM</span> : isInstalling ? <span>{Math.round(progress)}%</span> : isInstalled ? <><span>OPEN</span> <span>🚀</span></> : <span>GET</span>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        /* --- PREMIUM DETAILS VIEW --- */
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 min-h-full bg-white rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col">
                            <div className={`h-[350px] relative bg-gradient-to-br ${selectedApp.color} flex items-center justify-center`}>
                                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
                                <button
                                    onClick={() => this.setState({ view: 'browse' })}
                                    className="absolute top-8 left-8 w-14 h-14 bg-white/20 backdrop-blur-xl hover:bg-white/40 rounded-3xl flex items-center justify-center text-white text-2xl transition-all z-20 shadow-2xl"
                                >←</button>

                                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent"></div>

                                <div className="relative z-10 flex flex-col items-center transform -translate-y-4">
                                    <div className="w-40 h-40 rounded-[48px] bg-white p-6 shadow-2xl mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-700">
                                        <img src={selectedApp.icon} className="w-full h-full object-contain" />
                                    </div>
                                </div>
                            </div>

                            <div className="px-12 md:px-24 flex-1 pb-20">
                                <div className="text-center mb-16">
                                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">{selectedApp.title}</h1>
                                    <div className="flex items-center justify-center gap-8 mb-10">
                                        <div className="flex flex-col items-center">
                                            <span className="font-black text-2xl text-slate-800">{selectedApp.rating} ★</span>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Average User Rating</span>
                                        </div>
                                        <div className="w-px h-10 bg-slate-100"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="font-black text-2xl text-slate-800">{selectedApp.downloads}</span>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Installs</span>
                                        </div>
                                        <div className="w-px h-10 bg-slate-100"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="font-black text-2xl text-slate-800 capitalize">{selectedApp.category}</span>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Top Rated In</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                                        {selectedApp.tags?.map(tag => (
                                            <span key={tag} className="px-5 py-2 bg-[#f4f7fa] rounded-full text-sm font-black text-slate-600 uppercase tracking-tighter">#{tag}</span>
                                        ))}
                                    </div>

                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => !disabled_apps.includes(selectedApp.id) ? {} : this.installApp(selectedApp)}
                                            className={`px-16 py-5 rounded-[24px] text-xl font-black shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${!disabled_apps.includes(selectedApp.id) ? 'bg-slate-100 text-slate-400 shadow-none cursor-default' :
                                                'bg-blue-600 text-white hover:shadow-blue-500/50'
                                                }`}
                                        >
                                            {!disabled_apps.includes(selectedApp.id) ? 'ALREADY INSTALLED' : `INSTALL FOR ${(selectedApp.price || 'Free').toUpperCase()}`}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 border-t border-slate-50 pt-16">
                                    <div className="md:col-span-2">
                                        <h3 className="text-3xl font-black text-slate-800 mb-6 tracking-tighter">Product Description</h3>
                                        <p className="text-xl text-slate-600 leading-relaxed font-medium">
                                            {selectedApp.description} Explore a world of possibilities with {selectedApp.title}. Designed specifically for efficiency and high-performance, it integrates perfectly into your workflow.
                                            Whether you are a professional or a casual user, this app provides the tools you need to succeed in the modern digital age.
                                        </p>

                                        <div className="mt-20">
                                            <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter">Ratings & Reviews</h3>
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                <div className="bg-[#f8fafc] p-8 rounded-[40px] border border-slate-100 shadow-sm">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500"></div>
                                                            <span className="font-black text-slate-800">John Doe</span>
                                                        </div>
                                                        <span className="text-amber-400 text-sm">★★★★★</span>
                                                    </div>
                                                    <p className="text-slate-600 font-medium italic">"Absolutely game changing! The best app I've used on this OS."</p>
                                                </div>
                                                <div className="bg-[#f8fafc] p-8 rounded-[40px] border border-slate-100 shadow-sm">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500"></div>
                                                            <span className="font-black text-slate-800">Jane Smith</span>
                                                        </div>
                                                        <span className="text-amber-400 text-sm">★★★★☆</span>
                                                    </div>
                                                    <p className="text-slate-600 font-medium italic">"Very smooth experience, would love to see more features!"</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Information</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-400 font-bold">Developer</span>
                                                <span className="text-slate-800 font-black">Alphery Studio</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-400 font-bold">Size</span>
                                                <span className="text-slate-800 font-black">124.5 MB</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-400 font-bold">Version</span>
                                                <span className="text-slate-800 font-black">2.4.0</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                                <span className="text-slate-400 font-bold">Price</span>
                                                <span className="text-slate-800 font-black">{selectedApp.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                    
                    @keyframes gradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .animate-gradient-slow {
                        background-size: 200% 200%;
                        animation: gradient 15s ease infinite;
                    }
                `}</style>
            </div>
        );
    }
}

export const displayAppStore = () => {
    return <AppStoreWithAuth />;
}

export default AppStore;
