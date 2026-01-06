import React, { Component } from 'react';
import { Rnd } from 'react-rnd';
import Settings from '../apps/settings';
import ReactGA from 'react-ga';
import { displayTerminal } from '../apps/terminal'

export class Window extends Component {
    constructor() {
        super();
        this.id = null;
        this.startX = 60;
        this.startY = 10;
        this.state = {
            cursorType: "cursor-default",
            width: 60,
            height: 85,
            closed: false,
            maximized: false,
            x: 60,
            y: 10,
            parentSize: {
                height: 100,
                width: 100
            }
        }
    }

    componentDidMount() {
        this.id = this.props.id;
        this.setDefaultWindowDimenstion();

        // google analytics
        ReactGA.pageview(`/${this.id}`);

        // on window resize, resize boundary
        window.addEventListener('resize', this.resizeBoundries);
    }

    componentWillUnmount() {
        ReactGA.pageview("/desktop");
        window.removeEventListener('resize', this.resizeBoundries);
    }

    setDefaultWindowDimenstion = () => {
        if (window.innerWidth < 640) {
            this.setState({ height: 70, width: 90 }, this.resizeBoundries);
        }
        else {
            // macOS-like proportions: 70% width, 75% height
            this.setState({ height: 75, width: 70 }, this.resizeBoundries);
        }
    }

    resizeBoundries = () => {
        // Account for dock at bottom (70px) and navbar at top (32px)
        const dockHeight = 70;
        const navbarHeight = 32;

        this.setState({
            parentSize: {
                height: window.innerHeight //parent height
                    - (window.innerHeight * (this.state.height / 100.0))  // this window's height
                    - dockHeight // dock at bottom
                    - navbarHeight // navbar at top
                ,
                width: window.innerWidth // parent width
                    - (window.innerWidth * (this.state.width / 100.0)) //this window's width
                    - 80 // account for right sidebar
            }
        });
    }

    changeCursorToMove = () => {
        this.focusWindow();
        if (this.state.maximized) {
            this.restoreWindow();
        }
        this.setState({ cursorType: "cursor-default" })
    }

    changeCursorToDefault = () => {
        this.setState({ cursorType: "cursor-default" })
    }

    handleResize = (e, direction, ref, delta, position) => {
        const newWidth = (ref.offsetWidth / window.innerWidth) * 100;
        const newHeight = (ref.offsetHeight / window.innerHeight) * 100;
        this.setState({
            width: newWidth,
            height: newHeight,
            ...position
        }, () => {
            this.resizeBoundries();
            // Force re-render of app content after resize
            this.forceUpdate();
        });
    }

    handleDrag = (e, d) => {
        this.setState({ x: d.x, y: d.y });
    }

    setWinowsPosition = () => {
        var r = document.querySelector("#" + this.id);
        var rect = r.getBoundingClientRect();
        r.style.setProperty('--window-transform-x', rect.x.toFixed(1).toString() + "px");
        r.style.setProperty('--window-transform-y', (rect.y.toFixed(1) - 32).toString() + "px");
    }

    checkOverlap = () => {
        var r = document.querySelector("#" + this.id);
        var rect = r.getBoundingClientRect();
        if (rect.x.toFixed(1) < 50) { // if this window overlapps with SideBar
            this.props.hideSideBar(this.id, true);
        }
        else {
            this.props.hideSideBar(this.id, false);
        }
    }

    focusWindow = () => {
        this.props.focus(this.id);
    }

    minimizeWindow = () => {
        let posx = -310;
        if (this.state.maximized) {
            posx = -510;
        }
        this.setWinowsPosition();
        // get corrosponding sidebar app's position
        var r = document.querySelector("#sidebar-" + this.id);
        var sidebBarApp = r.getBoundingClientRect();

        r = document.querySelector("#" + this.id);
        // translate window to that position
        r.style.transform = `translate(${posx}px,${sidebBarApp.y.toFixed(1) - 240}px) scale(0.2)`;
        this.props.hasMinimised(this.id);
    }

    restoreWindow = () => {
        var r = document.querySelector("#" + this.id);
        this.setDefaultWindowDimenstion();
        // get previous position
        let posx = r.style.getPropertyValue("--window-transform-x");
        let posy = r.style.getPropertyValue("--window-transform-y");

        r.style.transform = `translate(${posx},${posy})`;
        setTimeout(() => {
            this.setState({ maximized: false });
            this.checkOverlap();
            // Force re-render of app content after restore
            this.forceUpdate();
        }, 300);
    }

    maximizeWindow = () => {
        if (this.state.maximized) {
            this.restoreWindow();
        }
        else {
            this.focusWindow();
            var r = document.querySelector("#" + this.id);
            this.setWinowsPosition();

            // Calculate height to leave space for dock (70px = ~7% of screen)
            const dockHeight = 7; // percentage
            const maxHeight = 100 - dockHeight - 3.7; // 3.7% for navbar

            // translate window to maximize position
            r.style.transform = `translate(-1pt, 0pt)`;
            this.setState({
                maximized: true,
                height: maxHeight,
                width: 100,
                x: 0,
                y: 0
            }, () => {
                this.props.hideSideBar(this.id, true);
                // Force re-render of app content after maximize
                setTimeout(() => this.forceUpdate(), 50);
            });
        }
    }

