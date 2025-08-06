'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { chatApi } from '@/lib/api';
import type { CreateChatRequest, ChatType } from '@/types';

interface CreateChatDialogProps {
  onClose: () => void;
}

export default function CreateChatDialog({ onClose }: CreateChatDialogProps) {
  const [chatType, setChatType] = useState<ChatType>('group');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmails, setMemberEmails] = useState('');

  const queryClient = useQueryClient();

  const createChatMutation = useMutation({
    mutationFn: (chatData: CreateChatRequest) => chatApi.createChat(chatData),
    onSuccess: () => {
      toast.success('Chat created successfully!');
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create chat';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (chatType === 'group' && !name.trim()) {
      toast.error('Group name is required');
      return;
    }

    // For now, we'll create a simple group chat without member invitation
    // In a real app, you'd want to search for users and invite them
    const chatData: CreateChatRequest = {
      chat_type: chatType,
      name: chatType === 'group' ? name.trim() : undefined,
      description: description.trim() || undefined,
      members: [], // Empty for now - user will be added automatically as admin
    };

    createChatMutation.mutate(chatData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Chat Type Selection */}
      <div className="space-y-3">
        <Label>Chat Type</Label>
        <RadioGroup value={chatType} onValueChange={(value) => setChatType(value as ChatType)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="group" id="group" />
            <Label htmlFor="group">Group Chat</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="direct" id="direct" />
            <Label htmlFor="direct">Direct Message</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Group Name (only for group chats) */}
      {chatType === 'group' && (
        <div className="space-y-2">
          <Label htmlFor="name">Group Name *</Label>
          <Input
            id="name"
            placeholder="Enter group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={createChatMutation.isPending}
            required
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          {chatType === 'group' ? 'Group Description' : 'Message'} (Optional)
        </Label>
        <Textarea
          id="description"
          placeholder={
            chatType === 'group' 
              ? 'Describe what this group is about...' 
              : 'Write your message...'
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={createChatMutation.isPending}
          rows={3}
        />
      </div>

      {/* Member Invitation (placeholder for future implementation) */}
      <div className="space-y-2">
        <Label htmlFor="members">
          Invite Members (Coming Soon)
        </Label>
        <Input
          id="members"
          placeholder="Enter email addresses..."
          value={memberEmails}
          onChange={(e) => setMemberEmails(e.target.value)}
          disabled={true} // Disabled for now
        />
        <p className="text-xs text-muted-foreground">
          Member invitation feature will be added in a future update
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={createChatMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createChatMutation.isPending}
        >
          {createChatMutation.isPending ? 'Creating...' : 'Create Chat'}
        </Button>
      </div>
    </form>
  );
}
