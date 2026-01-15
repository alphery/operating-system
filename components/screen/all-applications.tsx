import React, { useState, useEffect, useMemo } from 'react';
import UbuntuApp from '../base/ubuntu_app';

interface AllApplicationsProps {
    apps: any[];
    recentApps: string[];
    openApp: (id: string) => void;
    onAppContextMenu: (e: any, id: string) => void;
    visible: boolean;
    closeMenu: () => void;
    disabled_apps: { [key: string]: boolean };
}

const AllApplications: React.FC<AllApplicationsProps> = (props) => {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState(0); // 0 for all, 1 for frequent
    const [isRendered, setIsRendered] = useState(false); // To handle lazy rendering only after first open attempt if desired, but for now we render always or on first active.

    // Optimize: Focus input when visible
    useEffect(() => {
        if (props.visible) {
            // Reset query when opening if desired, or keep it
            // setQuery("");
        }
    }, [props.visible]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    // Memoize the filtered apps list to avoid recalculation on every render
    const filteredApps = useMemo(() => {
        let apps = props.apps;

        // Filter by search query
        if (query) {
            const lowerQuery = query.toLowerCase();
            apps = apps.filter(app => app.title.toLowerCase().includes(lowerQuery));
        }

        // Filter by category (Frequent)
        if (category === 1) {
            const frequentAppsInfo = JSON.parse(localStorage.getItem("frequentApps") || "[]");
            const frequentIds = new Set(frequentAppsInfo.map((info: any) => info.id));
            apps = apps.filter(app => frequentIds.has(app.id));
        }

        // Filter out disabled apps
        return apps.filter(app => !props.disabled_apps[app.id]);
    }, [props.apps, query, category, props.disabled_apps, props.visible]); // Recalculate when visible changes to ensure fresh data

    return (
        <>
            <div
                className={`all-apps-overlay ${props.visible ? 'active' : ''}`}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        e.stopPropagation();
                        props.closeMenu();
                    }
                }}
            >
                {/* Search Bar */}
                <div className={`search-container ${props.visible ? 'slide-in' : ''}`}>
                    <div className="search-wrapper">
                        <div className="search-icon-wrapper">
                            <img className="search-icon" alt="search icon" src={'./images/logos/search.png'} />
                        </div>
                        <input
                            className="search-input"
                            placeholder="Search"
                            value={query}
                            onChange={handleChange}
                            autoFocus={props.visible} // Only autofocus when visible
                        />
                    </div>
                </div>

                {/* Apps Grid */}
                <div
                    className="apps-grid-container"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            e.stopPropagation();
                            props.closeMenu();
                        }
                    }}
                >
                    <div className="apps-grid smooth-scroll">
                        {filteredApps.map((app, index) => (
                            <div
                                key={app.id}
                                className={`app-icon-wrapper ${props.visible ? 'fade-in-up' : ''}`}
                                style={{
                                    animationDelay: `${index * 5}ms`,
                                    opacity: props.visible ? 1 : 0 // Force hide when not visible to prevent layout flash
                                }}
                            >
                                <UbuntuApp
                                    name={app.title}
                                    id={app.id}
                                    icon={app.icon}
                                    openApp={(id) => {
                                        props.openApp(id);
                                        props.closeMenu();
                                    }}
                                    isDesktop={false}
                                    onContextMenu={props.onAppContextMenu}
                                    displayMode='launchpad'
                                />
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredApps.length === 0 && (
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
                    backface-visibility: hidden;
                    perspective: 1000px;
                    
                    /* Visibility Handling */
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                    transform: scale(1.1);
                    transition: opacity 200ms ease, transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1), visibility 200ms;
                }
                
                /* Active State (Visible) */
                .all-apps-overlay.active {
                    opacity: 1;
                    visibility: visible;
                    pointer-events: all;
                    transform: scale(1);
                }
                
                /* === Search Bar Animation === */
                .search-container {
                    width: 100%;
                    max-width: 28rem;
                    margin-bottom: 3rem;
                    padding: 0 1rem;
                    z-index: 60;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: opacity 300ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
                }

                .search-container.slide-in {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                /* === Search Input Styling === */
                .search-wrapper {
                    position: relative;
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
                    transition: all 200ms ease;
                }
                
                .search-input:focus {
                    background: rgba(255, 255, 255, 0.18);
                    border-color: rgba(255, 255, 255, 0.25);
                    text-align: left;
                    transform: scale(1.02);
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
                }
                
                .apps-grid-container::-webkit-scrollbar {
                    display: none;
                }
                
                .apps-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem 1rem;
                    justify-items: center;
                    padding: 1rem;
                }
                
                @media (min-width: 640px) { .apps-grid { grid-template-columns: repeat(5, 1fr); } }
                @media (min-width: 768px) { .apps-grid { grid-template-columns: repeat(6, 1fr); } }
                
                /* === App Icon Animation === */
                .app-icon-wrapper {
                    opacity: 0;
                    transform: translateY(20px) scale(0.9);
                    transition: opacity 300ms ease, transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .app-icon-wrapper.fade-in-up {
                    opacity: 1;
                    transform: translateY(0) scale(1);
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
            `}</style>
        </>
    );
}

export default AllApplications;