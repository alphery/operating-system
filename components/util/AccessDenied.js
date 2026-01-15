import React from 'react';

export default function AccessDenied({ appName }) {
    return (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center max-w-md px-8">
                {/* Lock Icon */}
                <div className="mb-6 mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Access Denied
                </h2>

                {/* Message */}
                <p className="text-gray-600 mb-2 leading-relaxed">
                    You don't have permission to access <span className="font-semibold text-gray-900">{appName}</span>.
                </p>

                <p className="text-gray-500 text-sm mb-6">
                    This app has been restricted by your administrator.
                </p>

                {/* Contact Box */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <p className="text-sm text-gray-600 mb-2">
                        Need access? Contact your administrator:
                    </p>
                    <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span>Alphery Support</span>
                    </div>
                </div>

                {/* Info */}
                <p className="text-xs text-gray-400">
                    Error Code: ERR_NO_PERMISSION
                </p>
            </div>
        </div>
    );
}
