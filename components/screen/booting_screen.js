import React from 'react'

function BootingScreen(props) {

    return (
        <div style={(props.visible || props.isShutDown ? { zIndex: "100" } : { zIndex: "-20" })} className={(props.visible || props.isShutDown ? " visible opacity-100" : " invisible opacity-0 ") + " absolute duration-500 select-none flex flex-col justify-center items-center top-0 right-0 overflow-hidden m-0 p-0 h-screen w-screen bg-[#0d0d0d] bg-[url('/images/wallpapers/wall-2.webp')] bg-cover bg-center"}>

            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl"></div>

            <div className="relative z-10 flex flex-col items-center justify-center space-y-12">

                {/* Brand Identity */}
                <div className="text-center transform transition-transform duration-700 hover:scale-105">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient-x pb-4">
                        ALPHERY WORKSPACE
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base font-medium tracking-[0.2em] uppercase opacity-80 mt-2">
                        System Initializing
                    </p>
                </div>

                {/* Loading State */}
                {!props.isShutDown && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="scale-loader">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                    </div>
                )}

                {/* Shutdown State */}
                {props.isShutDown && (
                    <div
                        onClick={props.turnOn}
                        className="group flex flex-col items-center cursor-pointer transition-all duration-300"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:shadow-purple-500/30 group-hover:border-purple-500/50 group-hover:scale-110 transition-all duration-300 backdrop-blur-md">
                            <svg className="w-8 h-8 text-white/50 group-hover:text-purple-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="mt-4 text-gray-500 text-xs font-semibold tracking-widest uppercase group-hover:text-purple-400 transition-colors duration-300">
                            Power On
                        </span>
                    </div>
                )}
            </div>

            {/* Version Info */}
            <div className="absolute bottom-8 text-center">
                <p className="text-gray-700 text-[10px] font-mono opacity-50">v2.1.0 • Stable Build</p>
            </div>
        </div>
    )
}

export default BootingScreen
