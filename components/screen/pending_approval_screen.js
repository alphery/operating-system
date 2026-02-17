import React from 'react';
import { useAuth } from '../../context/AuthContext-new';

export default function PendingApprovalScreen() {
    const { signOut: logout, platformUser: userData } = useAuth();

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans selection:bg-purple-500/30">
            {/* --- PREMIUM BACKGROUND ANIMATION --- */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Floating Mesh Gradients */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.05)_0%,transparent_70%)]"></div>

                {/* Static Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            </div>

            {/* --- MAIN CARD --- */}
            <div className="relative z-10 w-[90%] md:w-[70%] lg:w-[40%] xl:w-[30%] min-w-[320px] max-h-[90vh] flex flex-col group transition-all duration-500">
                {/* Glow Effect Border Wrapper */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

                <div className="relative bg-black/40 backdrop-blur-3xl rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col h-full max-h-full">
                    {/* Interior Header Decor */}
                    <div className="h-2 w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent shrink-0"></div>

                    <div className="p-6 sm:p-10 lg:p-12 overflow-y-auto custom-scrollbar flex-1">
                        {/* Header Section */}
                        <div className="flex flex-col items-center text-center mb-6 sm:mb-10">
                            <div className="relative mb-6 sm:mb-8">
                                {/* Animated Outer Ring */}
                                <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/30 animate-[spin_20s_linear_infinite]"></div>

                                {/* Status Icon Container */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-white/10 to-transparent rounded-full flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                </div>

                                {/* Floating Badge */}
                                <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-1.5 sm:p-2 rounded-xl shadow-lg animate-bounce">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2 sm:mb-3">
                                Access <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Restricted</span>
                            </h1>
                            <p className="text-gray-400 font-medium text-sm sm:text-base max-w-xs mx-auto leading-relaxed">
                                Your account is currently in the <span className="text-white">secure approval queue</span>.
                            </p>
                        </div>

                        {/* User Identity Panel */}
                        {userData && (
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 flex items-center gap-4 sm:gap-5 hover:bg-white/[0.05] transition-colors">
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center p-[2px]">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                            {userData.photoURL ? (
                                                <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white font-bold text-lg sm:text-xl uppercase italic">
                                                    {(userData.displayName || userData.email)[0]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full border-2 border-black animate-pulse"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-base sm:text-lg truncate">{userData.displayName || 'Guest User'}</p>
                                    <p className="text-gray-500 text-xs sm:text-sm truncate uppercase tracking-widest">{userData.email}</p>
                                </div>
                            </div>
                        )}

                        {/* Status Message */}
                        <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4 sm:p-6 mb-8 sm:mb-10">
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-500/20 p-2 rounded-lg mt-1 shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-purple-300 font-bold mb-1 text-sm sm:text-base">Verification Required</h4>
                                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                        For your security, Alphery OS requires manual activation by an administrator. You'll be granted entry once your identity is confirmed.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="group relative py-3 sm:py-4 px-4 sm:px-6 bg-white text-black rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] transition-all hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden text-sm sm:text-base"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                REFRESH
                            </button>

                            <button
                                onClick={logout}
                                className="group py-3 sm:py-4 px-4 sm:px-6 bg-transparent border border-white/20 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 hover:bg-white/10 hover:border-white/40 transition-all active:scale-[0.98] text-sm sm:text-base"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                                LOGOUT
                            </button>
                        </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="bg-white/[0.02] border-t border-white/5 py-4 sm:py-6 px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative w-2.5 h-2.5 sm:w-3 sm:h-3">
                                <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-75"></div>
                                <div className="relative bg-purple-600 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"></div>
                            </div>
                            <span className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-tighter">System is Online</span>
                        </div>
                        <div className="text-gray-500 text-[9px] sm:text-[10px] font-medium tracking-[0.2em] uppercase">
                            Alphery Access v2.0
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Corner Decors */}
            <div className="absolute top-0 right-0 p-10 hidden md:block opacity-20 hover:opacity-100 transition-opacity">
                <div className="text-white text-right space-y-1">
                    <p className="text-[10px] font-black tracking-widest uppercase">Encryption Mode</p>
                    <p className="text-[10px] font-black tracking-widest uppercase text-purple-500">AES-256-GCM</p>
                </div>
            </div>
        </div>
    );
}
