import React from 'react';
import { useAuth } from '../../context/AuthContext-new';

export default function PendingApprovalScreen() {
    const { signOut: logout, platformUser: userData } = useAuth();

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-md w-full mx-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-white text-center mb-2">
                        Pending Approval
                    </h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto mb-6 rounded-full"></div>

                    {/* Message */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                        <p className="text-gray-200 text-center mb-4 leading-relaxed">
                            Your account is currently <span className="font-bold text-yellow-400">waiting for approval</span> from the system administrator.
                        </p>
                        <p className="text-gray-400 text-sm text-center">
                            You will receive access to Alphery OS once your request is reviewed and approved.
                        </p>
                    </div>

                    {/* User Info */}
                    {userData && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 overflow-hidden flex items-center justify-center">
                                    {userData.photoURL ? (
                                        <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold text-lg">
                                            {(userData.displayName || userData.email)[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold">{userData.displayName}</p>
                                    <p className="text-gray-400 text-sm">{userData.email}</p>
                                </div>
                                <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                                    <span className="text-yellow-400 text-xs font-bold">PENDING</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status indicators */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Request submitted</span>
                        </div>
                        <div className="w-16 h-px bg-gray-600"></div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span>Awaiting review</span>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <p className="text-blue-300 text-sm font-semibold mb-1">What's Next?</p>
                                <p className="text-blue-200 text-xs leading-relaxed">
                                    The administrator will review your request shortly. You'll be notified via email once your account is approved. Please check back later.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            Check Status
                        </button>
                        <button
                            onClick={logout}
                            className="w-full py-3 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg font-medium transition-all duration-200"
                        >
                            Sign Out
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-gray-500 text-xs text-center mt-6">
                        Need help? Contact the administrator at{' '}
                        <span className="text-blue-400 font-semibold">alpherymail@gmail.com</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
