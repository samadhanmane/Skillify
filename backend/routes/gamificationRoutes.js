import express from 'express';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { 
  getUserGamification,
  getUserAchievements,
  getAchievementDetails,
  getAllBadges,
  getLeaderboard,
  getEnhancedLeaderboard,
  updateStreak,
  awardPoints,
  awardBadge,
  logAchievement,
  createBadge,
  checkUserBadges
} from '../controllers/gamificationController.js';

const router = express.Router();

// Get user's gamification profile
router.get('/profile', protect, getUserGamification);

// Get user's achievements and badges
router.get('/achievements', protect, getUserAchievements);

// Get achievement details
router.get('/achievements/:id', protect, getAchievementDetails);

// Get all available badges
router.get('/badges', protect, getAllBadges);

// Get leaderboard
router.get('/leaderboard', protect, getLeaderboard);

// Get enhanced leaderboard with additional data
router.get('/enhanced-leaderboard', protect, getEnhancedLeaderboard);

// Update streak
router.post('/update-streak', protect, updateStreak);

// Admin routes
router.post('/award-points', protect, adminOnly, awardPoints);
router.post('/award-badge', protect, adminOnly, awardBadge);
router.post('/log-achievement', protect, adminOnly, logAchievement);
router.post('/badges', protect, adminOnly, createBadge);

// Check and award badges
router.post('/check-badges', protect, checkUserBadges);

export default router; 