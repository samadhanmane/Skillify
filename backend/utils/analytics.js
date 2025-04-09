import User from '../models/User.js';
import Certificate from '../models/Certificate.js';
import Skill from '../models/Skill.js';
import UserAnalytics from '../models/UserAnalytics.js';
import mongoose from 'mongoose';

/**
 * Generates or updates user analytics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated analytics data
 */
export const generateUserAnalytics = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get certificates for this user
    const certificates = await Certificate.find({ user: userId })
      .populate('skills')
      .lean();
    
    // Get all skills associated with this user's certificates
    const skillIds = certificates.reduce((ids, cert) => {
      cert.skills.forEach(skill => {
        if (skill._id) {
          ids.add(skill._id.toString());
        }
      });
      return ids;
    }, new Set());
    
    const skills = await Skill.find({
      _id: { $in: Array.from(skillIds).map(id => mongoose.Types.ObjectId(id)) }
    }).lean();
    
    // Count certificates by status
    const certCounts = {
      total: certificates.length,
      verified: certificates.filter(c => c.verificationStatus === 'verified').length,
      pending: certificates.filter(c => c.verificationStatus === 'pending').length,
      rejected: certificates.filter(c => c.verificationStatus === 'rejected').length
    };
    
    // Count certificates by issuer
    const certsByIssuer = certificates.reduce((acc, cert) => {
      const issuer = cert.issuer || 'Unknown';
      acc[issuer] = (acc[issuer] || 0) + 1;
      return acc;
    }, {});
    
    // Count certificates by month
    const certsByMonth = certificates.reduce((acc, cert) => {
      const date = new Date(cert.issueDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate skill distribution by category
    const skillDistribution = skills.reduce((acc, skill) => {
      const category = skill.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate average skill level
    const avgSkillLevel = skills.length > 0
      ? skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length
      : 1;
    
    // Update user's summary analytics
    user.analytics.totalCertificates = certCounts.total;
    user.analytics.verifiedCertificates = certCounts.verified;
    user.analytics.skillsCount = skills.length;
    user.analytics.avgSkillLevel = avgSkillLevel;
    user.analytics.lastUpdated = new Date();
    
    // Store skill distribution in user record
    user.skillDistribution = skillDistribution;
    
    await user.save();
    
    // Update or create detailed analytics record
    let analytics = await UserAnalytics.findOne({ user: userId });
    
    if (!analytics) {
      analytics = new UserAnalytics({
        user: userId,
        skillProgress: [],
        certificateStats: {
          totalCount: certCounts.total,
          verifiedCount: certCounts.verified,
          pendingCount: certCounts.pending,
          rejectedCount: certCounts.rejected,
          byIssuer: certsByIssuer,
          byMonth: certsByMonth
        }
      });
    } else {
      analytics.certificateStats = {
        totalCount: certCounts.total,
        verifiedCount: certCounts.verified,
        pendingCount: certCounts.pending,
        rejectedCount: certCounts.rejected,
        byIssuer: certsByIssuer,
        byMonth: certsByMonth
      };
    }
    
    // Update skill progress records
    const updatedSkillProgress = [];
    
    for (const skill of skills) {
      const skillCerts = certificates.filter(cert => 
        cert.skills.some(s => s._id && s._id.toString() === skill._id.toString())
      );
      
      // Find existing record or create new one
      const existingRecord = analytics.skillProgress.find(
        sp => sp.skill && sp.skill.toString() === skill._id.toString()
      );
      
      if (existingRecord) {
        // Update existing record
        existingRecord.history.push({
          date: new Date(),
          level: skill.level,
          certificates: skillCerts.length
        });
        
        // Calculate growth rate (simple version)
        if (existingRecord.history.length > 1) {
          const oldestRecord = existingRecord.history[0];
          const newestRecord = existingRecord.history[existingRecord.history.length - 1];
          const daysDiff = Math.max(1, Math.floor((newestRecord.date - oldestRecord.date) / (1000 * 60 * 60 * 24)));
          const levelDiff = newestRecord.level - oldestRecord.level;
          
          existingRecord.growthRate = (levelDiff / daysDiff) * 30; // monthly growth rate
        }
        
        existingRecord.lastUpdated = new Date();
        updatedSkillProgress.push(existingRecord);
      } else {
        // Create new record
        updatedSkillProgress.push({
          skill: skill._id,
          history: [{
            date: new Date(),
            level: skill.level,
            certificates: skillCerts.length
          }],
          growthRate: 0,
          lastUpdated: new Date()
        });
      }
    }
    
    analytics.skillProgress = updatedSkillProgress;
    
    // Analyze patterns and generate learning patterns
    const learningPatterns = analyzeLearningPatterns(certificates, skills);
    analytics.learningPatterns = learningPatterns;
    
    // Generate recommendations
    const recommendations = generateRecommendations(certificates, skills, learningPatterns);
    analytics.recommendations = recommendations;
    
    await analytics.save();
    
    return {
      analytics,
      userSummary: user.analytics
    };
  } catch (error) {
    console.error('Error generating user analytics:', error);
    throw new Error('Failed to generate user analytics');
  }
};

/**
 * Analyzes user's learning patterns
 * @param {Array} certificates - User's certificates
 * @param {Array} skills - User's skills
 * @returns {Object} - Learning pattern analysis
 */
const analyzeLearningPatterns = (certificates, skills) => {
  // Default patterns
  const patterns = {
    preferredCategories: [],
    learningPace: 'steady',
    consistencyScore: 50,
    focusAreas: []
  };
  
  if (certificates.length === 0) return patterns;
  
  // Sort certificates by date
  const sortedCerts = [...certificates].sort((a, b) => new Date(a.issueDate) - new Date(b.issueDate));
  
  // Calculate time between certificates (in days)
  const timeBetweenCerts = [];
  for (let i = 1; i < sortedCerts.length; i++) {
    const prevDate = new Date(sortedCerts[i - 1].issueDate);
    const currDate = new Date(sortedCerts[i].issueDate);
    const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
    timeBetweenCerts.push(daysDiff);
  }
  
  // Determine learning pace based on average time between certificates
  if (timeBetweenCerts.length > 0) {
    const avgDays = timeBetweenCerts.reduce((sum, days) => sum + days, 0) / timeBetweenCerts.length;
    
    if (avgDays < 15) {
      patterns.learningPace = 'fast';
    } else if (avgDays > 60) {
      patterns.learningPace = 'slow';
    } else {
      patterns.learningPace = 'steady';
    }
    
    // Calculate standard deviation to determine if variable pace
    if (timeBetweenCerts.length > 2) {
      const avgTimeSquaredDiff = timeBetweenCerts.reduce((sum, days) => {
        return sum + Math.pow(days - avgDays, 2);
      }, 0) / timeBetweenCerts.length;
      const stdDev = Math.sqrt(avgTimeSquaredDiff);
      
      // If standard deviation is more than twice the average, consider it variable
      if (stdDev > avgDays * 1.5) {
        patterns.learningPace = 'variable';
      }
    }
    
    // Calculate consistency score (inverse of variability)
    const maxStdDev = avgDays * 2; // Theoretical maximum standard deviation we care about
    const normalizedStdDev = Math.min(stdDev, maxStdDev) / maxStdDev;
    patterns.consistencyScore = Math.round((1 - normalizedStdDev) * 100);
  }
  
  // Determine preferred categories
  const categoryCount = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  // Sort categories by count
  patterns.preferredCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);
  
  // Determine focus areas based on skill levels
  const skillsByLevel = [...skills].sort((a, b) => b.level - a.level);
  patterns.focusAreas = skillsByLevel
    .slice(0, 5)
    .map(skill => skill.name);
  
  return patterns;
};

/**
 * Generates personalized recommendations for the user
 * @param {Array} certificates - User's certificates
 * @param {Array} skills - User's skills
 * @param {Object} learningPatterns - User's learning patterns
 * @returns {Array} - Recommendations
 */
const generateRecommendations = (certificates, skills, learningPatterns) => {
  const recommendations = [];
  
  // Skill recommendations based on popular categories
  const popularCategories = [
    'Programming', 'Web Development', 'Data Science', 'Cloud Computing',
    'Design', 'Marketing', 'Business', 'Leadership', 'Soft Skills'
  ];
  
  // Common skill pairs (skills that go well together)
  const skillPairs = {
    'React': ['Redux', 'TypeScript', 'Next.js', 'GraphQL'],
    'JavaScript': ['TypeScript', 'React', 'Node.js', 'Vue.js'],
    'Python': ['Django', 'Flask', 'Data Science', 'Machine Learning'],
    'Java': ['Spring Boot', 'Hibernate', 'Microservices'],
    'AWS': ['Docker', 'Kubernetes', 'Terraform'],
    'SQL': ['Database Design', 'PostgreSQL', 'MongoDB'],
    'Data Science': ['Machine Learning', 'Python', 'Statistics']
  };
  
  // Get user's skill names
  const userSkillNames = skills.map(s => s.name);
  
  // Recommend skills based on pairs
  for (const skill of skills) {
    if (skillPairs[skill.name]) {
      const recommendations = skillPairs[skill.name].filter(s => !userSkillNames.includes(s));
      
      for (const rec of recommendations.slice(0, 2)) {
        recommendations.push({
          type: 'skill',
          name: rec,
          reason: `Pairs well with your ${skill.name} skill`,
          priority: 8,
          generated: new Date()
        });
      }
    }
  }
  
  // Recommend based on preferred categories
  if (learningPatterns.preferredCategories.length > 0) {
    const category = learningPatterns.preferredCategories[0];
    
    // Placeholder for category-specific recommendations
    const categoryRecommendations = {
      'Programming': ['Python', 'JavaScript', 'Java', 'C#', 'Go'],
      'Web Development': ['React', 'Angular', 'Vue.js', 'Node.js', 'Full Stack'],
      'Data Science': ['Python for Data Science', 'R Programming', 'SQL', 'Data Visualization'],
      'Cloud Computing': ['AWS', 'Azure', 'Google Cloud', 'Cloud Architecture'],
      'Design': ['UI/UX', 'Figma', 'Adobe XD', 'Graphic Design'],
      'Marketing': ['Digital Marketing', 'SEO', 'Content Marketing', 'Social Media'],
      'Business': ['Project Management', 'Agile', 'Business Analysis'],
      'Leadership': ['Management', 'Team Leadership', 'Communication'],
      'Soft Skills': ['Public Speaking', 'Time Management', 'Critical Thinking']
    };
    
    if (categoryRecommendations[category]) {
      const potentialRecs = categoryRecommendations[category].filter(
        rec => !userSkillNames.includes(rec)
      );
      
      for (const rec of potentialRecs.slice(0, 2)) {
        recommendations.push({
          type: 'skill',
          name: rec,
          reason: `Based on your interest in ${category}`,
          priority: 7,
          generated: new Date()
        });
      }
    }
  }
  
  // Recommend practice for skills that haven't been updated recently
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const oldSkills = skills.filter(skill => {
    const relatedCerts = certificates.filter(
      cert => cert.skills.some(s => s._id && s._id.toString() === skill._id.toString())
    );
    
    if (relatedCerts.length === 0) return false;
    
    const latestCert = relatedCerts.sort(
      (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
    )[0];
    
    return new Date(latestCert.issueDate) < sixMonthsAgo;
  });
  
  for (const skill of oldSkills.slice(0, 2)) {
    recommendations.push({
      type: 'practice',
      name: skill.name,
      reason: `You haven't updated this skill in over 6 months`,
      priority: 9,
      generated: new Date()
    });
  }
  
  // Recommend courses based on skill levels
  const beginnersSkills = skills.filter(s => s.level <= 3).slice(0, 2);
  
  for (const skill of beginnersSkills) {
    recommendations.push({
      type: 'course',
      name: `Advanced ${skill.name}`,
      reason: `Improve your beginner-level ${skill.name} skills`,
      priority: 6,
      generated: new Date()
    });
  }
  
  return recommendations.slice(0, 10); // Limit to 10 recommendations
};

/**
 * Generates a periodic report for the user
 * @param {string} userId - User ID
 * @param {string} period - Period type ('weekly', 'monthly', 'quarterly', 'yearly')
 * @returns {Promise<Object>} - Generated report
 */
export const generatePeriodicReport = async (userId, period = 'monthly') => {
  try {
    // Get analytics for the user
    const analytics = await UserAnalytics.findOne({ user: userId });
    if (!analytics) {
      throw new Error('Analytics not found for user');
    }
    
    // Determine date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1); // Default to monthly
    }
    
    // Get certificates for this period
    const newCertificates = await Certificate.find({
      user: userId,
      issueDate: { $gte: startDate }
    });
    
    // Get skills updated during this period
    const skillIds = new Set();
    newCertificates.forEach(cert => {
      cert.skills.forEach(skillId => skillIds.add(skillId.toString()));
    });
    
    const skills = await Skill.find({
      _id: { $in: Array.from(skillIds).map(id => mongoose.Types.ObjectId(id)) }
    });
    
    // Generate metrics
    const metrics = {
      newCertificates: newCertificates.length,
      skillsUpdated: skills.length,
      topIssuers: [],
      skillProgress: []
    };
    
    // Top issuers
    const issuerCount = newCertificates.reduce((acc, cert) => {
      const issuer = cert.issuer || 'Unknown';
      acc[issuer] = (acc[issuer] || 0) + 1;
      return acc;
    }, {});
    
    metrics.topIssuers = Object.entries(issuerCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issuer, count]) => ({ issuer, count }));
    
    // Skill progress
    for (const skill of skills) {
      const skillProgress = analytics.skillProgress.find(
        sp => sp.skill && sp.skill.toString() === skill._id.toString()
      );
      
      if (skillProgress && skillProgress.history.length >= 2) {
        const oldestInPeriod = skillProgress.history
          .filter(h => h.date >= startDate)
          .sort((a, b) => a.date - b.date)[0];
        
        const latest = skillProgress.history
          .sort((a, b) => b.date - a.date)[0];
        
        if (oldestInPeriod && latest && latest.level !== oldestInPeriod.level) {
          metrics.skillProgress.push({
            skillName: skill.name,
            levelChange: latest.level - oldestInPeriod.level,
            currentLevel: latest.level
          });
        }
      }
    }
    
    // Generate highlights
    const highlights = [];
    
    if (newCertificates.length > 0) {
      highlights.push(`You earned ${newCertificates.length} new certificate${newCertificates.length > 1 ? 's' : ''} in this period`);
    }
    
    if (metrics.skillProgress.length > 0) {
      const improvedSkills = metrics.skillProgress.filter(s => s.levelChange > 0);
      if (improvedSkills.length > 0) {
        highlights.push(`You improved in ${improvedSkills.length} skill${improvedSkills.length > 1 ? 's' : ''}`);
      }
    }
    
    if (metrics.topIssuers.length > 0) {
      highlights.push(`Your top certification provider was ${metrics.topIssuers[0].issuer}`);
    }
    
    // Generate recommendations
    const recommendations = [
      'Continue your learning streak to earn more points',
      'Complete your profile to showcase your skills better',
      'Connect your certificates to skills for better analytics'
    ];
    
    // Create report
    const report = {
      period,
      startDate,
      endDate: now,
      highlights,
      metrics,
      recommendations,
      generatedAt: now
    };
    
    // Add to analytics
    analytics.reports.push(report);
    await analytics.save();
    
    return report;
  } catch (error) {
    console.error('Error generating periodic report:', error);
    throw new Error('Failed to generate periodic report');
  }
};

export default {
  generateUserAnalytics,
  generatePeriodicReport
}; 