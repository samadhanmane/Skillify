import User from '../models/User.js';
import { Badge, Leaderboard, AchievementLog } from '../models/Gamification.js';
import gamification from '../utils/gamification.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';
import Certificate from '../models/Certificate.js';
import Skill from '../models/Skill.js';
import UserSkill from '../models/UserSkill.js';
import asyncHandler from 'express-async-handler';
import { checkAndAwardBadges } from '../utils/gamification.js';

/**
 * @desc    Get user's gamification data
 * @route   GET /api/gamification/profile
 * @access  Private
 */
export const getUserGamification = catchAsync(async (req, res) => {
  // Get the user with gamification data
  const user = await User.findById(req.user.id).select(
    'name points level badges achievements learningStreak analytics profileImage title'
  );
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Get additional stats for the response
  const certificateCount = await Certificate.countDocuments({ user: req.user.id });
  const verifiedCertificateCount = await Certificate.countDocuments({ 
    user: req.user.id,
    verificationStatus: 'verified'
  });
  
  // Get user skills for average calculation
  const userSkills = await UserSkill.find({ user: req.user.id });
  const skillCount = userSkills.length;
  
  // Calculate average skill level (normalize to 0-100%)
  let avgSkillLevel = 0;
  if (skillCount > 0) {
    const totalPoints = userSkills.reduce((sum, skill) => sum + skill.points, 0);
    avgSkillLevel = Math.round((totalPoints / skillCount) * 20); // Assuming max points is 5, normalize to 100%
  }
  
  // Calculate points to next level
  const pointsToNextLevel = 100 - (user.points % 100);
  
  // Prepare response data
  const gamificationData = {
    points: user.points,
    level: user.level,
    pointsToNextLevel,
    badges: user.badges || [],
    achievements: user.achievements || [],
    learningStreak: user.learningStreak,
    name: user.name,
    profileImage: user.profileImage,
    title: user.title,
    stats: {
      totalCertificates: certificateCount,
      verifiedCertificates: verifiedCertificateCount,
      skillsCount: skillCount,
      avgSkillLevel,
      ...user.analytics
    }
  };
  
  res.status(200).json({
    success: true,
    gamificationData
  });
});

/**
 * @desc    Get user's achievements and badges
 * @route   GET /api/gamification/achievements
 * @access  Private
 */
export const getUserAchievements = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Get user with badges
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Get achievement logs
  const achievementLogs = await AchievementLog.find({ user: userId })
    .sort({ earnedAt: -1 })
    .limit(50);
  
  return res.status(200).json({
    success: true,
    data: {
      points: user.points,
      level: user.level,
      badges: user.badges,
      achievements: achievementLogs
    }
  });
});

/**
 * @desc    Get achievement details by ID
 * @route   GET /api/gamification/achievements/:id
 * @access  Private
 */
export const getAchievementDetails = catchAsync(async (req, res) => {
  const achievementId = req.params.id;
  
  const achievement = await AchievementLog.findById(achievementId);
  if (!achievement) {
    return res.status(404).json({
      success: false,
      message: 'Achievement not found'
    });
  }
  
  // Check if user has permission
  if (achievement.user.toString() !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this achievement'
    });
  }
  
  return res.status(200).json({
    success: true,
    achievement
  });
});

/**
 * @desc    Get all available badges
 * @route   GET /api/gamification/badges
 * @access  Private
 */
export const getAllBadges = catchAsync(async (req, res) => {
  const badges = await Badge.find({}).sort({ name: 1 });
  
  // Get user's earned badges
  const user = await User.findById(req.user.id);
  const earnedBadgeNames = user.badges.map(b => b.name);
  
  // Mark badges as earned or not
  const badgesWithStatus = badges.map(badge => ({
    ...badge.toObject(),
    earned: earnedBadgeNames.includes(badge.name)
  }));
  
  return res.status(200).json({
    success: true,
    badges: badgesWithStatus
  });
});

/**
 * @desc    Get leaderboard
 * @route   GET /api/gamification/leaderboard
 * @access  Private
 */
