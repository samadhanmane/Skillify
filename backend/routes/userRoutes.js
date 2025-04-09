import express from 'express';
import { getCurrentUserProfile, updateProfile, updateProfileImage, getProfileByEmail, generateQRCode, getUserQRCode, addEducation, updateEducation, deleteEducation, generateResume, getUserEducation } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get user profile
router.get('/profile', protect, getCurrentUserProfile);

// Get user profile by email (public)
router.get('/profile/email/:email', getProfileByEmail);

// Generate QR code for profile sharing
router.post('/generate-qrcode', protect, generateQRCode);

// Get user's QR code
router.get('/qrcode', protect, getUserQRCode);

// Update user profile
router.put('/profile', protect, updateProfile);

// Upload profile image
router.post('/profile-image', protect, updateProfileImage);

// Education routes
router.post('/education', protect, addEducation);
router.put('/education/:id', protect, updateEducation);
router.delete('/education/:id', protect, deleteEducation);
router.get('/education', protect, getUserEducation);

// Resume generation
router.post('/generate-resume', protect, generateResume);

export default router; 