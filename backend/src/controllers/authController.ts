import { Request, Response } from 'express';
import { db } from '../services/database';
import { redis } from '../services/redis';
import { AuthUtils } from '../utils/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
} from '../types';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await db.prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username },
        ],
      },
    });

    if (existingUser) {
      throw new AppError(
        existingUser.email === email.toLowerCase() 
          ? 'Email already in use' 
          : 'Username already in use',
        409,
        'USER_EXISTS'
      );
    }

    // Hash password and create user
    const passwordHash = await AuthUtils.hashPassword(password);
    
    const user = await db.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        passwordHash,
        isOnline: true,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    // Set user as online in Redis
    await redis.setUserOnline(user.id, true);

    // Generate JWT token
    const token = AuthUtils.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const response: AuthResponse = {
      user: user as UserResponse,
      token,
    };

    res.status(201).json(response);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await db.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update user online status
    const updatedUser = await db.prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    // Set user as online in Redis
    await redis.setUserOnline(user.id, true);

    // Generate JWT token
    const token = AuthUtils.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const response: AuthResponse = {
      user: updatedUser as UserResponse,
      token,
    };

    res.json(response);
  }),

  me: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    // Get fresh user data from database
    const user = await db.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json(user);
  }),

  logout: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    // Update user offline status
    await db.prisma.user.update({
      where: { id: req.user.id },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });

    // Remove user from online status in Redis
    await redis.setUserOnline(req.user.id, false);

    res.json({ message: 'Logged out successfully' });
  }),

  refreshToken: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    // Generate new token
    const token = AuthUtils.generateToken({
      userId: req.user.id,
      email: req.user.email,
      username: req.user.username,
    });

    res.json({ token });
  }),
};
