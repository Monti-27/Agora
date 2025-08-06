import axios from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  CreateUserRequest,
  User,
  ChatResponse,
  CreateChatRequest,
  Message,
  SendMessageRequest,
} from '@/types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to safely access localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = safeLocalStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login (only on client-side)
      safeLocalStorage.removeItem('auth_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData: CreateUserRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', userData);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },
};

// Chat API
export const chatApi = {
  getChats: async (): Promise<ChatResponse[]> => {
    const response = await api.get<ChatResponse[]>('/api/chats');
    return response.data;
  },

  createChat: async (chatData: CreateChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/api/chats', chatData);
    return response.data;
  },

  getChat: async (chatId: string): Promise<ChatResponse> => {
    const response = await api.get<ChatResponse>(`/api/chats/${chatId}`);
    return response.data;
  },

  getMessages: async (
    chatId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Message[]> => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const response = await api.get<Message[]>(
      `/api/chats/${chatId}/messages?${params.toString()}`
    );
    return response.data;
  },

  sendMessage: async (
    chatId: string,
    messageData: SendMessageRequest
  ): Promise<Message> => {
    const response = await api.post<Message>(
      `/api/chats/${chatId}/messages`,
      messageData
    );
    return response.data;
  },
};

// Utility functions for token management
export const tokenManager = {
  getToken: (): string | null => {
    return safeLocalStorage.getItem('auth_token');
  },

  setToken: (token: string): void => {
    safeLocalStorage.setItem('auth_token', token);
  },

  removeToken: (): void => {
    safeLocalStorage.removeItem('auth_token');
  },

  isAuthenticated: (): boolean => {
    return !!safeLocalStorage.getItem('auth_token');
  },
};

export default api;
