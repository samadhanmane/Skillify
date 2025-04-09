import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  username: {
    type: String,
    sparse: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  profileImage: {
    type: String,
    default: ''
  },
  qrCodeUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  education: [{
    degree: {
      type: String,
      required: true
    },
    university: {
      type: String,
      required: true
    },
    location: {
      type: String,
      default: ''
    },
    graduationYear: {
      type: String,
      default: ''
    },
    startYear: {
      type: String,
      default: ''
    }
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  },
  links: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  // Gamification features
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  achievements: [{
    type: {
      type: String,
      enum: [
        'certificate_milestone', 
        'skill_level_up', 
        'perfect_verification', 
        'learning_streak',
        'top_learner'
      ]
    },
    details: {
      type: String
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Analytics data
  learningStreak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  skillDistribution: {
    type: Map,
    of: Number,
    default: {}
  },
  analytics: {
    totalCertificates: { type: Number, default: 0 },
    verifiedCertificates: { type: Number, default: 0 },
    skillsCount: { type: Number, default: 0 },
    avgSkillLevel: { type: Number, default: 1 },
    lastUpdated: { type: Date, default: Date.now }
  },
  // Privacy settings
  privacy: {
    showCertificates: { type: Boolean, default: true },
    showSkills: { type: Boolean, default: true },
    showAchievements: { type: Boolean, default: true },
    showAnalytics: { type: Boolean, default: false }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetOTP: String,
  resetOTPExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to calculate and update user level based on points
userSchema.methods.updateLevel = function() {
  // Simple formula: level = 1 + floor(points/100)
  this.level = 1 + Math.floor(this.points / 100);
  return this.level;
};

// Add sparse index for username to allow null values
userSchema.index({ username: 1 }, { unique: true, sparse: true });

// Add indexes for leaderboard and search
userSchema.index({ points: -1 });
userSchema.index({ 'analytics.totalCertificates': -1 });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User; 