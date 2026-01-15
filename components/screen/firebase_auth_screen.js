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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0d] bg-[url('/images/wallpapers/wall-2.webp')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>

            <div className="relative w-full max-w-sm p-8 space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Logo Section */}
                <div className="flex flex-col items-center justify-center space-y-4">
                    {/* Optional: Add Logo Image here if available 
                    <img src="./images/logos/white-logo.png" className="w-16 h-16 object-contain mb-2" />
                    */}
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight font-sans bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-transparent bg-clip-text animate-gradient-x pb-2">
                            Alphery OS
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 font-medium tracking-wide">
                            Experience the future of web
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4 pt-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="group w-full py-3.5 px-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl shadow-white/5"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-base">Sign in with Google</span>
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs text-center backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <div className="text-center pt-4">
                        <button
                            onClick={() => onAuthSuccess({ demoMode: true })}
                            className="text-gray-500 hover:text-white transition-colors text-xs font-medium px-4 py-2 rounded-lg hover:bg-white/5"
                        >
                            Try Demo Mode
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer / Copyright */}
            <div className="absolute bottom-6 text-center w-full">
                <p className="text-gray-600 text-[10px] tracking-widest uppercase opacity-50">Designed by Alphery Team</p>
            </div>
        </div>
    );
}
