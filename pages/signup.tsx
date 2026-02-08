import React, { useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function SignUpPage() {
    const [step, setStep] = useState<'info' | 'password' | 'success'>('info');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
    });
    const [customUid, setCustomUid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        setStep('password');
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate password
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    mobile: formData.mobile || undefined,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Sign up failed');
            }

            const data = await response.json();
            setCustomUid(data.customUid);
            setStep('success');
        } catch (err: any) {
            setError(err.message || 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/30 rounded-full blur-[100px]" />

            <div className="max-w-md w-full relative z-10">
                {/* Glass Card */}
                <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">Create Account</h1>
                        <p className="text-gray-500 font-medium">Join the future with Alphery OS</p>
                    </div>

                    {step === 'info' && (
                        <form onSubmit={handleInfoSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full px-5 py-3.5 bg-white/60 border border-white/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all shadow-sm"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    className="w-full px-5 py-3.5 bg-white/60 border border-white/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all shadow-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                    Mobile Number <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    placeholder="+1 234 567 8900"
                                    className="w-full px-5 py-3.5 bg-white/60 border border-white/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all shadow-sm"
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
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all"
                            >
                                Continue
                            </button>
                        </form>
                    )}

                    {step === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            <div className="bg-blue-50/80 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm flex gap-3 items-start">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>Set a strong password to secure your account.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                    className="w-full px-5 py-3.5 bg-white/60 border border-white/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all shadow-sm"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Re-enter your password"
                                    className="w-full px-5 py-3.5 bg-white/60 border border-white/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white transition-all shadow-sm"
                                    required
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
                                        setStep('info');
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
                                    {loading ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-xl">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
                                <p className="text-gray-500">
                                    Welcome to the family. Here is your User ID.
                                </p>
                            </div>

                            <div className="bg-white/60 border border-white/80 rounded-2xl p-6 shadow-inner relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your User ID</p>
                                <div className="text-4xl font-mono font-bold text-gray-800 tracking-wider mb-2 select-all">
                                    {customUid}
                                </div>
                                <p className="text-xs text-amber-600 font-medium mt-4 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-100">
                                    ⚠️ Save this ID. You'll need it to log in.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(customUid);
                                        // Ideally show toast
                                        alert('User ID copied to clipboard!');
                                    }}
                                    className="w-full bg-white/50 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-white/80 transition-all border border-transparent hover:border-gray-200 shadow-sm"
                                >
                                    📋 Copy User ID
                                </button>

                                <a
                                    href="/login"
                                    className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all text-center shadow-md"
                                >
                                    Go to Login
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Footer Links */}
                    {step !== 'success' && (
                        <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
                            <p className="text-gray-500 text-sm">
                                Already have an account?{' '}
                                <a href="/login" className="text-purple-600 hover:text-purple-700 font-bold hover:underline decoration-2 underline-offset-2 transition-all">
                                    Sign In
                                </a>
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom Text */}
                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm font-medium">© 2026 Alphery OS • Join the Future</p>
                </div>
            </div>
        </div>
    );
}
