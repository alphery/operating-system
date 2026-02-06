import React, { Component } from 'react';
import BackgroundImage from '../util components/background-image';
import SideBar from './side_bar';
import Window from '../base/window';
import UbuntuApp from '../base/ubuntu_app';
import DesktopMenu from '../context menus/desktop-menu';
import DefaultMenu from '../context menus/default';
import AllApplications from './all-applications';
import apps from '../../apps.config';
import $ from 'jquery';
import ReactGA from 'react-ga';
import SessionManager from '../util components/session';

export class Desktop extends Component {
    constructor() {
        super();
        this.app_stack = [];
        this.initFavourite = {};
        this.allWindowClosed = false;
        this.state = {
            focused_windows: {},
            closed_windows: {},
            allAppsView: false,
            overlapped_windows: {},
            disabled_apps: {},
            favourite_apps: {},
            hideSideBar: false,
            minimized_windows: {},
            desktop_apps: [],
            context_menus: {
                desktop: false,
                default: false,
                app: false,
            },
            selectedAppId: null,
            showNameBar: false,
            sortOrder: "name",
            displaySize: "medium",
            scaleFactor: 1
        }
    }

    changeSortOrder = (order) => { this.setState({ sortOrder: order }); }
    changeDisplaySize = (size) => { this.setState({ displaySize: size }); }
    handleScaleChange = (e) => {
        if (e.detail) {
            this.setState({ scaleFactor: e.detail / 100 });
        }
    }

    componentDidMount() {
        // ReactGA.pageview("/desktop"); // Removed: GA not initialized
        this.fetchAppsData = this.fetchAppsData.bind(this);
        this.fetchAppsData();
        this.setContextListeners();
        this.setEventListeners();
        this.checkForNewFolders();

        // Load initial scale factor from settings
        try {
            const saved = localStorage.getItem('system_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings.scaleFactor) {
                    this.setState({ scaleFactor: settings.scaleFactor / 100 });
                }
            }
        } catch (e) {
            console.error('Error loading scale factor:', e);
        }