export const getLeaderboard = catchAsync(async (req, res) => {
  const { type = 'points', period = 'alltime' } = req.query;
  
  // Validate type and period
  const validTypes = ['points', 'certificates', 'skills', 'streak'];
  const validPeriods = ['weekly', 'monthly', 'alltime'];
  
  if (!validTypes.includes(type) || !validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid leaderboard type or period'
    });
  }
  
  // Try to find existing leaderboard
  let leaderboard = await Leaderboard.findOne({ type, period });
  
  // If not found or outdated, generate a new one
  if (!leaderboard || 
      Date.now() - new Date(leaderboard.lastUpdated).getTime() > 3600000) { // 1 hour
    
    // Generate leaderboard based on type
    let users = [];
    
    switch (type) {
      case 'points':
        users = await User.find({})
          .select('name profileImage points level')
          .sort({ points: -1 })
          .limit(100);
        break;
        
      case 'certificates':
        users = await User.find({})
          .select('name profileImage analytics.totalCertificates')
          .sort({ 'analytics.totalCertificates': -1 })
          .limit(100);
        break;
        
      case 'skills':
        users = await User.find({})
          .select('name profileImage analytics.skillsCount')
          .sort({ 'analytics.skillsCount': -1 })
          .limit(100);
        break;
        
      case 'streak':
        users = await User.find({})
          .select('name profileImage learningStreak')
          .sort({ 'learningStreak.longest': -1 })
          .limit(100);
        break;
    }
    
    // Format users for leaderboard
    const rankings = users.map((user, index) => {
      let score = 0;
      
      switch (type) {
        case 'points':
          score = user.points || 0;
          break;
        case 'certificates':
          score = user.analytics?.totalCertificates || 0;
          break;
        case 'skills':
          score = user.analytics?.skillsCount || 0;
          break;
        case 'streak':
          score = user.learningStreak?.longest || 0;
          break;
      }
      
      return {
        user: user._id,
        name: user.name,
        avatar: user.profileImage,
        score,
        rank: index + 1,
        change: 0 // No change for now
      };
    });
    
    // Create or update leaderboard
    if (leaderboard) {
      // Calculate change in rank
      const oldRankings = leaderboard.rankings || [];
      
      // Update rankings with change in position
      rankings.forEach((ranking, index) => {
        const oldRanking = oldRankings.find(
          r => r.user && ranking.user && r.user.toString() === ranking.user.toString()
        );
        
        if (oldRanking) {
          ranking.change = oldRanking.rank - ranking.rank;
        }
      });
      
      leaderboard.rankings = rankings;
      leaderboard.lastUpdated = new Date();
      await leaderboard.save();
    } else {
      leaderboard = await Leaderboard.create({
        type,
        period,
        rankings,
        lastUpdated: new Date()
      });
    }
  }
  
  // Find current user's position
  const userRanking = leaderboard.rankings.find(
    r => r.user && r.user.toString() === req.user.id
  );
  
  return res.status(200).json({
    success: true,
    leaderboard: {
      type,
      period,
      rankings: leaderboard.rankings,
      userRanking,
      lastUpdated: leaderboard.lastUpdated
    }
  });
});

/**
 * @desc    Update user's streak
 * @route   POST /api/gamification/update-streak
 * @access  Private
 */
