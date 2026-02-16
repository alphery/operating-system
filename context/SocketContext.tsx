import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        console.log('[SocketContext] Initializing Socket.IO connection...');

        const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://alphery-os-backend.onrender.com', {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000, // Increased timeout for Render cold starts
        });

        socketInstance.on('connect', () => {
            console.log('✅ [SocketContext] Connected to backend!', socketInstance.id);
            setConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ [SocketContext] Disconnected from backend');
            setConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            // Reduce console noise - only log first error
            if (!socketInstance.recovered) {
                console.warn('[SocketContext] Connection error:', error.message);
            }
        });

        setSocket(socketInstance);

        return () => {
            console.log('[SocketContext] Cleaning up socket connection');
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
