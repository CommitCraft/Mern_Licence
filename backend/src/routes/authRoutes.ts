import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateUser } from '../middleware/authMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

const setupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many setup attempts.' },
});

router.get('/setup-status', AuthController.getSetupStatus);
router.post('/first-time-setup', setupLimiter, AuthController.firstTimeSetup);
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authenticateUser, AuthController.logout);
router.get('/me', authenticateUser, AuthController.me);
router.post('/change-password', authenticateUser, AuthController.changePassword);
router.post('/revoke-all-sessions', authenticateUser, AuthController.revokeAllSessions);

export default router;
