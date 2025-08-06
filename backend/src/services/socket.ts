import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AuthUtils } from '../utils/auth';
import { db } from './database';
import { redis } from './redis';
import { WebSocketMessage, SocketUser } from '../types';
import config from '../config';

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const payload = AuthUtils.verifyToken(token);
        
        const user = await db.prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
            isOnline: true,
            lastSeen: true,
            createdAt: true,
          },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.data.user = {
          ...user,
          socketId: socket.id,
        };

        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  private async handleConnection(socket: any): Promise<void> {
    const user: SocketUser = socket.data.user;
    
    try {
      // Add user to connected users
      this.connectedUsers.set(socket.id, user);
      
      // Update user online status
      await db.prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
      });
      
      await redis.setUserOnline(user.id, true);
      
      console.log(`User ${user.username} connected via Socket.io`);
      
      // Join user to their chat rooms
      await this.joinUserToChats(socket, user.id);
      
      // Notify other users that this user is online
      this.broadcastUserStatus(user.id, true, socket.id);

      // Handle typing events
      socket.on('typing', async (data: { chatId: string; isTyping: boolean }) => {
        await this.handleTyping(socket, user, data);
      });

      // Handle message read events
      socket.on('message_read', async (data: { messageId: string }) => {
        await this.handleMessageRead(socket, user, data);
      });

      // Handle join chat room
      socket.on('join_chat', (chatId: string) => {
        socket.join(`chat:${chatId}`);
      });

      // Handle leave chat room
      socket.on('leave_chat', (chatId: string) => {
        socket.leave(`chat:${chatId}`);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        await this.handleDisconnection(socket, user);
      });

    } catch (error) {
      console.error('Error handling socket connection:', error);
      socket.disconnect();
    }
  }

  private async joinUserToChats(socket: any, userId: string): Promise<void> {
    try {
      const chats = await db.prisma.chat.findMany({
        where: {
          members: { some: { userId } },
        },
        select: { id: true },
      });

      for (const chat of chats) {
        socket.join(`chat:${chat.id}`);
      }
    } catch (error) {
      console.error('Error joining user to chats:', error);
    }
  }

  private async handleTyping(
    socket: any,
    user: SocketUser,
    data: { chatId: string; isTyping: boolean }
  ): Promise<void> {
    try {
      // Verify user is a member of this chat
      const membership = await db.prisma.chatMember.findUnique({
        where: {
          chatId_userId: {
            chatId: data.chatId,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        return;
      }

      // Update typing status in Redis
      await redis.setTyping(data.chatId, user.id, data.isTyping);

      // Broadcast typing status to chat members (except sender)
      const message: WebSocketMessage = {
        type: 'typing',
        chatId: data.chatId,
        userId: user.id,
        username: user.username,
        isTyping: data.isTyping,
      };

      socket.to(`chat:${data.chatId}`).emit('message', message);

    } catch (error) {
      console.error('Error handling typing event:', error);
    }
  }

  private async handleMessageRead(
    socket: any,
    user: SocketUser,
    data: { messageId: string }
  ): Promise<void> {
    try {
      // Get message to verify chat membership
      const message = await db.prisma.message.findFirst({
        where: {
          id: data.messageId,
          chat: {
            members: { some: { userId: user.id } },
          },
        },
      });

      if (!message) {
        return;
      }

      // Don't mark own messages as read
      if (message.senderId === user.id) {
        return;
      }

      // Create read receipt
      await db.prisma.messageRead.upsert({
        where: {
          messageId_userId: {
            messageId: data.messageId,
            userId: user.id,
          },
        },
        update: { readAt: new Date() },
        create: {
          messageId: data.messageId,
          userId: user.id,
          readAt: new Date(),
        },
      });

      // Update user's last read timestamp for this chat
      await db.prisma.chatMember.update({
        where: {
          chatId_userId: {
            chatId: message.chatId,
            userId: user.id,
          },
        },
        data: { lastReadAt: new Date() },
      });

      // Broadcast read receipt to chat members
      const readMessage: WebSocketMessage = {
        type: 'message_read',
        chatId: message.chatId,
        messageId: data.messageId,
        userId: user.id,
        readAt: new Date(),
      };

      this.io.to(`chat:${message.chatId}`).emit('message', readMessage);

    } catch (error) {
      console.error('Error handling message read event:', error);
    }
  }

  private async handleDisconnection(socket: any, user: SocketUser): Promise<void> {
    try {
      // Remove from connected users
      this.connectedUsers.delete(socket.id);
      
      // Check if user has other active connections
      const hasOtherConnections = Array.from(this.connectedUsers.values())
        .some(connectedUser => connectedUser.id === user.id);

      if (!hasOtherConnections) {
        // Update user offline status
        await db.prisma.user.update({
          where: { id: user.id },
          data: { isOnline: false, lastSeen: new Date() },
        });
        
        await redis.setUserOnline(user.id, false);
        
        // Notify other users that this user is offline
        this.broadcastUserStatus(user.id, false);
      }
      
      console.log(`User ${user.username} disconnected from Socket.io`);
      
    } catch (error) {
      console.error('Error handling socket disconnection:', error);
    }
  }

  private broadcastUserStatus(userId: string, isOnline: boolean, excludeSocketId?: string): void {
    const message: WebSocketMessage = {
      type: 'user_online',
      userId,
      isOnline,
    };

    if (excludeSocketId) {
      this.io.except(excludeSocketId).emit('message', message);
    } else {
      this.io.emit('message', message);
    }
  }

  // Public method to broadcast new messages
  public async broadcastMessage(chatId: string, message: any): Promise<void> {
    const socketMessage: WebSocketMessage = {
      type: 'message',
      chatId,
      message,
    };

    this.io.to(`chat:${chatId}`).emit('message', socketMessage);
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected user IDs
  public getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.values()).map(user => user.id);
  }
}

export default SocketService;
