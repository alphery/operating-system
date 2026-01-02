import React from 'react';
import UbuntuApp from '../base/ubuntu_app';

export class AllApplications extends React.Component {
    constructor() {
        super();
        this.state = {
            query: "",
            apps: [],
            category: 0 // 0 for all, 1 for frequent
        }
    }

    componentDidMount() {
        this.setState({
            apps: this.props.apps
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

        let apps = (this.state.category === 0 ? [...this.state.apps] : getFrequentApps()).filter(app => !this.props.disabled_apps[app.id]);
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
                <div
                    key={index}
                    className="app-icon-wrapper"
                    style={{
                        animationDelay: `${index * 6}ms`
                    }}
                >
                    <UbuntuApp {...props} />
                </div>
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
        const { isClosing } = this.state;

        return (
            <>
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            e.stopPropagation();
                            this.props.closeMenu?.();
                        }
                    }}
                    className="all-apps-overlay"
                >
                    {/* Search Bar - macOS Launchpad Style */}
                    <div className="search-container">
                        <div className="search-wrapper">
                            <div className="search-icon-wrapper">
                                <img className="search-icon" alt="search icon" src={'./images/logos/search.png'} />
                            </div>
                            <input
                                className="search-input"
                                placeholder="Search"
                                value={this.state.query}
                                onChange={this.handleChange}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Apps Grid - macOS Launchpad Style */}
                    <div
                        className="apps-grid-container"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                e.stopPropagation();
                                this.props.closeMenu?.();
                            }
                        }}
                    >
                        <div className="apps-grid">
                            {this.renderApps()}
                        </div>

                        {/* Empty State */}
                        {this.state.apps.length === 0 && (
                            <div className="empty-state">
                                <span className="empty-text">No apps found</span>
                            </div>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    /* === macOS Launchpad Animation System === */
                    
                    .all-apps-overlay {
                        position: fixed;
                        inset: 0;
                        z-index: 50;
                        background: rgba(0, 0, 0, 0.4);
                        backdrop-filter: blur(40px) saturate(180%);
                        -webkit-backdrop-filter: blur(40px) saturate(180%);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: flex-start;
                        padding-top: 5rem;
                        
                        /* GPU Acceleration */
                        will-change: opacity, transform;
                        transform: translate3d(0, 0, 0);
                        backface-visibility: hidden;
                        perspective: 1000px;
                        
                        /* Opening Animation - macOS style */
                        animation: launchpadOpen 150ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
                    }
                    
                    .all-apps-overlay.closing {
                        animation: launchpadClose 120ms cubic-bezier(0.42, 0, 1, 1) forwards;
                    }
                    
                    @keyframes launchpadOpen {
                        from {
                            opacity: 0;
                            transform: translate3d(0, 0, 0) scale(1.15);
                        }
                        to {
                            opacity: 1;
                            transform: translate3d(0, 0, 0) scale(1);
                        }
                    }
                    
                    @keyframes launchpadClose {
                        from {
                            opacity: 1;
                            transform: translate3d(0, 0, 0) scale(1);
                        }
                        to {
                            opacity: 0;
                            transform: translate3d(0, 0, 0) scale(1.1);
                        }
                    }
                    
                    /* === Search Bar === */
                    
                    .search-container {
                        width: 100%;
                        max-width: 28rem;
                        margin-bottom: 3rem;
                        padding: 0 1rem;
                        z-index: 60;
                        animation: searchFadeIn 150ms cubic-bezier(0.25, 0.1, 0.25, 1) 30ms backwards;
                    }
                    
                    @keyframes searchFadeIn {
                        from {
                            opacity: 0;
                            transform: translate3d(0, -10px, 0);
                        }
                        to {
                            opacity: 1;
                            transform: translate3d(0, 0, 0);
                        }
                    }
                    
                    .search-wrapper {
                        position: relative;
                        will-change: transform;
                        transform: translate3d(0, 0, 0);
                    }
                    
                    .search-icon-wrapper {
                        position: absolute;
                        top: 0;
                        bottom: 0;
                        left: 0;
                        padding-left: 0.75rem;
                        display: flex;
                        align-items: center;
                        pointer-events: none;
                    }
                    
                    .search-icon {
                        width: 1rem;
                        height: 1rem;
                        opacity: 0.5;
                        transition: opacity 120ms cubic-bezier(0.25, 0.1, 0.25, 1);
                    }
                    
                    .search-input {
                        width: 100%;
                        background: rgba(255, 255, 255, 0.12);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 1rem;
                        padding: 0.5rem 1rem 0.5rem 2.5rem;
                        outline: none;
                        text-align: center;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        transition: all 120ms cubic-bezier(0.25, 0.1, 0.25, 1);
                        will-change: transform, background-color;
                        transform: translate3d(0, 0, 0);
                    }
                    
                    .search-input::placeholder {
                        color: rgba(255, 255, 255, 0.6);
                        text-align: center;
                        transition: all 120ms cubic-bezier(0.25, 0.1, 0.25, 1);
                    }
                    
                    .search-input:focus {
                        background: rgba(255, 255, 255, 0.18);
                        border-color: rgba(255, 255, 255, 0.25);
                        text-align: left;
                        transform: translate3d(0, 0, 0) scale(1.02);
                    }
                    
                    .search-input:focus::placeholder {
                        text-align: left;
                    }
                    
                    .search-wrapper:focus-within .search-icon {
                        opacity: 1;
                    }
                    
                    /* === Apps Grid === */
                    
                    .apps-grid-container {
                        width: 100%;
                        max-width: 80rem;
                        flex: 1;
                        overflow-y: auto;
                        overflow-x: hidden;
                        padding: 0 1rem 5rem;
                        -webkit-overflow-scrolling: touch;
                        scroll-behavior: smooth;
                    }
                    
                    .apps-grid-container::-webkit-scrollbar {
                        width: 0;
                        display: none;
                    }
                    
                    .apps-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 2.5rem 1rem;
                        justify-items: center;
                        padding: 1rem;
                    }
                    
                    @media (min-width: 640px) {
                        .apps-grid {
                            grid-template-columns: repeat(5, 1fr);
                        }
                    }
                    
                    @media (min-width: 768px) {
                        .apps-grid {
                            grid-template-columns: repeat(6, 1fr);
                        }
                    }
                    
                    @media (min-width: 1024px) {
                        .apps-grid {
                            grid-template-columns: repeat(7, 1fr);
                        }
                    }
                    
                    /* === App Icon Stagger Animation === */
                    
                    .app-icon-wrapper {
                        animation: iconFadeIn 180ms cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
                        will-change: transform, opacity;
                        transform: translate3d(0, 0, 0);
                    }
                    
                    .all-apps-overlay.closing .app-icon-wrapper {
                        animation: iconFadeOut 100ms cubic-bezier(0.42, 0, 1, 1) forwards;
                    }
                    
                    @keyframes iconFadeIn {
                        from {
                            opacity: 0;
                            transform: translate3d(0, 20px, 0) scale(0.8);
                        }
                        to {
                            opacity: 1;
                            transform: translate3d(0, 0, 0) scale(1);
                        }
                    }
                    
                    @keyframes iconFadeOut {
                        from {
                            opacity: 1;
                            transform: translate3d(0, 0, 0) scale(1);
                        }
                        to {
                            opacity: 0;
                            transform: translate3d(0, 10px, 0) scale(0.9);
                        }
                    }
                    
                    /* === Empty State === */
                    
                    .empty-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 16rem;
                        color: white;
                        opacity: 0.6;
                    }
                    
                    .empty-text {
                        font-size: 1.25rem;
                    }
                    
                    /* === Reduced Motion Support === */
                    
                    @media (prefers-reduced-motion: reduce) {
                        .all-apps-overlay,
                        .search-container,
                        .app-icon-wrapper,
                        .search-input {
                            animation: none !important;
                            transition: none !important;
                        }
                    }
                `}</style>
            </>
        )
    }
}

export default AllApplications;