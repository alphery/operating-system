import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

// Mock data generator for visual techiness
const useLiveMetric = (min: number, max: number, intervalMs: number) => {
    const [value, setValue] = useState(min);
    useEffect(() => {
        const i = setInterval(() => {
            setValue(Math.floor(Math.random() * (max - min + 1)) + min);
        }, intervalMs);
        return () => clearInterval(i);
    }, [min, max, intervalMs]);
    return value;
};

// Log Message Type
type Log = { id: string; time: string; type: 'info' | 'success' | 'warn' | 'error'; msg: string };

export const RealtimeDemo = () => {
    const { socket, connected } = useSocket();
    const [logs, setLogs] = useState<Log[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Real-time System Metrics
    const [metrics, setMetrics] = useState({
        cpuLoad: 0,
        memoryUsage: 0,
        latency: 0,
        requests: 0,
        uptime: 0,
        dbStatus: 'connecting...',
        dbError: null as string | null,
        firebaseStatus: 'connecting...',
        firebaseError: null as string | null,
        serverStatus: 'offline'
    });

    // Request counter simulation (since backend doesn't track this globally yet)
    const reqRef = useRef(0);
    const prevErrors = useRef({ db: null as string | null, firebase: null as string | null });

    useEffect(() => {
        const fetchHealth = async () => {
            const start = Date.now();
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/health`);
                const data = await res.json();
                const latency = Date.now() - start;

                reqRef.current += Math.floor(Math.random() * 5); // Simulate traffic increments

                setMetrics(prev => ({
                    ...prev,
                    cpuLoad: data.system?.cpuLoad || 0,
                    memoryUsage: data.system?.memoryUsage || 0,
                    latency,
                    requests: reqRef.current,
                    uptime: data.uptime || 0,
                    dbStatus: data.database?.status || 'unknown',
                    dbError: data.database?.error || null,
                    firebaseStatus: data.firebase?.status || 'unknown',
                    firebaseError: data.firebase?.error || null,
                    serverStatus: 'online'
                }));
            } catch (err) {
                setMetrics(prev => ({
                    ...prev,
                    serverStatus: 'offline',
                    latency: 0,
                    dbStatus: 'disconnected',
                    dbError: null,
                    firebaseStatus: 'disconnected',
                    firebaseError: null
                }));
            }
        };

        fetchHealth(); // Initial fetch
        const interval = setInterval(fetchHealth, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    // Monitor for new errors and log them
    useEffect(() => {
        if (metrics.dbError && metrics.dbError !== prevErrors.current.db) {
            addLog('error', `DATABASE FAILURE: ${metrics.dbError}`);
            prevErrors.current.db = metrics.dbError;
        }
        if (metrics.firebaseError && metrics.firebaseError !== prevErrors.current.firebase) {
            addLog('error', `FIREBASE FAILURE: ${metrics.firebaseError}`);
            prevErrors.current.firebase = metrics.firebaseError;
        }
        // Clear errors if resolved
        if (!metrics.dbError) prevErrors.current.db = null;
        if (!metrics.firebaseError) prevErrors.current.firebase = null;
    }, [metrics.dbError, metrics.firebaseError]);

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // System Startup Logs
    useEffect(() => {
        addLog('info', 'Initializing Alphery OS Realtime Kernel...');
        setTimeout(() => addLog('info', 'Connecting to Telemetry Stream...'), 800);
    }, []);

    // Socket Listeners - Monitoring Real Connection
    useEffect(() => {
        if (socket) {
            socket.on('connect', () => {
                addLog('success', 'Socket Uplink Established.');
            });
            socket.on('disconnect', () => addLog('warn', 'Socket Uplink Lost. Retrying...'));
            socket.on('message', (data: any) => {
                const user = data.user || 'System';
                const text = data.text || JSON.stringify(data);
                addLog('info', `[${user}]: ${text}`);
            });

            return () => {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('message');
            };
        }
    }, [socket]);

    const addLog = (type: Log['type'], msg: string) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev.slice(-49), { id: Math.random().toString(36).substr(2, 9), time, type, msg }]);
    };

    const sendCommand = () => {
        if (!inputMessage.trim()) return;

        if (socket && connected) {
            socket.emit('message', { text: inputMessage, user: 'Admin' });
            addLog('success', `>> SENT: ${inputMessage}`);
            setInputMessage('');
        } else {
            addLog('error', 'Transmission Failed: Socket Disconnected');
        }
    };

    return (
        <div className="w-full h-full bg-[#0a0f1c] text-cyan-400 font-mono overflow-hidden flex flex-col relative select-none">
            {/* Background Grid - CSS Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Header */}
            <header className="h-14 border-b border-cyan-900/50 bg-[#0a0f1c]/90 backdrop-blur flex items-center justify-between px-6 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                    <h1 className="text-xl font-bold tracking-widest text-white">REALTIME<span className="text-cyan-400">CONNECT</span></h1>
                    <span className="text-xs px-2 py-0.5 border border-cyan-800 rounded bg-cyan-900/30 text-cyan-300">v2.4.0</span>
                </div>
                <div className="flex items-center gap-6 text-xs uppercase tracking-wider">
                    <div className="flex flex-col items-end">
                        <span className="text-slate-500">System Time</span>
                        <span className="text-white font-bold">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-slate-500">Uptime</span>
                        <span className="text-green-400 font-bold">{formatUptime(metrics.uptime)}</span>
                    </div>
                </div>
            </header>

            {/* Main Dashboard Grid */}
            <div className="flex-1 p-6 grid grid-cols-12 grid-rows-6 gap-4 z-10 overflow-hidden min-h-0">

                {/* 1. Server Status Card (Top Left) */}
                <div className="col-span-12 md:col-span-4 row-span-2 bg-[#0d1326]/80 border border-cyan-800/50 rounded-xl p-4 flex flex-col justify-between backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                    <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${metrics.serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            SERVER HEALTH
                        </h3>
                        <span className={`text-xs ${metrics.serverStatus === 'online' ? 'text-cyan-600 animate-pulse' : 'text-red-500'}`}>
                            {metrics.serverStatus === 'online' ? 'LIVE DATA' : 'OFFLINE'}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {/* CPU */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">CPU Load (Host)</span>
                                <span className="text-cyan-300">{metrics.cpuLoad}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-500" style={{ width: `${metrics.cpuLoad}%` }}></div>
                            </div>
                        </div>
                        {/* Memory */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Memory Usage</span>
                                <span className="text-purple-300">{metrics.memoryUsage}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-700" style={{ width: `${metrics.memoryUsage}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Database Status Card (Top Middle) */}
                <div className="col-span-12 md:col-span-4 row-span-2 bg-[#0d1326]/80 border border-cyan-800/50 rounded-xl p-4 flex flex-col justify-between backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                    <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full"></span> DATA STREAM
                        </h3>
                        <span className={`text-xs ${metrics.dbStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                            {metrics.dbStatus === 'connected' ? 'SYNCED' : metrics.dbStatus.toUpperCase()}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-[#0a0f1c] p-3 rounded-lg border border-cyan-900/30 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-white mb-1">{metrics.latency}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Latency (ms)</span>
                        </div>
                        <div className="bg-[#0a0f1c] p-3 rounded-lg border border-cyan-900/30 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-white mb-1">{metrics.requests}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Total Reqs</span>
                        </div>
                    </div>
                </div>

                {/* 3. Connection Status (Top Right) */}
                <div className="col-span-12 md:col-span-4 row-span-2 bg-[#0d1326]/80 border border-cyan-800/50 rounded-xl p-4 flex flex-col relative backdrop-blur-sm overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-4">NETWORK TOPOLOGY</h3>

                    <div className="space-y-3 relative z-10 text-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
                                <span className="text-slate-300">Socket.IO Uplink</span>
                            </div>
                            <span className={connected ? 'text-green-400' : 'text-red-400'}>{connected ? 'ACTIVE' : 'OFFLINE'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${metrics.serverStatus === 'online' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-red-500'}`}></div>
                                <span className="text-slate-300">Backend API</span>
                            </div>
                            <span className={metrics.serverStatus === 'online' ? 'text-blue-400' : 'text-red-400'}>
                                {metrics.serverStatus === 'online' ? 'READY' : 'UNREACHABLE'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${metrics.dbStatus === 'connected' ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : 'bg-red-500'}`}></div>
                                <span className="text-slate-300">Supabase Cloud</span>
                            </div>
                            <span className={metrics.dbStatus === 'connected' ? 'text-purple-400' : 'text-red-400'}>
                                {metrics.dbStatus === 'connected' ? 'CONNECTED' : 'ERROR'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${metrics.firebaseStatus === 'connected' ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : (metrics.firebaseStatus === 'mock_mode' ? 'bg-yellow-500' : 'bg-red-500')}`}></div>
                                <span className="text-slate-300">Firebase Auth</span>
                            </div>
                            <span className={metrics.firebaseStatus === 'connected' ? 'text-orange-400' : (metrics.firebaseStatus === 'mock_mode' ? 'text-yellow-400' : 'text-red-400')}>
                                {metrics.firebaseStatus === 'connected' ? 'CONNECTED' : (metrics.firebaseStatus === 'mock_mode' ? 'MOCK MODE' : 'ERROR')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Live Terminal (Bottom Large Area) */}
                <div className="col-span-12 row-span-4 bg-black/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-2xl relative">
                    {/* Fake Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[10px] w-full animate-scan pointer-events-none opacity-20"></div>

                    {/* Terminal Header */}
                    <div className="bg-[#1a202c] px-4 py-2 border-b border-slate-700 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">&gt;_ SERVER LOGS</span>
                            <span className="w-2 h-2 bg-slate-600 rounded-full animate-pulse"></span>
                        </div>
                    </div>

                    {/* Logs Area */}
                    <div ref={logContainerRef} className="flex-1 p-4 overflow-y-auto space-y-1 font-mono text-xs md:text-sm">
                        {logs.length === 0 && <div className="text-slate-600 italic opacity-50 text-center mt-10">Waiting for system events...</div>}
                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded transition">
                                <span className="text-slate-500 select-none">[{log.time}]</span>
                                <span className={`uppercase font-bold w-16 text-right select-none
                                    ${log.type === 'info' ? 'text-blue-400' : ''}
                                    ${log.type === 'success' ? 'text-green-400' : ''}
                                    ${log.type === 'warn' ? 'text-yellow-400' : ''}
                                    ${log.type === 'error' ? 'text-red-500' : ''}
                                `}>
                                    {log.type}
                                </span>
                                <span className="text-slate-300 flex-1 break-all">{log.msg}</span>
                            </div>
                        ))}
                    </div>

                    {/* Command Input */}
                    <div className="p-3 bg-[#0a0f1c] border-t border-slate-800 flex items-center gap-3 shrink-0">
                        <span className="text-cyan-500 font-bold ml-2">➜</span>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-slate-600"
                            placeholder="Enter system command or broadcast message..."
                            value={inputMessage}
                            onChange={e => setInputMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendCommand()}
                        />
                        <button
                            onClick={sendCommand}
                            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition ${connected ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                        >
                            Execute
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(1000%); }
                }
                .animate-scan {
                    animation: scan 4s linear infinite;
                }
                
                /* Scrollbar Styling */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: #0a0f1c; 
                }
                ::-webkit-scrollbar-thumb {
                    background: #1e293b; 
                    border-radius: 3px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #334155; 
                }
            `}</style>
        </div>
    );
};

export default RealtimeDemo;
