import express from 'express';
import {
  createCertificate,
  getCertificates,
  getCertificate,
  updateCertificate,
  deleteCertificate,
  getPublicCertificatesByUserId,
  verifyCertificate,
  getAllPublicCertificates,
  getPublicCertificateById,
  downloadCertificateFile,
  getSharedCertificate
} from '../controllers/certificateController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/user/:userId', getPublicCertificatesByUserId);
router.get('/public', getAllPublicCertificates);
router.get('/public/:id', getPublicCertificateById);
router.get('/shared/:email/:certificateId', getSharedCertificate);
router.post('/verify', verifyCertificate);
router.get('/download/:filename', downloadCertificateFile);

// All protected certificate routes
router.use(protect);

router.route('/')
  .post(createCertificate)
  .get(getCertificates);

router.route('/:id')
  .get(getCertificate)
  .put(updateCertificate)
  .delete(deleteCertificate);

export default router; 