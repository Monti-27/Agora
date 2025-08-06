'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Send, Users, MoreVertical } from 'lucide-react';

import { chatApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useWebSocket } from '@/lib/websocket';
import { formatDistance, format } from 'date-fns';
import type { Message, WebSocketMessage, ChatResponse } from '@/types';

interface ChatWindowProps {
  chatId: string;
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  const {
    connect,
    sendTypingIndicator,
    markMessageAsRead,
    joinChat,
    leaveChat,
    addEventListener,
    removeEventListener,
    isConnected,
  } = useWebSocket();

  // Fetch chat details
  const { data: chat } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatApi.getChat(chatId),
    enabled: !!chatId,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => chatApi.getMessages(chatId, { limit: 50 }),
    enabled: !!chatId,
    refetchInterval: 5000, // Refetch every 5 seconds as fallback
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      chatApi.sendMessage(chatId, { content, message_type: 'text' }),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
    },
  });

  // WebSocket message handler
  useEffect(() => {
    const handleWebSocketMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'message':
          if (message.chat_id === chatId) {
            // Add new message to the list
            queryClient.setQueryData(
              ['messages', chatId],
              (oldMessages: Message[] = []) => [
                ...oldMessages,
                message.message,
              ]
            );
            // Update chat list
            queryClient.invalidateQueries({ queryKey: ['chats'] });
          }
          break;

        case 'typing':
          if (message.chat_id === chatId && message.user_id !== user?.id) {
            setTypingUsers(prev => {
              if (message.is_typing) {
                return prev.includes(message.username) 
                  ? prev 
                  : [...prev, message.username];
              } else {
                return prev.filter(username => username !== message.username);
              }
            });
          }
          break;

        case 'user_online':
          // Update user online status in chat members
          queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
          break;

        case 'message_read':
          if (message.chat_id === chatId) {
            // Update read status for messages
            queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
          }
          break;

        case 'error':
          toast.error(message.message);
          break;
      }
    };

    addEventListener(handleWebSocketMessage);
    
    // Connect WebSocket if not connected
    if (!isConnected()) {
      connect().then(() => {
        // Join the chat room after connecting
        joinChat(chatId);
      }).catch(console.error);
    } else {
      // Already connected, just join the chat room
      joinChat(chatId);
    }

    return () => {
      removeEventListener(handleWebSocketMessage);
      leaveChat(chatId);
    };
  }, [chatId, user?.id, addEventListener, removeEventListener, connect, isConnected, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_id !== user?.id) {
        markMessageAsRead(lastMessage.id);
      }
    }
  }, [messages, user?.id, markMessageAsRead]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(chatId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(chatId, false);
    }, 1000);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = messageText.trim();
    if (!content) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(chatId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    sendMessageMutation.mutate(content);
  };

  // Get chat name and members
  const getChatName = (chat: ChatResponse) => {
    if (chat.chat_type === 'group') {
      return chat.name || 'Group Chat';
    }
    const otherUser = chat.members.find(member => member.user_id !== user?.id);
    return otherUser?.username || 'Unknown User';
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') {
      return 'U'; // Default fallback
    }
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      if (!timestamp) return 'Unknown time';
      
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return format(date, 'HH:mm');
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return format(date, 'MMM dd');
      }
    } catch (error) {
      console.warn('Error formatting message time:', timestamp, error);
      return 'Unknown time';
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={
                chat.chat_type === 'direct' 
                  ? chat.members.find(m => m.user_id !== user?.id)?.avatar_url 
                  : undefined
              } />
              <AvatarFallback>
                {chat.chat_type === 'group' ? (
                  <Users className="h-5 w-5" />
                ) : (
                  getInitials(getChatName(chat))
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{getChatName(chat)}</h3>
              <p className="text-sm text-muted-foreground">
                {chat.chat_type === 'group' 
                  ? `${chat.members.length} members`
                  : chat.members.find(m => m.user_id !== user?.id)?.is_online 
                    ? 'Online' 
                    : 'Offline'
                }
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isCurrentUser = message.sender_id === user?.id;
            const showAvatar = !isCurrentUser && (
              index === 0 || 
              messages[index - 1].sender_id !== message.sender_id
            );

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <div className="w-8">
                    {showAvatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender_avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(message.sender_username)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {!isCurrentUser && showAvatar && (
                    <p className="text-xs font-medium mb-1">
                      {message.sender_username}
                    </p>
                  )}
                  
                  <p className="text-sm">{message.content}</p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-xs ${
                      isCurrentUser 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                    
                    {message.edited_at && (
                      <span className={`text-xs ${
                        isCurrentUser 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        (edited)
                      </span>
                    )}
                  </div>

                  {isCurrentUser && message.read_by.length > 0 && (
                    <p className="text-xs text-primary-foreground/70 mt-1">
                      Read by {message.read_by.length} people
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex gap-3">
              <div className="w-8"></div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...`
                    : `${typingUsers.join(', ')} are typing...`
                  }
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
