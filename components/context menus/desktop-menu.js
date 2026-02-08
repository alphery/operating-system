import React, { useState, useEffect } from 'react'

function DesktopMenu(props) {

    const [isFullScreen, setIsFullScreen] = useState(false)

    useEffect(() => {
        document.addEventListener('fullscreenchange', checkFullScreen);
        return () => {
            document.removeEventListener('fullscreenchange', checkFullScreen);
        };
    }, [])


    const openTerminal = () => {
        props.openApp("terminal");
    }

    const openSettings = () => {
        props.openApp("settings");
    }

    const checkFullScreen = () => {
        if (document.fullscreenElement) {
            setIsFullScreen(true)
        } else {
            setIsFullScreen(false)
        }
    }

    const goFullScreen = () => {
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else {
                document.documentElement.requestFullscreen()
            }
        }
        catch (e) {
            console.log(e)
        }
    }

    const resetIconPositions = () => {
        localStorage.removeItem('desktopAppPositions');
        window.location.reload();
    }

    const handleRefresh = () => {
        window.location.reload();
    }

    const handleViewClick = () => {
        const next = { small: 'medium', medium: 'large', large: 'small' }[props.displaySize || 'medium'];
        props.changeDisplaySize(next);
    }

    const handleSortClick = () => {
        const next = props.sortOrder === 'name' ? 'default' : 'name';
        props.changeSortOrder(next);
    }

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                alert(`Clipboard content: ${text}\n(File creation from clipboard not yet implemented)`);
            } else {
                alert("Clipboard is empty.");
            }
        } catch (e) {
            alert("Clipboard access denied or not supported.");
        }
    }

    return (
        <div
            id="desktop-menu"
            className={(props.active ? " animate-menu-pop opacity-100 pointer-events-auto " : " opacity-0 pointer-events-none ") + " cursor-default w-64 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl text-white py-2 absolute z-50 text-[13px] shadow-2xl shadow-black/50 overflow-hidden transition-opacity duration-150"}
        >
            <div className="px-1.5">
                {/* View */}
                <div onClick={handleViewClick} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer flex justify-between items-center text-white/90 rounded-lg group">
                    <span className="font-medium">View ({props.displaySize || 'medium'})</span>
                    <span className="opacity-40 group-hover:opacity-70 text-[10px]">▶</span>
                </div>

                {/* Sort */}
                <div onClick={handleSortClick} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer flex justify-between items-center text-white/90 rounded-lg group">
                    <span className="font-medium">Sort by ({props.sortOrder === 'name' ? 'Name' : 'Default'})</span>
                    <span className="opacity-40 group-hover:opacity-70 text-[10px]">▶</span>
                </div>

                <div onClick={handleRefresh} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg">
                    <span className="font-medium">Refresh</span>
                </div>
            </div>

            <Devider />

            <div className="px-1.5">
                <div onClick={handlePaste} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg font-medium">
                    <span>Paste</span>
                </div>
                <div className="w-full py-1.5 px-3 cursor-default text-white/30 rounded-lg font-normal text-xs">
                    <span>Paste shortcut</span>
                </div>
            </div>

            <Devider />

            <div className="px-1.5">
                <div onClick={props.addNewFolder} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg font-medium">
                    <span>New Folder</span>
                </div>
                <div onClick={() => props.openApp('gedit')} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg font-medium">
                    <span>New Text Document</span>
                </div>
            </div>

            <Devider />

            <div className="px-1.5">
                <div onClick={openSettings} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg font-medium">
                    <span>Display settings</span>
                </div>
                <div onClick={openSettings} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg font-medium">
                    <span>Personalise</span>
                </div>
            </div>

            <Devider />

            <div className="px-1.5">
                <div onClick={openTerminal} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg font-medium">
                    <span>Open in Terminal</span>
                </div>
                <div onClick={resetIconPositions} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg font-medium">
                    <span>Reset Icon Positions</span>
                </div>
            </div>

            <Devider />

            <div className="px-1.5">
                <div onClick={goFullScreen} className="w-full py-1.5 px-3 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer text-white/90 rounded-lg font-medium flex justify-between items-center group">
                    <span>{isFullScreen ? "Exit" : "Enter"} Full Screen</span>
                    <span className="opacity-40 group-hover:opacity-100 text-xs">⤢</span>
                </div>
            </div>
        </div>
    )
}

function Devider() {
    return (
        <div className="h-px bg-white/10 my-1 mx-2"></div>
    );
}

export default DesktopMenu
