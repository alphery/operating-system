import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`✅ Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`❌ Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-tenant')
    handleJoinTenant(client: Socket, tenantId: string): void {
        client.join(`tenant:${tenantId}`);
        console.log(`🔗 Client ${client.id} joined tenant room: ${tenantId}`);
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: any): void {
        this.server.emit('message', payload);
    }
    @SubscribeMessage('join-user')
    handleJoinUser(client: Socket, userId: string): void {
        client.join(`user:${userId}`);
        console.log(`👤 Client ${client.id} joined user room: ${userId}`);
    }

    emitToUser(userId: string, event: string, payload: any) {
        this.server.to(`user:${userId}`).emit(event, payload);
    }
}
