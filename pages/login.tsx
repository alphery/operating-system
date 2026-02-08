import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function LoginPage() {
    const [step, setStep] = useState<'uid' | 'password'>('uid');
    const [customUid, setCustomUid] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Get email by custom UID
            const response = await fetch(`${BACKEND_URL}/auth/get-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customUid }),
            });

            if (!response.ok) {
                throw new Error('Invalid User ID');
            }

            const data = await response.json();
            setEmail(data.email);
            setStep('password');
        } catch (err: any) {
            setError(err.message || 'Invalid User ID');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            // Exchange for session token
            const response = await fetch(`${BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();

            // Store session
            localStorage.setItem('sessionToken', data.sessionToken);
            localStorage.setItem('platformUser', JSON.stringify(data.platformUser));
            localStorage.setItem('tenants', JSON.stringify(data.tenants));

            // Redirect to desktop
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Invalid password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/30 rounded-full blur-[100px]" />

            <div className="max-w-md w-full relative z-10">
                {/* Glass Card */}
                <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl mx-auto mb-4 shadow-lg flex items-center justify-center text-white text-2xl font-bold">
                            A
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-gray-500 font-medium">Sign in to Alphery OS</p>
                    </div>

                    {step === 'uid' ? (
                        <form onSubmit={handleUidSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                    User ID
                                </label>
                                <input
                                    type="text"
                                    value={customUid}
                                    onChange={(e) => setCustomUid(e.target.value.toUpperCase())}
                                    placeholder="AUxxxxxx"
                                    className="w-full px-5 py-3.5 bg-white/60 border border-white/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all shadow-sm"
                                    required
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50/80 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Continue'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-white/60 mb-6">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-sm">
                                    ID
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">User ID</p>
                                    <p className="text-gray-800 font-semibold">{customUid}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('uid');
                                        setPassword('');
                                        setError('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-2"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-3.5 bg-white/60 border border-white/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all shadow-sm"
                                    required
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50/80 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('uid');
                                        setPassword('');
                                        setError('');
                                    }}
                                    className="flex-1 bg-white/50 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-white/80 transition-all border border-transparent hover:border-gray-200"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Footer Links */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
                        <p className="text-gray-500 text-sm">
                            New to Alphery?{' '}
                            <a href="/signup" className="text-purple-600 hover:text-purple-700 font-bold hover:underline decoration-2 underline-offset-2 transition-all">
                                Create Account
                            </a>
                        </p>
                    </div>
                </div>

                {/* Bottom Text */}
                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm font-medium">© 2026 Alphery OS • Secure Login</p>
                </div>
            </div>
        </div>
    );
}
