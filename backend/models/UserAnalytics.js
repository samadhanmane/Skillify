import mongoose from 'mongoose';

const userAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skillProgress: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    history: [{
      date: { type: Date, default: Date.now },
      level: { type: Number, default: 1 },
      certificates: { type: Number, default: 0 }
    }],
    growthRate: { type: Number, default: 0 }, // Calculated field
    lastUpdated: { type: Date, default: Date.now }
  }],
  certificateStats: {
    totalCount: { type: Number, default: 0 },
    verifiedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
    byIssuer: { type: Map, of: Number, default: {} },
    byMonth: { type: Map, of: Number, default: {} }
  },
  activityMetrics: {
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date },
    averageSessionTime: { type: Number, default: 0 }, // in minutes
    activeDays: { type: Number, default: 0 },
    activityHeatmap: { type: Map, of: Number, default: {} } // date -> activity count
  },
  learningPatterns: {
    preferredCategories: [{ type: String }],
    learningPace: { type: String, enum: ['slow', 'steady', 'fast', 'variable'], default: 'steady' },
    consistencyScore: { type: Number, default: 0, min: 0, max: 100 },
    focusAreas: [{ type: String }]
  },
  recommendations: [{
    type: { type: String, enum: ['skill', 'certificate', 'course', 'practice'] },
    name: { type: String },
    reason: { type: String },
    priority: { type: Number, default: 5, min: 1, max: 10 },
    generated: { type: Date, default: Date.now }
  }],
  reports: [{
    period: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
    startDate: { type: Date },
    endDate: { type: Date },
    highlights: [String],
    metrics: Object,
    recommendations: [String],
    generatedAt: { type: Date, default: Date.now }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes for efficient queries
userAnalyticsSchema.index({ user: 1 });
userAnalyticsSchema.index({ 'skillProgress.skill': 1 });
userAnalyticsSchema.index({ 'recommendations.priority': -1 });
userAnalyticsSchema.index({ updatedAt: -1 });

const UserAnalytics = mongoose.model('UserAnalytics', userAnalyticsSchema);

export default UserAnalytics; 