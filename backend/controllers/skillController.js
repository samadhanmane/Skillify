import Skill from '../models/Skill.js';
import UserSkill from '../models/UserSkill.js';
import Certificate from '../models/Certificate.js';
import { awardSkillPoints } from '../utils/gamification.js';

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
export const getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: skills.length,
      skills
    });
  } catch (error) {
    console.error('Get all skills error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get skill by ID
// @route   GET /api/skills/:id
// @access  Public
export const getSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({ 
        success: false, 
        message: 'Skill not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      skill
    });
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get user skills
// @route   GET /api/skills/user
// @route   GET /api/skills/user-skills
// @access  Private
export const getUserSkills = async (req, res) => {
  try {
    // Use a timeout to prevent hanging requests
    const timeout = setTimeout(() => {
      throw new Error('Request timeout');
    }, 10000);

    const userSkills = await UserSkill.find({ user: req.user.id })
      .populate('skill', 'name category description')
      .sort({ points: -1 });
    
    // Clear the timeout as request completed successfully
    clearTimeout(timeout);
    
    res.status(200).json({
      success: true,
      count: userSkills.length,
      userSkills
    });
  } catch (error) {
    console.error('Get user skills error:', error);
    
    // Check if it's a connection reset error
    if (error.code === 'ECONNRESET') {
      return res.status(500).json({ 
        success: false, 
        message: 'Connection lost. Please try again.',
        retryable: true
      });
    }
    
    // Handle timeout error
    if (error.message === 'Request timeout') {
      return res.status(504).json({ 
        success: false, 
        message: 'Request timed out. Please try again.',
        retryable: true
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get skill data for dashboard
// @route   GET /api/skills/dashboard
// @access  Private
export const getSkillsDashboard = async (req, res) => {
  try {
    // Get user skills with populated data
    const userSkills = await UserSkill.find({ user: req.user.id })
      .populate('skill', 'name category')
      .populate('certificates', 'title issuer issueDate')
      .sort({ points: -1 });
    
    // Calculate skill categories data for chart
    const categoryData = {};
    userSkills.forEach(userSkill => {
      const category = userSkill.skill.category;
      if (!categoryData[category]) {
        categoryData[category] = {
          count: 0,
          totalPoints: 0
        };
      }
      categoryData[category].count += 1;
      categoryData[category].totalPoints += userSkill.points;
    });
    
    // Format data for charts
    const chartData = {
      categories: Object.keys(categoryData).map(category => ({
        name: category,
        count: categoryData[category].count,
        totalPoints: categoryData[category].totalPoints,
        averagePoints: Math.round(categoryData[category].totalPoints / categoryData[category].count)
      })),
      topSkills: userSkills.slice(0, 5).map(userSkill => ({
        id: userSkill.skill._id,
        name: userSkill.skill.name,
        points: userSkill.points,
        certificateCount: userSkill.certificates.length
      })),
      skillDistribution: userSkills.map(userSkill => ({
        id: userSkill.skill._id,
        name: userSkill.skill.name,
        points: userSkill.points,
        category: userSkill.skill.category
      }))
    };
    
    // Get recent certificates
    const recentCertificates = await Certificate.find({ user: req.user.id })
      .populate('skills', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      skillCount: userSkills.length,
      chartData,
      recentCertificates
    });
  } catch (error) {
    console.error('Get skills dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get skill data for a specific user (public profile)
// @route   GET /api/skills/user/:userId
// @access  Public
export const getPublicUserSkills = async (req, res) => {
  try {
    const userSkills = await UserSkill.find({ user: req.params.userId })
      .populate('skill', 'name category')
      .sort({ points: -1 });
    
    // Format data for public view
    const skills = userSkills.map(userSkill => ({
      id: userSkill.skill._id,
      name: userSkill.skill.name,
      category: userSkill.skill.category,
      points: userSkill.points
    }));
    
    // Calculate skill categories for chart
    const categories = {};
    userSkills.forEach(userSkill => {
      const category = userSkill.skill.category;
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          totalPoints: 0
        };
      }
      categories[category].count += 1;
      categories[category].totalPoints += userSkill.points;
    });
    
    const chartData = {
      categories: Object.keys(categories).map(category => ({
        name: category,
        count: categories[category].count,
        totalPoints: categories[category].totalPoints
      })),
      topSkills: skills.slice(0, 5)
    };
    
    res.status(200).json({
      success: true,
      skillCount: skills.length,
      skills,
      chartData
    });
  } catch (error) {
    console.error('Get public user skills error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Create a user skill
// @route   POST /api/skills/user-skills
// @access  Private
export const createUserSkill = async (req, res) => {
  try {
    const { name, category, level } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide skill name'
      });
    }
    
    // Sanitize level input to ensure it's a number between 0-100
    const skillLevel = level ? Math.min(Math.max(parseInt(level), 1), 100) : 50;
    
    // Sanitize category
    const skillCategory = category ? category.trim() : 'Other';
    
    // Find or create the skill with better error handling
    let skill;
    try {
      // Escape special regex characters in the skill name
      const trimmedName = name.trim();
      const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      skill = await Skill.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
      
      if (!skill) {
        skill = await Skill.create({
          name: trimmedName,
          category: skillCategory,
          description: ''
        });
      }
    } catch (skillError) {
      console.error('Error finding/creating skill:', skillError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error processing skill data', 
        error: skillError.message 
      });
    }
    
    // Check if user already has this skill
    try {
      const existingUserSkill = await UserSkill.findOne({
        user: req.user.id,
        skill: skill._id
      });
      
      if (existingUserSkill) {
        return res.status(400).json({
          success: false,
          message: 'You already have this skill'
        });
      }
    } catch (checkError) {
      console.error('Error checking existing skill:', checkError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking existing skills', 
        error: checkError.message 
      });
    }
    
    // Create user skill with better error handling
    let userSkill;
    try {
      userSkill = await UserSkill.create({
        user: req.user.id,
        skill: skill._id,
        points: skillLevel,
        certificates: [],
        updatedAt: Date.now()
      });
      
      // Populate skill info
      await userSkill.populate('skill', 'name category description');
      
      // Award points for adding a new skill
      const pointsData = await awardSkillPoints(req.user.id, skill._id);
      
      res.status(201).json({
        success: true,
        userSkill,
        gamification: {
          pointsAwarded: pointsData.pointsAwarded,
          newPoints: pointsData.newPoints,
          newLevel: pointsData.newLevel
        }
      });
    } catch (createError) {
      console.error('Error creating user skill:', createError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error saving skill to your profile', 
        error: createError.message 
      });
    }
  } catch (error) {
    console.error('Create user skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update a user skill
// @route   PUT /api/skills/user-skills/:id
// @access  Private
export const updateUserSkill = async (req, res) => {
  try {
    const { points } = req.body;
    
    // Find user skill
    const userSkill = await UserSkill.findById(req.params.id);
    
    if (!userSkill) {
      return res.status(404).json({
        success: false,
        message: 'User skill not found'
      });
    }
    
    // Check ownership
    if (userSkill.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this skill'
      });
    }
    
    // Update points
    if (points !== undefined) {
      userSkill.points = Math.max(0, Math.min(100, points)); // Ensure between 0-100
    }
    
    userSkill.updatedAt = Date.now();
    await userSkill.save();
    
    // Populate skill info
    await userSkill.populate('skill', 'name category description');
    
    res.status(200).json({
      success: true,
      userSkill
    });
  } catch (error) {
    console.error('Update user skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete a user skill
// @route   DELETE /api/skills/user-skills/:id
// @access  Private
export const deleteUserSkill = async (req, res) => {
  try {
    // Find user skill
    const userSkill = await UserSkill.findById(req.params.id);
    
    if (!userSkill) {
      return res.status(404).json({
        success: false,
        message: 'User skill not found'
      });
    }
    
    // Check ownership
    if (userSkill.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this skill'
      });
    }
    
    // Delete user skill
    await UserSkill.deleteOne({ _id: userSkill._id });
    
    res.status(200).json({
      success: true,
      message: 'User skill deleted successfully'
    });
  } catch (error) {
    console.error('Delete user skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 