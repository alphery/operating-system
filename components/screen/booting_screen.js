import React from 'react'

function BootingScreen(props) {

    return (
        <div style={(props.visible || props.isShutDown ? { zIndex: "100" } : { zIndex: "-20" })} className={(props.visible || props.isShutDown ? " visible opacity-100" : " invisible opacity-0 ") + " absolute duration-500 select-none flex flex-col justify-center items-center top-0 right-0 overflow-hidden m-0 p-0 h-screen w-screen bg-black"}>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Alphery OS Logo with animated OS */}
                <div className="relative mb-16 flex items-center justify-center overflow-visible">
                    {/* ALPHERY text */}
                    <h1 className="text-7xl md:text-9xl font-black tracking-tight relative">
                        <span className="bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-transparent bg-clip-text">
                            ALPHERY
                        </span>
                    </h1>

                    {/* OS text - animates from inside ALPHERY */}
                    <div className="relative overflow-visible ml-4">
                        <span className="text-7xl md:text-9xl font-black tracking-tight bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 text-transparent bg-clip-text animate-slide-out">
                            OS
                        </span>
                    </div>
                </div>

                {/* Loading indicator */}
                {!props.isShutDown && (
                    <div className="flex flex-col items-center">
                        {/* White loading spinner */}
                        <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin mb-4"></div>

                        {/* Loading dots */}
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}

                {/* Power button for shutdown state */}
                {props.isShutDown && (
                    <div className="flex flex-col items-center cursor-pointer group" onClick={props.turnOn}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                            <div className="relative bg-gray-900 rounded-full p-6 border-2 border-white group-hover:border-purple-500 transition-all">
                                <svg className="w-12 h-12 text-white group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mt-6 uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:text-white transition-all">Press to Start</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                @keyframes slide-out {
                    0% {
                        transform: translateX(-100%) scale(0.5);
                        opacity: 0;
                    }
                    60% {
                        transform: translateX(10px) scale(1.1);
                    }
                    100% {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                }
                
                .animate-slide-out {
                    animation: slide-out 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }
            `}</style>
        </div>
    )
}

export default BootingScreen
