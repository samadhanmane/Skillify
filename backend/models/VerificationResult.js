import mongoose from 'mongoose';

const verificationResultSchema = new mongoose.Schema({
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ocrText: {
    type: String,
    default: ''
  },
  confidenceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  verificationDetails: {
    issuerVerified: { type: Boolean, default: false },
    dateVerified: { type: Boolean, default: false },
    templateMatched: { type: Boolean, default: false },
    qrCodeValid: { type: Boolean, default: false },
    textConsistency: { type: Number, default: 0, min: 0, max: 100 }
  },
  aiDecision: {
    type: String,
    enum: ['verified', 'suspicious', 'rejected', 'needs_review'],
    default: 'needs_review'
  },
  verifiedBy: {
    algorithm: { type: String, default: 'OCR+ML' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  verificationHistory: [{
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'verified', 'rejected', 'needs_review']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
verificationResultSchema.index({ certificate: 1 });
verificationResultSchema.index({ user: 1 });
verificationResultSchema.index({ 'verificationHistory.status': 1 });
verificationResultSchema.index({ confidenceScore: -1 });

const VerificationResult = mongoose.model('VerificationResult', verificationResultSchema);

export default VerificationResult; 