// User types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Chat types
export type ChatType = 'direct' | 'group';
export type ChatRole = 'admin' | 'member';
export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Chat {
  id: string;
  name?: string;
  description?: string;
  chat_type: ChatType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMember {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  role: ChatRole;
  is_online: boolean;
  joined_at: string;
  last_read_at?: string;
}

export interface ChatResponse {
  id: string;
  name?: string;
  description?: string;
  chat_type: ChatType;
  created_by: string;
  created_at: string;
  updated_at: string;
  members: ChatMember[];
  unread_count: number;
}

export interface CreateChatRequest {
  name?: string;
  description?: string;
  chat_type: ChatType;
  members: string[]; // User IDs
}

// Message types
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar_url?: string;
  content: string;
  message_type: MessageType;
  reply_to_id?: string;
  reply_to_message?: Message;
  edited_at?: string;
  created_at: string;
  read_by: MessageReadStatus[];
}

export interface MessageReadStatus {
  user_id: string;
  username: string;
  read_at: string;
}

export interface SendMessageRequest {
  content: string;
  message_type: MessageType;
  reply_to_id?: string;
}

// WebSocket message types
export type WebSocketMessage = 
  | {
      type: 'message';
      chat_id: string;
      message: Message;
    }
  | {
      type: 'typing';
      chat_id: string;
      user_id: string;
      username: string;
      is_typing: boolean;
    }
  | {
      type: 'user_online';
      user_id: string;
      is_online: boolean;
    }
  | {
      type: 'message_read';
      chat_id: string;
      message_id: string;
      user_id: string;
      read_at: string;
    }
  | {
      type: 'error';
      message: string;
    };

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

// UI state types
export interface TypingUser {
  user_id: string;
  username: string;
  chat_id: string;
}

export interface UIState {
  currentChatId?: string;
  isConnected: boolean;
  typingUsers: TypingUser[];
  onlineUsers: Set<string>;
}
