import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: function() {
      return this.contentType !== 'faq';
    },
    trim: true
  },
  question: {
    type: String,
    required: function() {
      return this.contentType === 'faq';
    },
    trim: true
  },
  answer: {
    type: String,
    required: function() {
      return this.contentType === 'faq';
    },
    trim: true
  },
  content: {
    type: String,
    required: function() {
      return ['page', 'announcement'].includes(this.contentType);
    }
  },
  contentType: {
    type: String,
    enum: ['page', 'faq', 'announcement'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiry: {
    type: Date,
    required: function() {
      return this.contentType === 'announcement';
    }
  },
  slug: {
    type: String,
    required: function() {
      return this.contentType === 'page';
    },
    unique: function() {
      return this.contentType === 'page';
    },
    trim: true,
    lowercase: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
ContentSchema.index({ contentType: 1, status: 1 });
ContentSchema.index({ slug: 1 }, { unique: true, sparse: true });

const Content = mongoose.model('Content', ContentSchema);

export default Content; 