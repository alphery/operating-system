import React, { useState, useEffect } from 'react';
import Clock from '../util components/clock';
import ERPDatabase from '../util components/database';

export default function LockScreen(props) {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

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
        setUsers(ERPDatabase.getSystemUsers());
    }, []);

    // Reset state when screen is locked
    useEffect(() => {
        if (props.isLocked) {
            setSelectedUser(null);
            setPassword("");
            setError(false);
        }
    }, [props.isLocked]);

    const handleLogin = () => {
        if (!selectedUser) return;

        if (selectedUser.password === password) {
            props.unLockScreen(selectedUser);
            setPassword("");
            setError(false);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
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

                {/* Login Form */}
                <div className="flex flex-col items-center bg-black bg-opacity-50 p-10 rounded-2xl backdrop-blur-sm shadow-2xl transition-all duration-300">

                    {!selectedUser ? (
                        <>
                            <h3 className="text-xl mb-6 font-light">Select User to Login</h3>
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
                                />
                                <button
                                    onClick={handleLogin}
                                    className="absolute right-1 top-1 bottom-1 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center justify-center transition-colors">
                                    Login
                                </button>
                            </div>
                            {error && <p className="text-red-400 text-sm mt-2 font-medium">Incorrect password. Try "123"</p>}

                            <button
                                onClick={() => { setSelectedUser(null); setPassword(""); setError(false); }}
                                className="mt-6 text-sm text-gray-300 hover:text-white underline">
                                Switch User
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