export const updateStreak = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Get current streak data
  const streak = user.learningStreak || {
    current: 0,
    longest: 0,
    lastActive: null
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = streak.lastActive ? new Date(streak.lastActive) : null;
  
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day - increment streak
      streak.current += 1;
      streak.longest = Math.max(streak.current, streak.longest);
      
      // Award streak achievement at milestones
      if (streak.current === 7) {
        // Add achievement for 7-day streak
        user.achievements.push({
          type: 'learning_streak',
          details: 'Maintained a 7-day learning streak',
          earnedAt: new Date()
        });
        
        // Award badge for 7-day streak if not already awarded
        const hasBadge = user.badges.some(badge => 
          badge.name === 'Week Warrior');
        
        if (!hasBadge) {
          user.badges.push({
            name: 'Week Warrior',
            description: 'Maintained a learning streak for 7 consecutive days',
            type: 'consistency-king',
            earnedAt: new Date()
          });
          
          // Log achievement
          await AchievementLog.create({
            user: userId,
            achievementType: 'badge_earned',
            details: {
              title: 'Week Warrior Badge Earned',
              description: 'Maintained a learning streak for 7 consecutive days',
              pointsEarned: 50
            }
          });
        }
        
        // Award points for 7-day streak
        user.points += 50;
      } else if (streak.current === 30) {
        // Add achievement for 30-day streak
        user.achievements.push({
          type: 'learning_streak',
          details: 'Maintained a 30-day learning streak',
          earnedAt: new Date()
        });
        
        // Award badge for 30-day streak if not already awarded
        const hasBadge = user.badges.some(badge => 
          badge.name === 'Month Master');
        
        if (!hasBadge) {
          user.badges.push({
            name: 'Month Master',
            description: 'Maintained a learning streak for 30 consecutive days',
            type: 'consistency-king',
            earnedAt: new Date()
          });
          
          // Log achievement
          await AchievementLog.create({
            user: userId,
            achievementType: 'badge_earned',
            details: {
              title: 'Month Master Badge Earned',
              description: 'Maintained a learning streak for 30 consecutive days',
              pointsEarned: 200
            }
          });
        }
        
        // Award points for 30-day streak
        user.points += 200;
      }
    } else if (diffDays > 1) {
      // Streak broken - reset to 1
      streak.current = 1;
    }
    // If same day, no change needed
  } else {
    // First time login - start with 1
    streak.current = 1;
    streak.longest = 1;
  }
  
  streak.lastActive = today;
  user.learningStreak = streak;
  
  // Always award points for daily login (if not already logged in today)
  if (!lastActive || lastActive.getTime() !== today.getTime()) {
    user.points += 5;
    
    // Log achievement
    await AchievementLog.create({
      user: userId,
      achievementType: 'daily_login',
      details: {
        title: 'Daily Login',
        description: 'Logged in today to maintain your streak',
        pointsEarned: 5
      }
    });
    
    // Calculate level based on points (every 100 points = 1 level)
    const newLevel = Math.floor(user.points / 100) + 1;
    
    // Check if user leveled up
    if (newLevel > user.level) {
      // Add level up achievement
      user.achievements.push({
        type: 'level_up',
        details: `Reached Level ${newLevel}`,
        earnedAt: new Date()
      });
      
      // Log level up
      await AchievementLog.create({
        user: userId,
        achievementType: 'level_up',
        details: {
          title: `Level ${newLevel} Reached`,
          description: `You've reached level ${newLevel}!`,
          pointsEarned: 0
        }
      });
      
      user.level = newLevel;
    }
  }
  
  await user.save();
  
  return res.status(200).json({
    success: true,
    message: 'Streak updated successfully',
    streak: user.learningStreak,
    points: user.points,
    level: user.level
  });
});

/**
 * @desc    Award points to user
 * @route   POST /api/gamification/award-points
 * @access  Private (Admin only)
 */
export const awardPoints = catchAsync(async (req, res) => {
  const { userId, points, reason } = req.body;
  
  if (!userId || !points) {
    return res.status(400).json({
      success: false,
      message: 'User ID and points are required'
    });
  }
  
  // Check if admin or self
  if (!req.user.isAdmin && req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to award points'
    });
  }
  
  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Update points
  user.points += parseInt(points);
  
  // Update level based on points
  user.updateLevel();
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: `Awarded ${points} points to user`,
    newTotal: user.points,
    newLevel: user.level
  });
});

/**
 * @desc    Award a badge to user
 * @route   POST /api/gamification/award-badge
 * @access  Private (Admin only)
 */
