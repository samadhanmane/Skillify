import User from '../models/User.js';
import UserAnalytics from '../models/UserAnalytics.js';
import Skill from '../models/Skill.js';
import analytics from '../utils/analytics.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

/**
 * @desc    Get user analytics dashboard data
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
export const getDashboardData = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Generate analytics if they don't exist
  const analyticsData = await analytics.generateUserAnalytics(userId);
  
  // Get user with analytics
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Get detailed analytics
  const userAnalytics = await UserAnalytics.findOne({ user: userId });
  
  // Prepare dashboard data
  const dashboardData = {
    summary: {
      totalCertificates: user.analytics.totalCertificates || 0,
      verifiedCertificates: user.analytics.verifiedCertificates || 0,
      skillsCount: user.analytics.skillsCount || 0,
      avgSkillLevel: user.analytics.avgSkillLevel || 1,
      points: user.points || 0,
      level: user.level || 1,
      streak: user.learningStreak?.current || 0
    },
    skillDistribution: user.skillDistribution || {},
    certificateStats: userAnalytics?.certificateStats || {
      totalCount: 0,
      verifiedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      byIssuer: {},
      byMonth: {}
    },
    learningPatterns: userAnalytics?.learningPatterns || {
      preferredCategories: [],
      learningPace: 'steady',
      consistencyScore: 50,
      focusAreas: []
    },
    topRecommendations: (userAnalytics?.recommendations || [])
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
  };
  
  return res.status(200).json({
    success: true,
    dashboardData
  });
});

/**
 * @desc    Get user skill progress data
 * @route   GET /api/analytics/skills-progress
 * @access  Private
 */
export const getSkillsProgressData = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Get user analytics
  const userAnalytics = await UserAnalytics.findOne({ user: userId });
  if (!userAnalytics) {
    // Generate analytics if they don't exist
    await analytics.generateUserAnalytics(userId);
    userAnalytics = await UserAnalytics.findOne({ user: userId });
  }
  
  if (!userAnalytics) {
    return res.status(404).json({
      success: false,
      message: 'Analytics not found for user'
    });
  }
  
  // Extract skill progression data
  const skillProgress = userAnalytics.skillProgress || [];
  
  // Transform data for chart rendering
  const skillProgressForCharts = await Promise.all(skillProgress.map(async (sp) => {
    // Get skill name
    const skill = await Skill.findById(sp.skill);
    const skillName = skill ? skill.name : 'Unknown Skill';
    
    // Format history for time series chart
    const historyForChart = sp.history.map(h => ({
      date: h.date,
      level: h.level,
      certificates: h.certificates
    }));
    
    return {
      skillId: sp.skill,
      skillName,
      currentLevel: historyForChart.length > 0 ? 
        historyForChart[historyForChart.length - 1].level : 1,
      growthRate: sp.growthRate,
      history: historyForChart,
      certificateCount: historyForChart.length > 0 ?
        historyForChart[historyForChart.length - 1].certificates : 0
    };
  }));
  
  // Sort by current level
  skillProgressForCharts.sort((a, b) => b.currentLevel - a.currentLevel);
  
  return res.status(200).json({
    success: true,
    skillProgress: skillProgressForCharts
  });
});

/**
 * @desc    Get user analytics reports
 * @route   GET /api/analytics/reports
 * @access  Private
 */
export const getAnalyticsReports = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { period = 'monthly' } = req.query;
  
  // Validate period
  const validPeriods = ['weekly', 'monthly', 'quarterly', 'yearly'];
  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid period'
    });
  }
  
  // Get user analytics
  const userAnalytics = await UserAnalytics.findOne({ user: userId });
  
  // Generate a new report if needed
  let report;
  if (userAnalytics) {
    // Check if a recent report exists
    const recentReport = userAnalytics.reports.find(r => 
      r.period === period && 
      new Date(r.generatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
    );
    
    if (recentReport) {
      report = recentReport;
    } else {
      // Generate new report
      report = await analytics.generatePeriodicReport(userId, period);
    }
  } else {
    // Generate analytics and report
    await analytics.generateUserAnalytics(userId);
    report = await analytics.generatePeriodicReport(userId, period);
  }
  
  return res.status(200).json({
    success: true,
    report
  });
});

/**
 * @desc    Get recommendations for user
 * @route   GET /api/analytics/recommendations
 * @access  Private
 */
export const getRecommendations = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Get user analytics
  const userAnalytics = await UserAnalytics.findOne({ user: userId });
  if (!userAnalytics) {
    // Generate analytics if they don't exist
    await analytics.generateUserAnalytics(userId);
    userAnalytics = await UserAnalytics.findOne({ user: userId });
  }
  
  if (!userAnalytics || !userAnalytics.recommendations) {
    return res.status(200).json({
      success: true,
      recommendations: []
    });
  }
  
  // Get recommendations
  const recommendations = userAnalytics.recommendations;
  
  return res.status(200).json({
    success: true,
    recommendations
  });
});

/**
 * @desc    Manually trigger analytics update
 * @route   POST /api/analytics/update
 * @access  Private
 */
export const updateAnalytics = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Generate or update analytics
  const analyticsData = await analytics.generateUserAnalytics(userId);
  
  return res.status(200).json({
    success: true,
    message: 'Analytics updated successfully',
    summary: analyticsData.userSummary
  });
});

/**
 * @desc    Get user activity data for heatmap
 * @route   GET /api/analytics/activity
 * @access  Private
 */
export const getUserActivity = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  // Get user analytics
  const userAnalytics = await UserAnalytics.findOne({ user: userId });
  if (!userAnalytics || !userAnalytics.activityMetrics || !userAnalytics.activityMetrics.activityHeatmap) {
    return res.status(200).json({
      success: true,
      activityData: []
    });
  }
  
  // Convert heatmap to array format for visualization
  const activityHeatmap = userAnalytics.activityMetrics.activityHeatmap;
  const activityData = Object.entries(activityHeatmap).map(([date, count]) => ({
    date,
    count
  }));
  
  return res.status(200).json({
    success: true,
    activityData,
    activityMetrics: {
      totalLogins: userAnalytics.activityMetrics.loginCount || 0,
      averageSessionTime: userAnalytics.activityMetrics.averageSessionTime || 0,
      activeDays: userAnalytics.activityMetrics.activeDays || 0
    }
  });
});

export default {
  getDashboardData,
  getSkillsProgressData,
  getAnalyticsReports,
  getRecommendations,
  updateAnalytics,
  getUserActivity
}; 