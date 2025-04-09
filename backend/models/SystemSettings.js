import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['general', 'security', 'verification', 'email', 'integration', 'appearance'],
    required: true
  },
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index to ensure category+key is unique
SystemSettingsSchema.index({ category: 1, key: 1 }, { unique: true });

const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema);

export default SystemSettings; 