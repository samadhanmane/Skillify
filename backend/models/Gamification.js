import mongoose from 'mongoose';

// Schema for badge definitions (system-wide)
const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: 'default_badge.png'
  },
  category: {
    type: String,
    enum: ['skills', 'certificates', 'engagement', 'achievements', 'special'],
    default: 'achievements'
  },
  criteria: {
    type: { type: String, required: true }, // e.g., 'certificates_count', 'skill_level'
    threshold: { type: Number, required: true }, // value needed to earn badge
    conditions: { type: Map, of: String, default: {} } // additional conditions
  },
  pointsAwarded: {
    type: Number,
    default: 10
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Leaderboard Schema (cached/aggregated)
const leaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['points', 'certificates', 'skills', 'streak'],
    required: true
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'alltime'],
    required: true
  },
  rankings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    avatar: String,
    score: Number,
    rank: Number,
    change: Number // change in rank since last update
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  // Compound index to ensure unique leaderboard types per period
  index: { type: 1, period: 1 },
  unique: true
});

// User Achievement Log
const achievementLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementType: {
    type: String,
    required: true,
    enum: [
      'badge_earned',
      'level_up',
      'certification_milestone',
      'skill_milestone',
      'streak_milestone',
      'special_event',
      'daily_login',
      'learning_streak'
    ]
  },
  details: {
    title: { type: String, required: true },
    description: { type: String },
    relatedEntity: { type: mongoose.Schema.Types.ObjectId }, // Badge, Certificate, or Skill ID
    entityType: { type: String }, // 'badge', 'certificate', 'skill'
    pointsEarned: { type: Number, default: 0 }
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes
badgeSchema.index({ name: 1 }, { unique: true });
badgeSchema.index({ category: 1 });
leaderboardSchema.index({ type: 1, period: 1 }, { unique: true });
leaderboardSchema.index({ lastUpdated: -1 });
achievementLogSchema.index({ user: 1 });
achievementLogSchema.index({ achievementType: 1 });
achievementLogSchema.index({ earnedAt: -1 });

const Badge = mongoose.model('Badge', badgeSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
const AchievementLog = mongoose.model('AchievementLog', achievementLogSchema);

export { Badge, Leaderboard, AchievementLog }; 