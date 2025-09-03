import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config';
import { db } from './services/database';
import { redis } from './services/redis';
import SocketService from './services/socket';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

async function startServer() {
  try {
    // Initialize services
    await db.connect();
    await redis.connect();
    
    // Create Express app
    const app = express();
    const server = createServer(app);
    
    // Initialize Socket.io
    const socketService = new SocketService(server);
    
    // Global middleware
    app.use(helmet());
    app.use(cors({
      origin: config.frontendUrl,
      credentials: true,
    }));
    
    // Rate limiting
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: { error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
    }));
    
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // API routes
    app.use('/api', routes);
    
    // Health check with detailed info
    app.get('/health', async (req, res) => {
      try {
        const dbHealthy = await db.healthCheck();
        const redisHealthy = await redis.healthCheck();
        const connectedUsers = socketService.getConnectedUsersCount();
        
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.nodeEnv,
          services: {
            database: dbHealthy ? 'healthy' : 'unhealthy',
            redis: redisHealthy ? 'healthy' : 'unhealthy',
            websocket: 'healthy',
          },
          stats: {
            connectedUsers,
          },
        });
      } catch (error) {
        res.status(503).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        });
      }
    });
    
    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    // Start server
    server.listen(config.port, () => {
      console.log(`
🚀 Server running on port ${config.port}
📦 Environment: ${config.nodeEnv}
🔗 WebSocket server ready
✅ All services connected

API Base URL: http://localhost:${config.port}/api
Health Check: http://localhost:${config.port}/health
      `);
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📤 ${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        console.log('📊 HTTP server closed');
        
        try {
          await db.disconnect();
          await redis.disconnect();
          console.log('📦 All services disconnected');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
// Updated on 2025-08-11
// Updated on 2025-08-15
// Updated on 2025-08-27
// Updated on 2025-09-03
