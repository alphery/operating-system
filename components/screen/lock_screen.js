import React, { useState, useEffect } from 'react';
import Clock from '../util components/clock';
import ERPDatabase from '../util components/database';

export default function LockScreen(props) {
    const [users, setUsers] = useState([]);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const wallpapers = {
        "wall-1": "./images/wallpapers/wallpaper1.jpg",
        "wall-2": "./images/wallpapers/wallpaper2.jpg",
        "wall-4": "./images/wallpapers/wallpaper4.jpg",
        "wall-5": "./images/wallpapers/wallpaper5.jpg",
        "wall-7": "./images/wallpapers/wallpaper7.jpg",
        "wall-8": "./images/wallpapers/wallpaper8.jpg",
    };

    useEffect(() => {
        // Load users to have a valid user to login with
        const allUsers = ERPDatabase.getSystemUsers();
        setUsers(allUsers);
    }, []);

    const handleUnlock = () => {
        if (isUnlocking) return;

        setIsUnlocking(true);

        // Find a default user to login as (prefer Admin, or just first user)
        const userToLogin = users.find(u => u.role === 'admin') || users[0];

        // Wait for animation
        setTimeout(() => {
            if (userToLogin) {
                props.unLockScreen(userToLogin);
            }
            setIsUnlocking(false);
        }, 500); // 500ms matches CSS transition
    };

    // Handle scroll/swipe to unlock
    useEffect(() => {
        const handleWheel = (e) => {
            if (props.isLocked && e.deltaY < -50 && !isUnlocking) {
                handleUnlock();
            }
        };
        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, [props.isLocked, isUnlocking, users]);


    return (
        <div
            id="ubuntu-lock-screen"
            style={{ zIndex: "100" }}
            onClick={handleUnlock}
            className={
                (props.isLocked ? " visible translate-y-0 opacity-100 " : " invisible -translate-y-full opacity-0 ") +
                (isUnlocking ? " -translate-y-full opacity-0 " : "") +
                " absolute outline-none transform duration-700 ease-in-out select-none top-0 right-0 overflow-hidden m-0 p-0 h-screen w-screen cursor-pointer group"
            }
        >
            <div
                style={{
                    backgroundImage: `url(${wallpapers[props.bgImgName] || wallpapers["wall-2"]})`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center"
                }}
                className="absolute top-0 left-0 w-full h-full z-20"
            ></div>

            {/* Dark Overlay for text readability */}
            <div className="absolute top-0 left-0 w-full h-full z-30 bg-black/20"></div>

            <div className="w-full h-full z-50 overflow-hidden relative flex flex-col justify-between p-20 text-white">

                {/* Clock & Date Section (Windows Style - Bottom Left or Center) */}
                <div className="flex flex-col items-start mt-20 ml-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <div className="text-8xl font-thin tracking-wider drop-shadow-lg">
                        <Clock onlyTime={true} />
                    </div>
                    <div className="text-4xl font-light mt-2 drop-shadow-md">
                        <Clock onlyDay={true} />
                    </div>
                </div>

                {/* Swipe/Click Hint */}
                <div className="flex flex-col items-center mb-10 animate-bounce delay-700 opacity-80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-lg font-medium tracking-wide">Swipe up or click to unlock</span>
                </div>

            </div>
        </div>
    )
}
