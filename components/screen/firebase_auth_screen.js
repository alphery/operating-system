import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext-new';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';

export default function FirebaseAuthScreen({ onAuthSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auth Hook
    const { loginWithUserId } = useAuth();

    // Login State
    const [loginUid, setLoginUid] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup State
    const [signupStep, setSignupStep] = useState('info'); // 'info', 'password', 'success'
    const [signupData, setSignupData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: ''
    });
    const [generatedUid, setGeneratedUid] = useState('');

    // Toggle Mode
    const toggleMode = (newMode) => {
        if (loading) return;
        setError('');
        setMode(newMode);
        setIsFlipped(newMode === 'signup');
        // Reset states when switching
        if (newMode === 'login') {
            setSignupStep('info');
        }
    };

    // --- Login Handler (Direct User ID Login) ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Direct login with User ID
            await loginWithUserId(loginUid, loginPassword);

            // --- AUTO FULLSCREEN ON LOGIN ---
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
        } catch (authErr) {
            console.error('Login failed:', authErr);
            setError(authErr.message || 'Invalid User ID or password');
        } finally {
            setLoading(false);
        }
    };


    // --- Signup Handlers ---
    const handleSignupInfoSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!signupData.email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }
        setSignupStep('password');
    };

    const handleSignupPasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (signupData.password.length < 6) {
            setError('Password too short (min 6)');
            return;
        }
        if (signupData.password !== signupData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: signupData.name,
                    email: signupData.email,
                    mobile: signupData.mobile || undefined,
                    password: signupData.password,
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Signup failed');
            }
            const data = await response.json();
            setGeneratedUid(data.customUid);
            setSignupStep('success');
        } catch (err) {
            setError(err.message);
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

                {/* Mode Toggler */}
                <div className="mb-[2em] md:mb-[2.5em] flex justify-center">
                    <div className="bg-white/5 backdrop-blur-xl p-[0.3em] rounded-[1em] border border-white/10 flex items-center gap-[0.5em] shadow-2xl relative z-10 w-fit">
                        <button
                            onClick={() => toggleMode('login')}
                            className={`px-[2em] py-[0.8em] rounded-[0.8em] text-[0.8em] font-black uppercase tracking-[0.2em] transition-all duration-500 ${mode === 'login' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => toggleMode('signup')}
                            className={`px-[2em] py-[0.8em] rounded-[0.8em] text-[0.8em] font-black uppercase tracking-[0.2em] transition-all duration-500 ${mode === 'signup' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                {/* The Flip Card Container */}
                <div className={`auth-card-inner !min-h-[35em] ${isFlipped ? 'auth-card-flipped' : ''}`}>

                    {/* FRONT: LOGIN */}
                    <div className="auth-card-front">
                        <div className="bg-[#0f0f0f]/80 backdrop-blur-3xl rounded-[3em] p-[2.5em] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-full flex flex-col justify-center">
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
                                        <label className="text-[0.6em] font-black text-gray-500 uppercase tracking-[0.2em] ml-[0.5em]">Username</label>
                                        <input
                                            type="text"
                                            value={loginUid}
                                            onChange={(e) => setLoginUid(e.target.value.toUpperCase())}
                                            placeholder="AUXXXXXX"
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
                                    {loading ? 'Decrypting...' : 'Enter Workspace'}
                                </button>

                                <div className="pt-[0.5em] text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Trigger Fullscreen
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
                    </div>

                    {/* BACK: SIGNUP */}
                    <div className="auth-card-back">
                        <div className="bg-[#0f0f0f]/80 backdrop-blur-3xl rounded-[3em] p-[2.5em] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-full flex flex-col justify-center relative overflow-hidden">

                            {signupStep === 'success' ? (
                                <div className="text-center space-y-[2em] animate-in fade-in zoom-in duration-700">
                                    <div className="w-[4em] h-[4em] bg-green-500/10 border border-green-500/20 rounded-[1em] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                                        <svg className="w-[2.5em] h-[2.5em] text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h2 className="text-[1.8em] font-black text-white uppercase tracking-tighter">Access <span className="text-green-500">Granted</span></h2>
                                    <div className="bg-black/40 border border-white/10 rounded-[1.5em] p-[1.5em] shadow-inner">
                                        <p className="text-[0.6em] text-gray-500 font-black uppercase tracking-[0.2em] mb-[1em]">Identity Token</p>
                                        <div className="text-[2em] font-mono font-black text-white tracking-widest overflow-hidden break-all">{generatedUid}</div>
                                    </div>
                                    <button
                                        onClick={() => toggleMode('login')}
                                        className="w-full bg-white text-black py-[1em] rounded-[1.2em] font-black uppercase tracking-widest hover:bg-gray-100 transition-all font-sans text-[1em]"
                                    >
                                        Proceed to Login
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-[2em]">
                                        <div className="w-[4em] h-[4em] bg-black rounded-[1em] mx-auto flex items-center justify-center mb-[1.5em] shadow-xl">
                                            <img src="./images/logos/Dark_Logo_H.png" className="w-[2.5em] h-[2.5em] object-contain" alt="Logo" />
                                        </div>
                                        <h2 className="text-[1.8em] font-black text-white uppercase tracking-tighter">New <span className="text-purple-500">User</span></h2>
                                        <p className="text-[0.6em] text-gray-500 uppercase tracking-[0.3em] font-bold mt-[0.5em]">Enterprise Enrollment</p>
                                    </div>

                                    {signupStep === 'info' ? (
                                        <form onSubmit={handleSignupInfoSubmit} className="space-y-[1.2em]">
                                            <div className="space-y-[0.4em] focus-within:translate-x-1 transition-transform text-left">
                                                <label className="text-[0.6em] font-black text-gray-500 uppercase tracking-[0.2em] ml-[0.5em]">Name</label>
                                                <input
                                                    type="text"
                                                    value={signupData.name}
                                                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                                    placeholder="John Doe"
                                                    className="w-full px-[1.5em] py-[1em] bg-white/5 border border-white/10 rounded-[1.2em] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-[1em]"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-[0.4em] focus-within:translate-x-1 transition-transform text-left">
                                                <label className="text-[0.6em] font-black text-gray-500 uppercase tracking-[0.2em] ml-[0.5em]">Mobile No</label>
                                                <input
                                                    type="tel"
                                                    value={signupData.mobile}
                                                    onChange={(e) => setSignupData({ ...signupData, mobile: e.target.value })}
                                                    placeholder="+XX XXXXX XXXXX"
                                                    className="w-full px-[1.5em] py-[1em] bg-white/5 border border-white/10 rounded-[1.2em] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono transition-all text-[1em]"
                                                />
                                            </div>

                                            <div className="space-y-[0.4em] focus-within:translate-x-1 transition-transform text-left">
                                                <label className="text-[0.6em] font-black text-gray-500 uppercase tracking-[0.2em] ml-[0.5em]">Email ID</label>
                                                <input
                                                    type="email"
                                                    value={signupData.email}
                                                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                                    placeholder="mail@enterprise.os"
                                                    className="w-full px-[1.5em] py-[1em] bg-white/5 border border-white/10 rounded-[1.2em] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-[1em]"
                                                    required
                                                />
                                            </div>

                                            {error && <div className="text-red-400 text-[0.6em] font-bold uppercase tracking-wider text-center">{error}</div>}
                                            <button type="submit" className="w-full bg-white text-black py-[1em] rounded-[1.2em] font-black uppercase tracking-widest hover:bg-gray-100 active:scale-[0.98] transition-all shadow-xl text-[1em]">Create Account</button>
                                        </form>
                                    ) : (
                                        /* This acts as the Password "Popup" step */
                                        <div className="space-y-[2em] animate-in slide-in-from-right-8 duration-500">
                                            <div className="bg-purple-500/10 border border-purple-500/20 p-[1.2em] rounded-[1.5em] text-center">
                                                <p className="text-[0.7em] font-bold text-purple-400 uppercase tracking-[0.1em] leading-relaxed">Identity Info Verified. <br /> Set your new password</p>
                                            </div>

                                            <form onSubmit={handleSignupPasswordSubmit} className="space-y-[1.2em]">
                                                <div className="space-y-[0.4em] focus-within:translate-x-1 transition-transform text-left">
                                                    <label className="text-[0.6em] font-black text-gray-500 uppercase tracking-[0.2em] ml-[0.5em]">New Password</label>
                                                    <input
                                                        type="password"
                                                        value={signupData.password}
                                                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full px-[1.5em] py-[1em] bg-white/5 border border-white/10 rounded-[1.2em] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-[1em]"
                                                        required
                                                        autoFocus
                                                    />
                                                </div>

                                                <div className="space-y-[0.4em] focus-within:translate-x-1 transition-transform text-left">
                                                    <label className="text-[0.6em] font-black text-gray-500 uppercase tracking-[0.2em] ml-[0.5em]">Verify Password</label>
                                                    <input
                                                        type="password"
                                                        value={signupData.confirmPassword}
                                                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full px-[1.5em] py-[1em] bg-white/5 border border-white/10 rounded-[1.2em] text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-[1em]"
                                                        required
                                                    />
                                                </div>

                                                {error && <div className="text-red-400 text-[0.6em] font-bold uppercase tracking-wider text-center">{error}</div>}
                                                <div className="flex gap-[1em]">
                                                    <button type="button" onClick={() => setSignupStep('info')} className="flex-1 bg-white/5 border border-white/10 text-white py-[1em] rounded-[1.2em] font-bold uppercase text-[0.8em] hover:bg-white/10 transition-colors">Back</button>
                                                    <button type="submit" disabled={loading} className="flex-[2] bg-white text-black py-[1em] rounded-[1.2em] font-black uppercase tracking-widest hover:bg-gray-100 transition-all text-[1em]">
                                                        {loading ? 'Finalizing...' : 'Authorize Node'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </>
                            )}
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
