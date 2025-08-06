import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/auth';
import { db } from '../services/database';
import { JwtPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({ error: 'Access token is required' });
      return;
    }

    const payload = AuthUtils.verifyToken(token);
    
    // Verify user still exists and is not deactivated
    const user = await db.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = AuthUtils.verifyToken(token);
      
      const user = await db.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, username: true },
      });

      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors in optional auth
    next();
  }
};
