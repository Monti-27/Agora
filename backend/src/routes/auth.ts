import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, emailValidation, passwordValidation, usernameValidation } from '../middleware/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', 
  authLimiter,
  validateRequest([
    emailValidation,
    usernameValidation,
    passwordValidation,
  ]),
  authController.register
);

router.post('/login',
  loginLimiter,
  validateRequest([
    emailValidation,
    passwordValidation,
  ]),
  authController.login
);

// Protected routes
router.get('/me', authenticateToken, authController.me);
router.post('/logout', authenticateToken, authController.logout);
router.post('/refresh', authenticateToken, authController.refreshToken);

export default router;
