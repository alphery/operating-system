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
            console.error('[SocketContext] Connection error:', error.message);
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
