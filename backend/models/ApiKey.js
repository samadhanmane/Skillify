import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'API key name is required'],
    trim: true
  },
  key: {
    type: String,
    required: [true, 'API key is required'],
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  permissions: [{
    type: String,
    enum: [
      'read:certificates', 
      'write:certificates', 
      'delete:certificates', 
      'read:skills', 
      'write:skills', 
      'read:profiles', 
      'verify:certificates'
    ]
  }],
  rateLimit: {
    type: Number,
    default: 100
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Method to update lastUsed timestamp
ApiKeySchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

// Create a compound index for efficient queries
ApiKeySchema.index({ owner: 1, status: 1 });

const ApiKey = mongoose.model('ApiKey', ApiKeySchema);

export default ApiKey; 