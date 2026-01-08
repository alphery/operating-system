import React, { useState, useEffect } from 'react';
import Clock from '../util components/clock';
import ERPDatabase from '../util components/database';

export default function LockScreen(props) {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(null);

    const wallpapers = {
        "wall-1": "./images/wallpapers/wallpaper1.jpg",
        "wall-2": "./images/wallpapers/wallpaper2.jpg",
        "wall-4": "./images/wallpapers/wallpaper4.jpg",
        "wall-5": "./images/wallpapers/wallpaper5.jpg",
        "wall-7": "./images/wallpapers/wallpaper7.jpg",
        "wall-8": "./images/wallpapers/wallpaper8.jpg",
    };

    useEffect(() => {
        // Load users from DB on mount
        const allUsers = ERPDatabase.getSystemUsers();

        // If in demo mode, only show demo user
        if (props.demoMode) {
            const demoUser = allUsers.find(u => u.role === 'demo');
            if (demoUser) {
                console.log('[LOCK_SCREEN] Auto-selecting demo user:', demoUser);
                setUsers([demoUser]);
                setSelectedUser(demoUser); // Auto-select demo user
            } else {
                console.error('[LOCK_SCREEN] Demo user not found in database!');
            }
        } else {
            setUsers(allUsers);
        }
    }, [props.demoMode]);

    // Reset state when screen is locked
    useEffect(() => {
        if (props.isLocked) {
            // Don't reset selected user in demo mode
            if (!props.demoMode) {
                setSelectedUser(null);
            }
            setPassword("");
            setError(false);
            setLoginAttempts(0);
            setIsLocked(false);
            setLockoutTime(null);
        }
    }, [props.isLocked, props.demoMode]);

    // Auto-login for demo mode (no password required)
    useEffect(() => {
        if (props.demoMode && selectedUser && selectedUser.role === 'demo' && selectedUser.password === '') {
            console.log('[LOCK_SCREEN] Auto-logging in demo user...');
            // Auto-login after 2.5 seconds to show the nice UI
            const timer = setTimeout(() => {
                props.unLockScreen(selectedUser);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [selectedUser, props.demoMode]);

    // Check lockout timer
    useEffect(() => {
        if (isLocked && lockoutTime) {
            const timer = setInterval(() => {
                const now = Date.now();
                if (now >= lockoutTime) {
                    setIsLocked(false);
                    setLoginAttempts(0);
                    setLockoutTime(null);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isLocked, lockoutTime]);

    const handleLogin = () => {
        if (!selectedUser) return;

        // Check if locked out
        if (isLocked) {
            const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000);
            setError(`Too many failed attempts. Try again in ${remainingTime} seconds`);
            return;
        }

        if (selectedUser.password === password) {
            props.unLockScreen(selectedUser);
            setPassword("");
            setError(false);
            setLoginAttempts(0);
        } else {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);

            if (newAttempts >= 3) {
                // Lock for 30 seconds after 3 failed attempts
                setIsLocked(true);
                setLockoutTime(Date.now() + 30000);
                setError('Too many failed attempts. Locked for 30 seconds.');
                setPassword("");
            } else {
                setError(`Incorrect password. ${3 - newAttempts} attempts remaining`);
            }
            setTimeout(() => {
                if (newAttempts < 3) {
                    setError(false);
                }
            }, 2000);
        }
    };

    // Select first user automatically if none selected but list loaded
    // useEffect(() => {
    //     if (users.length > 0 && !selectedUser) {
    //         setSelectedUser(users[0]);
    //     }
    // }, [users, selectedUser]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    console.log('[LOCK_SCREEN] Rendering - isLocked:', props.isLocked, 'selectedUser:', selectedUser?.displayName, 'demoMode:', props.demoMode);

    return (
        <div id="ubuntu-lock-screen" style={{ zIndex: "100" }}
            className={(props.isLocked ? " visible translate-y-0 " : " invisible -translate-y-full ") + " absolute outline-none bg-gray-300 bg-opacity-90 transform duration-500 select-none top-0 right-0 overflow-hidden m-0 p-0 h-screen w-screen"}>

            <div style={{ backgroundImage: `url(${wallpapers[props.bgImgName]})`, backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPositionX: "center" }}
                className="absolute top-0 left-0 w-full h-full transform z-20 blur-md "></div>

            <div className="w-full h-full z-50 overflow-hidden relative flex flex-col justify-center items-center text-white bg-black bg-opacity-40">

                {/* Clock only visible when no user selected or idle */}
                {!selectedUser && (
                    <div onClick={() => setSelectedUser(users[0])} className="cursor-pointer flex flex-col items-center mb-10 hover:scale-105 transition-transform duration-300">
                        <div className="text-7xl">
                            <Clock onlyTime={true} />
                        </div>
                        <div className="mt-4 text-xl font-medium">
                            <Clock onlyDay={true} />
                        </div>
                    </div>
                )}

                {/* Demo Mode Badge */}
                {props.demoMode && (
                    <div className="absolute top-8 right-8 bg-blue-500 bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        <span className="text-white font-bold text-sm">DEMO MODE</span>
                    </div>
                )}

                {/* Login Form */}
                <div className="flex flex-col items-center bg-black bg-opacity-50 p-10 rounded-2xl backdrop-blur-sm shadow-2xl transition-all duration-300">

                    {!selectedUser ? (
                        <>
                            <h3 className="text-xl mb-6 font-light">
                                {props.demoMode ? 'Demo Login' : 'Select User to Login'}
                            </h3>
                            <div className="flex gap-6">
                                {users.map((user, index) => (
                                    <div key={index}
                                        onClick={() => setSelectedUser(user)}
                                        className="flex flex-col items-center cursor-pointer hover:bg-white hover:bg-opacity-10 p-4 rounded-lg transition-all">
                                        <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-transparent hover:border-orange-500 overflow-hidden mb-2">
                                            <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-medium">{user.displayName}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            {/* Demo Mode - Show Loading Animation (No Password Required) */}
                            {props.demoMode && selectedUser.password === '' ? (
                                <div className="flex flex-col items-center space-y-6">
                                    {/* User Avatar with Glow */}
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 p-1 shadow-2xl">
                                            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                                                {/* User Icon */}
                                                <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Welcome Message */}
                                    <div className="text-center space-y-2">
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                                            Welcome to Alphery OS
                                        </h2>
                                        <p className="text-gray-300 text-lg font-medium">{selectedUser.displayName}</p>
                                    </div>

                                    {/* Advanced Loader */}
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="demo-loader"></div>

                                        {/* Loading Text */}
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                            </svg>
                                            <span className="text-xs font-medium">Loading demo environment...</span>
                                        </div>
                                    </div>

                                    <style jsx>{`
                                        .demo-loader {
                                            width: 60px;
                                            display: flex;
                                            align-items: flex-start;
                                            aspect-ratio: 1;
                                        }
                                        .demo-loader:before,
                                        .demo-loader:after {
                                            content: "";
                                            flex: 1;
                                            aspect-ratio: 1;
                                            --g: conic-gradient(from -90deg at 10px 10px, #3B82F6 90deg, #0000 0);
                                            background: var(--g), var(--g), var(--g);
                                            filter: drop-shadow(30px 30px 0 #A855F7);
                                            animation: demo-loader-anim 1s infinite;
                                        }
                                        .demo-loader:after {
                                            transform: scaleX(-1);
                                        }
                                        @keyframes demo-loader-anim {
                                            0%   { background-position: 0 0, 10px 10px, 20px 20px; }
                                            33%  { background-position: 10px 10px; }
                                            66%  { background-position: 0 20px, 10px 10px, 20px 0; }
                                            100% { background-position: 0 0, 10px 10px, 20px 20px; }
                                        }
                                    `}</style>

                                    {/* Feature Pills */}
                                    <div className="flex flex-wrap gap-2 justify-center max-w-md">
                                        <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs font-medium">
                                            No Sign-up Required
                                        </span>
                                        <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-medium">
                                            Instant Access
                                        </span>
                                        <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-xs font-medium">
                                            Full Features
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                /* Regular Login Form - For Admin and Other Users */
                                <>
                                    <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white overflow-hidden mb-4 shadow-lg">
                                        <img src={selectedUser.image} alt={selectedUser.username} className="w-full h-full object-cover" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-6">{selectedUser.displayName}</h2>

                                    <div className="relative w-64">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Password"
                                            autoFocus
                                            className={`w-full px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-500 text-black ${error ? 'border-red-500 bg-red-100' : 'border-gray-300'}`}
                                            disabled={isLocked}
                                        />
                                        <button
                                            onClick={handleLogin}
                                            disabled={isLocked}
                                            className="absolute right-1 top-1 bottom-1 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center justify-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                                            Login
                                        </button>
                                    </div>
                                    {error && <p className="text-red-400 text-sm mt-2 font-medium">{error}</p>}

                                    <button
                                        onClick={() => { setSelectedUser(null); setPassword(""); setError(false); }}
                                        className="mt-6 text-sm text-gray-300 hover:text-white underline">
                                        Switch User
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