        window.addEventListener('app_status_changed', this.fetchAppsData);
        window.addEventListener('system_scaleFactor_change', this.handleScaleChange);
        // Listen for global open_app events from Navbar or other components
        window.addEventListener('open_app', (e) => {
            if (e.detail && e.detail.appId) {
                this.openApp(e.detail.appId);
            }
        });
        console.log("[Desktop] Component mounted, listening for app_status_changed and open_app");
    }

    componentWillUnmount() {
        this.removeContextListeners();
        window.removeEventListener('app_status_changed', this.fetchAppsData);
        window.removeEventListener('system_scaleFactor_change', this.handleScaleChange);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.user !== this.props.user || prevProps.userData !== this.props.userData) {
            this.checkForNewFolders();
            this.fetchAppsData();
        }
    }

    checkForNewFolders = () => {
        let username = this.props.user ? this.props.user.username : null;
        if (!username) return;

        const savedDesktopApps = SessionManager.getDesktopApps(username);
        // Mutation removed: We don't want to modify the global apps config based on session state.
        // Logic moved to fetchAppsData where we check SessionManager directly if needed, 
        // but now we strictly rely on userDesktop list.
        this.fetchAppsData();
    }

    setEventListeners = () => {
        const settingsEl = document.getElementById("open-settings");
        if (settingsEl) {
            settingsEl.addEventListener("click", () => {
                this.openApp("settings");
            });
        }
    }

    setContextListeners = () => {
        document.addEventListener('contextmenu', this.checkContextMenu);
        document.addEventListener('click', this.hideAllContextMenu);
    }

    removeContextListeners = () => {
        document.removeEventListener("contextmenu", this.checkContextMenu);
        document.removeEventListener("click", this.hideAllContextMenu);
    }

    checkContextMenu = (e) => {
        // Only handle right-clicks on specific areas with custom menus
        if (e.target.dataset.context === "desktop-area") {
            e.preventDefault();
            this.hideAllContextMenu();
            ReactGA.event({ category: `Context Menu`, action: `Opened Desktop Context Menu` });
            this.showContextMenu(e, "desktop");
        }
        // For everything else, allow native browser right-click menu
    }

    showContextMenu = (e, menuName) => {
        let { posx, posy } = this.getMenuPosition(e);
        let contextMenu = document.getElementById(`${menuName}-menu`);
        if (!contextMenu) return;

        if (posx + $(contextMenu).width() > window.innerWidth) posx -= $(contextMenu).width();
        if (posy + $(contextMenu).height() > window.innerHeight) posy -= $(contextMenu).height();

        contextMenu.style.left = posx + "px";
        contextMenu.style.top = posy + "px";

        this.setState({ context_menus: { ...this.state.context_menus, [menuName]: true } });
    }

    hideAllContextMenu = () => {
        let menus = this.state.context_menus;
        Object.keys(menus).forEach(key => menus[key] = false);
        this.setState({ context_menus: menus });
    }

    getMenuPosition = (e) => {
        var posx = 0;
        var posy = 0;
        if (!e) e = window.event;
        if (e.pageX || e.pageY) {
            posx = e.pageX; posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        return { posx, posy }
    }

    fetchAppsData = () => {
        let focused_windows = {}, closed_windows = {}, disabled_apps = {}, favourite_apps = {}, overlapped_windows = {}, minimized_windows = {};
        let desktop_apps = [];

        // Safe access to ID with fallback (using platformUser.id if available)
        const userUid = (this.props.userData && this.props.userData.id) ? this.props.userData.id :
            ((this.props.user && this.props.user.uid) ? this.props.user.uid : 'guest');
        // Bumped key to _v4 for clean state
        const storageKey = `disabled_apps_${userUid}_v4`;

        // Priority system for disabled apps:
        // 1. Firestore (cloud - survives browser changes & history clears) for authenticated users
        // 2. localStorage (local cache) for guest users or as fallback
        let disabledFromStorage = [];
        const isAuthenticated = this.props.user && this.props.user.uid;

        if (isAuthenticated && this.props.userData && this.props.userData.disabledApps) {
            // Load from Firestore for authenticated users (persists across browsers)
            disabledFromStorage = this.props.userData.disabledApps || [];
            console.log(`[Desktop] Authenticated user - Loading disabled apps from Firestore:`, disabledFromStorage);

            // Sync to localStorage as cache
            localStorage.setItem(storageKey, JSON.stringify(disabledFromStorage));
        } else {
            // Fallback to localStorage for guest or when Firestore data isn't available yet
            const hasExistingData = localStorage.getItem(storageKey) !== null;
            disabledFromStorage = hasExistingData ? JSON.parse(localStorage.getItem(storageKey) || '[]') : [];

            // For new users, initialize with only default installed apps
            if (!hasExistingData) {
                // Determine what can be installed
                const allowedApps = (this.props.userData && this.props.userData.allowedApps) ? this.props.userData.allowedApps : null;

                const DEFAULT_INSTALLED = window.DEFAULT_INSTALLED_APPS || [
                    'chrome', 'messenger', 'calendar', 'weather',
                    'settings', 'files', 'trash', 'gedit', 'app-store'
                ];

                // Logic: Disable everything that is NOT in DEFAULT_INSTALLED
                // OR disable everything NOT in allowedApps
                apps.forEach(app => {
                    const isSystem = ['app-store', 'settings', 'messenger', 'trash'].includes(app.id);
                    const isAllowed = allowedApps === null || allowedApps.includes(app.id) || isSystem;
                    const isDefault = DEFAULT_INSTALLED.includes(app.id);

                    // If it's not allowed, it MUST be disabled
                    // If it's allowed but not default, it starts as disabled (must be installed from store)
                    if (!isAllowed || !isDefault) {
                        if (!disabledFromStorage.includes(app.id)) {
                            disabledFromStorage.push(app.id);
                        }
                    }
                });

                // Save the initial state for new users
                localStorage.setItem(storageKey, JSON.stringify(disabledFromStorage));
                console.log(`[Desktop] New user detected. Initialized disabled apps:`, disabledFromStorage);

                // Sync to Firestore if authenticated
                if (isAuthenticated && this.props.updateUserData) {
                    this.props.updateUserData({ disabledApps: disabledFromStorage })
                        .catch(err => console.warn("Failed to sync initial disabled apps to Firestore:", err));
                }
            }
        }

        // SYSTEM APPS SAFEGUARD: Ensure these are never disabled
        const SYSTEM_APPS = ['app-store', 'settings', 'messenger', 'trash'];
        disabledFromStorage = disabledFromStorage.filter(id => !SYSTEM_APPS.includes(id));

        // Get user-specific favorites/desktop settings
        // changed key to _v6 to force reset for all users as requested
        let userFavorites = JSON.parse(localStorage.getItem(`${userUid}_dock_apps_v6`) || 'null');
        const userDesktop = JSON.parse(localStorage.getItem(`${userUid}_desktop_apps_v3`) || '[]');

        // Fix for empty object legacy state: If we have an empty object, treat it as no preferences
        if (userFavorites && Object.keys(userFavorites).length === 0) {
            userFavorites = null;
        }

        // DEFAULT DOCK APPS (Desktop/Global Defaults) - 6 Apps
        const DEFAULT_DOCK_APPS = ['files', 'calendar', 'weather', 'settings', 'messenger', 'app-store'];


        let installedCount = 0;
        apps.forEach((app) => {
            const user = this.props.user;
            const userData = this.props.userData;

            // SYSTEM APPS: Always available and installed
            const SYSTEM_APPS = ['app-store', 'settings', 'messenger', 'trash'];
            const isSystemApp = SYSTEM_APPS.includes(app.id);

            // PERMISSION CHECK: Determines App Store visibility (not desktop visibility)
            // Super Admin: Has access to all apps
            // Regular Users: Access based on userData.allowedApps array
            let hasPermission = false;

            if (!user || (userData && userData.isGod)) {
                // God Mode or Guest: All apps available
                hasPermission = true;
            } else if (isSystemApp) {
                // System apps: Always available
                hasPermission = true;
            } else if (this.props.currentTenant) {
                // In the new system, tenant members see apps assigned to the tenant
                // For now, allow everything or implement tenant-app check
                hasPermission = true;
            } else {
                // Regular Firestore legacy check
                if (userData && (userData.allowedApps === undefined || userData.allowedApps === null)) {
                    hasPermission = true;
                } else if (userData && Array.isArray(userData.allowedApps)) {
                    hasPermission = userData.allowedApps.includes(app.id);
                }
            }

            // CRITICAL FIX: For managed users (with explicit allowedApps), we force installation.
            // This ensures assigned apps ALWAYS show up and cannot be "uninstalled" (hidden).
            // For standard users/admins, we respect the local disabled/uninstalled state.
            const isManaged = userData && Array.isArray(userData.allowedApps);
            const isInstalled = isManaged ? hasPermission : (hasPermission && !disabledFromStorage.includes(app.id));

            if (isInstalled) installedCount++;

            // IMPORTANT: All apps are processed (for App Store), but only installed apps show on desktop
            // This separates permissions (what CAN be installed) from installation (what IS installed)

            const isDisabled = !isInstalled; // If not installed, it's disabled

            focused_windows[app.id] = false;
            closed_windows[app.id] = true;
            disabled_apps[app.id] = isDisabled;

            // Priority: User setting > Default List > App Config
            // If userFavorites is null (never set or empty), use DEFAULT_DOCK_APPS
            if (userFavorites) {
                favourite_apps[app.id] = userFavorites[app.id] !== undefined ? userFavorites[app.id] : false;
            } else {
                // Only add to default dock if installed
                favourite_apps[app.id] = DEFAULT_DOCK_APPS.includes(app.id) && isInstalled;
            }

            // Keep existing state if available and app is installed
            if (this.state.closed_windows[app.id] !== undefined && isInstalled) {
                closed_windows[app.id] = this.state.closed_windows[app.id];
                focused_windows[app.id] = this.state.focused_windows[app.id];
                overlapped_windows[app.id] = this.state.overlapped_windows[app.id];
                minimized_windows[app.id] = this.state.minimized_windows[app.id];
            } else {
                closed_windows[app.id] = true;
                focused_windows[app.id] = false;
                overlapped_windows[app.id] = false;
                minimized_windows[app.id] = false;
            }

            // Desktop shortcuts: Only show if user explicitly added them
            // We no longer fallback to app.desktop_shortcut to prevent auto-adding new apps
            const isOnDesktop = userDesktop.includes(app.id);

            if (isOnDesktop && isInstalled) {
                desktop_apps.push(app.id);
            }
        });

        console.log(`[Desktop] fetchAppsData complete. Installed apps: ${installedCount}/${apps.length}`);

        this.setState({
            focused_windows,
            closed_windows,
            disabled_apps,
            favourite_apps,
            overlapped_windows,
            minimized_windows,
            desktop_apps
        });
        this.initFavourite = { ...favourite_apps };
    }

    openApp = (objId) => {
        ReactGA.event({ category: `Open App`, action: `Opened ${objId} window` });

        if (this.state.disabled_apps[objId]) return;

        if (this.state.minimized_windows[objId]) {
            this.focus(objId);
            var r = document.querySelector("#" + objId);
            if (r) r.style.transform = `translate(${r.style.getPropertyValue("--window-transform-x")},${r.style.getPropertyValue("--window-transform-y")}) scale(1)`;

            let minimized_windows = this.state.minimized_windows;
            minimized_windows[objId] = false;
            this.setState({ minimized_windows: minimized_windows });
            return;
        }

        if (this.app_stack.includes(objId)) this.focus(objId);
        else {
            let closed_windows = this.state.closed_windows;
            // Removed: favourite_apps modification to prevent auto-add to dock

            setTimeout(() => {
                closed_windows[objId] = false;
                this.setState({ closed_windows, allAppsView: false }, () => this.focus(objId));
                this.app_stack.push(objId);
            }, 200);
        }
    }

    closeApp = (objId) => {
        this.app_stack.splice(this.app_stack.indexOf(objId), 1);
        this.giveFocusToLastApp();
        this.hideSideBar(null, false);
        let closed_windows = this.state.closed_windows;
        // Removed: favourite_apps modification (auto-remove logic)
        closed_windows[objId] = true;
        this.setState({ closed_windows });
    }

    focus = (objId) => {
        var focused_windows = this.state.focused_windows;
        focused_windows[objId] = true;
        for (let key in focused_windows) {
            if (key !== objId) focused_windows[key] = false;
        }
        this.setState({ focused_windows });
    }

    giveFocusToLastApp = () => {
        if (!this.checkAllMinimised()) {
            for (let i = this.app_stack.length - 1; i >= 0; i--) {
                if (!this.state.minimized_windows[this.app_stack[i]]) {
                    this.focus(this.app_stack[i]);
                    break;
                }
            }
        }
    }

    checkAllMinimised = () => {
        let result = true;
        for (const key in this.state.minimized_windows) {
            if (!this.state.closed_windows[key]) result = result & this.state.minimized_windows[key];
        }
        return result;
    }

    hideSideBar = (objId, hide) => {
        if (hide === this.state.hideSideBar) return;
        if (objId === null) {
            if (hide === false) this.setState({ hideSideBar: false });
            else {
                for (const key in this.state.overlapped_windows) {
                    if (this.state.overlapped_windows[key]) {
                        this.setState({ hideSideBar: true });
                        return;
                    }
                }
            }
            return;
        }
        if (hide === false) {
            for (const key in this.state.overlapped_windows) {
                if (this.state.overlapped_windows[key] && key !== objId) return;
            }
        }
        let overlapped_windows = this.state.overlapped_windows;
        overlapped_windows[objId] = hide;
        this.setState({ hideSideBar: hide, overlapped_windows });
    }

    hasMinimised = (objId) => {
        let minimized_windows = this.state.minimized_windows;
        var focused_windows = this.state.focused_windows;
        minimized_windows[objId] = true;
        focused_windows[objId] = false;
        this.setState({ minimized_windows, focused_windows });
        this.hideSideBar(null, false);
        this.giveFocusToLastApp();
    }

    renderDesktopApps = () => {
        if (Object.keys(this.state.closed_windows).length === 0) return;
        let appsJsx = [];

        // Filter and Sort
        let appsToRender = apps.filter(app =>
            this.state.desktop_apps.includes(app.id) && !this.state.disabled_apps[app.id]
        );

        if (this.state.sortOrder === "name") {
            appsToRender.sort((a, b) => a.title.localeCompare(b.title));
        }

        appsToRender.forEach((app, index) => {
            const props = {
                name: app.title,
                id: app.id,
                icon: app.icon,
                openApp: this.openApp,
                isDesktop: true,
                onContextMenu: this.handleAppContextMenu,
                displaySize: this.state.displaySize
            }
            appsJsx.push(<UbuntuApp key={app.id} {...props} />);
        });
        return appsJsx;
    }

    renderWindows = () => {
        let windowsJsx = [];
        apps.forEach((app, index) => {
            if (this.state.closed_windows[app.id] === false) {
                const props = {
                    title: app.title,
                    id: app.id,
                    screen: app.screen,
                    addFolder: this.addToDesktop,
                    closed: this.closeApp,
                    openApp: this.openApp,
                    focus: this.focus,
                    isFocused: this.state.focused_windows[app.id],
                    hideSideBar: this.hideSideBar,
                    hasMinimised: this.hasMinimised,
                    minimized: this.state.minimized_windows[app.id],
                    changeBackgroundImage: this.props.changeBackgroundImage,
                    bg_image_name: this.props.bg_image_name,
                    scaleFactor: this.state.scaleFactor,
                }
                windowsJsx.push(<Window key={index} {...props} />);
            }
        });
        return windowsJsx;
    }

    addNewFolder = () => { this.setState({ showNameBar: true }); }

    addToDesktop = (appId) => {
        const userUid = (this.props.user && this.props.user.uid) ? this.props.user.uid : 'guest';
        let desktop_apps = [...this.state.desktop_apps];
        if (!desktop_apps.includes(appId)) desktop_apps.push(appId);
        this.setState({ desktop_apps });
        localStorage.setItem(`${userUid}_desktop_apps_v3`, JSON.stringify(desktop_apps));
    }

    addAppToDesktop = (appId) => { this.addToDesktop(appId); }

    removeAppFromDesktop = (appId) => {
        const userUid = (this.props.user && this.props.user.uid) ? this.props.user.uid : 'guest';
        let desktop_apps = this.state.desktop_apps.filter(id => id !== appId);
        this.setState({ desktop_apps });
        localStorage.setItem(`${userUid}_desktop_apps_v3`, JSON.stringify(desktop_apps));
    }

    addAppToDock = (appId) => {
        const userUid = (this.props.user && this.props.user.uid) ? this.props.user.uid : 'guest';
        let favourite_apps = { ...this.state.favourite_apps };
        favourite_apps[appId] = true;
        this.setState({ favourite_apps });
        localStorage.setItem(`${userUid}_dock_apps_v6`, JSON.stringify(favourite_apps));
    }

    removeAppFromDock = (appId) => {
        const userUid = (this.props.user && this.props.user.uid) ? this.props.user.uid : 'guest';
        let favourite_apps = { ...this.state.favourite_apps };
        favourite_apps[appId] = false;
        this.setState({ favourite_apps });
        localStorage.setItem(`${userUid}_dock_apps_v6`, JSON.stringify(favourite_apps));
    }

    handleAppContextMenu = (e, appId) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideAllContextMenu();
        this.setState({ selectedAppId: appId });
        this.showContextMenu(e, "app");
    }

    showAllApps = () => { this.setState({ allAppsView: !this.state.allAppsView }) }

    uninstallApp = (appId) => {
        const userUid = (this.props.user && this.props.user.uid) ? this.props.user.uid : 'guest';
        let disabled_apps = { ...this.state.disabled_apps };
        disabled_apps[appId] = true;
        this.setState({ disabled_apps });

        const storageKey = `disabled_apps_${userUid}_v3`;
        let currentDisabled = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (!currentDisabled.includes(appId)) {
            currentDisabled.push(appId);
            localStorage.setItem(storageKey, JSON.stringify(currentDisabled));
        }

        if (this.props.user && this.props.updateUserData) {
            this.props.updateUserData({ disabledApps: currentDisabled })
                .catch(err => console.warn("Failed to sync disabled apps:", err));
        }
        this.fetchAppsData(); // Refresh state
    }

    // Mobile Long Press Handling
    handleTouchStart = (e, appId) => {
        e.persist();
        const touch = e.touches[0];
        this.touchTimer = setTimeout(() => {
            this.isLongPress = true;
            // Create synthetic event for positioning
            const syntheticEvent = {
                preventDefault: () => { },
                stopPropagation: () => { },
                target: e.target,
                pageX: touch.pageX,
                pageY: touch.pageY,
                clientX: touch.clientX,
                clientY: touch.clientY,
                dataset: e.target.dataset || {}
            };
            this.handleAppContextMenu(syntheticEvent, appId);
        }, 600); // 600ms for long press
    }

    handleTouchEnd = () => {
        if (this.touchTimer) clearTimeout(this.touchTimer);
    }

    handleTouchMove = () => {
        if (this.touchTimer) clearTimeout(this.touchTimer);
    }

    handleMobileAppClick = (appId) => {
        if (this.isLongPress) {
            this.isLongPress = false;
            return;
        }
        this.openApp(appId);
    }

    render() {
        return (
            <div className={" h-full w-full flex flex-col items-end justify-start content-start flex-wrap-reverse pt-8 bg-transparent relative overflow-hidden overscroll-none window-parent"}>
                <div className="absolute h-full w-full bg-transparent" data-context="desktop-area">
                    {this.renderWindows()}
                </div>

                {/* Desktop Background */}
                <BackgroundImage img={this.props.bg_image_name} />

                {/* --- MOBILE LAYOUT (< md) --- */}
                <div className="flex md:hidden flex-col w-full h-full pt-8 pb-4 px-4 justify-between z-20">
                    {/* Mobile App Grid */}
                    <div className="grid grid-cols-4 gap-4 content-start overflow-y-auto pb-4">
                        {apps.filter(app => !this.state.disabled_apps[app.id] && !['settings', 'messenger', 'files', 'app-store'].includes(app.id)).map(app => (
                            <div key={app.id}
                                className="flex flex-col items-center gap-1 active:opacity-70 transition-opacity"
                                onClick={() => this.handleMobileAppClick(app.id)}
                                onTouchStart={(e) => this.handleTouchStart(e, app.id)}
                                onTouchEnd={this.handleTouchEnd}
                                onTouchMove={this.handleTouchMove}
                            >
                                <div className="w-14 h-14 bg-white bg-opacity-10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white border-opacity-20">
                                    <img src={app.icon} alt={app.title} className="w-9 h-9 drop-shadow-md" />
                                </div>
                                <span className="text-xs text-white text-center font-medium drop-shadow-md line-clamp-1 w-full">{app.title}</span>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Dock (Fixed 4 Apps) */}
                    <div className="mx-2 mb-2 bg-white bg-opacity-20 backdrop-blur-xl rounded-2xl p-3 flex justify-evenly items-center shadow-2xl border border-white border-opacity-10">
                        {apps.filter(app => ['settings', 'messenger', 'files', 'app-store'].includes(app.id) && !this.state.disabled_apps[app.id]).map(app => (
                            <div key={app.id}
                                onClick={() => this.handleMobileAppClick(app.id)}
                                onTouchStart={(e) => this.handleTouchStart(e, app.id)}
                                onTouchEnd={this.handleTouchEnd}
                                onTouchMove={this.handleTouchMove}
                                className="w-12 h-12 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <img src={app.icon} alt={app.title} className="w-10 h-10 drop-shadow-lg" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- DESKTOP LAYOUT (>= md) --- */}
                <div className="hidden md:block">
                    <SideBar apps={apps}
                        hide={this.state.hideSideBar}
                        hideSideBar={this.hideSideBar}
                        favourite_apps={this.state.favourite_apps}
                        showAllApps={this.showAllApps}
                        allAppsView={this.state.allAppsView}
                        closed_windows={this.state.closed_windows}
                        focused_windows={this.state.focused_windows}
                        isMinimized={this.state.minimized_windows}
                        openAppByAppId={this.openApp}
                        openContextMenu={this.handleAppContextMenu}
                        disabled_apps={this.state.disabled_apps}
                    />

                    {this.renderDesktopApps()}

                    <DesktopMenu
                        active={this.state.context_menus.desktop}
                        openApp={this.openApp}
                        addNewFolder={this.addNewFolder}
                        changeSortOrder={this.changeSortOrder}
                        changeDisplaySize={this.changeDisplaySize}
                        sortOrder={this.state.sortOrder}
                        displaySize={this.state.displaySize}
                    />
                </div>
                {/* DISABLED: Default context menu removed */}
                {/* <DefaultMenu active={this.state.context_menus.default} /> */}
                <AllApplications apps={apps}
                    recentApps={this.app_stack}
                    openApp={this.openApp}
                    onAppContextMenu={this.handleAppContextMenu}
                    visible={this.state.allAppsView}
                    closeMenu={this.showAllApps}
                    disabled_apps={this.state.disabled_apps}
                />

                <AppContextMenu
                    active={this.state.context_menus.app}
                    appId={this.state.selectedAppId}
                    isFavourite={this.state.selectedAppId && this.state.favourite_apps[this.state.selectedAppId] !== false}
                    isOnDesktop={this.state.selectedAppId && this.state.desktop_apps.includes(this.state.selectedAppId)}
                    addToDesktop={this.addAppToDesktop}
                    removeFromDesktop={this.removeAppFromDesktop}
                    addToDock={this.addAppToDock}
                    removeFromDock={this.removeAppFromDock}
                    uninstallApp={this.uninstallApp}
                    closeMenu={this.hideAllContextMenu}
                />
            </div>
        )
    }
}

function AppContextMenu({ active, appId, isFavourite, isOnDesktop, addToDesktop, removeFromDesktop, addToDock, removeFromDock, uninstallApp, closeMenu }) {
    const handleAddToDesktop = (e) => { e.stopPropagation(); if (appId) addToDesktop(appId); closeMenu(); };
    const handleRemoveFromDesktop = (e) => { e.stopPropagation(); if (appId) removeFromDesktop(appId); closeMenu(); };
    const handleAddToDock = (e) => { e.stopPropagation(); if (appId) addToDock(appId); closeMenu(); };
    const handleRemoveFromDock = (e) => { e.stopPropagation(); if (appId) removeFromDock(appId); closeMenu(); };
    const handleUninstall = (e) => { e.stopPropagation(); if (appId) uninstallApp(appId); closeMenu(); };

    return (
        <div id="app-menu" style={{ zIndex: 9999 }} className={(active ? " block " : " hidden ") + " cursor-default w-52 context-menu-bg border text-left font-light border-gray-900 rounded text-white py-2 absolute text-sm shadow-xl backdrop-blur-md bg-opacity-80"}>
            {!isOnDesktop ? (
                <div onClick={handleAddToDesktop} className="w-full py-1.5 px-4 hover:bg-white hover:bg-opacity-10 cursor-pointer flex items-center gap-2">
                    <span className="w-4 h-4 text-xs flex items-center justify-center">+</span>
                    <span>Add to Desktop</span>
                </div>
            ) : (
                <div onClick={handleRemoveFromDesktop} className="w-full py-1.5 px-4 hover:bg-white hover:bg-opacity-10 cursor-pointer flex items-center gap-2">
                    <span className="w-4 h-4 text-xs flex items-center justify-center">−</span>
                    <span>Remove from Desktop</span>
                </div>
            )}

            {!isFavourite ? (
                <div onClick={handleAddToDock} className="w-full py-1.5 px-4 hover:bg-white hover:bg-opacity-10 cursor-pointer flex items-center gap-2">
                    <span className="w-4 h-4 text-xs flex items-center justify-center">★</span>
                    <span>Pin to Dock</span>
                </div>
            ) : (
                <div onClick={handleRemoveFromDock} className="w-full py-1.5 px-4 hover:bg-white hover:bg-opacity-10 cursor-pointer flex items-center gap-2">
                    <span className="w-4 h-4 text-xs flex items-center justify-center">☆</span>
                    <span>Unpin from Dock</span>
                </div>
            )}

            <div className="h-px bg-white bg-opacity-10 my-1"></div>

            <div onClick={handleUninstall} className="w-full py-1.5 px-4 hover:bg-red-500 hover:text-white cursor-pointer flex items-center gap-2 text-red-300">
                <span className="w-4 h-4 text-xs flex items-center justify-center">🗑️</span>
                <span>Uninstall App</span>
            </div>
        </div>
    );
}

export default Desktop;