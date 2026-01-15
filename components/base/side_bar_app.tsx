import React, { useState } from "react";

interface SideBarAppProps {
    id: string;
    title: string;
    icon: string;
    isClose: { [key: string]: boolean };
    isFocus: { [key: string]: boolean };
    openApp: (id: string) => void;
    isMinimized: { [key: string]: boolean };
    openFromMinimised?: (id: string) => void;
    dockScale?: number;
    onHover?: () => void;
    onLeave?: () => void;
    openContextMenu?: (e: React.MouseEvent, id: string) => void;
}

const SideBarApp: React.FC<SideBarAppProps> = (props) => {
    const [showTitle, setShowTitle] = useState(false);
    const [scaleImage, setScaleImage] = useState(false);

    const handleOpenApp = (e: React.MouseEvent) => {
        e.stopPropagation(); // Stop propagation to prevent issues

        if (!props.isMinimized[props.id] && props.isClose[props.id]) {
            startScaleAnimation();
        }
        props.openApp(props.id);
        setShowTitle(false);
    };

    const startScaleAnimation = () => {
        setScaleImage(true);
        setTimeout(() => {
            setScaleImage(false);
        }, 1000);
    };

    const scale = props.dockScale || 1;
    const baseSize = 48; // Base width/height in px
    const size = baseSize * scale;

    const isOpen = props.isClose[props.id] === false;
    const isFocused = props.isFocus[props.id];

    return (
        <div
            tabIndex={0}
            onClick={handleOpenApp}
            onMouseEnter={() => {
                setShowTitle(true);
                if (props.onHover) props.onHover();
            }}
            onMouseLeave={() => {
                setShowTitle(false);
                if (props.onLeave) props.onLeave();
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (props.openContextMenu) props.openContextMenu(e, props.id);
            }}
            className={`
                outline-none relative transition-all duration-200 ease-out transform rounded-xl m-1 flex justify-center items-center
                ${isOpen && isFocused ? "bg-white bg-opacity-10" : ""}
                ${scaleImage ? "scale-75" : ""} 
                interactive-element
            `}
            id={"sidebar-" + props.id}
            style={{ width: `${size}px`, height: `${size}px`, willChange: "width, height" }}
        >
            <div className="w-full h-full p-1.5 flex items-center justify-center">
                <div className="w-full h-full rounded-xl overflow-hidden relative">
                    <img
                        className="w-full h-full object-contain pointer-events-none"
                        src={props.icon}
                        alt={props.title}
                    />
                </div>
            </div>

            {/* Active Indicator Dot */}
            {isOpen && (
                <div className="w-1.5 h-1.5 absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-gray-200 rounded-full shadow-sm"></div>
            )}

            {/* Tooltip Title */}
            <div
                className={`
                    absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                    text-gray-100 font-medium text-xs bg-gray-800 bg-opacity-80 backdrop-blur-md 
                    rounded-md shadow-lg z-50 whitespace-nowrap py-0.5 px-2
                    ${showTitle ? "opacity-100 visible" : "opacity-0 invisible"}
                    transition-opacity duration-200
                `}
            >
                {props.title}
            </div>
        </div>
    );
};

export default SideBarApp;
