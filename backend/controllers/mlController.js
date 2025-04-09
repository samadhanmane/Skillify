import Certificate from '../models/Certificate.js';
import VerificationResult from '../models/VerificationResult.js';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import {
  extractTextFromImage,
  analyzeImageIntegrity,
  verifyCertificate,
  verifyAgainstIssuerDatabase,
  enhancedGptVerification,
  analyzeSkills
} from '../utils/ml.js';
import analytics from '../utils/analytics.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';
import Recommendation from '../models/Recommendation.js';
import UserSkill from '../models/UserSkill.js';
import { 
  awardCertificatePoints, 
  logAchievement 
} from '../utils/gamification.js';

/**
 * @desc    Verify a certificate using ML
 * @route   POST /api/ml/verify-certificate/:id
 * @access  Private
 */
export const verifyUserCertificate = catchAsync(async (req, res) => {
  const certificateId = req.params.id;
  
  // Get certificate
  const certificate = await Certificate.findById(certificateId);
  if (!certificate) {
    return res.status(404).json({
      success: false,
      message: 'Certificate not found'
    });
  }
  
  // Check if user has permission
  if (certificate.user.toString() !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to verify this certificate'
    });
  }
  
  // Check if certificate has an image
  if (!certificate.certificateImage) {
    return res.status(400).json({
      success: false,
      message: 'Certificate has no image to verify'
    });
  }
  
  // Extract text from certificate image
  const extractedText = await extractTextFromImage(certificate.certificateImage);
  
  // Store extracted text in certificate
  certificate.extractedText = extractedText;
  
  // Verify certificate
  const verificationResult = await verifyCertificate(extractedText, {
    title: certificate.title,
    issuer: certificate.issuer,
    issueDate: certificate.issueDate,
    credentialID: certificate.credentialID,
    credentialURL: certificate.credentialURL,
    holderName: req.user.name
  });
  
  // Update certificate status
  certificate.verificationStatus = verificationResult.aiDecision === 'verified' 
    ? 'verified' 
    : (verificationResult.aiDecision === 'rejected' ? 'rejected' : 'pending');
  
  certificate.verificationScore = verificationResult.confidenceScore;
  
  // Save certificate
  await certificate.save();
  
  // Create verification result record
  const newVerificationResult = new VerificationResult({
    certificate: certificateId,
    user: req.user.id,
    ocrText: extractedText,
    confidenceScore: verificationResult.confidenceScore,
    verificationDetails: verificationResult.verificationDetails,
    aiDecision: verificationResult.aiDecision,
    verificationHistory: [{
      status: verificationResult.aiDecision === 'verified' ? 'verified' : 
        (verificationResult.aiDecision === 'rejected' ? 'rejected' : 'needs_review'),
      timestamp: new Date(),
      notes: `Automatic verification with confidence score: ${verificationResult.confidenceScore}%`
    }]
  });
  
  await newVerificationResult.save();
  
  // Award points for verifying a certificate if it was verified
  if (certificate.verificationStatus === 'verified') {
    await awardCertificatePoints(req.user.id, certificate._id, 'verify');
    
    // Log an achievement
    await logAchievement(req.user.id, {
      type: 'certificate_verified',
      details: `Verified certificate: ${certificate.title}`,
      timestamp: new Date()
    });
  }
  
  // Update user analytics
  await analytics.generateUserAnalytics(req.user.id);
  
  return res.status(200).json({
    success: true,
    verificationResult: {
      status: certificate.verificationStatus,
      score: certificate.verificationScore,
      details: verificationResult.verificationDetails,
      extractedText
    }
  });
});

/**
 * @desc    Analyze user skills
 * @route   GET /api/ml/analyze-skills
 * @access  Private
 */
export const analyzeUserSkills = catchAsync(async (req, res) => {
  // Get user's certificates
  const certificates = await Certificate.find({ user: req.user.id })
    .populate('skills')
    .lean();
  
  // Get user's skills
  const skills = await Skill.find({
    _id: { $in: certificates.reduce((ids, cert) => [...ids, ...cert.skills.map(s => s._id)], []) }
  }).lean();
  
  // Analyze skills
  const skillAnalysis = await analyzeSkills(skills, certificates);
  
  // Generate updated analytics
  await analytics.generateUserAnalytics(req.user.id);
  
  return res.status(200).json({
    success: true,
    analysis: skillAnalysis
  });
});

/**
 * @desc    Get skill recommendations
 * @route   GET /api/ml/recommendations
 * @access  Private
 */
