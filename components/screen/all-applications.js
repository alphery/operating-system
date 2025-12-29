import React from 'react';
import UbuntuApp from '../base/ubuntu_app';

export class AllApplications extends React.Component {
    constructor() {
        super();
        this.state = {
            query: "",
            apps: [],
            category: 0, // 0 for all, 1 for frequent
            isAnimating: true
        }
    }

    componentDidMount() {
        this.setState({
            apps: this.props.apps,
            isAnimating: false // Start animation immediately
        });
    }

    handleChange = (e) => {
        this.setState({
            query: e.target.value,
            apps: e.target.value === "" || e.target.value === null ?
                this.props.apps : this.state.apps.filter(
                    (app) => app.title.toLowerCase().includes(e.target.value.toLowerCase())
                )
        })
    }

    renderApps = () => {

        let appsJsx = [];
        let frequentAppsInfo = JSON.parse(localStorage.getItem("frequentApps"));
        let getFrequentApps = () => {
            let frequentApps = [];
            if (frequentAppsInfo) {
                frequentAppsInfo.forEach((app_info) => {
                    let app = this.props.apps.find(app => app.id === app_info.id);
                    if (app) {
                        frequentApps.push(app);
                    }
                })
            }
            return frequentApps;
        }

        let apps = this.state.category === 0 ? [...this.state.apps] : getFrequentApps();
        apps.forEach((app, index) => {
            const props = {
                name: app.title,
                id: app.id,
                icon: app.icon,
                openApp: this.props.openApp,
                isDesktop: false,
                onContextMenu: this.props.onAppContextMenu,
                displayMode: 'launchpad'
            }

            appsJsx.push(
                <UbuntuApp key={index} {...props} />
            );
        });
        return appsJsx;
    }

    handleSwitch = (category) => {
        if (category !== this.state.category) {
            this.setState({
                category: category
            })
        }
    }

    render() {
        return (
            <>
                <div
                    onClick={(e) => {
                        // Only close if clicking the background itself
                        if (e.target === e.currentTarget) this.props.closeMenu ? this.props.closeMenu() : null;
                    }}
                    className={`fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-2xl transition-all duration-300 ease-out flex flex-col items-center justify-start pt-20 ${this.state.isAnimating ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                    style={{ animation: 'zoomIn 0.2s ease-out' }}
                >
                    {/* Search Bar - Launchpad Style */}
                    <div className="w-full max-w-md mb-12 px-4 z-50">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <img className="w-4 h-4 opacity-50 group-focus-within:opacity-100 transition-opacity" alt="search icon" src={'./images/logos/search.png'} />
                            </div>
                            <input
                                className="w-full bg-white bg-opacity-10 text-white placeholder-gray-300 border border-white border-opacity-10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:bg-opacity-20 focus:border-opacity-30 transition-all text-center placeholder:text-center focus:text-left focus:placeholder:text-left shadow-lg backdrop-blur-md"
                                placeholder="Search"
                                value={this.state.query}
                                onChange={this.handleChange}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Apps Grid - Launchpad Style */}
                    <div
                        className="w-full max-w-6xl flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-10 pb-20"
                        onClick={(e) => {
                            // If clicking in the grid empty space, close. 
                            // But Grid items stop propagation? UbuntuApp should probably not propagate if clicked, but let's be safe.
                            if (e.target === e.currentTarget) this.props.closeMenu ? this.props.closeMenu() : null;
                        }}
                    >
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-y-10 gap-x-4 justify-items-center">
                            {this.renderApps()}
                        </div>

                        {/* Empty State */}
                        {this.state.apps.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 text-white opacity-60">
                                <span className="text-xl">No apps found</span>
                            </div>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    @keyframes zoomIn {
                        from {
                            opacity: 0;
                            transform: scale(1.1);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    
                    /* Hide scrollbar for cleaner look implicitly, or keep custom if needed */
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 0px; /* Hidden scrollbar for Launchpad look */
                    }
                `}</style>
            </>
        )
    }
}

export default AllApplications;