import React from 'react'

function BootingScreen(props) {

    return (
        <div style={(props.visible || props.isShutDown ? { zIndex: "100" } : { zIndex: "-20" })} className={(props.visible || props.isShutDown ? " visible opacity-100" : " invisible opacity-0 ") + " absolute duration-500 select-none flex flex-col justify-center items-center top-0 right-0 overflow-hidden m-0 p-0 h-screen w-screen bg-black"}>

            {/* Subtle Background Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/5 via-purple-600/5 to-blue-500/5 blur-3xl"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Animated ALPHERY OS Text */}
                <div className="text-center mb-16">
                    <svg height="0" width="0" className="absolute">
                        <defs>
                            <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3B82F6">
                                    <animate attributeName="stop-color" values="#3B82F6; #A855F7; #3B82F6" dur="4s" repeatCount="indefinite"></animate>
                                </stop>
                                <stop offset="50%" stopColor="#A855F7">
                                    <animate attributeName="stop-color" values="#A855F7; #3B82F6; #A855F7" dur="4s" repeatCount="indefinite"></animate>
                                </stop>
                                <stop offset="100%" stopColor="#3B82F6">
                                    <animate attributeName="stop-color" values="#3B82F6; #A855F7; #3B82F6" dur="4s" repeatCount="indefinite"></animate>
                                </stop>
                            </linearGradient>
                        </defs>
                    </svg>

                    <svg width="600" height="120" viewBox="0 0 600 120" className="mx-auto">
                        <text
                            x="50%"
                            y="50%"
                            dominantBaseline="middle"
                            textAnchor="middle"
                            fill="url(#text-gradient)"
                            className="tracking-tight"
                            fontSize="72"
                            fontWeight="600"
                            fontFamily="SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                        >
                            ALPHERY OS
                        </text>
                    </svg>

                    {/* Tagline */}
                    <p className="text-gray-500 text-sm font-normal tracking-wide mt-3" style={{ fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                        Enterprise Operating System
                    </p>
                </div>

                {/* Loading Section */}
                {!props.isShutDown && (
                    <div className="flex flex-col items-center">
                        {/* Simple rotating dots loader */}
                        <div className="relative w-16 h-16">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1 h-3 bg-white rounded-full will-change-opacity"
                                    style={{
                                        left: '50%',
                                        top: '50%',
                                        transform: `rotate(${i * 30}deg) translate(0, -24px)`,
                                        transformOrigin: '0 24px',
                                        opacity: 1 - (i * 0.08),
                                        animation: `dots-spin 1s linear infinite`,
                                        animationDelay: `${-1 + (i * 0.083)}s`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Shutdown State - Clean Power Button */}
                {props.isShutDown && (
                    <div className="flex flex-col items-center cursor-pointer group" onClick={props.turnOn}>

                        {/* Power Button - macOS Style */}
                        <div className="relative">
                            {/* Glow on Hover */}
                            <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/0 via-purple-600/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:via-purple-600/20 group-hover:to-blue-500/20 rounded-full blur-xl transition-all duration-500"></div>

                            {/* Button */}
                            <div className="relative w-20 h-20 bg-gray-900/50 backdrop-blur-sm border border-gray-800 group-hover:border-purple-500/50 rounded-full flex items-center justify-center transition-all duration-300">
                                <svg className="w-8 h-8 text-gray-600 group-hover:text-gray-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3m0 0L9.5 6.5M13 3l3.5 3.5M19 12a7 7 0 11-14 0" />
                                </svg>
                            </div>
                        </div>

                        {/* Text */}
                        <p className="text-gray-600 group-hover:text-gray-400 text-xs font-medium mt-5 transition-all duration-300" style={{ fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                            Press to start
                        </p>
                    </div>
                )}
            </div>

            {/* Version Badge - Bottom Right */}
            <div className="absolute bottom-6 right-6 text-gray-700 text-xs font-medium tracking-wide" style={{ fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                Version 2.0
            </div>

            <style jsx>{`
                /* macOS-style smooth animations */
                * {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                
                @keyframes dots-spin {
                    0% { opacity: 1; }
                    100% { opacity: 0.1; }
                }
            `}</style>
        </div>
    )
}

export default BootingScreen
