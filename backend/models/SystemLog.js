import mongoose from 'mongoose';

const SystemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'debug'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for more efficient querying
SystemLogSchema.index({ level: 1, timestamp: -1 });
SystemLogSchema.index({ userId: 1, timestamp: -1 });
SystemLogSchema.index({ source: 1, timestamp: -1 });
// TTL index for automatic cleanup (logs older than 90 days will be removed)
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const SystemLog = mongoose.model('SystemLog', SystemLogSchema);

export default SystemLog; 