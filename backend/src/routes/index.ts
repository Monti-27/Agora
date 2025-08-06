import { Router } from 'express';
import authRoutes from './auth';
import chatRoutes from './chat';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);

export default router;