export const getRecommendations = catchAsync(async (req, res) => {
  // Get user analytics
  const analyticsData = await analytics.generateUserAnalytics(req.user.id);
  
  if (!analyticsData || !analyticsData.analytics || !analyticsData.analytics.recommendations) {
    return res.status(200).json({
      success: true,
      recommendations: []
    });
  }
  
  // Return recommendations
  return res.status(200).json({
    success: true,
    recommendations: analyticsData.analytics.recommendations
  });
});

/**
 * @desc    Batch verify certificates
 * @route   POST /api/ml/verify-batch
 * @access  Private
 */
export const verifyBatchCertificates = catchAsync(async (req, res) => {
  const { certificateIds } = req.body;
  
  if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No certificate IDs provided'
    });
  }
  
  // Verify each certificate
  const results = [];
  
  for (const id of certificateIds) {
    try {
      // Get certificate
      const certificate = await Certificate.findById(id);
      
      if (!certificate) {
        results.push({
          id,
          success: false,
          message: 'Certificate not found'
        });
        continue;
      }
      
      // Check permission
      if (certificate.user.toString() !== req.user.id && !req.user.isAdmin) {
        results.push({
          id,
          success: false,
          message: 'Not authorized'
        });
        continue;
      }
      
      // Check for image
      if (!certificate.certificateImage) {
        results.push({
          id,
          success: false,
          message: 'No image to verify'
        });
        continue;
      }
      
      // Extract text and verify
      const extractedText = await extractTextFromImage(certificate.certificateImage);
      certificate.extractedText = extractedText;
      
      const verificationResult = await verifyCertificate(extractedText, {
        title: certificate.title,
        issuer: certificate.issuer,
        issueDate: certificate.issueDate,
        credentialID: certificate.credentialID
      });
      
      // Update certificate
      certificate.verificationStatus = verificationResult.aiDecision === 'verified' 
        ? 'verified' 
        : (verificationResult.aiDecision === 'rejected' ? 'rejected' : 'pending');
      
      certificate.verificationScore = verificationResult.confidenceScore;
      
      await certificate.save();
      
      // Create verification record
      await VerificationResult.create({
        certificate: id,
        user: req.user.id,
        ocrText: extractedText,
        confidenceScore: verificationResult.confidenceScore,
        verificationDetails: verificationResult.verificationDetails,
        aiDecision: verificationResult.aiDecision,
        verificationHistory: [{
          status: verificationResult.aiDecision === 'verified' ? 'verified' : 
            (verificationResult.aiDecision === 'rejected' ? 'rejected' : 'needs_review'),
          timestamp: new Date(),
          notes: `Batch verification with confidence score: ${verificationResult.confidenceScore}%`
        }]
      });
      
      results.push({
        id,
        success: true,
        status: certificate.verificationStatus,
        score: certificate.verificationScore
      });
    } catch (error) {
      console.error(`Error verifying certificate ${id}:`, error);
      results.push({
        id,
        success: false,
        message: error.message || 'Failed to verify certificate'
      });
    }
  }
  
  // Update user analytics
  await analytics.generateUserAnalytics(req.user.id);
  
  return res.status(200).json({
    success: true,
    results
  });
});

/**
 * Verify a certificate using OCR and ML
 * @route POST /api/ml/verify-certificate
 */
