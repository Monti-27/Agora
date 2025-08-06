import { Request, Response } from 'express';
import { db } from '../services/database';
import { redis } from '../services/redis';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  CreateChatRequest,
  SendMessageRequest,
  ChatResponse,
  MessageResponse,
  ChatMemberResponse,
  MessageReadStatus,
  ChatType,
  MessageType,
} from '../types';

export const chatController = {
  // Get all chats for the current user
  getChats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const chats = await db.prisma.chat.findMany({
      where: {
        members: {
          some: { userId: req.user.id },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          select: { id: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const chatResponses: ChatResponse[] = await Promise.all(
      chats.map(async (chat) => {
        // Get unread message count for this user
        const userMember = chat.members.find(m => m.userId === req.user!.id);
        const lastReadAt = userMember?.lastReadAt;
        
        const unreadCount = await db.prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: req.user!.id },
            ...(lastReadAt && { createdAt: { gt: lastReadAt } }),
          },
        });

        const members: ChatMemberResponse[] = chat.members.map(member => ({
          id: member.id,
          userId: member.userId,
          username: member.user.username,
          avatarUrl: member.user.avatarUrl || undefined,
          role: member.role,
          isOnline: member.user.isOnline,
          joinedAt: member.joinedAt,
          lastReadAt: member.lastReadAt || undefined,
        }));

        return {
          id: chat.id,
          name: chat.name || undefined,
          description: chat.description || undefined,
          chatType: chat.chatType,
          createdBy: chat.createdBy,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          members,
          unreadCount,
        };
      })
    );

    res.json(chatResponses);
  }),

  // Create a new chat
  createChat: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { name, description, chatType, memberIds }: CreateChatRequest = req.body;

    // Validate chat type and name
    if (chatType === ChatType.GROUP && !name?.trim()) {
      throw new AppError('Group chat must have a name', 400, 'INVALID_DATA');
    }

    if (chatType === ChatType.DIRECT && memberIds.length !== 1) {
      throw new AppError('Direct chat must have exactly one other member', 400, 'INVALID_DATA');
    }

    if (chatType === ChatType.DIRECT) {
      // Check if direct chat already exists
      const existingChat = await db.prisma.chat.findFirst({
        where: {
          chatType: ChatType.DIRECT,
          members: {
            every: {
              userId: { in: [req.user.id, memberIds[0]] },
            },
          },
        },
      });

      if (existingChat) {
        throw new AppError('Direct chat already exists between these users', 409, 'CHAT_EXISTS');
      }
    }

    // Verify all member IDs exist
    const existingUsers = await db.prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true },
    });

    if (existingUsers.length !== memberIds.length) {
      throw new AppError('One or more users not found', 404, 'USERS_NOT_FOUND');
    }

    // Create chat and add members in a transaction
    const chat = await db.prisma.$transaction(async (tx) => {
      const newChat = await tx.chat.create({
        data: {
          name: name?.trim(),
          description: description?.trim(),
          chatType,
          createdBy: req.user!.id,
        },
      });

      // Add creator as admin
      await tx.chatMember.create({
        data: {
          chatId: newChat.id,
          userId: req.user!.id,
          role: 'ADMIN',
        },
      });

      // Add other members
      await tx.chatMember.createMany({
        data: memberIds.map(memberId => ({
          chatId: newChat.id,
          userId: memberId,
          role: 'MEMBER' as const,
        })),
      });

      return newChat;
    });

    // Get the complete chat with members
    const completeChat = await db.prisma.chat.findUnique({
      where: { id: chat.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (!completeChat) {
      throw new AppError('Failed to create chat', 500, 'CHAT_CREATION_FAILED');
    }

    const chatMembers: ChatMemberResponse[] = completeChat.members.map(member => ({
      id: member.id,
      userId: member.userId,
      username: member.user.username,
      avatarUrl: member.user.avatarUrl || undefined,
      role: member.role,
      isOnline: member.user.isOnline,
      joinedAt: member.joinedAt,
      lastReadAt: member.lastReadAt || undefined,
    }));

    const response: ChatResponse = {
      id: completeChat.id,
      name: completeChat.name || undefined,
      description: completeChat.description || undefined,
      chatType: completeChat.chatType,
      createdBy: completeChat.createdBy,
      createdAt: completeChat.createdAt,
      updatedAt: completeChat.updatedAt,
      members: chatMembers,
      unreadCount: 0,
    };

    res.status(201).json(response);
  }),

  // Get a specific chat
  getChat: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { chatId } = req.params;

    // Verify user is a member of this chat
    const chat = await db.prisma.chat.findFirst({
      where: {
        id: chatId,
        members: { some: { userId: req.user.id } },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new AppError('Chat not found', 404, 'CHAT_NOT_FOUND');
    }

    const members: ChatMemberResponse[] = chat.members.map(member => ({
      id: member.id,
      userId: member.userId,
      username: member.user.username,
      avatarUrl: member.user.avatarUrl || undefined,
      role: member.role,
      isOnline: member.user.isOnline,
      joinedAt: member.joinedAt,
      lastReadAt: member.lastReadAt || undefined,
    }));

    const response: ChatResponse = {
      id: chat.id,
      name: chat.name || undefined,
      description: chat.description || undefined,
      chatType: chat.chatType,
      createdBy: chat.createdBy,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      members,
      unreadCount: 0, // Will be calculated if needed
    };

    res.json(response);
  }),

  // Get messages for a chat
  getMessages: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is a member of this chat
    const membership = await db.prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      throw new AppError('Chat not found', 404, 'CHAT_NOT_FOUND');
    }

    // Try to get cached messages first
    let messages: any[] | null = null;
    if (offset === 0) {
      messages = await redis.getCachedMessages(chatId);
    }

    if (!messages) {
      // Get messages from database
      const dbMessages = await db.prisma.message.findMany({
        where: { chatId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          messageReads: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          replyTo: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      });

      messages = dbMessages.reverse(); // Reverse to get chronological order

      // Cache messages if this is the first page
      if (offset === 0 && messages.length > 0) {
        await redis.cacheMessages(chatId, messages);
      }
    }

    const messageResponses: MessageResponse[] = messages.map(message => {
      const readBy: MessageReadStatus[] = message.messageReads?.map((read: any) => ({
        userId: read.user.id,
        username: read.user.username,
        readAt: read.readAt,
      })) || [];

      return {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        senderUsername: message.sender.username,
        senderAvatarUrl: message.sender.avatarUrl || undefined,
        content: message.content,
        messageType: message.messageType,
        replyToId: message.replyToId || undefined,
        replyToMessage: message.replyTo ? {
          id: message.replyTo.id,
          chatId: message.replyTo.chatId,
          senderId: message.replyTo.senderId,
          senderUsername: message.replyTo.sender.username,
          senderAvatarUrl: message.replyTo.sender.avatarUrl || undefined,
          content: message.replyTo.content,
          messageType: message.replyTo.messageType,
          createdAt: message.replyTo.createdAt,
          readBy: [],
        } : undefined,
        editedAt: message.editedAt || undefined,
        createdAt: message.createdAt,
        readBy,
      };
    });

    res.json(messageResponses);
  }),

  // Send a message
  sendMessage: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { chatId } = req.params;
    const { content, messageType, replyToId }: SendMessageRequest = req.body;

    // Verify user is a member of this chat
    const membership = await db.prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      throw new AppError('Chat not found', 404, 'CHAT_NOT_FOUND');
    }

    // Create message
    const message = await db.prisma.message.create({
      data: {
        chatId,
        senderId: req.user.id,
        content: content.trim(),
        messageType: messageType || MessageType.TEXT,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Update chat's updated timestamp
    await db.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Clear cached messages to force refresh
    await redis.delete(`messages:${chatId}`);

    const messageResponse: MessageResponse = {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      senderUsername: message.sender.username,
      senderAvatarUrl: message.sender.avatarUrl || undefined,
      content: message.content,
      messageType: message.messageType,
      replyToId: message.replyToId || undefined,
      replyToMessage: message.replyTo ? {
        id: message.replyTo.id,
        chatId: message.replyTo.chatId,
        senderId: message.replyTo.senderId,
        senderUsername: message.replyTo.sender.username,
        senderAvatarUrl: message.replyTo.sender.avatarUrl || undefined,
        content: message.replyTo.content,
        messageType: message.replyTo.messageType,
        createdAt: message.replyTo.createdAt,
        readBy: [],
      } : undefined,
      editedAt: message.editedAt || undefined,
      createdAt: message.createdAt,
      readBy: [],
    };

    res.status(201).json(messageResponse);
  }),

  // Mark message as read
  markMessageRead: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    const { messageId } = req.params;

    // Verify message exists and user is a member of the chat
    const message = await db.prisma.message.findFirst({
      where: {
        id: messageId,
        chat: {
          members: { some: { userId: req.user.id } },
        },
      },
    });

    if (!message) {
      throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Don't mark own messages as read
    if (message.senderId === req.user.id) {
      res.json({ message: 'Cannot mark own message as read' });
      return;
    }

    // Create or update read receipt
    await db.prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: req.user.id,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId: req.user.id,
        readAt: new Date(),
      },
    });

    // Update user's last read timestamp for this chat
    await db.prisma.chatMember.update({
      where: {
        chatId_userId: {
          chatId: message.chatId,
          userId: req.user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    res.json({ message: 'Message marked as read' });
  }),
};
