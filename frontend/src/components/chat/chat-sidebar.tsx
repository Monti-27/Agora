'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, LogOut, Users } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { formatDistance } from 'date-fns';
import type { ChatResponse } from '@/types';
import CreateChatDialog from './create-chat-dialog';

interface ChatSidebarProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string) => void;
}

export default function ChatSidebar({ selectedChatId, onChatSelect }: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);

  // Fetch chats
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: chatApi.getChats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    const chatName = chat.name || 
      (chat.chat_type === 'direct' 
        ? chat.members.find(m => m.user_id !== user?.id)?.username 
        : 'Direct Chat');
    
    return chatName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getChatName = (chat: ChatResponse) => {
    if (chat.chat_type === 'group') {
      return chat.name || 'Group Chat';
    }
    
    // For direct chats, show the other user's name
    const otherUser = chat.members.find(member => member.user_id !== user?.id);
    return otherUser?.username || 'Unknown User';
  };

  const getChatAvatar = (chat: ChatResponse) => {
    if (chat.chat_type === 'group') {
      return null; // Use default group avatar
    }
    
    // For direct chats, show the other user's avatar
    const otherUser = chat.members.find(member => member.user_id !== user?.id);
    return otherUser?.avatar_url;
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

  const formatChatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Never';
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Unknown';
    }
  };

  return (
    <div className="w-80 h-full bg-muted/30 border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>
                {user?.username ? getInitials(user.username) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user?.username}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Dialog open={isCreateChatOpen} onOpenChange={setIsCreateChatOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Chat</DialogTitle>
            </DialogHeader>
            <CreateChatDialog onClose={() => setIsCreateChatOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => {
                const isSelected = chat.id === selectedChatId;
                const chatName = getChatName(chat);
                const chatAvatar = getChatAvatar(chat);
                const onlineMembers = chat.members.filter(m => m.is_online).length;

                return (
                  <button
                    key={chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors hover:bg-accent/50 ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chatAvatar || undefined} />
                          <AvatarFallback>
                            {chat.chat_type === 'group' ? (
                              <Users className="h-5 w-5" />
                            ) : (
                              getInitials(chatName)
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {chat.chat_type === 'direct' && 
                         chat.members.find(m => m.user_id !== user?.id)?.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{chatName}</p>
                          {chat.unread_count > 0 && (
                            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {chat.unread_count > 99 ? '99+' : chat.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {chat.chat_type === 'group' 
                              ? `${chat.members.length} members, ${onlineMembers} online`
                              : chat.members.find(m => m.user_id !== user?.id)?.is_online 
                                ? 'Online' 
                                : 'Offline'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatChatDate(chat.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
