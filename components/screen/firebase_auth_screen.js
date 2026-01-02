import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function FirebaseAuthScreen({ onAuthSuccess }) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { loginWithGoogle } = useAuth();

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            await loginWithGoogle();
            onAuthSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="w-full max-w-md p-8 space-y-10">
                {/* Logo */}
                <div className="text-center transform hover:scale-105 transition-transform duration-500">
                    <h1 className="text-6xl font-black tracking-tight">
                        <span className="bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-transparent bg-clip-text animate-gradient-x">
                            ALPHERY
                        </span>
                        <span className="ml-3 bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-transparent bg-clip-text animate-gradient-x">
                            OS
                        </span>
                    </h1>
                </div>

                {/* Actions */}
                <div className="space-y-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5 ring-4 ring-transparent hover:ring-white/10"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-lg">Sign in with Google</span>
                    </button>

                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm text-center backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <div className="text-center pt-2">
                        <button
                            onClick={() => onAuthSuccess({ isDemo: true })}
                            className="group relative px-4 py-2 text-gray-500 hover:text-white transition-colors text-sm font-medium overflow-hidden rounded-lg"
                        >
                            <span className="relative z-10">Continue without account</span>
                            <div className="absolute inset-0 bg-white/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 rounded-lg"></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
