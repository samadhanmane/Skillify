import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide skill name'],
    trim: true
  },
  category: {
    type: String,
    default: 'Other',
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // New fields for skill analysis and progression
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  proficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  endorsements: {
    type: Number,
    default: 0
  },
  relatedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  progressHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    level: {
      type: Number,
      default: 1
    },
    certifications: {
      type: Number,
      default: 1
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better performance
skillSchema.index({ name: 1, category: 1 });
skillSchema.index({ level: -1 });

const Skill = mongoose.model('Skill', skillSchema);

export default Skill; 