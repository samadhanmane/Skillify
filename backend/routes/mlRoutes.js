import express from 'express';
import { verifyNewCertificate, bulkVerifyCertificates, getRecommendations, verifyUserCertificate, analyzeUserSkills } from '../controllers/mlController.js';
import { protect } from '../middlewares/authMiddleware.js';
// Temporarily comment out rate limiter until it can be installed
// import { mlLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Protect all routes
router.use(protect);
// Apply rate limiter to all ML routes
// router.use(mlLimiter);

// Certificate verification routes
router.post('/verify-certificate', verifyNewCertificate);
router.post('/verify-certificate/:id', verifyUserCertificate);
router.post('/bulk-verify', bulkVerifyCertificates);

// Skill recommendation routes
router.get('/recommendations', getRecommendations);
router.get('/analyze-skills', analyzeUserSkills);

export default router; 