export const verifyNewCertificate = async (req, res) => {
  try {
    // Always enable issuer database verification for enhanced security
    const { imageUrl } = req.body;
    // Set checkIssuerDatabase to true regardless of what was provided
    const checkIssuerDatabase = true;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate image URL is required' 
      });
    }
    
    // Extract metadata from request
    const certificateData = {
      title: req.body.title || '',
      issuer: req.body.issuer || '',
      issueDate: req.body.issueDate || '',
      credentialID: req.body.credentialID || '',
      credentialURL: req.body.credentialURL || '',
      holderName: req.body.holderName || req.user?.name || ''
    };
    
    // Validate required fields for optimal verification
    if (!certificateData.credentialURL) {
      return res.status(400).json({
        success: false,
        message: 'Credential URL is required for accurate verification'
      });
    }
    
    // Extract text from image
    console.log('Extracting text from certificate image...');
    const extractedText = await extractTextFromImage(imageUrl);
    
    if (!extractedText || extractedText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from certificate image. Please provide a clearer image.'
      });
    }
    
    console.log('Text extracted successfully, proceeding with verification...');
    
    // Analyze image integrity if possible
    let imageIntegrityAnalysis = null;
    
    // Perform image integrity analysis if it's a local file
    if (imageUrl.startsWith('/') || imageUrl.startsWith('./') || imageUrl.startsWith('../')) {
      try {
        imageIntegrityAnalysis = await analyzeImageIntegrity(imageUrl);
      } catch (error) {
        console.warn('Image integrity analysis failed:', error.message);
      }
    }
    
    // Use enhanced GPT-4 verification
    const verificationResult = await enhancedGptVerification(
      extractedText, 
      certificateData,
      imageIntegrityAnalysis
    );
    
    // Always check against issuer database for enhanced security
    let issuerDatabaseResult = null;
    
    try {
      issuerDatabaseResult = await verifyAgainstIssuerDatabase(certificateData);
      
      // If database check was successful, adjust confidence score
      if (issuerDatabaseResult.issuerVerified) {
        verificationResult.confidenceScore = Math.min(
          100, 
          verificationResult.confidenceScore + 15
        );
        
        // Update decision if database verification succeeded
        if (verificationResult.confidenceScore >= 75) {
          verificationResult.aiDecision = 'verified';
          verificationResult.reasoning = [
            ...verificationResult.reasoning || [],
            'Certificate validated against issuer database'
          ];
        }
      } else if (issuerDatabaseResult.databaseChecked && !issuerDatabaseResult.issuerVerified) {
        // If database check failed, reduce confidence score
        verificationResult.confidenceScore = Math.max(
          0, 
          verificationResult.confidenceScore - 20
        );
        
        // Update decision if database verification failed
        if (verificationResult.confidenceScore <= 40) {
          verificationResult.aiDecision = 'rejected';
          verificationResult.redFlags = [
            ...verificationResult.redFlags || [],
            'Certificate verification failed against issuer database'
          ];
        }
      }
    } catch (error) {
      console.error('Error verifying against issuer database:', error);
    }
    
    // Format response
    return res.status(200).json({
      success: true,
      verification: {
        extractedText,
        verificationResult,
        issuerDatabaseResult,
        imageIntegrityAnalysis,
        aiDecision: verificationResult.aiDecision,
        confidenceScore: verificationResult.confidenceScore,
        reasoning: verificationResult.reasoning || verificationResult.aiReasoningDetails,
        redFlags: verificationResult.redFlags || [],
        enhancedVerification: verificationResult.enhancedVerification || false
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Certificate verification failed',
      error: error.message
    });
  }
};

/**
 * Bulk verify multiple certificates
 * @route POST /api/ml/bulk-verify
 */
export const bulkVerifyCertificates = async (req, res) => {
  const { certificateIds } = req.body;
  
  if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Certificate IDs are required' 
    });
  }
  
  const results = [];
  
  for (const id of certificateIds) {
    try {
      // Get certificate
      const certificate = await Certificate.findOne({
        _id: id,
        user: req.user.id
      });
      
      if (!certificate) {
        results.push({
          id,
          success: false,
          message: 'Certificate not found'
        });
        continue;
      }
      
      // Check for image
      if (!certificate.certificateImage) {
        results.push({
          id,
          success: false,
          message: 'No image to verify'
        });
        continue;
      }
      
      // Extract text and verify
      const extractedText = await extractTextFromImage(certificate.certificateImage);
      certificate.extractedText = extractedText;
      
      const verificationResult = await verifyCertificate(extractedText, {
        title: certificate.title,
        issuer: certificate.issuer,
        issueDate: certificate.issueDate,
        credentialID: certificate.credentialID
      });
      
      // Get previous verification status to check if this is a new verification
      const previousStatus = certificate.verificationStatus;
      
      // Update certificate
      certificate.verificationStatus = verificationResult.aiDecision === 'verified' 
        ? 'verified' 
        : (verificationResult.aiDecision === 'rejected' ? 'rejected' : 'pending');
      
      certificate.verificationScore = verificationResult.confidenceScore;
      
      await certificate.save();
      
      // Create verification record
      await VerificationResult.create({
        certificate: id,
        user: req.user.id,
        ocrText: extractedText,
        confidenceScore: verificationResult.confidenceScore,
        verificationDetails: verificationResult.verificationDetails,
        aiDecision: verificationResult.aiDecision,
        verificationHistory: [{
          status: verificationResult.aiDecision === 'verified' ? 'verified' : 
            (verificationResult.aiDecision === 'rejected' ? 'rejected' : 'needs_review'),
          timestamp: new Date(),
          notes: `Batch verification with confidence score: ${verificationResult.confidenceScore}%`
        }]
      });
      
      // Award points if certificate was verified (and wasn't previously verified)
      if (certificate.verificationStatus === 'verified' && previousStatus !== 'verified') {
        await awardCertificatePoints(req.user.id, id, 'verify');
        
        // If verification score is 100%, award perfect verification achievement
        if (certificate.verificationScore >= 95) {
          await logAchievement(req.user.id, {
            type: 'perfect_verification',
            details: `Perfect verification score on certificate: ${certificate.title}`
          });
        }
      }
      
      results.push({
        id,
        success: true,
        status: certificate.verificationStatus,
        score: certificate.verificationScore
      });
    } catch (error) {
      console.error(`Error verifying certificate ${id}:`, error);
      results.push({
        id,
        success: false,
        message: error.message || 'Failed to verify certificate'
      });
    }
  }
  
  // Update user analytics
  await analytics.generateUserAnalytics(req.user.id);
  
  return res.status(200).json({
    success: true,
    results
  });
};

