import React, { Component } from 'react';
import { useAuth } from '../../context/AuthContext';

// Wrapper to get user context
function AppStoreWithAuth(props) {
    const { user } = useAuth();
    return <AppStore user={user} {...props} />;
}

class AppStore extends Component {
    constructor(props) {
        super(props);
        this.state = {
            apps: [],
            disabled_apps: [],
            filter: 'all' // all, installed, uninstalled
        }
    }

    componentDidMount() {
        if (typeof window !== 'undefined') {
            this.setState({
                apps: window.ALL_APPS || [],
                disabled_apps: this.getDisabledApps()
            });
        }
    }

    componentDidUpdate(prevProps) {
        // Sync if user changes
        if (prevProps.user?.uid !== this.props.user?.uid) {
            this.setState({
                disabled_apps: this.getDisabledApps()
            });
        }
        // Sync apps if they were previously empty (window.ALL_APPS populate delay)
        if (this.state.apps.length === 0 && window.ALL_APPS && window.ALL_APPS.length > 0) {
            this.setState({ apps: window.ALL_APPS });
        }
    }

    getDisabledApps = () => {
        if (!this.props.user) return [];
        const key = `disabled_apps_${this.props.user.uid}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    toggleApp = (appId) => {
        // Prevent uninstalling critical apps
        if (['app-store', 'settings', 'users', 'messenger'].includes(appId)) {
            alert("This system app cannot be uninstalled.");
            return;
        }

        const { user } = this.props;
        if (!user) return;

        const key = `disabled_apps_${user.uid}`;
        let disabled = this.getDisabledApps();

        if (disabled.includes(appId)) {
            disabled = disabled.filter(id => id !== appId); // Install
        } else {
            disabled.push(appId); // Uninstall
        }

        this.setState({ disabled_apps: disabled });
        localStorage.setItem(key, JSON.stringify(disabled));

        // Notify Desktop to update (pass userId to be safe, though event is global)
        window.dispatchEvent(new CustomEvent('app_status_changed', { detail: { userId: user.uid } }));
    }

    render() {
        const { apps, disabled_apps, filter } = this.state;
        // If apps not loaded yet, try window again
        const appList = apps.length > 0 ? apps : (typeof window !== 'undefined' ? window.ALL_APPS || [] : []);

        const filteredApps = appList.filter(app => {
            if (filter === 'installed') return !disabled_apps.includes(app.id);
            if (filter === 'uninstalled') return disabled_apps.includes(app.id);
            return true;
        });

        return (
            <div className="flex flex-col h-full w-full bg-gray-50 text-gray-800 font-ubuntu select-none">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm">
                            <img src="./themes/Yaru/apps/app_store.png" alt="App Store" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">App Store</h1>
                    </div>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {['all', 'installed', 'uninstalled'].map(f => (
                            <button
                                key={f}
                                onClick={() => this.setState({ filter: f })}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${filter === f ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredApps.map(app => {
                            const isInstalled = !disabled_apps.includes(app.id);
                            const isSystem = ['app-store', 'settings', 'users', 'messenger'].includes(app.id);

                            return (
                                <div key={app.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <img src={app.icon} alt={app.title} className="w-14 h-14 object-contain rounded-2xl" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 truncate">{app.title}</h3>
                                        <p className="text-xs text-gray-500">{isSystem ? 'System App' : (isInstalled ? 'Installed' : 'Not Installed')}</p>
                                    </div>
                                    <button
                                        onClick={() => this.toggleApp(app.id)}
                                        disabled={isSystem}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isSystem
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : isInstalled
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {isSystem ? 'System' : (isInstalled ? 'Uninstall' : 'Install')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}

export const displayAppStore = () => {
    return <AppStoreWithAuth />;
}
