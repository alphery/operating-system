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
            transports: ['polling', 'websocket'], // Use polling first for reliability
            path: '/socket.io/',
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 60000,
        });

        socketInstance.on('connect', () => {
            console.log('✅ [SocketContext] Connected to backend!', socketInstance.id);
            setConnected(true);

            // AUTO-JOIN USER ROOM
            try {
                const savedSession = localStorage.getItem('session_payload');
                if (savedSession) {
                    const payload = JSON.parse(savedSession);
                    if (payload.sub) {
                        socketInstance.emit('join-user', payload.sub);
                        console.log('👤 [SocketContext] Joined user room:', payload.sub);
                    }
                }
            } catch (e) {
                console.error('[SocketContext] Failed to join user room:', e);
            }
        });

        socketInstance.on('force_logout', (data: any) => {
            console.warn('⚠️ [SocketContext] Force logout requested:', data?.reason);
            alert(`Session Terminated: ${data?.reason || 'Account access revoked'}`);

            localStorage.removeItem('session_token');
            localStorage.removeItem('session_payload');
            localStorage.removeItem('user_tenants');

            // Force hard reload to login
            window.location.href = '/login';
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
