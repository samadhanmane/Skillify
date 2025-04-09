import User from '../models/User.js';
import { Badge, AchievementLog } from '../models/Gamification.js';

/**
 * Award points to a user
 * @param {string} userId - The user ID
 * @param {number} points - The number of points to award
 * @param {string} reason - The reason for awarding points
 * @returns {Promise<object>} - The updated user's level and points
 */
export const awardPoints = async (userId, points, reason = '') => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Add points
  user.points += points;
  
  // Update level based on points
  user.updateLevel();
  
  // Save user
  await user.save();
  
  return {
    userId,
    newPoints: user.points,
    newLevel: user.level,
    pointsAwarded: points,
    reason
  };
};

/**
 * Award a badge to a user
 * @param {string} userId - The user ID
 * @param {object} badge - The badge object with name, description, and image
 * @returns {Promise<object>} - The awarded badge
 */
export const awardBadge = async (userId, badge) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if user already has this badge
  const hasBadge = user.badges.some(b => b.name === badge.name);
  
  if (hasBadge) {
    return null; // User already has this badge
  }
  
  // Add badge
  const newBadge = {
    name: badge.name,
    description: badge.description || '',
    image: badge.image || '',
    type: badge.type || '',
    earnedAt: new Date()
  };
  
  user.badges.push(newBadge);
  
  // Award bonus points for earning a badge
  user.points += 50;
  user.updateLevel();
  
  // Save user
  await user.save();
  
  return newBadge;
};

/**
 * Log an achievement for a user
 * @param {string} userId - The user ID
 * @param {object} achievement - The achievement object with type and details
 * @returns {Promise<object>} - The logged achievement
 */
export const logAchievement = async (userId, achievement) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Add achievement
  const newAchievement = {
    type: achievement.type,
    details: achievement.details,
    earnedAt: new Date()
  };
  
  user.achievements.push(newAchievement);
  
  // Award points based on achievement type
  let pointsToAward = 20; // Default points
  
  switch (achievement.type) {
    case 'certificate_milestone':
      pointsToAward = 30;
      break;
    case 'skill_level_up':
      pointsToAward = 25;
      break;
    case 'perfect_verification':
      pointsToAward = 50;
      break;
    case 'learning_streak':
      pointsToAward = 40;
      break;
    case 'top_learner':
      pointsToAward = 100;
      break;
    default:
      pointsToAward = 20;
  }
  
  user.points += pointsToAward;
  user.updateLevel();
  
  // Save user
  await user.save();
  
  return {
    achievement: newAchievement,
    pointsAwarded: pointsToAward
  };
};

/**
 * Update a user's learning streak
 * @param {string} userId - The user ID 
 * @returns {Promise<object>} - The updated streak data
 */
export const updateLearningStreak = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const now = new Date();
  const lastActive = user.learningStreak.lastActive || new Date(0);
  
  // Calculate days between now and last active
  const dayDifference = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
  
  // Update streak based on days difference
  if (dayDifference === 0) {
    // Already logged in today, no streak update needed
    return user.learningStreak;
  } else if (dayDifference === 1) {
    // Logged in consecutive day, increase streak
    user.learningStreak.current += 1;
    
    // Update longest streak if current > longest
    if (user.learningStreak.current > user.learningStreak.longest) {
      user.learningStreak.longest = user.learningStreak.current;
    }
    
    // Check for streak milestones
    if (user.learningStreak.current === 7) {
      // Log achievement for 7-day streak
      await logAchievement(userId, {
        type: 'learning_streak',
        details: 'Maintained a 7-day learning streak'
      });
      
      // No need to add points here since logAchievement already does it
    } else if (user.learningStreak.current === 30) {
      // Log achievement for 30-day streak
      await logAchievement(userId, {
        type: 'learning_streak',
        details: 'Maintained a 30-day learning streak'
      });
      
      // Award badge for 30-day streak
      await awardBadge(userId, {
        name: 'Consistency Champion',
        description: 'Maintained a 30-day learning streak',
        type: 'consistency-king'
      });
    } else {
      // Award small points for maintaining streak
      user.points += 5;
      user.updateLevel();
      await user.save();
    }
  } else {
    // Streak broken, reset to 1
    user.learningStreak.current = 1;
  }
  
  // Update last active
  user.learningStreak.lastActive = now;
  
  // Save if not already saved by other functions
  if (dayDifference !== 1 || (user.learningStreak.current !== 7 && user.learningStreak.current !== 30)) {
    await user.save();
  }
  
  return user.learningStreak;
};

/**
 * Check and award badges based on user activity
 * @param {string} userId - The user ID
 */
