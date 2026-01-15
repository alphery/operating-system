import React, { Component } from 'react';

export class AboutAlphery extends Component {
    constructor() {
        super();
        this.state = {};
    }

    render() {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-900 font-sans select-none">
                <div className="flex flex-col items-center gap-6 p-8">
                    {/* OS Logo */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-30 transition duration-500 rounded-full"></div>
                        <img
                            src="./images/logos/Dark_Logo_H.png"
                            alt="Alphery OS Logo"
                            className="h-24 w-auto object-contain drop-shadow-2xl relative z-10 transition transform group-hover:scale-105 duration-300"
                        />
                    </div>

                    {/* OS Title */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Alphery OS</h1>
                        <p className="text-sm font-medium text-gray-500">Version 2.0 (Build 24A348)</p>
                    </div>

                    {/* Specs Grid */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-80">
                        <div className="space-y-4 text-[13px]">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-gray-500 font-medium">Model</span>
                                <span className="text-gray-900 font-semibold">MacBook Pro 16"</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-gray-500 font-medium">Processor</span>
                                <span className="text-gray-900 font-semibold">Apple M3 Max</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-gray-500 font-medium">Memory</span>
                                <span className="text-gray-900 font-semibold">128 GB</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-gray-500 font-medium">Graphics</span>
                                <span className="text-gray-900 font-semibold">Apple GPU (40-core)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Serial Number</span>
                                <span className="text-gray-900 font-mono text-xs">AOS-X99-2024</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 mt-2">
                        <button className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-md transition border border-gray-300">
                            System Report...
                        </button>
                        <button className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-md transition border border-gray-300">
                            Software Update...
                        </button>
                    </div>

                    <div className="text-[10px] text-gray-400 mt-6 text-center leading-relaxed">
                        &copy; 2024 Alphery Inc. All rights reserved.<br />
                        License: Enterprise Edition
                    </div>
                </div>
            </div>
        );
    }
}

export const displayAboutAlphery = () => {
    return <AboutAlphery />;
}