    closeWindow = () => {
        this.setWinowsPosition();
        this.setState({ closed: true }, () => {
            this.props.hideSideBar(this.id, false);
            setTimeout(() => {
                this.props.closed(this.id)
            }, 300) // after 300ms this window will be unmounted from parent (Desktop)
        });
    }

    render() {
        return (
            <Rnd
                size={{
                    width: `${this.state.width}%`,
                    height: `${this.state.height}%`
                }}
                position={{ x: this.state.x, y: this.state.y }}
                onDragStart={this.changeCursorToMove}
                onDragStop={this.changeCursorToDefault}
                onDrag={this.handleDrag}
                onResize={this.handleResize}
                onResizeStart={this.focusWindow}
                minWidth="25%"
                minHeight="25%"
                bounds="parent"
                dragHandleClassName="bg-ub-window-title"
                enableResizing={!this.state.maximized}
                disableDragging={this.state.maximized}
                style={{
                    zIndex: this.props.isFocused ? 30 : 20,
                }}
            >
                <div
                    className={this.state.cursorType + " " + (this.state.closed ? " closed-window " : "") + (this.state.maximized ? " duration-300 rounded-none" : " rounded-2xl") + (this.props.minimized ? " opacity-0 invisible duration-200 " : "") + (this.props.isFocused ? "" : " notFocused") + " opened-window overflow-hidden main-window border-black border-opacity-20 border flex flex-col h-full w-full backdrop-blur-sm"}
                    style={{
                        boxShadow: this.props.isFocused
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                            : '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    }}
                    id={this.id}
                >
                    <WindowTopBar title={this.props.title} />
                    <WindowEditButtons minimize={this.minimizeWindow} maximize={this.maximizeWindow} isMaximised={this.state.maximized} close={this.closeWindow} id={this.id} />
                    {(this.id === "settings"
                        ? <Settings changeBackgroundImage={this.props.changeBackgroundImage} currBgImgName={this.props.bg_image_name} />
                        : <WindowMainScreen screen={this.props.screen} title={this.props.title}
                            addFolder={this.props.id === "terminal" ? this.props.addFolder : null}
                            openApp={this.props.openApp} />)}
                </div>
            </Rnd >
        )
    }
}

export default Window

// Window's title bar
export function WindowTopBar(props) {
    return (
        <div className=" relative bg-ub-window-title border-t-2 border-white border-opacity-5 py-1.5 px-3 text-white w-full select-none rounded-t-2xl backdrop-blur-md bg-opacity-95">
            <div className="flex justify-center text-sm font-bold">{props.title}</div>
        </div>
    )
}

// Window's Edit Buttons
export function WindowEditButtons(props) {
    return (
        <div className="absolute select-none right-0 top-0 mt-1.5 mr-2 flex justify-center items-center gap-2">
            <span className="bg-white bg-opacity-0 hover:bg-opacity-20 rounded-full flex justify-center h-6 w-6 items-center transition-all duration-200" onClick={props.minimize}>
                <img
                    src="./themes/Yaru/window/window-minimize-symbolic.svg"
                    alt="minimize"
                    className="h-4 w-4 inline opacity-90 hover:opacity-100"
                />
            </span>
            {
                (props.isMaximised
                    ?
                    <span className="bg-white bg-opacity-0 hover:bg-opacity-20 rounded-full flex justify-center h-6 w-6 items-center transition-all duration-200" onClick={props.maximize}>
                        <img
                            src="./themes/Yaru/window/window-restore-symbolic.svg"
                            alt="restore"
                            className="h-4 w-4 inline opacity-90 hover:opacity-100"
                        />
                    </span>
                    :
                    <span className="bg-white bg-opacity-0 hover:bg-opacity-20 rounded-full flex justify-center h-6 w-6 items-center transition-all duration-200" onClick={props.maximize}>
                        <img
                            src="./themes/Yaru/window/window-maximize-symbolic.svg"
                            alt="maximize"
                            className="h-4 w-4 inline opacity-90 hover:opacity-100"
                        />
                    </span>
                )
            }
            <button tabIndex="-1" id={`close-${props.id}`} className="focus:outline-none cursor-default bg-ub-orange bg-opacity-90 hover:bg-opacity-100 rounded-full flex justify-center h-6 w-6 items-center transition-all duration-200 hover:scale-110" onClick={props.close}>
                <img
                    src="./themes/Yaru/window/window-close-symbolic.svg"
                    alt="close"
                    className="h-4 w-4 inline"
                />
            </button>
        </div>
    )
}

// Window's Main Screen
export class WindowMainScreen extends Component {
    constructor() {
        super();
        this.state = {
            setDarkBg: false,
        }
    }
    componentDidMount() {
        setTimeout(() => {
            this.setState({ setDarkBg: true });
        }, 3000);
    }
    render() {
        return (
            <div className={"w-full flex-grow z-20 max-h-full overflow-y-auto windowMainScreen resize-responsive" + (this.state.setDarkBg ? " bg-ub-drk-abrgn " : " bg-ub-cool-grey")}>
                {this.props.addFolder ? displayTerminal(this.props.addFolder, this.props.openApp) : this.props.screen(this.props.openApp)}
            </div>
        )
    }
}