export const awardBadge = catchAsync(async (req, res) => {
  const { userId, badge } = req.body;
  
  if (!userId || !badge || !badge.name) {
    return res.status(400).json({
      success: false,
      message: 'User ID and badge details are required'
    });
  }
  
  // Only admins can award badges
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to award badges'
    });
  }
  
  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Check if badge already exists
  const badgeExists = user.badges.some(b => b.name === badge.name);
  if (badgeExists) {
    return res.status(400).json({
      success: false,
      message: 'Badge already awarded to user'
    });
  }
  
  // Add badge
  user.badges.push({
    name: badge.name,
    description: badge.description || '',
    image: badge.image || '',
    earnedAt: new Date()
  });
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: `Badge "${badge.name}" awarded to user`,
    badge: user.badges[user.badges.length - 1]
  });
});

/**
 * @desc    Log an achievement for a user
 * @route   POST /api/gamification/log-achievement
 * @access  Private (Admin only)
 */
export const logAchievement = catchAsync(async (req, res) => {
  const { userId, achievement } = req.body;
  
  if (!userId || !achievement || !achievement.type || !achievement.details) {
    return res.status(400).json({
      success: false,
      message: 'User ID and achievement details are required'
    });
  }
  
  // Only admins can log achievements
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to log achievements'
    });
  }
  
  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Add achievement
  user.achievements.push({
    type: achievement.type,
    details: achievement.details,
    earnedAt: new Date()
  });
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: `Achievement logged for user`,
    achievement: user.achievements[user.achievements.length - 1]
  });
});

/**
 * @desc    Create a new badge
 * @route   POST /api/gamification/badges
 * @access  Private (Admin only)
 */
export const createBadge = catchAsync(async (req, res) => {
  // Check if admin
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can create badges'
    });
  }
  
  const {
    name,
    description,
    image,
    category,
    criteria,
    pointsAwarded,
    rarity
  } = req.body;
  
  // Check if badge already exists
  const existingBadge = await Badge.findOne({ name });
  if (existingBadge) {
    return res.status(400).json({
      success: false,
      message: 'Badge with this name already exists'
    });
  }
  
  // Create badge
  const badge = await Badge.create({
    name,
    description,
    image: image || 'default_badge.png',
    category: category || 'achievements',
    criteria,
    pointsAwarded: pointsAwarded || 10,
    rarity: rarity || 'common'
  });
  
  return res.status(201).json({
    success: true,
    badge
  });
});

/**
 * @desc    Check and award badges to user
 * @route   POST /api/gamification/check-badges
 * @access  Private
 */
export const checkUserBadges = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Check and award badges
  const newBadges = await checkAndAwardBadges(userId);
  
  return res.status(200).json({
    success: true,
    badgesAwarded: newBadges
  });
});

/**
 * @desc    Get enhanced leaderboard with detailed user data
 * @route   GET /api/gamification/enhanced-leaderboard
 * @access  Private
 */
