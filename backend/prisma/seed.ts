import { PrismaClient, ChatType, ChatRole, MessageType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  // Create demo users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      isOnline: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      isOnline: false,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      username: 'charlie',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      isOnline: true,
    },
  });

  const diana = await prisma.user.upsert({
    where: { email: 'diana@example.com' },
    update: {},
    create: {
      email: 'diana@example.com',
      username: 'diana',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
      isOnline: true,
    },
  });

  console.log('👥 Created demo users');

  // Create direct chat between Alice and Bob
  const directChat = await prisma.chat.create({
    data: {
      chatType: ChatType.DIRECT,
      createdBy: alice.id,
      members: {
        create: [
          {
            userId: alice.id,
            role: ChatRole.MEMBER,
          },
          {
            userId: bob.id,
            role: ChatRole.MEMBER,
          },
        ],
      },
    },
  });

  // Create group chat
  const groupChat = await prisma.chat.create({
    data: {
      name: 'Team Discussion',
      description: 'General team chat for project updates',
      chatType: ChatType.GROUP,
      createdBy: alice.id,
      members: {
        create: [
          {
            userId: alice.id,
            role: ChatRole.ADMIN,
          },
          {
            userId: charlie.id,
            role: ChatRole.MEMBER,
          },
          {
            userId: diana.id,
            role: ChatRole.MEMBER,
          },
        ],
      },
    },
  });

  console.log('💬 Created demo chats');

  // Create messages in direct chat
  const directMessage1 = await prisma.message.create({
    data: {
      chatId: directChat.id,
      senderId: alice.id,
      content: 'Hey Bob! How are you?',
      messageType: MessageType.TEXT,
    },
  });

  const directMessage2 = await prisma.message.create({
    data: {
      chatId: directChat.id,
      senderId: bob.id,
      content: "Hi Alice! I'm doing great, thanks for asking.",
      messageType: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      chatId: directChat.id,
      senderId: alice.id,
      content: "That's wonderful to hear! 😊",
      messageType: MessageType.TEXT,
    },
  });

  // Create messages in group chat
  const groupMessage1 = await prisma.message.create({
    data: {
      chatId: groupChat.id,
      senderId: alice.id,
      content: 'Welcome to the team chat everyone!',
      messageType: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      chatId: groupChat.id,
      senderId: charlie.id,
      content: 'Thanks Alice! Excited to be here.',
      messageType: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      chatId: groupChat.id,
      senderId: diana.id,
      content: 'Looking forward to working with everyone! 🚀',
      messageType: MessageType.TEXT,
    },
  });

  console.log('📨 Created demo messages');

  // Create some read receipts
  await prisma.messageRead.createMany({
    data: [
      {
        messageId: directMessage1.id,
        userId: bob.id,
      },
      {
        messageId: directMessage2.id,
        userId: alice.id,
      },
      {
        messageId: groupMessage1.id,
        userId: charlie.id,
      },
      {
        messageId: groupMessage1.id,
        userId: diana.id,
      },
    ],
  });

  // Update last read timestamps for chat members
  await prisma.chatMember.updateMany({
    where: { chatId: directChat.id, userId: bob.id },
    data: { lastReadAt: new Date(Date.now() - 60 * 60 * 1000) }, // 1 hour ago
  });

  await prisma.chatMember.updateMany({
    where: { chatId: groupChat.id, userId: charlie.id },
    data: { lastReadAt: new Date(Date.now() - 30 * 60 * 1000) }, // 30 minutes ago
  });

  await prisma.chatMember.updateMany({
    where: { chatId: groupChat.id, userId: diana.id },
    data: { lastReadAt: new Date(Date.now() - 15 * 60 * 1000) }, // 15 minutes ago
  });

  console.log('✅ Created read receipts');
  console.log('🌱 Database seeding completed successfully!');
  console.log('\nDemo Users:');
  console.log('- alice@example.com / password123');
  console.log('- bob@example.com / password123');
  console.log('- charlie@example.com / password123');
  console.log('- diana@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
