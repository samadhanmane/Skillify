import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide certificate title'],
    trim: true
  },
  issuer: {
    type: String,
    required: [true, 'Please provide certificate issuer'],
    trim: true
  },
  issueDate: {
    type: Date,
    required: [true, 'Please provide issue date']
  },
  expiryDate: {
    type: Date
  },
  credentialID: {
    type: String,
    trim: true
  },
  credentialURL: {
    type: String,
    trim: true
  },
  certificateImage: {
    type: String
  },
  certificateFile: {
    type: String, // For PDF uploads
    trim: true
  },
  fileType: {
    type: String,
    enum: ['image', 'pdf', 'url', 'none'],
    default: 'none'
  },
  isPublic: {
    type: Boolean,
    default: true, // Public by default
    description: 'Determines if the certificate is publicly visible via links and QR codes'
  },
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  // Enhanced verification fields
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'auto_verified', 'flagged'],
    default: 'pending'
  },
  verificationScore: {
    type: Number,
    default: 0
  },
  verificationDetails: {
    aiConfidence: {
      type: Number,
      default: 0
    },
    issuerVerified: {
      type: Boolean,
      default: false
    },
    editsDetected: {
      type: Boolean,
      default: false
    },
    detectedIssues: [{
      type: String,
      trim: true
    }],
    lastVerifiedAt: {
      type: Date
    }
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  extractedText: {
    type: String,
    default: ''
  },
  achievements: [{
    type: String,
    enum: ['quick_learner', 'skill_master', 'consistent_achiever', 'top_performer']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
certificateSchema.index({ user: 1, issueDate: -1 });
certificateSchema.index({ isPublic: 1 }); // Index for public certificate queries

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate; 