
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext-new';

export default function FirebaseAuthScreen({ onAuthSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auth Hook - use loginDirect for AA/AT/AU system
    const { loginWithGoogle } = useAuth();

    // --- Login Handler (Google - No Firebase) ---
    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle();

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

                    <div className="space-y-[1.5em]">
                        {error && <div className="text-red-400 text-[0.6em] font-bold uppercase tracking-wider text-center animate-shake">{error}</div>}

                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white text-black py-[1em] rounded-[1.2em] font-black uppercase tracking-widest hover:bg-gray-100 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)] text-[1em] flex items-center justify-center gap-2"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-[1.2em] h-[1.2em]" alt="Google Logo" />
                            {loading ? 'Authenticating...' : 'Sign in with Google'}
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
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-[3em] text-center opacity-30">
                    <p className="text-[0.55em] font-black text-white uppercase tracking-[0.5em]">Alphery Enterprise Edition 1.0</p>
                </div>
            </div>
        </div>
    );
}
