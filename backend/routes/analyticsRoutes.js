import express from 'express';
import analyticsController from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Dashboard data
router.get('/dashboard', analyticsController.getDashboardData);

// Skill progress data
router.get('/skills-progress', analyticsController.getSkillsProgressData);

// Reports
router.get('/reports', analyticsController.getAnalyticsReports);

// Recommendations
router.get('/recommendations', analyticsController.getRecommendations);

// Manual analytics update
router.post('/update', analyticsController.updateAnalytics);

// Activity data
router.get('/activity', analyticsController.getUserActivity);

export default router; 