export const getEnhancedLeaderboard = catchAsync(async (req, res) => {
  const { type = 'points', period = 'alltime', page = 1, limit = 10 } = req.query;
  
  // Validate type and period
  const validTypes = ['points', 'certificates', 'skills', 'streak'];
  const validPeriods = ['weekly', 'monthly', 'alltime'];
  
  if (!validTypes.includes(type) || !validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid leaderboard type or period'
    });
  }
  
  // Calculate pagination
  const pageInt = parseInt(page, 10) || 1;
  const limitInt = parseInt(limit, 10) || 10;
  const skip = (pageInt - 1) * limitInt;
  
  // Set up query for user data based on type
  let sortField = {};
  let projectionFields = {};
  
  switch (type) {
    case 'points':
      sortField = { points: -1 };
      projectionFields = {
        name: 1,
        username: 1,
        profileImage: 1,
        points: 1,
        level: 1,
        badges: { $slice: 3 }, // Only get the first 3 badges
        learningStreak: 1
      };
      break;
      
    case 'certificates':
      sortField = { 'analytics.totalCertificates': -1 };
      projectionFields = {
        name: 1,
        username: 1,
        profileImage: 1,
        points: 1,
        level: 1,
        'analytics.totalCertificates': 1,
        'analytics.verifiedCertificates': 1
      };
      break;
      
    case 'skills':
      sortField = { 'analytics.skillsCount': -1 };
      projectionFields = {
        name: 1,
        username: 1,
        profileImage: 1,
        points: 1,
        level: 1,
        'analytics.skillsCount': 1,
        'analytics.avgSkillLevel': 1
      };
      break;
      
    case 'streak':
      sortField = { 'learningStreak.longest': -1 };
      projectionFields = {
        name: 1,
        username: 1,
        profileImage: 1,
        points: 1,
        level: 1,
        learningStreak: 1
      };
      break;
  }
  
  // Fetch users for leaderboard
  const users = await User.find({})
    .select(projectionFields)
    .sort(sortField)
    .skip(skip)
    .limit(limitInt);
  
  // Get total count for pagination
  const totalUsers = await User.countDocuments({});
  
  // Get current user's rank
  let userRank = null;
  if (req.user) {
    // For points leaderboard
    if (type === 'points') {
      const higherRankedUsers = await User.countDocuments({
        points: { $gt: req.user.points }
      });
      userRank = higherRankedUsers + 1;
    }
    // For certificates leaderboard
    else if (type === 'certificates') {
      const currentUser = await User.findById(req.user.id).select('analytics.totalCertificates');
      if (currentUser?.analytics?.totalCertificates) {
        const higherRankedUsers = await User.countDocuments({
          'analytics.totalCertificates': { $gt: currentUser.analytics.totalCertificates }
        });
        userRank = higherRankedUsers + 1;
      }
    }
    // For skills leaderboard
    else if (type === 'skills') {
      const currentUser = await User.findById(req.user.id).select('analytics.skillsCount');
      if (currentUser?.analytics?.skillsCount) {
        const higherRankedUsers = await User.countDocuments({
          'analytics.skillsCount': { $gt: currentUser.analytics.skillsCount }
        });
        userRank = higherRankedUsers + 1;
      }
    }
    // For streak leaderboard
    else if (type === 'streak') {
      const currentUser = await User.findById(req.user.id).select('learningStreak');
      if (currentUser?.learningStreak?.longest) {
        const higherRankedUsers = await User.countDocuments({
          'learningStreak.longest': { $gt: currentUser.learningStreak.longest }
        });
        userRank = higherRankedUsers + 1;
      }
    }
  }
  
  // Format users for the response
  const formattedUsers = users.map((user, index) => {
    const rank = skip + index + 1;
    
    // Create base user object
    const formattedUser = {
      id: user._id,
      name: user.name,
      username: user.username,
      profileImage: user.profileImage,
      rank,
      points: user.points,
      level: user.level
    };
    
    // Add type-specific data
    switch (type) {
      case 'points':
        formattedUser.badges = user.badges || [];
        formattedUser.streak = user.learningStreak?.current || 0;
        break;
        
      case 'certificates':
        formattedUser.totalCertificates = user.analytics?.totalCertificates || 0;
        formattedUser.verifiedCertificates = user.analytics?.verifiedCertificates || 0;
        break;
        
      case 'skills':
        formattedUser.skillsCount = user.analytics?.skillsCount || 0;
        formattedUser.avgSkillLevel = user.analytics?.avgSkillLevel || 0;
        break;
        
      case 'streak':
        formattedUser.currentStreak = user.learningStreak?.current || 0;
        formattedUser.longestStreak = user.learningStreak?.longest || 0;
        break;
    }
    
    return formattedUser;
  });
  
  return res.status(200).json({
    success: true,
    leaderboard: {
      type,
      period,
      users: formattedUsers,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limitInt)
      },
      userRank
    }
  });
});

export default {
  getUserGamification,
  getUserAchievements,
  getAchievementDetails,
  getAllBadges,
  getLeaderboard,
  updateStreak,
  awardPoints,
  awardBadge,
  logAchievement,
  createBadge,
  checkUserBadges,
  getEnhancedLeaderboard
}; 