import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import ApiKey from '../models/ApiKey.js';
import Content from '../models/Content.js';
import SystemLog from '../models/SystemLog.js';
import SystemSettings from '../models/SystemSettings.js';
import Certificate from '../models/Certificate.js';
import Skill from '../models/Skill.js';
import UserAnalytics from '../models/UserAnalytics.js';
import crypto from 'crypto';

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getSystemStats = asyncHandler(async (req, res) => {
  // Get counts from different collections
  const userCount = await User.countDocuments();
  const activeUsers = await UserAnalytics.countDocuments({ 
    lastActive: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
  });
  const certificateCount = await Certificate.countDocuments();
  const verifiedCertificates = await Certificate.countDocuments({ verified: true });
  const skillCount = await Skill.countDocuments();
  const pendingVerifications = await Certificate.countDocuments({ 
    verificationStatus: 'pending' 
  });
  
  // Get system alerts from logs
  const systemAlerts = await SystemLog.countDocuments({ 
    level: { $in: ['error', 'warning'] },
    timestamp: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  res.json({
    userCount,
    activeUsers,
    certificateCount,
    verifiedCertificates,
    skillCount,
    pendingVerifications,
    systemAlerts
  });
});

/**
 * @desc    Get all users for admin management
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getUserManagement = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('name email role status lastLogin createdAt')
    .sort('-createdAt');
  
  res.json(users);
});

/**
 * @desc    Update user details
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Update allowed fields
  const { name, email, role } = req.body;
  
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  
  const updatedUser = await user.save();
  
  // Log the action
  await SystemLog.create({
    level: 'info',
    message: `User ${user._id} updated by admin`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.json(updatedUser);
});

/**
 * @desc    Deactivate a user
 * @route   PUT /api/admin/users/:id/deactivate
 * @access  Private/Admin
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Prevent deactivating yourself
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot deactivate your own account');
  }
  
  user.status = 'inactive';
  const updatedUser = await user.save();
  
  // Log the action
  await SystemLog.create({
    level: 'warning',
    message: `User ${user._id} deactivated by admin`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.json(updatedUser);
});

/**
 * @desc    Activate a user
 * @route   PUT /api/admin/users/:id/activate
 * @access  Private/Admin
 */
export const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  user.status = 'active';
  const updatedUser = await user.save();
  
  // Log the action
  await SystemLog.create({
    level: 'info',
    message: `User ${user._id} activated by admin`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.json(updatedUser);
});

/**
 * @desc    Get all API keys
 * @route   GET /api/admin/api-keys
 * @access  Private/Admin
 */
export const getApiKeys = asyncHandler(async (req, res) => {
  const apiKeys = await ApiKey.find()
    .populate('owner', 'name email')
    .sort('-createdAt');
  
  res.json(apiKeys);
});

/**
 * @desc    Create a new API key
 * @route   POST /api/admin/api-keys
 * @access  Private/Admin
 */
export const createApiKey = asyncHandler(async (req, res) => {
  const { name, permissions, rateLimit, ownerId } = req.body;
  
  // Generate a secure random API key
  const apiKeyValue = `sk_${crypto.randomBytes(32).toString('hex')}`;
  
  // Create the API key
  const apiKey = await ApiKey.create({
    name,
    key: apiKeyValue,
    permissions,
    rateLimit: rateLimit || 100,
    owner: ownerId || req.user._id,
    status: 'active'
  });
  
  // Log the action
  await SystemLog.create({
    level: 'info',
    message: `New API key created: ${name}`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.status(201).json(apiKey);
});

/**
 * @desc    Revoke an API key
 * @route   PUT /api/admin/api-keys/:id/revoke
 * @access  Private/Admin
 */
export const revokeApiKey = asyncHandler(async (req, res) => {
  const apiKey = await ApiKey.findById(req.params.id);
  
  if (!apiKey) {
    res.status(404);
    throw new Error('API key not found');
  }
  
  apiKey.status = 'inactive';
  const updatedApiKey = await apiKey.save();
  
  // Log the action
  await SystemLog.create({
    level: 'warning',
    message: `API key revoked: ${apiKey.name}`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.json(updatedApiKey);
});

/**
 * @desc    Delete an API key
 * @route   DELETE /api/admin/api-keys/:id
 * @access  Private/Admin
 */
export const deleteApiKey = asyncHandler(async (req, res) => {
  const apiKey = await ApiKey.findById(req.params.id);
  
  if (!apiKey) {
    res.status(404);
    throw new Error('API key not found');
  }
  
  await apiKey.remove();
  
  // Log the action
  await SystemLog.create({
    level: 'warning',
    message: `API key deleted: ${apiKey.name}`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.json({ message: 'API key removed' });
});

/**
 * @desc    Get content (pages, FAQs, announcements)
 * @route   GET /api/admin/content
 * @access  Private/Admin
 */
export const getContent = asyncHandler(async (req, res) => {
  const { type } = req.query;
  
  // Filter by content type if provided
  const filter = type ? { contentType: type } : {};
  
  const content = await Content.find(filter)
    .populate('author', 'name')
    .sort('-updatedAt');
  
  res.json(content);
});

/**
 * @desc    Create new content
 * @route   POST /api/admin/content
 * @access  Private/Admin
 */
export const createContent = asyncHandler(async (req, res) => {
  const { title, question, answer, content, contentType, status, expiry, slug } = req.body;
  
  const newContent = await Content.create({
    title,
    question,
    answer,
    content,
    contentType,
    status: status || 'draft',
    author: req.user._id,
    expiry,
    slug: slug || (title ? title.toLowerCase().replace(/\s+/g, '-') : undefined)
  });
  
  // Log the action
  await SystemLog.create({
    level: 'info',
    message: `New ${contentType} created: ${title || question}`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.status(201).json(newContent);
});

/**
 * @desc    Update content
 * @route   PUT /api/admin/content/:id
 * @access  Private/Admin
 */
export const updateContent = asyncHandler(async (req, res) => {
  const { title, question, answer, content, status, expiry, slug } = req.body;
  
  const existingContent = await Content.findById(req.params.id);
  
  if (!existingContent) {
    res.status(404);
    throw new Error('Content not found');
  }
  
  // Update fields if provided
  if (title) existingContent.title = title;
  if (question) existingContent.question = question;
  if (answer) existingContent.answer = answer;
  if (content) existingContent.content = content;
  if (status) existingContent.status = status;
  if (expiry) existingContent.expiry = expiry;
  if (slug) existingContent.slug = slug;
  
  const updatedContent = await existingContent.save();
  
  // Log the action
  await SystemLog.create({
    level: 'info',
    message: `${existingContent.contentType} updated: ${existingContent.title || existingContent.question}`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.json(updatedContent);
});

/**
 * @desc    Delete content
 * @route   DELETE /api/admin/content/:id
 * @access  Private/Admin
 */
export const deleteContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  
  if (!content) {
    res.status(404);
    throw new Error('Content not found');
  }
  
  await content.remove();
  
  // Log the action
  await SystemLog.create({
    level: 'warning',
    message: `${content.contentType} deleted: ${content.title || content.question}`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip
  });
  
  res.json({ message: 'Content removed' });
});

/**
 * @desc    Get system logs
 * @route   GET /api/admin/logs
 * @access  Private/Admin
 */
export const getSystemLogs = asyncHandler(async (req, res) => {
  const { level, startDate, endDate, limit = 100 } = req.query;
  
  // Build filter based on query parameters
  const filter = {};
  
  if (level) {
    filter.level = level;
  }
  
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  
  const logs = await SystemLog.find(filter)
    .sort('-timestamp')
    .limit(parseInt(limit, 10))
    .populate('userId', 'name email');
  
  res.json(logs);
});

/**
 * @desc    Get system settings
 * @route   GET /api/admin/settings
 * @access  Private/Admin
 */
export const getSystemSettings = asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  // Filter by category if provided
  const filter = category ? { category } : {};
  
  const settings = await SystemSettings.find(filter)
    .populate('lastModifiedBy', 'name')
    .sort('category key');
  
  res.json(settings);
});

/**
 * @desc    Update system setting
 * @route   PUT /api/admin/settings/:category/:key
 * @access  Private/Admin
 */
export const updateSystemSettings = asyncHandler(async (req, res) => {
  const { category, key } = req.params;
  const { value, description, isPublic } = req.body;
  
  // Find the setting if it exists
  let setting = await SystemSettings.findOne({ category, key });
  
  if (setting) {
    // Update existing setting
    setting.value = value;
    if (description !== undefined) setting.description = description;
    if (isPublic !== undefined) setting.isPublic = isPublic;
    setting.lastModifiedBy = req.user._id;
    
    const updatedSetting = await setting.save();
    
    // Log the action
    await SystemLog.create({
      level: 'info',
      message: `System setting updated: ${category}.${key}`,
      source: 'adminController',
      userId: req.user._id,
      ipAddress: req.ip
    });
    
    res.json(updatedSetting);
  } else {
    // Create new setting
    setting = await SystemSettings.create({
      category,
      key,
      value,
      description,
      isPublic: isPublic || false,
      lastModifiedBy: req.user._id
    });
    
    // Log the action
    await SystemLog.create({
      level: 'info',
      message: `System setting created: ${category}.${key}`,
      source: 'adminController',
      userId: req.user._id,
      ipAddress: req.ip
    });
    
    res.status(201).json(setting);
  }
});

/**
 * @desc    Get all certificates (admin view)
 * @route   GET /api/admin/certificates
 * @access  Private/Admin
 */
export const getAllCertificates = asyncHandler(async (req, res) => {
  // Get query parameters for filtering
  const { status, verified, search, limit = 100 } = req.query;
  
  // Build the filter object
  const filter = {};
  
  if (status) {
    if (status === 'active') {
      // Active certificates have a valid expiry date or no expiry date
      filter.$or = [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: null }
      ];
      filter.verificationStatus = { $ne: 'rejected' };
    } else if (status === 'expired') {
      filter.expiryDate = { $lt: new Date() };
    } else if (status === 'pending') {
      filter.verificationStatus = 'pending';
    } else if (status === 'revoked') {
      filter.verificationStatus = 'rejected';
    }
  }
  
  if (verified === 'true') {
    filter.verificationStatus = 'verified';
  } else if (verified === 'false') {
    filter.verificationStatus = { $ne: 'verified' };
  }
  
  if (search) {
    // Search in title, issuer, or credential ID
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { issuer: { $regex: search, $options: 'i' } },
      { credentialID: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Fetch certificates with user info
  const certificates = await Certificate.find(filter)
    .populate('user', 'name email')
    .populate('skills', 'name category')
    .sort('-createdAt')
    .limit(parseInt(limit));
  
  // Log the action
  await SystemLog.create({
    level: 'info',
    message: `Admin viewed certificates (${certificates.length} results)`,
    source: 'adminController',
    userId: req.user._id,
    ipAddress: req.ip || 'unknown'
  });
  
  res.status(200).json({
    success: true,
    count: certificates.length,
    certificates
  });
}); 