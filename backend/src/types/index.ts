import { ChatType, ChatRole, MessageType, User, Chat, Message, ChatMember, MessageRead } from '@prisma/client';

// Extend Prisma types with computed fields
export interface UserWithStatus extends User {
  isOnline: boolean;
}

export interface ChatWithMembers extends Chat {
  members: ChatMemberWithUser[];
  _count?: {
    messages: number;
  };
}

export interface ChatMemberWithUser extends ChatMember {
  user: UserWithStatus;
}

export interface MessageWithDetails extends Message {
  sender: UserWithStatus;
  replyTo?: MessageWithDetails | null;
  messageReads: MessageReadWithUser[];
  _count?: {
    messageReads: number;
  };
}

export interface MessageReadWithUser extends MessageRead {
  user: UserWithStatus;
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

export interface CreateChatRequest {
  name?: string;
  description?: string;
  chatType: ChatType;
  memberIds: string[];
}

export interface SendMessageRequest {
  content: string;
  messageType: MessageType;
  replyToId?: string;
}

export interface ChatResponse {
  id: string;
  name?: string;
  description?: string;
  chatType: ChatType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: ChatMemberResponse[];
  unreadCount: number;
}

export interface ChatMemberResponse {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  role: ChatRole;
  isOnline: boolean;
  joinedAt: Date;
  lastReadAt?: Date;
}

export interface MessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl?: string;
  content: string;
  messageType: MessageType;
  replyToId?: string;
  replyToMessage?: MessageResponse;
  editedAt?: Date;
  createdAt: Date;
  readBy: MessageReadStatus[];
}

export interface MessageReadStatus {
  userId: string;
  username: string;
  readAt: Date;
}

// Socket.io event types
export interface SocketUser extends UserResponse {
  socketId: string;
}

export interface TypingData {
  chatId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface MessageReadData {
  chatId: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface OnlineStatusData {
  userId: string;
  isOnline: boolean;
}

// WebSocket message types (for frontend compatibility)
export type WebSocketMessage = 
  | {
      type: 'message';
      chatId: string;
      message: MessageResponse;
    }
  | {
      type: 'typing';
      chatId: string;
      userId: string;
      username: string;
      isTyping: boolean;
    }
  | {
      type: 'user_online';
      userId: string;
      isOnline: boolean;
    }
  | {
      type: 'message_read';
      chatId: string;
      messageId: string;
      userId: string;
      readAt: Date;
    }
  | {
      type: 'error';
      message: string;
    };

// Utility types
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Export Prisma enums for convenience
export { ChatType, ChatRole, MessageType };
