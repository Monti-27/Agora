import { createClient, RedisClientType } from 'redis';
import config from '../config';

class RedisService {
  private static instance: RedisService;
  public client: RedisClientType;
  public publisher: RedisClientType;
  public subscriber: RedisClientType;

  private constructor() {
    // Main client for caching
    this.client = createClient({
      url: config.redisUrl,
    });

    // Publisher for pub/sub
    this.publisher = createClient({
      url: config.redisUrl,
    });

    // Subscriber for pub/sub
    this.subscriber = createClient({
      url: config.redisUrl,
    });

    // Error handling
    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
    this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.client.connect(),
        this.publisher.connect(),
        this.subscriber.connect(),
      ]);
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.client.disconnect(),
      this.publisher.disconnect(),
      this.subscriber.disconnect(),
    ]);
    console.log('📤 Redis disconnected');
  }

  // Caching methods
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Pub/Sub methods
  async publish(channel: string, message: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    await this.subscriber.subscribe(channel, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        console.error('Error parsing Redis message:', error);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // Typing indicators (with TTL)
  async setTyping(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const key = `typing:${chatId}:${userId}`;
    if (isTyping) {
      await this.client.setEx(key, 10, 'true'); // 10 seconds TTL
    } else {
      await this.client.del(key);
    }
  }

  async getTypingUsers(chatId: string): Promise<string[]> {
    const keys = await this.client.keys(`typing:${chatId}:*`);
    return keys.map(key => key.split(':')[2]);
  }

  // Online users tracking
  async setUserOnline(userId: string, isOnline: boolean): Promise<void> {
    const key = `online:${userId}`;
    if (isOnline) {
      await this.client.setEx(key, 300, 'true'); // 5 minutes TTL
    } else {
      await this.client.del(key);
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = `online:${userId}`;
    return await this.client.exists(key) === 1;
  }

  // Message caching (last 50 messages per chat)
  async cacheMessages(chatId: string, messages: any[]): Promise<void> {
    const key = `messages:${chatId}`;
    await this.client.del(key); // Clear existing
    if (messages.length > 0) {
      const serializedMessages: string[] = messages.map(msg => JSON.stringify(msg));
      // Push messages one by one
      for (const message of serializedMessages) {
        await this.client.lPush(key, message);
      }
      await this.client.lTrim(key, 0, 49); // Keep only last 50
      await this.client.expire(key, 3600); // 1 hour TTL
    }
  }

  async getCachedMessages(chatId: string): Promise<any[] | null> {
    const key = `messages:${chatId}`;
    const messages = await this.client.lRange(key, 0, -1);
    return messages.length > 0 ? messages.map(msg => JSON.parse(msg)).reverse() : null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

export const redis = RedisService.getInstance();
export default RedisService;
