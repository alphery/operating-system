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
            displaySize: "medium"
        }
    }

    changeSortOrder = (order) => { this.setState({ sortOrder: order }); }
    changeDisplaySize = (size) => { this.setState({ displaySize: size }); }

    componentDidMount() {
        // ReactGA.pageview("/desktop"); // Removed: GA not initialized
        this.fetchAppsData();
        this.setContextListeners();
        this.setEventListeners();
        this.checkForNewFolders();
        window.addEventListener('app_status_changed', this.fetchAppsData);
    }

    componentWillUnmount() {
        this.removeContextListeners();
        window.removeEventListener('app_status_changed', this.fetchAppsData);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.user !== this.props.user) {
            this.checkForNewFolders();
            this.fetchAppsData();
        }
    }

    checkForNewFolders = () => {
        let username = this.props.user ? this.props.user.username : null;
        if (!username) return;

        const savedDesktopApps = SessionManager.getDesktopApps(username);
        if (savedDesktopApps.length > 0) {
            apps.forEach(app => {
                if (savedDesktopApps.includes(app.id)) app.desktop_shortcut = true;
            });
        }
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
        e.preventDefault();
        this.hideAllContextMenu();
        switch (e.target.dataset.context) {
            case "desktop-area":
                ReactGA.event({ category: `Context Menu`, action: `Opened Desktop Context Menu` });
                this.showContextMenu(e, "desktop");
                break;
            default:
                ReactGA.event({ category: `Context Menu`, action: `Opened Default Context Menu` });
                this.showContextMenu(e, "default");
        }
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

        const userUid = this.props.user ? this.props.user.uid : 'guest';
        const username = this.props.user ? this.props.user.username : 'guest';
        const storageKey = `disabled_apps_${userUid}`;
        const disabledFromStorage = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(storageKey) || '[]') : [];

        // Get user-specific favorites/desktop settings
        const userFavorites = JSON.parse(localStorage.getItem(`${username}_dock_apps_v2`) || '{}');
        const userDesktop = JSON.parse(localStorage.getItem(`${username}_desktop_apps`) || '[]');

        apps.forEach((app) => {
            const user = this.props.user;
            const hasPermission = !user ||
                (user.permissions && user.permissions.includes("all_apps")) ||
                (user.permissions && user.permissions.includes(app.id));

            if (!hasPermission && user) return;

            const isDisabled = app.disabled || disabledFromStorage.includes(app.id);

            focused_windows[app.id] = false;
            closed_windows[app.id] = true;
            disabled_apps[app.id] = isDisabled;

            // Priority: User setting > Default config
            favourite_apps[app.id] = userFavorites[app.id] !== undefined ? userFavorites[app.id] : app.favourite;

            if (this.state.closed_windows[app.id] !== undefined && !isDisabled) {
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

            // Priority: User setting > Default config
            const isOnDesktop = userDesktop.length > 0 ? userDesktop.includes(app.id) : app.desktop_shortcut;
            if (isOnDesktop) desktop_apps.push(app.id);
        });

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
            let favourite_apps = this.state.favourite_apps;

            setTimeout(() => {
                favourite_apps[objId] = true;
                closed_windows[objId] = false;
                this.setState({ closed_windows, favourite_apps, allAppsView: false }, () => this.focus(objId));
                this.app_stack.push(objId);
            }, 200);
        }
    }

    closeApp = (objId) => {
        this.app_stack.splice(this.app_stack.indexOf(objId), 1);
        this.giveFocusToLastApp();
        this.hideSideBar(null, false);
        let closed_windows = this.state.closed_windows;
        let favourite_apps = this.state.favourite_apps;
        if (this.initFavourite[objId] === false) favourite_apps[objId] = false;
        closed_windows[objId] = true;
        this.setState({ closed_windows, favourite_apps });
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
                }
                windowsJsx.push(<Window key={index} {...props} />);
            }
        });
        return windowsJsx;
    }

    addNewFolder = () => { this.setState({ showNameBar: true }); }

    addToDesktop = (appId) => {
        const username = this.props.user ? this.props.user.username : 'guest';
        let desktop_apps = [...this.state.desktop_apps];
        if (!desktop_apps.includes(appId)) desktop_apps.push(appId);
        this.setState({ desktop_apps });
        localStorage.setItem(`${username}_desktop_apps`, JSON.stringify(desktop_apps));
    }

    addAppToDesktop = (appId) => { this.addToDesktop(appId); }

    removeAppFromDesktop = (appId) => {
        const username = this.props.user ? this.props.user.username : 'guest';
        let desktop_apps = this.state.desktop_apps.filter(id => id !== appId);
        this.setState({ desktop_apps });
        localStorage.setItem(`${username}_desktop_apps`, JSON.stringify(desktop_apps));
    }

    addAppToDock = (appId) => {
        const username = this.props.user ? this.props.user.username : 'guest';
        let favourite_apps = { ...this.state.favourite_apps };
        favourite_apps[appId] = true;
        this.setState({ favourite_apps });
        localStorage.setItem(`${username}_dock_apps`, JSON.stringify(favourite_apps));
    }

    removeAppFromDock = (appId) => {
        const username = this.props.user ? this.props.user.username : 'guest';
        let favourite_apps = { ...this.state.favourite_apps };
        favourite_apps[appId] = false;
        this.setState({ favourite_apps });
        localStorage.setItem(`${username}_dock_apps`, JSON.stringify(favourite_apps));
    }

    handleAppContextMenu = (e, appId) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideAllContextMenu();
        this.setState({ selectedAppId: appId });
        this.showContextMenu(e, "app");
    }

    showAllApps = () => { this.setState({ allAppsView: !this.state.allAppsView }) }

    render() {
        return (
            <div className={" h-full w-full flex flex-col items-end justify-start content-start flex-wrap-reverse pt-8 bg-transparent relative overflow-hidden overscroll-none window-parent"}>
                <div className="absolute h-full w-full bg-transparent" data-context="desktop-area">
                    {this.renderWindows()}
                </div>

                <BackgroundImage img={this.props.bg_image_name} />

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
                <DefaultMenu active={this.state.context_menus.default} />
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
                    closeMenu={this.hideAllContextMenu}
                />
            </div>
        )
    }
}

function AppContextMenu({ active, appId, isFavourite, isOnDesktop, addToDesktop, removeFromDesktop, addToDock, removeFromDock, closeMenu }) {
    const handleAddToDesktop = (e) => { e.stopPropagation(); if (appId) addToDesktop(appId); closeMenu(); };
    const handleRemoveFromDesktop = (e) => { e.stopPropagation(); if (appId) removeFromDesktop(appId); closeMenu(); };
    const handleAddToDock = (e) => { e.stopPropagation(); if (appId) addToDock(appId); closeMenu(); };
    const handleRemoveFromDock = (e) => { e.stopPropagation(); if (appId) removeFromDock(appId); closeMenu(); };

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
        </div>
    );
}

export default Desktop;