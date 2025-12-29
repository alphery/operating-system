import React, { Component } from 'react'
import Draggable from 'react-draggable'

export class UbuntuApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDragged: false,
            showContextMenu: false,
            menuPosition: { x: 0, y: 0 }
        };
    }

    openApp = () => {
        this.props.openApp(this.props.id);
    }

    handleDragStart = () => {
        this.setState({ isDragged: true });
    }

    handleDragStop = (e, data) => {
        // Save position to localStorage
        const savedPositions = JSON.parse(localStorage.getItem('desktopAppPositions') || '{}');
        savedPositions[this.props.id] = { x: data.x, y: data.y };
        localStorage.setItem('desktopAppPositions', JSON.stringify(savedPositions));
    }

    handleContextMenu = (e) => {
        if (this.props.onContextMenu) {
            e.preventDefault();
            e.stopPropagation();
            this.props.onContextMenu(e, this.props.id);
        }
    }

    render() {
        // Get saved position from localStorage
        const savedPositions = JSON.parse(localStorage.getItem('desktopAppPositions') || '{}');
        const savedPos = savedPositions[this.props.id];

        // Determine if this is a desktop app or menu app
        const isDesktopApp = this.props.isDesktop;

        // If not a desktop app, render without Draggable
        if (!isDesktopApp) {
            const isLaunchpad = this.props.displayMode === 'launchpad';
            const containerClass = isLaunchpad
                ? "p-2 m-2 z-10 bg-transparent hover:bg-white hover:bg-opacity-10 focus:bg-white focus:bg-opacity-20 border border-transparent outline-none rounded-xl select-none w-28 h-28 flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-200"
                : "p-1 m-px z-10 bg-white bg-opacity-0 hover:bg-opacity-20 focus:bg-ub-orange focus:bg-opacity-50 focus:border-yellow-700 focus:border-opacity-100 border border-transparent outline-none rounded select-none w-24 h-20 flex flex-col justify-start items-center text-center text-xs font-normal text-white cursor-pointer";

            const iconSize = isLaunchpad ? "w-16 h-16" : "w-10 h-10";
            const textSize = isLaunchpad ? "text-sm font-medium mt-2 text-white shadow-sm" : "text-xs font-normal text-white";

            return (
                <div
                    className={containerClass}
                    id={"app-" + this.props.id}
                    onClick={this.openApp} // Changed from onDoubleClick for Launchpad feel (usually single click)
                    onContextMenu={this.handleContextMenu}
                    tabIndex={0}
                >
                    <img className={`${iconSize} pointer-events-none filter drop-shadow-lg ${this.props.id === 'nosleep' ? 'rounded-2xl' : ''}`} src={this.props.icon} alt={"Ubuntu " + this.props.name} />
                    <span className={textSize} style={{ textShadow: isLaunchpad ? '0 1px 2px rgba(0,0,0,0.5)' : 'none' }}>
                        {this.props.name}
                    </span>
                </div>
            );
        }

        return (
            <Draggable
                defaultPosition={savedPos || { x: 0, y: 0 }}
                onStart={this.handleDragStart}
                onStop={this.handleDragStop}
                bounds="parent"
                disabled={false}
            >
                <div
                    className={`p-1 m-px z-10 bg-white bg-opacity-0 hover:bg-opacity-20 focus:bg-ub-orange focus:bg-opacity-50 focus:border-yellow-700 focus:border-opacity-100 border border-transparent outline-none rounded select-none w-24 h-20 flex flex-col justify-start items-center text-center text-xs font-normal text-white ${savedPos ? 'absolute cursor-move' : 'cursor-move'}`}
                    id={"app-" + this.props.id}
                    onDoubleClick={this.openApp}
                    onContextMenu={this.handleContextMenu}
                    tabIndex={0}
                >
                    <img width="40px" height="40px" className={`mb-1 w-10 pointer-events-none ${this.props.id === 'nosleep' ? 'rounded-lg' : ''}`} src={this.props.icon} alt={"Ubuntu " + this.props.name} />
                    {this.props.name}

                </div>
            </Draggable>
        )
    }
}

export default UbuntuApp