/**
 * Helper function to map a skill to a category
 */
const getSkillCategory = (skillName) => {
  const categories = {
    'JavaScript': 'Web Development',
    'Python': 'Programming',
    'Java': 'Programming',
    'React': 'Web Development',
    'Angular': 'Web Development',
    'Vue': 'Web Development',
    'Node.js': 'Web Development',
    'Express': 'Web Development',
    'MongoDB': 'Database',
    'SQL': 'Database',
    'AWS': 'Cloud Computing',
    'Azure': 'Cloud Computing',
    'Google Cloud': 'Cloud Computing',
    'DevOps': 'DevOps',
    'Machine Learning': 'Data Science',
    'Data Science': 'Data Science',
    'UX/UI': 'Design',
    'Design': 'Design',
    'Project Management': 'Management',
    'Agile': 'Management',
    'Scrum': 'Management',
    'Leadership': 'Soft Skills',
    'Communication': 'Soft Skills'
  };
  
  return categories[skillName] || 'Other';
};

/**
 * Helper function to map skill level to difficulty
 */
const getLevelDifficulty = (level) => {
  if (level <= 1) return 'Beginner';
  if (level <= 3) return 'Intermediate';
  if (level <= 5) return 'Advanced';
  return 'Expert';
};

/**
 * Calculate average skill level
 */
const calculateAverageLevel = (skillLevels) => {
  if (!skillLevels || skillLevels.length === 0) return 0;
  
  const sum = skillLevels.reduce((total, skill) => total + skill.level, 0);
  return Math.round((sum / skillLevels.length) * 10) / 10; // Round to 1 decimal place
};

/**
 * Determine certificate security level based on verification results
 */
const determineCertificateSecurityLevel = (verificationResult, issuerVerification) => {
  if (!verificationResult) return 'unknown';
  
  const { confidenceScore, imageIntegrityScore } = verificationResult;
  const issuerVerified = issuerVerification?.issuerVerified || false;
  
  // High security: High confidence + image integrity + issuer verification
  if (confidenceScore >= 90 && imageIntegrityScore >= 90 && issuerVerified) {
    return 'high';
  }
  
  // Medium-High: Good confidence + either image integrity or issuer verification
  if (confidenceScore >= 80 && (imageIntegrityScore >= 80 || issuerVerified)) {
    return 'medium-high';
  }
  
  // Medium: Moderate confidence or good confidence without other validations
  if (confidenceScore >= 70 || (confidenceScore >= 80 && !issuerVerified && (!imageIntegrityScore || imageIntegrityScore < 80))) {
    return 'medium';
  }
  
  // Low: Low confidence but not rejected
  if (confidenceScore >= 50) {
    return 'low';
  }
  
  // Questionable: Very low confidence
  return 'questionable';
};

/**
 * Generate human-readable verification summary
 */
const generateVerificationSummary = (verificationResult, issuerVerification) => {
  if (!verificationResult) {
    return 'No verification performed';
  }
  
  const { confidenceScore, aiDecision, aiReasoningDetails } = verificationResult;
  
  let summary = '';
  
  switch (aiDecision) {
    case 'verified':
      summary = `Certificate appears to be authentic (${confidenceScore}% confidence).`;
      break;
    case 'rejected':
      summary = `Certificate appears to be invalid (${confidenceScore}% confidence).`;
      break;
    case 'needs_review':
      summary = `Certificate requires manual review (${confidenceScore}% confidence).`;
      break;
    default:
      summary = 'Verification was inconclusive.';
  }
  
  // Add reasoning if available
  if (aiReasoningDetails && aiReasoningDetails.length > 0) {
    summary += ` Reasoning: ${aiReasoningDetails.join(', ')}.`;
  }
  
  // Add issuer verification if available
  if (issuerVerification) {
    if (issuerVerification.issuerVerified) {
      summary += ' Certificate has been verified with the issuer database.';
    } else if (issuerVerification.databaseChecked) {
      summary += ' Certificate could not be verified with the issuer database.';
    }
  }
  
  return summary;
};

export default {
  verifyUserCertificate,
  analyzeUserSkills,
  getRecommendations,
  verifyBatchCertificates,
  verifyNewCertificate,
  bulkVerifyCertificates
};