import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext-new';

export default function FirebaseAuthScreen({ onAuthSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auth Hook - use loginDirect for AA/AT/AU system
    const { loginDirect, emergencyLogin } = useAuth();

    // Login State
    const [loginUid, setLoginUid] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // --- Login Handler (Direct - No Firebase) ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Direct login with AA/AT/AU ID + Password
            await loginDirect(loginUid.trim(), loginPassword);

            // Auto fullscreen on login
            try {
                const docElm = document.documentElement;
                if (docElm.requestFullscreen) docElm.requestFullscreen();
                else if (docElm.mozRequestFullScreen) docElm.mozRequestFullScreen();
                else if (docElm.webkitRequestFullScreen) docElm.webkitRequestFullScreen();
                else if (docElm.msRequestFullscreen) docElm.msRequestFullscreen();
            } catch (e) {
                console.log("Fullscreen request failed:", e);
            }

            onAuthSuccess();
        } catch (err) {
            console.warn('Login failed:', err.message);

            // Emergency fallback for admin IDs
            if (loginUid.trim() === 'AA000001') {
                console.warn('Admin ID detected. Activating Emergency Bypass...');
                try {
                    const docElm = document.documentElement;
                    if (docElm.requestFullscreen) docElm.requestFullscreen();
                } catch (e) { }
                await emergencyLogin('alpherymail@gmail.com');
                onAuthSuccess();
                return;
            }

            setError(err.message || 'Connection failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-y-auto overflow-x-hidden font-sans py-8">
            {/* Ambient Background */}
            <div className="fixed inset-0 bg-[url('/images/wallpapers/wall-2.webp')] bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"></div>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl pointer-events-none"></div>

            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />

            <div className="relative w-full max-w-full perspective-auth p-[1.5em] md:p-[2em] my-auto transition-all duration-500">

                {/* LOGIN FORM */}
                <div className="bg-[#0f0f0f]/80 backdrop-blur-3xl rounded-[3em] p-[2.5em] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-[500px] mx-auto">
                    <div className="text-center mb-[2em]">
                        <div className="w-[4em] h-[4em] bg-black rounded-[1em] mx-auto flex items-center justify-center mb-[1.5em] shadow-xl">
                            <img src="./images/logos/Dark_Logo_H.png" className="w-[2.5em] h-[2.5em] object-contain" alt="Logo" />
                        </div>
                        <h2 className="text-[1.8em] font-black text-white uppercase tracking-tighter">Welcome to <span className="text-purple-500">Alphery</span></h2>
                        <p className="text-[0.6em] text-gray-500 uppercase tracking-[0.3em] font-bold mt-[0.5em]">An Enterprise grade workspace</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-[1.5em]">
                        <div className="space-y-[1em]">
                            <div className="space-y-[0.4em]">
                                <label className="text-[0.6em] font-black text-gray-500 uppercase tracking-[0.2em] ml-[0.5em]">User ID</label>
                                <input
                                    type="text"
                                    value={loginUid}
                                    onChange={(e) => setLoginUid(e.target.value.toUpperCase())}
                                    placeholder="AA000001 / AT000001 / AU000001"
                                    className="w-full px-[1.5em] py-[1em] bg-white/5 border border-white/10 rounded-[1.2em] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono tracking-widest text-[1.1em] transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-[0.4em]">
                                <label className="text-[0.6em] font-black text-gray-500 uppercase tracking-[0.2em] ml-[0.5em]">Password</label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-[1.5em] py-[1em] bg-white/5 border border-white/10 rounded-[1.2em] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[1.1em] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className="text-red-400 text-[0.6em] font-bold uppercase tracking-wider text-center animate-shake">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black py-[1em] rounded-[1.2em] font-black uppercase tracking-widest hover:bg-gray-100 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)] text-[1em]"
                        >
                            {loading ? 'Authenticating...' : 'Enter Workspace'}
                        </button>

                        <div className="pt-[0.5em] text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        const docElm = document.documentElement;
                                        if (docElm.requestFullscreen) docElm.requestFullscreen();
                                        else if (docElm.mozRequestFullScreen) docElm.mozRequestFullScreen();
                                        else if (docElm.webkitRequestFullScreen) docElm.webkitRequestFullScreen();
                                        else if (docElm.msRequestFullscreen) docElm.msRequestFullscreen();
                                    } catch (e) { }
                                    onAuthSuccess({ demoMode: true });
                                }}
                                className="text-[0.6em] font-black text-gray-600 hover:text-white uppercase tracking-[0.2em] transition-colors"
                            >
                                Explore as Guest
                            </button>
                        </div>
                    </form>
                </div>

                {/* Branding Footer */}
                <div className="mt-[3em] text-center opacity-30">
                    <p className="text-[0.55em] font-black text-white uppercase tracking-[0.5em]">Alphery Enterprise Edition 1.0</p>
                </div>
            </div>
        </div>
    );
}
