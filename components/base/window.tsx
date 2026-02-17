import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import Settings from '../apps/settings';
import ReactGA from 'react-ga';
import { displayTerminal } from '../apps/terminal';
import AccessDenied from '../util/AccessDenied';
import { useAuth } from '../../context/AuthContext-new';

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
    scaleFactor?: number;
}

const Window: React.FC<WindowProps> = (props) => {
    // Utility for calculating initial dimensions
    const getInitialDimensions = () => {
        if (typeof window === 'undefined') return { width: 800, height: 600, x: 60, y: 30, isMax: false };

        // MOBILE OPTIMIZATION: Force full screen for apps on small devices
        if (window.innerWidth < 640) {
            return {
                width: window.innerWidth,
                height: window.innerHeight, // Full height
                x: 0,
                y: 0,
                isMax: true
            };
        } else {
            // Larger default size for modern premium apps
            const w = Math.min(1280, window.innerWidth * 0.85);
            const h = Math.min(840, window.innerHeight * 0.8);
            return {
                width: w,
                height: h,
                x: (window.innerWidth - w) / 2,
                y: (window.innerHeight - h) / 2,
                isMax: false
            };
        }
    };

    const initial = getInitialDimensions();
    const [isMaximized, setIsMaximized] = useState(initial.isMax);
    const [isClosed, setIsClosed] = useState(false);
    const [size, setSize] = useState({ width: initial.width, height: initial.height });
    const [position, setPosition] = useState({ x: initial.x, y: initial.y });
    const [prevSize, setPrevSize] = useState({ width: initial.width, height: initial.height });
    const [prevPosition, setPrevPosition] = useState({ x: initial.x, y: initial.y });
    const [cursorType, setCursorType] = useState("cursor-default");

    const id = props.id;
    const windowRef = useRef<any>(null);

    // Calculate content scale to prevent congestion
    // On Mobile: Disable scaling, let CSS responsive media queries handle layout
    // On Desktop: Keep generic scaling for windowed mode
    const contentScale = window.innerWidth < 640
        ? 1
        : Math.max(0.5, Math.min(1, size.width / 1280));

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                // Force full maximize on mobile resize
                setIsMaximized(true);
                setSize({ width: window.innerWidth, height: window.innerHeight });
                setPosition({ x: 0, y: 0 });
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
            setSize({ width: window.innerWidth, height: window.innerHeight });
            setPosition({ x: 0, y: 0 });

            props.hideSideBar(id, true);
        }
    };

    const restoreWindow = () => {
        // Prevent restoring on mobile
        if (window.innerWidth < 640) return;

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

    const isMobile = window.innerWidth < 640;

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
            enableResizing={!isMaximized && !isMobile}
            disableDragging={isMaximized || isMobile}
            scale={props.scaleFactor || 1}
            className={`absolute window-container hw-accelerated-transition ${isClosed ? "scale-0 opacity-0" : "scale-100 opacity-100"} ${isMobile ? 'fixed !top-10 !left-0 !right-0 !bottom-0 !transform-none !w-full !h-[calc(100%-2.5rem)]' : ''}`}
            style={{
                zIndex: props.isFocused ? 30 : 20,
                display: props.minimized ? 'none' : 'block',
                willChange: "transform, width, height"
            }}
        >
            <div
                className={`flex flex-col h-full w-full bg-ub-cool-grey window-transparency window-blur optimized-shadow-lg rounded-lg overflow-hidden border border-black border-opacity-40
                ${props.isFocused ? "optimized-shadow-lg" : "optimized-shadow"}
                ${isMaximized ? "rounded-none" : "rounded-lg"}`}
            >
                {/* Title Bar - Draggable Handle/Mobile Header */}
                <div
                    className={`window-title-bar relative flex justify-center items-center select-none text-sm font-semibold text-white/90 border-b border-white/5 cursor-move z-10 transition-colors
                    ${isMobile
                            ? 'h-14 text-lg bg-[#0a0f1c] shadow-md' // Mobile App Header Style
                            : 'h-10 bg-white/10 backdrop-blur-xl hover:bg-white/20' // Desktop Window Header
                        }`}
                    onDoubleClick={maximizeWindow}
                >
                    {/* Mobile Back Button - Native App Feel */}
                    {isMobile && (
                        <button
                            className="absolute left-0 top-0 h-full px-5 flex items-center text-white active:bg-white/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); closeWindow(); }}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                    )}

                    <span className="truncate max-w-[60%] tracking-tight flex items-center gap-2">
                        {/* Application Icon (Optional placeholder if you have app icons available) */}
                        {props.title}
                    </span>

                    {/* Desktop Window Controls */}
                    {!isMobile && (
                        <div className="window-controls absolute right-0 top-0 h-full flex items-center">
                            {/* Minimize */}
                            <button
                                className="w-12 h-full flex items-center justify-center hover:bg-white/10 transition-colors group"
                                onClick={(e) => { e.stopPropagation(); minimizeWindow(); }}
                            >
                                <svg className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor" /></svg>
                            </button>

                            {/* Maximize / Restore */}
                            <button
                                className="w-12 h-full flex items-center justify-center hover:bg-white/10 transition-colors group"
                                onClick={(e) => { e.stopPropagation(); maximizeWindow(); }}
                            >
                                {isMaximized ? (
                                    <svg className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" viewBox="0 0 10 10">
                                        <path d="M2.1,0v2H0v8.1h8.2v-2h2V0H2.1z M7.2,9.1H1.1V3.1h6.1V9.1z M9.1,7.1h-1V2.1H3.1v-1h6V7.1z" fill="currentColor" />
                                    </svg>
                                ) : (
                                    <svg className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" viewBox="0 0 10 10">
                                        <path d="M0,0v10h10V0H0z M9,9H1V1h8V9z" fill="currentColor" />
                                    </svg>
                                )}
                            </button>

                            {/* Close */}
                            <button
                                className="w-12 h-full flex items-center justify-center hover:bg-[#C42B1C] transition-colors group rounded-tr-lg"
                                onClick={(e) => { e.stopPropagation(); closeWindow(); }}
                            >
                                <svg className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" viewBox="0 0 10 10">
                                    <path d="M10,0.7L9.3,0L5,4.3L0.7,0L0,0.7L4.3,5L0,9.3L0.7,10L5,5.7l4.3,4.3l0.7-0.7L5.7,5L10,0.7z" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area - Memoized to prevent re-renders on drag */}
                {React.useMemo(() => (
                    <div className="flex-1 relative w-full overflow-hidden bg-ub-cool-grey text-white select-text">
                        <div
                            style={{
                                transform: `scale(${contentScale})`,
                                transformOrigin: 'top left',
                                width: `${100 / contentScale}%`,
                                height: `${100 / contentScale}%`,
                                transition: 'transform 0.2s ease-out'
                            }}
                            className="absolute top-0 left-0"
                        >
                            {id === "settings" ? (
                                <Settings changeBackgroundImage={props.changeBackgroundImage} currBgImgName={props.bg_image_name} />
                            ) : (
                                <WindowMainScreen
                                    appId={id}
                                    screen={props.screen}
                                    title={props.title}
                                    addFolder={props.id === "terminal" ? props.addFolder : null}
                                    openApp={props.openApp}
                                />
                            )}
                        </div>
                    </div>
                ), [id, props.bg_image_name, props.screen, props.title, props.addFolder, props.screen, props.openApp, contentScale])}
            </div>
        </Rnd>
    );
};

export default React.memo(Window);

// Window's Main Screen
interface WindowMainScreenProps {
    appId: string;
    screen: any;
    title: string;
    addFolder: any;
    openApp: (id: string) => void;
}

const WindowMainScreen: React.FC<WindowMainScreenProps> = (props) => {
    const { user, platformUser, currentTenant } = useAuth();

    // System apps that are always accessible
    const SYSTEM_APPS = ['app-store', 'settings', 'messenger', 'trash', 'files', 'gedit'];
    const isSystemApp = SYSTEM_APPS.includes(props.appId);

    // Check if user has permission to use this app
    let hasPermission = false;

    if (!user || !platformUser) {
        // Guest or unauthenticated: All apps available
        hasPermission = true;
    } else if (platformUser.isGod || user.email === 'alpherymail@gmail.com' || user.email === 'aksnetlink@gmail.com') {
        // Platform God: All apps available
        hasPermission = true;
    } else if (isSystemApp) {
        // System apps: Always available
        hasPermission = true;
    } else if (props.appId === 'alphery-access' && currentTenant && (currentTenant.role === 'owner' || currentTenant.role === 'admin')) {
        // Alphery Access: Only for Tenant Owners/Admins
        hasPermission = true;
    } else if (!currentTenant) {
        // Not in a tenant: Only system apps
        hasPermission = false;
    } else {
        // Default for now: If they are in a tenant, let them try to open it.
        // The app itself or backend will handle deeper permission errors.
        hasPermission = true;
    }

    // If no permission, show Access Denied screen
    if (!hasPermission) {
        return <AccessDenied appName={props.title} />;
    }

    // User has permission, show the app
    return (
        <div className="w-full h-full overflow-y-auto">
            {props.addFolder
                ? displayTerminal(props.addFolder, props.openApp)
                : props.screen(props.openApp)
            }
        </div>
    );
}
