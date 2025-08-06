'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi, tokenManager } from '@/lib/api';
import { websocketClient } from '@/lib/websocket';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client state after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Query to fetch current user info
  const {
    data: userData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: isClient && tokenManager.isAuthenticated(),
    retry: false,
  });

  // Update user state when query data changes
  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (!isLoading && isClient && !tokenManager.isAuthenticated()) {
      setUser(null);
    }
  }, [userData, isLoading, isClient]);

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (user && tokenManager.isAuthenticated()) {
      websocketClient.connect().catch((error) => {
        console.error('Failed to connect WebSocket:', error);
      });
    } else {
      websocketClient.disconnect();
    }

    return () => {
      websocketClient.disconnect();
    };
  }, [user]);

  const login = (token: string, userData: User) => {
    tokenManager.setToken(token);
    setUser(userData);
    refetch();
  };

  const logout = () => {
    tokenManager.removeToken();
    setUser(null);
    websocketClient.disconnect();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
