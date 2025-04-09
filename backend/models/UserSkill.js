import mongoose from 'mongoose';

const userSkillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  certificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can only have one record per skill
userSkillSchema.index({ user: 1, skill: 1 }, { unique: true });

const UserSkill = mongoose.model('UserSkill', userSkillSchema);

export default UserSkill; 