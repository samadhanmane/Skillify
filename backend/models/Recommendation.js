import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  recommendationType: {
    type: String,
    enum: ['skill', 'certificate', 'course'],
    default: 'skill'
  },
  skillName: {
    type: String,
    required: function() {
      return this.recommendationType === 'skill';
    }
  },
  targetSkillLevel: {
    type: Number,
    min: 1,
    max: 100,
    default: 50
  },
  relevance: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  sourceCertificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }],
  sourceSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['course', 'documentation', 'tutorial', 'article', 'other'],
      default: 'other'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setMonth(date.getMonth() + 1); // Recommendations expire after 1 month
      return date;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for efficiently querying user's active recommendations
recommendationSchema.index({ user: 1, isActive: 1 });

// Automatically deactivate expired recommendations
recommendationSchema.pre('find', function() {
  this.where({ 
    expiresAt: { $gt: new Date() },
    isActive: true
  });
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation; 