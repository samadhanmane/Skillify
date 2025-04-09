import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { 
  getSystemStats,
  getUserManagement,
  updateUser,
  deactivateUser,
  activateUser,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getSystemLogs,
  getSystemSettings,
  updateSystemSettings,
  getAllCertificates
} from '../controllers/adminController.js';

const router = express.Router();

// System stats
router.get('/stats', protect, admin, getSystemStats);

// User management
router.get('/users', protect, admin, getUserManagement);
router.put('/users/:id', protect, admin, updateUser);
router.put('/users/:id/deactivate', protect, admin, deactivateUser);
router.put('/users/:id/activate', protect, admin, activateUser);

// Certificate management
router.get('/certificates', protect, admin, getAllCertificates);

// API management
router.get('/api-keys', protect, admin, getApiKeys);
router.post('/api-keys', protect, admin, createApiKey);
router.put('/api-keys/:id/revoke', protect, admin, revokeApiKey);
router.delete('/api-keys/:id', protect, admin, deleteApiKey);

// Content management
router.get('/content', protect, admin, getContent);
router.post('/content', protect, admin, createContent);
router.put('/content/:id', protect, admin, updateContent);
router.delete('/content/:id', protect, admin, deleteContent);

// System logs
router.get('/logs', protect, admin, getSystemLogs);

// System settings
router.get('/settings', protect, admin, getSystemSettings);
router.put('/settings/:category/:key', protect, admin, updateSystemSettings);

export default router; 