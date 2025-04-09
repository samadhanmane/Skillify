import express from 'express';
import {
  getAllSkills,
  getSkill,
  getUserSkills,
  getSkillsDashboard,
  getPublicUserSkills,
  createUserSkill,
  updateUserSkill,
  deleteUserSkill
} from '../controllers/skillController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllSkills);
router.get('/user/:userId', getPublicUserSkills);

// Protected routes
router.get('/user', protect, getUserSkills);
router.get('/user-skills', protect, getUserSkills);
router.post('/user-skills', protect, createUserSkill);
router.put('/user-skills/:id', protect, updateUserSkill);
router.delete('/user-skills/:id', protect, deleteUserSkill);
router.get('/dashboard', protect, getSkillsDashboard);

// Route that potentially conflicts with /user-skills - keep it at the end
router.get('/:id', getSkill);

export default router; 