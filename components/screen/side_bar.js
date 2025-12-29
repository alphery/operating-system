import React, { useState } from 'react'
import SideBarApp from '../base/side_bar_app';

export default function SideBar(props) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    function showSideBar() {
        props.hideSideBar(null, false);
    }

    function hideSideBar() {
        setTimeout(() => {
            props.hideSideBar(null, true);
        }, 2000);
    }

    // Filter apps first to get a clean list for indexing
    const dockApps = props.apps.filter(app => props.favourite_apps[app.id] !== false);

    // Calculate scale based on distance from hovered index
    const getScale = (index) => {
        if (hoveredIndex === null) return 1;
        const distance = Math.abs(hoveredIndex - index);
        if (distance === 0) return 1.8;
        if (distance === 1) return 1.4; // Neighbors
        if (distance === 2) return 1.15;  // Far neighbors
        return 1;
    };

    // Helper to render apps with scale logic
    const renderApps = () => {
        return dockApps.map((app, naturalIndex) => {
            const index = naturalIndex + 1; // Offset by 1 because AllApps is at 0
            const scale = getScale(index);

            return (
                <SideBarApp
                    key={index}
                    id={app.id}
                    title={app.title}
                    icon={app.icon}
                    isClose={props.closed_windows}
                    isFocus={props.focused_windows}
                    openApp={props.openAppByAppId}
                    isMinimized={props.isMinimized}
                    openFromMinimised={props.openFromMinimised}
                    dockScale={scale}
                    onHover={() => setHoveredIndex(index)}
                    onLeave={() => setHoveredIndex(null)}
                />
            );
        });
    };

    return (
        <>
            <div
                className={(props.hide ? " translate-y-full " : "") + " absolute transform duration-300 select-none z-50 left-1/2 transform -translate-x-1/2 bottom-4 w-auto h-[58px] flex justify-center items-end rounded-2xl bg-white bg-opacity-20 backdrop-blur-2xl border border-white border-opacity-20 shadow-2xl pb-[1px] px-3 transition-all"}
                onMouseLeave={() => setHoveredIndex(null)}
            >
                <AllApps
                    showApps={props.showAllApps}
                    dockScale={getScale(0)}
                    onHover={() => setHoveredIndex(0)}
                />
                <div className="w-px h-10 bg-white bg-opacity-20 mx-2 self-center"></div>
                {renderApps()}
            </div>
        </>
    )
}

export function AllApps(props) {
    const [title, setTitle] = useState(false);
    const scale = props.dockScale || 1;
    const baseSize = 48; // Base width in px (w-12)
    const size = baseSize * scale;

    return (
        <div
            className={`outline-none relative transition-all duration-200 ease-out transform rounded-xl m-1 cursor-pointer flex justify-center items-center`}
            style={{ width: `${size}px`, height: `${size}px` }}
            onMouseEnter={() => {
                setTitle(true);
                if (props.onHover) props.onHover();
            }}
            onMouseLeave={() => {
                setTitle(false);
                // Parent handles mouseLeave on container usually, but for distinct items we can bubble change? 
                // The parent container onMouseLeave handles clear, but moving between items handles reset.
                // We don't need explicit onLeave here if parent handles it or if entering another sets it.
                // But for safety, we rely on parent's logic or entering another item.
            }}
            onClick={props.showApps}
        >
            <img
                width={`${28 * scale}px`}
                height={`${28 * scale}px`}
                className="w-full h-full object-contain p-1.5"
                src="./themes/Yaru/system/view-app-grid-symbolic.svg"
                alt="Ubuntu view app"
            />
            <div
                className={
                    (title ? " visible " : " invisible ") +
                    " w-max py-0.5 px-2 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 text-gray-100 font-medium text-xs bg-gray-800 bg-opacity-80 backdrop-blur-md rounded-md shadow-lg z-50 whitespace-nowrap"
                }
            >
                Applications
            </div>
        </div>
    );
}

