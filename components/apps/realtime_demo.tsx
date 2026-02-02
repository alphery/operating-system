import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export const RealtimeDemo = () => {
    const { socket, connected } = useSocket();
    const [messages, setMessages] = useState<string[]>([]);
    const [inputMessage, setInputMessage] = useState('');

    useEffect(() => {
        if (socket) {
            socket.on('message', (data) => {
                setMessages((prev) => [...prev, data.text]);
            });

            return () => {
                socket.off('message');
            };
        }
    }, [socket]);

    const sendMessage = () => {
        if (socket && inputMessage.trim()) {
            socket.emit('message', { text: inputMessage, user: 'You' });
            setInputMessage('');
        }
    };

    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">🔴 Live Realtime Test</h2>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 mb-4 h-64 overflow-y-auto">
                        {messages.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">No messages yet. Send one below!</p>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 mb-2">
                                    <p className="text-sm">{msg}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!connected}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
                        >
                            Send
                        </button>
                    </div>

                    <div className="mt-4 p-4 bg-slate-900/30 rounded-lg">
                        <p className="text-xs text-slate-400">
                            <strong>🧪 Testing:</strong> Open this in multiple browser tabs to see realtime sync in action!
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4">
                        <h3 className="font-bold text-green-400 mb-2">✅ Connected Services</h3>
                        <ul className="text-sm space-y-1">
                            <li>• Frontend: Port 3000</li>
                            <li>• Backend: Port 3001</li>
                            <li>• Socket.IO: Active</li>
                            <li>• Supabase: Cloud DB</li>
                        </ul>
                    </div>

                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
                        <h3 className="font-bold text-purple-400 mb-2">🚀 Available APIs</h3>
                        <ul className="text-sm space-y-1">
                            <li>• GET /health</li>
                            <li>• Socket.IO /socket.io</li>
                            <li>• JWT Auth Ready</li>
                            <li>• AWS S3 Ready</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealtimeDemo;
