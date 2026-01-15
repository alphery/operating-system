import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import Settings from '../apps/settings';
import ReactGA from 'react-ga';
import { displayTerminal } from '../apps/terminal';

interface WindowProps {
    id: string;
    title: string;
    screen: any;
    addFolder?: any;
    openApp: (id: string) => void;
    closed: (id: string) => void;
    focus: (id: string) => void;
    hideSideBar: (id: string, hide: boolean) => void;
    hasMinimised: (id: string) => void;
    changeBackgroundImage: (name: string) => void;
    bg_image_name: string;
    isFocused: boolean;
    minimized: boolean;
}

const Window: React.FC<WindowProps> = (props) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [position, setPosition] = useState({ x: 60, y: 30 });
    const [prevSize, setPrevSize] = useState({ width: 800, height: 600 });
    const [prevPosition, setPrevPosition] = useState({ x: 60, y: 30 });
    const [cursorType, setCursorType] = useState("cursor-default");

    const id = props.id;
    const windowRef = useRef<any>(null);

    useEffect(() => {
        // Initial size based on screen size
        if (window.innerWidth < 640) {
            // Mobile: Full screen always
            setIsMaximized(true);
            setSize({ width: window.innerWidth, height: window.innerHeight - 32 }); // Subtract navbar height
            setPosition({ x: 0, y: 0 });
        } else {
            // Desktop: Default window-ed behavior
            setSize({ width: Math.min(1000, window.innerWidth * 0.7), height: Math.min(700, window.innerHeight * 0.75) });
            setPosition({ x: window.innerWidth * 0.15, y: 50 });
        }

        const handleResize = () => {
            if (window.innerWidth < 640 && !isMaximized) {
                maximizeWindow();
            }
        }

        window.addEventListener('resize', handleResize);

        ReactGA.pageview(`/${id}`);
        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    const handleDragStart = () => {
        focusWindow();
        if (isMaximized) {
            restoreWindow();
        }
    };

    const focusWindow = () => {
        props.focus(id);
    };

    const handleResize = (e: any, direction: any, ref: any, delta: any, position: any) => {
        setSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height)
        });
        setPosition(position);
    };

    const handleDrag = (e: any, d: any) => {
        setPosition({ x: d.x, y: d.y });
        checkOverlap(d.x);
    };

    const checkOverlap = (x: number) => {
        if (x < 50) {
            props.hideSideBar(id, true);
        } else {
            props.hideSideBar(id, false);
        }
    };

    const maximizeWindow = () => {
        if (isMaximized) {
            restoreWindow();
        } else {
            focusWindow();
            // Save current state before maximizing
            setPrevSize(size);
            setPrevPosition(position);

            setIsMaximized(true);
            setSize({ width: window.innerWidth, height: window.innerHeight - 32 }); // Subtract navbar height
            setPosition({ x: 0, y: 0 });

            props.hideSideBar(id, true);
        }
    };

    const restoreWindow = () => {
        setIsMaximized(false);
        setSize(prevSize);
        setPosition(prevPosition);
        props.hideSideBar(id, false);
    };

    const minimizeWindow = () => {
        // Animation logic could be handled via CSS classes in parent or here
        // For now, we rely on the prop 'minimized' which hides the window
        props.hasMinimised(id);
    };

    const closeWindow = () => {
        setIsClosed(true);
        props.hideSideBar(id, false);
        setTimeout(() => {
            props.closed(id);
        }, 300);
    };

    return (
        <Rnd
            size={size}
            position={position}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragStop={() => setCursorType("cursor-default")}
            onResize={handleResize}
            onResizeStart={() => {
                focusWindow();
                setCursorType("cursor-nwse-resize");
            }}
            onResizeStop={() => setCursorType("cursor-default")}
            minWidth={200}
            minHeight={150}
            bounds="parent"
            dragHandleClassName="window-title-bar"
            cancel=".window-controls"
            enableResizing={!isMaximized}
            disableDragging={isMaximized}
            style={{
                zIndex: props.isFocused ? 30 : 20,
                display: props.minimized ? 'none' : 'block', // Hide if minimized
            }}
            className={`absolute ${isClosed ? "scale-0 opacity-0" : "scale-100 opacity-100"} transition-opacity duration-200`}
        >
            <div
                className={`flex flex-col h-full w-full bg-ub-cool-grey shadow-2xl rounded-lg overflow-hidden border border-black border-opacity-40
                ${props.isFocused ? "shadow-2xl" : "shadow-md opacity-95"}
                ${isMaximized ? "rounded-none" : "rounded-lg"}`}
                style={{
                    transform: 'translate3d(0,0,0)', // Force GPU acceleration
                    backfaceVisibility: 'hidden',
                    willChange: 'transform' // Hint browser for 60fps dragging
                }}
            >
                {/* Title Bar - Draggable Handle/Mobile Header */}
                <div
                    className={`window-title-bar relative bg-ub-title-bar flex justify-center items-center select-none text-sm font-bold text-white border-b border-white border-opacity-10 cursor-move z-10
                    ${isMaximized && window.innerWidth < 640 ? 'h-12 text-base' : 'h-10'}`} // Taller header on mobile
                    onDoubleClick={maximizeWindow}
                >
                    {/* Mobile Back Button - Only on mobile */}
                    {isMaximized && window.innerWidth < 640 && (
                        <button
                            className="absolute left-0 top-0 h-full px-4 flex items-center text-white"
                            onClick={(e) => { e.stopPropagation(); closeWindow(); }}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                    )}

                    {props.title}

                    {/* Window Controls - Hidden on mobile unless needed */}
                    <div className={`window-controls absolute right-0 top-0 h-full flex items-center pr-3 gap-2 ${window.innerWidth < 640 ? 'hidden' : 'flex'}`}>
                        <button
                            className="w-6 h-6 rounded-full hover:bg-white hover:bg-opacity-10 flex items-center justify-center focus:outline-none transition-colors"
                            onClick={(e) => { e.stopPropagation(); minimizeWindow(); }}
                        >
                            <img src="./themes/Yaru/window/window-minimize-symbolic.svg" alt="minimize" className="w-3.5 h-3.5" />
                        </button>
                        <button
                            className="w-6 h-6 rounded-full hover:bg-white hover:bg-opacity-10 flex items-center justify-center focus:outline-none transition-colors"
                            onClick={(e) => { e.stopPropagation(); maximizeWindow(); }}
                        >
                            {isMaximized ? (
                                <img src="./themes/Yaru/window/window-restore-symbolic.svg" alt="restore" className="w-3.5 h-3.5" />
                            ) : (
                                <img src="./themes/Yaru/window/window-maximize-symbolic.svg" alt="maximize" className="w-3.5 h-3.5" />
                            )}
                        </button>
                        <button
                            className="w-6 h-6 rounded-full bg-[#FF5D5B] hover:bg-[#FF8585] flex items-center justify-center focus:outline-none transition-colors"
                            onClick={(e) => { e.stopPropagation(); closeWindow(); }}
                        >
                            <img src="./themes/Yaru/window/window-close-symbolic.svg" alt="close" className="w-3.5 h-3.5" style={{ filter: "brightness(0)" }} />
                        </button>
                    </div>
                </div>

                {/* Content Area - Grows to fill space */}
                <div className="flex-1 relative w-full overflow-hidden bg-ub-cool-grey text-white select-text">
                    {id === "settings" ? (
                        <Settings changeBackgroundImage={props.changeBackgroundImage} currBgImgName={props.bg_image_name} />
                    ) : (
                        <WindowMainScreen
                            screen={props.screen}
                            title={props.title}
                            addFolder={props.id === "terminal" ? props.addFolder : null}
                            openApp={props.openApp}
                        />
                    )}
                </div>
            </div>
        </Rnd>
    );
};

export default React.memo(Window);

// Window's Main Screen
interface WindowMainScreenProps {
    screen: any;
    title: string;
    addFolder: any;
    openApp: (id: string) => void;
}

const WindowMainScreen: React.FC<WindowMainScreenProps> = (props) => {
    return (
        <div className="w-full h-full overflow-y-auto">
            {props.addFolder
                ? displayTerminal(props.addFolder, props.openApp)
                : props.screen(props.openApp)
            }
        </div>
    );
}
