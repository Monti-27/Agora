import { io, Socket } from 'socket.io-client';
import type { WebSocketMessage, TypingUser } from '@/types';
import { tokenManager } from './api';

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private eventHandlers: WebSocketEventHandler[] = [];
  private isIntentionallyClosed = false;

  constructor() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    this.url = baseUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        resolve();
        return;
      }

      const token = tokenManager.getToken();
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      this.socket = io(this.url, {
        auth: {
          token,
        },
        transports: ['websocket'],
        upgrade: true,
      });

      this.isIntentionallyClosed = false;

      this.socket.on('connect', () => {
        console.log('Socket.io connected');
        resolve();
      });

      this.socket.on('message', (message: WebSocketMessage) => {
        this.handleMessage(message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason);
        
        if (!this.isIntentionallyClosed && reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          this.socket?.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        reject(error);
      });

      // Connection timeout
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.disconnect();
          reject(new Error('Socket.io connection timeout'));
        }
      }, 10000);
    });
  }

  private handleMessage(message: WebSocketMessage) {
    // Broadcast message to all event handlers
    this.eventHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in WebSocket event handler:', error);
      }
    });
  }

  send(event: string, data: any): boolean {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
      return true;
    }
    console.warn('Socket.io is not connected');
    return false;
  }

  // Typing indicators
  sendTypingIndicator(chatId: string, isTyping: boolean) {
    this.send('typing', {
      chatId,
      isTyping,
    });
  }

  // Mark message as read
  markMessageAsRead(messageId: string) {
    this.send('message_read', {
      messageId,
    });
  }

  // Join chat room
  joinChat(chatId: string) {
    this.send('join_chat', chatId);
  }

  // Leave chat room
  leaveChat(chatId: string) {
    this.send('leave_chat', chatId);
  }

  // Event handling
  addEventListener(handler: WebSocketEventHandler) {
    this.eventHandlers.push(handler);
  }

  removeEventListener(handler: WebSocketEventHandler) {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}

// Create a singleton instance
export const websocketClient = new WebSocketClient();

// Hook for using WebSocket in React components
export const useWebSocket = () => {
  return {
    connect: () => websocketClient.connect(),
    disconnect: () => websocketClient.disconnect(),
    send: (event: string, data: any) => websocketClient.send(event, data),
    sendTypingIndicator: (chatId: string, isTyping: boolean) => 
      websocketClient.sendTypingIndicator(chatId, isTyping),
    markMessageAsRead: (messageId: string) => 
      websocketClient.markMessageAsRead(messageId),
    joinChat: (chatId: string) => websocketClient.joinChat(chatId),
    leaveChat: (chatId: string) => websocketClient.leaveChat(chatId),
    addEventListener: (handler: WebSocketEventHandler) => 
      websocketClient.addEventListener(handler),
    removeEventListener: (handler: WebSocketEventHandler) => 
      websocketClient.removeEventListener(handler),
    isConnected: () => websocketClient.isConnected(),
  };
};

export default websocketClient;
