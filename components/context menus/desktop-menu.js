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
        <div id="desktop-menu" className={(props.active ? " block " : " hidden ") + " cursor-default w-64 bg-gray-900 bg-opacity-60 backdrop-blur-2xl border border-white border-opacity-10 rounded-xl text-white py-2 absolute z-50 text-sm shadow-2xl"}>

            {/* View */}
            <div onClick={handleViewClick} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer flex justify-between items-center text-gray-200">
                <span>View ({props.displaySize || 'medium'})</span>
                <span className="text-xs">▶</span>
            </div>

            {/* Sort */}
            <div onClick={handleSortClick} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer flex justify-between items-center text-gray-200">
                <span>Sort by ({props.sortOrder === 'name' ? 'Name' : 'Default'})</span>
                <span className="text-xs">▶</span>
            </div>

            <div onClick={handleRefresh} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer">
                <span>Refresh</span>
            </div>

            <Devider />

            <div onClick={handlePaste} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer text-gray-200">
                <span>Paste</span>
            </div>
            <div className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-default text-gray-500 hover:text-gray-300">
                <span>Paste shortcut</span>
            </div>

            <Devider />

            {/* New Items */}
            <div onClick={props.addNewFolder} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer">
                <span>New Folder</span>
            </div>
            <div onClick={() => props.openApp('gedit')} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer">
                <span>New Text Document</span>
            </div>

            <Devider />

            <div onClick={openSettings} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer">
                <span>Display settings</span>
            </div>
            <div onClick={openSettings} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer">
                <span>Personalise</span>
            </div>

            <Devider />

            <div onClick={openTerminal} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer">
                <span>Open in Terminal</span>
            </div>
            <div onClick={resetIconPositions} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer">
                <span>Reset Icon Positions</span>
            </div>

            <Devider />

            <div onClick={goFullScreen} className="w-full py-1.5 px-4 hover:bg-blue-500 hover:text-white transition-colors duration-100 mb-0.5 cursor-pointer">
                <span>{isFullScreen ? "Exit" : "Enter"} Full Screen</span>
            </div>

        </div>
    )
}

function Devider() {
    return (
        <div className="flex justify-center w-full my-1">
            <div className="border-t border-white border-opacity-10 w-11/12"></div>
        </div>
    );
}

export default DesktopMenu
