import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  forgotPassword, 
  resetPassword, 
  verifyOTP, 
  checkEmailExists, 
  updateEmail 
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:resetToken', authLimiter, resetPassword);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/check-email', checkEmailExists);

// Protected routes
router.get('/me', protect, getMe);
router.post('/update-email', protect, updateEmail);

export default router; 