export const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get user certificates and skills
  const certificates = await import('../models/Certificate.js')
    .then(module => module.default.countDocuments({ user: userId }));
  
  const verifiedCertificates = await import('../models/Certificate.js')
    .then(module => module.default.countDocuments({ 
      user: userId,
      verificationStatus: 'verified'
    }));
  
  const skills = await import('../models/Skill.js')
    .then(module => module.default.countDocuments({ user: userId }));
  
  const badgesToCheck = [
    // Certificate Champion - 10+ certificates
    {
      condition: certificates >= 10,
      badge: {
        name: 'Certificate Champion',
        description: 'Added 10 or more certificates',
        type: 'certificate-champion'
      }
    },
    
    // Skill Master - 10+ skills
    {
      condition: skills >= 10,
      badge: {
        name: 'Skill Master',
        description: 'Added 10 or more skills',
        type: 'skill-master'
      }
    },
    
    // Verification Guru - 5+ verified certificates
    {
      condition: verifiedCertificates >= 5,
      badge: {
        name: 'Verification Guru',
        description: 'Verified 5 or more certificates',
        type: 'verification-guru'
      }
    },
    
    // Profile Completer - Has bio, location, and at least one social link
    {
      condition: 
        user.bio && 
        user.bio.length > 0 && 
        user.location && 
        user.location.length > 0 && 
        Object.values(user.links).some(link => link && link.length > 0),
      badge: {
        name: 'Profile Completer',
        description: 'Completed profile with bio, location, and social links',
        type: 'profile-complete'
      }
    }
  ];
  
  // Check each badge and award if condition is met
  for (const badgeData of badgesToCheck) {
    if (badgeData.condition) {
      await awardBadge(userId, badgeData.badge);
    }
  }
};

/**
 * Award points for adding a certificate
 * @param {string} userId - The user ID
 * @param {string} certificateId - The certificate ID
 * @param {string} action - The action (create, update, verify)
 * @returns {Promise<object>} - Points data
 */
export const awardCertificatePoints = async (userId, certificateId, action = 'create') => {
  let points = 0;
  let reason = '';
  
  // Determine points based on action
  switch (action) {
    case 'create':
      points = 20;
      reason = 'Adding new certificate';
      break;
    case 'verify':
      points = 30;
      reason = 'Certificate verified';
      break;
    case 'update':
      points = 5;
      reason = 'Updating certificate information';
      break;
    default:
      points = 0;
      reason = 'Certificate action';
  }
  
  // Award points
  const pointsData = await awardPoints(userId, points, reason);
  
  // Check for milestones
  const certificateCount = await import('../models/Certificate.js')
    .then(module => module.default.countDocuments({ user: userId }));
  
  // Check for certificate achievements
  if (certificateCount === 5) {
    await logAchievement(userId, {
      type: 'certificate_milestone',
      details: 'Added 5 certificates'
    });
  } else if (certificateCount === 10) {
    await logAchievement(userId, {
      type: 'certificate_milestone',
      details: 'Added 10 certificates'
    });
    
    // Award Certificate Champion badge
    await awardBadge(userId, {
      name: 'Certificate Champion',
      description: 'Added 10 or more certificates',
      type: 'certificate-champion'
    });
  }
  
  // Check for badge eligibility
  await checkAndAwardBadges(userId);
  
  return pointsData;
};

/**
 * Award points for adding a skill
 * @param {string} userId - The user ID
 * @param {string} skillId - The skill ID
 * @returns {Promise<object>} - Points data
 */
export const awardSkillPoints = async (userId, skillId) => {
  // Award points for adding a new skill
  const pointsData = await awardPoints(userId, 15, 'Adding new skill');
  
  // Check for milestones
  const skillCount = await import('../models/UserSkill.js')
    .then(module => module.default.countDocuments({ user: userId }));
  
  // Check for skill achievements
  if (skillCount === 5) {
    await logAchievement(userId, {
      type: 'skill_milestone',
      details: 'Added 5 skills'
    });
  } else if (skillCount === 10) {
    await logAchievement(userId, {
      type: 'skill_milestone',
      details: 'Added 10 skills'
    });
    
    // Award Skill Master badge
    await awardBadge(userId, {
      name: 'Skill Master',
      description: 'Added 10 or more skills',
      type: 'skill-master'
    });
  }
  
  // Check for badge eligibility
  await checkAndAwardBadges(userId);
  
  return pointsData;
};

export default {
  awardPoints,
  awardCertificatePoints,
  awardSkillPoints,
  checkAndAwardBadges,
  logAchievement,
  updateLearningStreak
}; 