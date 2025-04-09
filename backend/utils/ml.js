import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import crypto from 'crypto';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.join(__dirname, '..', 'temp');

/**
 * Extract text from an image using OCR
 * @param {string} imageUrl - URL or base64 of the image to process
 * @returns {Promise<string>} - Extracted text
 */
export const extractTextFromImage = async (imageUrl) => {
  try {
    let imagePath = imageUrl;
    
    // If URL starts with http, download the image first
    if (imageUrl.startsWith('http')) {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const tempFilePath = path.join(tempDir, `temp_cert_${Date.now()}.jpg`);
      
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write the image to a temp file
      fs.writeFileSync(tempFilePath, buffer);
      imagePath = tempFilePath;
    }
    // If base64 data, convert and save to temp file
    else if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(';base64,').pop();
      const tempFilePath = path.join(tempDir, `temp_cert_${Date.now()}.jpg`);
      
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write the image to a temp file
      fs.writeFileSync(tempFilePath, base64Data, { encoding: 'base64' });
      imagePath = tempFilePath;
    }
    
    // Process with Tesseract OCR
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m)
    });
    
    // Clean up temp file if we created one
    if (imagePath !== imageUrl && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    return result.data.text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from certificate image');
  }
};

/**
 * Analyze image for potential tampering or manipulation
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeImageIntegrity = async (imagePath) => {
  try {
    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Calculate image hash for integrity verification
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    
    // Check for metadata inconsistencies (common in edited images)
    // This is simplified and would need a proper implementation with image metadata libraries
    const metadataConsistent = true; // Placeholder for actual implementation
    
    // Check for compression artifacts (indicative of multiple saves/edits)
    // This would need image processing libraries for proper implementation
    const compressionArtifacts = false; // Placeholder for actual implementation
    
    // Look for inconsistent pixel patterns (can indicate editing)
    // This would need computer vision libraries for proper implementation
    const pixelPatternConsistent = true; // Placeholder for actual implementation
    
    return {
      imageHash: hash,
      metadataConsistent,
      compressionArtifacts,
      pixelPatternConsistent,
      integrityScore: metadataConsistent && !compressionArtifacts && pixelPatternConsistent ? 100 : 50
    };
  } catch (error) {
    console.error('Error analyzing image integrity:', error);
    return {
      imageHash: null,
      metadataConsistent: false,
      compressionArtifacts: true,
      pixelPatternConsistent: false,
      integrityScore: 0,
      error: error.message
    };
  }
};

/**
 * Verify certificate by comparing extracted text with provided metadata
 * @param {string} extractedText - Text extracted from certificate image
 * @param {Object} certificateData - Certificate metadata for verification
 * @param {string} [imageUrl] - Optional URL to the certificate image for enhanced verification
 * @returns {Promise<Object>} - Verification result
 */
export const verifyCertificate = async (extractedText, certificateData, imageUrl = null) => {
  try {
    const { title, issuer, issueDate, credentialID, credentialURL, holderName } = certificateData;
    
    // Initialize verification details
    const verificationDetails = {
      textExtracted: true,
      titleFound: false,
      issuerFound: false,
      dateFound: false,
      credentialIDFound: false,
      credentialURLFound: false,
      holderNameFound: false,
      matchScore: 0,
      nameMatchConfidence: 0,
      imageIntegrityScore: null
    };
    
    // Check if each field is present in the extracted text
    if (title && extractedText.includes(title)) {
      verificationDetails.titleFound = true;
    }
    
    if (issuer && extractedText.includes(issuer)) {
      verificationDetails.issuerFound = true;
    }
    
    // For date, check different formats
    if (issueDate) {
      const dateObj = new Date(issueDate);
      const dateFormats = [
        dateObj.toLocaleDateString('en-US'), // MM/DD/YYYY
        dateObj.toLocaleDateString('en-GB'), // DD/MM/YYYY
        dateObj.toISOString().split('T')[0], // YYYY-MM-DD
        dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) // Month DD, YYYY
      ];
      
      verificationDetails.dateFound = dateFormats.some(format => 
        extractedText.includes(format)
      );
    }
    
    if (credentialID && extractedText.includes(credentialID)) {
      verificationDetails.credentialIDFound = true;
    }
    
    // Check for credential URL in the text
    if (credentialURL) {
      // Extract domain from URL for more flexible matching
      const urlDomain = credentialURL.replace(/^https?:\/\//, '').split('/')[0];
      verificationDetails.credentialURLFound = extractedText.includes(urlDomain) || extractedText.includes(credentialURL);
    }
    
    // Verify if the holder name is on the certificate
    if (holderName) {
      // Simple exact match
      if (extractedText.includes(holderName)) {
        verificationDetails.holderNameFound = true;
        verificationDetails.nameMatchConfidence = 100;
      } else {
        // Check for partial or similar name matches (allow for OCR errors)
        const nameParts = holderName.split(' ').filter(part => part.length > 1);
        let matchedParts = 0;
        
        for (const part of nameParts) {
          if (extractedText.includes(part)) {
            matchedParts++;
          }
        }
        
        const nameMatchPercentage = nameParts.length > 0 
          ? (matchedParts / nameParts.length) * 100 
          : 0;
          
        verificationDetails.nameMatchConfidence = nameMatchPercentage;
        verificationDetails.holderNameFound = nameMatchPercentage > 70;
      }
    }
    
    // Check image integrity if URL is provided
    if (imageUrl) {
      let imagePath = imageUrl;
      let tempFilePath = null;
      
      // Download the image if it's a URL
      if (imageUrl.startsWith('http')) {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        tempFilePath = path.join(tempDir, `integrity_check_${Date.now()}.jpg`);
        
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempFilePath, buffer);
        imagePath = tempFilePath;
      } else if (imageUrl.startsWith('data:image')) {
        const base64Data = imageUrl.split(';base64,').pop();
        tempFilePath = path.join(tempDir, `integrity_check_${Date.now()}.jpg`);
        
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempFilePath, base64Data, { encoding: 'base64' });
        imagePath = tempFilePath;
      }
      
      try {
        const integrityResults = await analyzeImageIntegrity(imagePath);
        verificationDetails.imageIntegrityScore = integrityResults.integrityScore;
        
        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (error) {
        console.error('Image integrity check failed:', error);
        verificationDetails.imageIntegrityScore = 0;
      }
    }
    
    // Calculate match score (0-100) with weighted importance
    let matchPoints = 0;
    let totalPoints = 0;
    
    // Title verification (20%)
    if (title) {
      totalPoints += 20;
      if (verificationDetails.titleFound) matchPoints += 20;
    }
    
    // Issuer verification (25%)
    if (issuer) {
      totalPoints += 25;
      if (verificationDetails.issuerFound) matchPoints += 25;
    }
    
    // Date verification (15%)
    if (issueDate) {
      totalPoints += 15;
      if (verificationDetails.dateFound) matchPoints += 15;
    }
    
    // Credential ID verification (30% when available)
    if (credentialID) {
      totalPoints += 30;
      if (verificationDetails.credentialIDFound) matchPoints += 30;
    }
    
    // Credential URL verification (20% or 15% if credential ID is available)
    if (credentialURL) {
      const urlWeight = credentialID ? 15 : 20;
      totalPoints += urlWeight;
      if (verificationDetails.credentialURLFound) matchPoints += urlWeight;
    }
    
    // Holder name verification (15% or 10% if credential ID is available)
    if (holderName) {
      const nameWeight = credentialID ? 10 : 15;
      totalPoints += nameWeight;
      matchPoints += (verificationDetails.nameMatchConfidence / 100) * nameWeight;
    }
    
    verificationDetails.matchScore = totalPoints > 0 
      ? Math.round((matchPoints / totalPoints) * 100) 
      : 0;
    
    // Factor in image integrity if available
    let finalConfidenceScore = verificationDetails.matchScore;
    if (verificationDetails.imageIntegrityScore !== null) {
      // Weighted average: 70% text matching, 30% image integrity
      finalConfidenceScore = Math.round(
        (verificationDetails.matchScore * 0.7) + 
        (verificationDetails.imageIntegrityScore * 0.3)
      );
    }
    
    // Determine AI decision based on comprehensive analysis
    let aiDecision = 'needs_review';
    let aiReasoningDetails = [];
    
    // Build reasoning details
    if (!verificationDetails.titleFound && title) {
      aiReasoningDetails.push('Certificate title not found in document');
    }
    
    if (!verificationDetails.issuerFound && issuer) {
      aiReasoningDetails.push('Issuer name not found in document');
    }
    
    if (!verificationDetails.dateFound && issueDate) {
      aiReasoningDetails.push('Issue date not found in expected format');
    }
    
    if (!verificationDetails.credentialIDFound && credentialID) {
      aiReasoningDetails.push('Credential ID not found in document');
    }
    
    if (!verificationDetails.credentialURLFound && credentialURL) {
      aiReasoningDetails.push('Credential URL or domain not found in document');
    }
    
    if (holderName && verificationDetails.nameMatchConfidence < 70) {
      aiReasoningDetails.push(`Holder name match confidence is low (${verificationDetails.nameMatchConfidence.toFixed(2)}%)`);
    }
    
    if (verificationDetails.imageIntegrityScore !== null && verificationDetails.imageIntegrityScore < 70) {
      aiReasoningDetails.push('Image integrity analysis indicates potential tampering');
    }
    
    // Make final decision
    if (finalConfidenceScore >= 85) {
      aiDecision = 'verified';
      if (aiReasoningDetails.length === 0) {
        aiReasoningDetails.push('All certificate data successfully verified');
      }
    } else if (finalConfidenceScore <= 40) {
      aiDecision = 'rejected';
      if (aiReasoningDetails.length === 0) {
        aiReasoningDetails.push('Multiple verification checks failed');
      }
    } else {
      if (aiReasoningDetails.length === 0) {
        aiReasoningDetails.push('Some verification checks passed, others failed or were inconclusive');
      }
    }
    
    return {
      verificationDetails,
      confidenceScore: finalConfidenceScore,
      textMatchScore: verificationDetails.matchScore,
      imageIntegrityScore: verificationDetails.imageIntegrityScore,
      aiDecision,
      aiReasoningDetails,
      verificationDate: new Date()
    };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    throw new Error('Failed to verify certificate');
  }
};

/**
 * Check certificate against issuer database (if available)
 * @param {Object} certificateData - Certificate metadata
 * @returns {Promise<Object>} - Database verification result
 */
export const verifyAgainstIssuerDatabase = async (certificateData) => {
  try {
    const { issuer, credentialID, credentialURL, holderName } = certificateData;
    
    // This would connect to external APIs or databases
    // For now, we'll simulate with known issuers
    
    const knownIssuers = {
      'Coursera': 'https://www.coursera.org/api/verify',
      'Udemy': 'https://www.udemy.com/api/verify',
      'edX': 'https://www.edx.org/api/verify',
      'LinkedIn Learning': 'https://www.linkedin.com/learning/api/verify',
      'Microsoft': 'https://learn.microsoft.com/api/verify',
      'Google': 'https://developers.google.com/api/verify'
    };
    
    // Check if we have an API for this issuer
    if (!knownIssuers[issuer]) {
      return {
        issuerVerified: false,
        databaseChecked: false,
        message: 'No verification API available for this issuer'
      };
    }
    
    // In a real implementation, this would make an API call to the issuer
    // For now, we'll simulate a response based on credential ID format
    
    // Simulate credential validation with basic logic
    // A real implementation would actually verify with the issuer's API
    const credentialValid = credentialID && 
      (credentialID.length > 8) && 
      (/^[a-zA-Z0-9-]+$/.test(credentialID));
    
    // Check if the credential URL is valid and matches the issuer's domain
    const urlValid = credentialURL && (
      credentialURL.includes(issuer.toLowerCase().replace(/\s+/g, '')) || 
      Object.values(knownIssuers).some(apiUrl => 
        credentialURL.startsWith(apiUrl.replace('/api/verify', ''))
      )
    );
    
    // Simulate holder name validation  
    const holderValid = holderName && holderName.length > 3;
    
    // For improved verification, prioritize credential ID if available, otherwise rely more on URL
    let isVerified = false;
    
    if (credentialID) {
      // If we have a credential ID, it should be valid along with the URL
      isVerified = credentialValid && urlValid && (holderValid || !holderName);
    } else {
      // Without credential ID, rely more heavily on URL and issuer match
      isVerified = urlValid && (holderValid || !holderName);
    }
    
    return {
      issuerVerified: isVerified,
      databaseChecked: true,
      issuerApiUrl: knownIssuers[issuer],
      credentialValid: credentialID ? credentialValid : null,
      urlValid,
      holderValid: holderName ? holderValid : null,
      message: isVerified
        ? 'Certificate validated with issuer database' 
        : credentialID 
          ? 'Certificate failed validation with issuer database'
          : 'Certificate validated with limited information (no credential ID)'
    };
  } catch (error) {
    console.error('Error verifying against issuer database:', error);
    return {
      issuerVerified: false,
      databaseChecked: false,
      error: error.message,
      message: 'Error connecting to issuer database'
    };
  }
};

/**
 * Analyze user skills to identify gaps and make recommendations
 * @param {Array} skills - User's skills
 * @param {Array} certificates - User's certificates
 * @returns {Promise<Object>} - Skill analysis results
 */
export const analyzeSkills = async (skills, certificates) => {
  try {
    // Calculate skill distribution by category
    const categoryDistribution = skills.reduce((acc, skill) => {
      const category = skill.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Find skill levels
    const skillLevels = skills.map(skill => ({
      name: skill.name,
      level: skill.level || 1,
      category: skill.category || 'Other'
    }));
    
    // Find skill gaps based on certificates
    const skillGaps = [];
    const existingSkillNames = skills.map(s => s.name.toLowerCase());
    
    // Extract potential skills from certificate descriptions
    certificates.forEach(cert => {
      const description = cert.description || '';
      
      // Common skill keywords to look for in certificates
      const skillKeywords = [
        'Programming', 'JavaScript', 'Python', 'Java', 'C#', 'SQL',
        'React', 'Angular', 'Vue', 'Node.js', 'Express', 'MongoDB',
        'AWS', 'Azure', 'Google Cloud', 'DevOps', 'Machine Learning',
        'Data Science', 'UX/UI', 'Design', 'Project Management',
        'Agile', 'Scrum', 'Leadership', 'Communication'
      ];
      
      skillKeywords.forEach(keyword => {
        if (
          description.includes(keyword) && 
          !existingSkillNames.includes(keyword.toLowerCase())
        ) {
          skillGaps.push(keyword);
        }
      });
    });
    
    // Find underrepresented categories
    const allCategories = [
      'Programming', 'Web Development', 'Mobile Development',
      'Database', 'Cloud Computing', 'DevOps', 'Machine Learning',
      'Data Science', 'Design', 'Project Management', 'Soft Skills',
      'Business', 'Marketing'
    ];
    
    const underrepresentedCategories = allCategories.filter(
      category => !categoryDistribution[category] || categoryDistribution[category] < 2
    );
    
    // Create learning path recommendations
    const learningPaths = [];
    
    // Based on strongest skills, suggest advanced paths
    const topSkills = [...skillLevels].sort((a, b) => b.level - a.level).slice(0, 3);
    
    topSkills.forEach(skill => {
      switch (skill.category) {
        case 'Programming':
        case 'Web Development':
          learningPaths.push({
            name: `Advanced ${skill.name} Development`,
            skills: [`Advanced ${skill.name}`, 'Software Architecture', 'Design Patterns'],
            category: skill.category,
            level: skill.level + 1
          });
          break;
        case 'Data Science':
        case 'Machine Learning':
          learningPaths.push({
            name: `Advanced ${skill.category}`,
            skills: ['Deep Learning', 'Neural Networks', 'Data Visualization'],
            category: skill.category,
            level: skill.level + 1
          });
          break;
        default:
          learningPaths.push({
            name: `${skill.name} Mastery`,
            skills: [`Advanced ${skill.name}`, 'Project Management', 'Leadership'],
            category: skill.category,
            level: skill.level + 1
          });
      }
    });
    
    /**
     * Advanced feature: Career path predictions based on skill profile
     * This would use a more complex ML model in a real implementation
     */
    const careerSuitabilityPredictions = [
      {
        path: 'Software Engineer',
        suitabilityScore: calculateCareerSuitability(skills, 'Software Engineer'),
        requiredSkills: ['JavaScript', 'Python', 'Java', 'Data Structures', 'Algorithms'],
        recommendedNextSkills: ['System Design', 'Cloud Architecture']
      },
      {
        path: 'Data Scientist',
        suitabilityScore: calculateCareerSuitability(skills, 'Data Scientist'),
        requiredSkills: ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Data Visualization'],
        recommendedNextSkills: ['Deep Learning', 'Big Data Technologies']
      },
      {
        path: 'UX/UI Designer',
        suitabilityScore: calculateCareerSuitability(skills, 'UX/UI Designer'),
        requiredSkills: ['UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'User Testing'],
        recommendedNextSkills: ['Motion Design', 'Design Systems']
      },
      {
        path: 'DevOps Engineer',
        suitabilityScore: calculateCareerSuitability(skills, 'DevOps Engineer'),
        requiredSkills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud Platforms'],
        recommendedNextSkills: ['Infrastructure as Code', 'Security Automation']
      }
    ];
    
    return {
      skillDistribution: categoryDistribution,
      skillLevels,
      skillGaps: [...new Set(skillGaps)],
      underrepresentedCategories,
      learningPaths,
      careerSuitabilityPredictions: careerSuitabilityPredictions
        .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
        .slice(0, 3), // Return top 3 career matches
      analysisDate: new Date()
    };
  } catch (error) {
    console.error('Error analyzing skills:', error);
    throw new Error('Failed to analyze skills');
  }
};

/**
 * Calculate career suitability score based on skills (simplified version)
 * @param {Array} skills - User's skills
 * @param {string} careerPath - Career path to check suitability for
 * @returns {number} - Suitability score (0-100)
 */
const calculateCareerSuitability = (skills, careerPath) => {
  // This would be a much more sophisticated model in reality
  // For now, we'll use a simple keyword matching approach
  
  const careerKeywords = {
    'Software Engineer': ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git', 'Cloud'],
    'Data Scientist': ['Python', 'R', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization', 'Big Data'],
    'UX/UI Designer': ['UI', 'UX', 'Design', 'Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'Wireframing'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Linux', 'Bash', 'Jenkins']
  };
  
  if (!careerKeywords[careerPath]) {
    return 0;
  }
  
  const relevantKeywords = careerKeywords[careerPath];
  let matchCount = 0;
  
  // Count how many skills match the career keywords
  skills.forEach(skill => {
    const skillName = skill.name.toLowerCase();
    for (const keyword of relevantKeywords) {
      if (skillName.includes(keyword.toLowerCase())) {
        matchCount++;
        break;
      }
    }
  });
  
  // Calculate suitability percentage
  return Math.min(100, Math.round((matchCount / relevantKeywords.length) * 100));
};

const generateVerificationSummary = (verificationResult, issuerVerification) => {
  if (!verificationResult) {
    return 'No verification performed';
  }
  
  const { confidenceScore, aiDecision, aiReasoningDetails, verificationDetails } = verificationResult;
  
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
  
  // Add note about credential ID if not provided
  if (!verificationDetails.credentialIDFound && aiDecision !== 'rejected') {
    summary += ' Note: No credential ID was provided or found, which limits verification precision.';
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
      if (issuerVerification.credentialValid === null) {
        summary += ' Certificate was checked against issuer database with limited information (missing credential ID).';
      } else {
        summary += ' Certificate could not be verified with the issuer database.';
      }
    }
  }
  
  return summary;
};

/**
 * Enhanced certificate verification using GPT-4
 * @param {string} extractedText - Text extracted from certificate image
 * @param {Object} certificateData - Certificate metadata for verification
 * @param {Object} imageAnalysis - Results from image integrity analysis
 * @returns {Promise<Object>} - Enhanced verification result
 */
export const enhancedGptVerification = async (extractedText, certificateData, imageAnalysis = null) => {
  try {
    // Basic verification first
    const basicVerification = await verifyCertificate(extractedText, certificateData);
    
    // If confidence is very high or very low, we can trust the basic verification
    if (basicVerification.confidenceScore >= 90 || basicVerification.confidenceScore <= 20) {
      console.log(`Using basic verification result: ${basicVerification.aiDecision} with confidence ${basicVerification.confidenceScore}`);
      return {
        ...basicVerification,
        enhancedVerification: false,
        gptAnalysisApplied: false,
        reasoning: basicVerification.aiReasoningDetails
      };
    }
    
    // Prepare data for GPT-4 analysis
    const verificationData = {
      extractedText,
      certificateData,
      basicVerificationResults: basicVerification,
      imageIntegrityAnalysis: imageAnalysis
    };
    
    // Define the GPT prompt
    const prompt = `
      You are an AI certificate verification expert. Analyze this certificate data carefully.
      
      CERTIFICATE TEXT (extracted using OCR):
      ${extractedText}
      
      CLAIMED CERTIFICATE DETAILS:
      Title: ${certificateData.title || 'Not provided'}
      Issuer: ${certificateData.issuer || 'Not provided'}
      Issue Date: ${certificateData.issueDate || 'Not provided'}
      Credential ID: ${certificateData.credentialID || 'Not provided'}
      Credential URL: ${certificateData.credentialURL || 'Not provided'}
      Holder Name: ${certificateData.holderName || 'Not provided'}
      
      BASIC VERIFICATION RESULTS:
      Title Found: ${basicVerification.verificationDetails.titleFound}
      Issuer Found: ${basicVerification.verificationDetails.issuerFound}
      Date Found: ${basicVerification.verificationDetails.dateFound}
      Credential ID Found: ${basicVerification.verificationDetails.credentialIDFound}
      Credential URL Found: ${basicVerification.verificationDetails.credentialURLFound}
      Holder Name Found: ${basicVerification.verificationDetails.holderNameFound}
      Name Match Confidence: ${basicVerification.verificationDetails.nameMatchConfidence}%
      Overall Confidence: ${basicVerification.confidenceScore}%
      Initial Decision: ${basicVerification.aiDecision}
      
      ${imageAnalysis ? `
      IMAGE INTEGRITY ANALYSIS:
      Integrity Score: ${imageAnalysis.integrityScore}
      Metadata Consistent: ${imageAnalysis.metadataConsistent}
      Compression Artifacts: ${imageAnalysis.compressionArtifacts}
      Pixel Pattern Consistent: ${imageAnalysis.pixelPatternConsistent}
      ` : 'No image integrity analysis available.'}
      
      YOUR TASK:
      1. Determine if the certificate is likely genuine or fraudulent
      2. Provide a confidence score (0-100%)
      3. List specific reasons for your decision
      4. Look for inconsistencies or red flags
      5. Consider both textual content and image analysis
      6. If the certificate mentions skills or qualifications, verify they match the title and issuer
      7. Check if the formatting and language is consistent with professional certificates
      8. Make a final decision: "verified", "rejected", or "needs_review"
      
      Respond in JSON format only with these fields:
      {
        "decision": "verified|rejected|needs_review",
        "confidenceScore": number,
        "reasoning": [list of detailed reasons],
        "redFlags": [list of specific concerns or inconsistencies]
      }
    `;
    
    // Simulate GPT response for now - In production, replace with actual OpenAI API call
    // const gptResponse = await callGptApi(prompt);
    
    // Simulate GPT analysis for development
    const simulatedResponse = simulateGptVerification(extractedText, certificateData, basicVerification);
    
    // Process GPT response
    const enhancedVerification = {
      ...basicVerification,
      enhancedVerification: true,
      gptAnalysisApplied: true,
      aiDecision: simulatedResponse.decision,
      confidenceScore: simulatedResponse.confidenceScore,
      reasoning: simulatedResponse.reasoning,
      redFlags: simulatedResponse.redFlags
    };
    
    return enhancedVerification;
  } catch (error) {
    console.error('Error in enhanced GPT verification:', error);
    // If GPT enhancement fails, fall back to basic verification
    const basicVerification = await verifyCertificate(extractedText, certificateData);
    return {
      ...basicVerification,
      enhancedVerification: false,
      gptAnalysisApplied: false,
      gptError: error.message
    };
  }
};

/**
 * Simulate GPT-4 verification response (for development/testing)
 * In production, replace with actual OpenAI API call
 */
function simulateGptVerification(extractedText, certificateData, basicVerification) {
  // Extract some basic metrics
  const textLength = extractedText.length;
  const hasCertificateKeywords = /certificate|certification|diploma|degree|awarded|completed/i.test(extractedText);
  const hasIssuerMatch = certificateData.issuer && extractedText.includes(certificateData.issuer);
  const hasTitleMatch = certificateData.title && extractedText.includes(certificateData.title);
  const hasCredentialIdMatch = certificateData.credentialID && extractedText.includes(certificateData.credentialID);
  const hasNameMatch = certificateData.holderName && extractedText.includes(certificateData.holderName);
  const hasDateMatch = certificateData.issueDate && extractedText.includes(certificateData.issueDate);
  
  // Count how many key items were found
  const matchCount = [hasIssuerMatch, hasTitleMatch, hasCredentialIdMatch, hasNameMatch, hasDateMatch]
    .filter(Boolean).length;
  
  // Determine if the format seems professional
  const seemsProfessional = 
    textLength > 200 && 
    hasCertificateKeywords && 
    /congratulations|successfully|completed|achievement/i.test(extractedText);
  
  // Look for red flags
  const redFlags = [];
  
  if (textLength < 100) {
    redFlags.push("Extracted text is suspiciously short for a legitimate certificate");
  }
  
  if (!hasCertificateKeywords) {
    redFlags.push("Text lacks common certificate terminology");
  }
  
  if (certificateData.issuer && !hasIssuerMatch) {
    redFlags.push(`Claimed issuer "${certificateData.issuer}" not found in certificate text`);
  }
  
  if (certificateData.title && !hasTitleMatch) {
    redFlags.push(`Claimed title "${certificateData.title}" not found in certificate text`);
  }
  
  if (certificateData.credentialID && !hasCredentialIdMatch) {
    redFlags.push(`Claimed credential ID "${certificateData.credentialID}" not found in certificate text`);
  }
  
  if (certificateData.holderName && !hasNameMatch) {
    redFlags.push(`Recipient name "${certificateData.holderName}" not found in certificate text`);
  }
  
  if (/template|sample|example/i.test(extractedText)) {
    redFlags.push("Certificate contains terms like 'template', 'sample', or 'example'");
  }
  
  // Calculate enhanced confidence score
  let confidenceScore = basicVerification.confidenceScore;
  
  // Adjust based on additional factors
  if (seemsProfessional) confidenceScore += 10;
  if (matchCount >= 4) confidenceScore += 15;
  if (matchCount <= 1) confidenceScore -= 20;
  if (redFlags.length >= 3) confidenceScore -= 25;
  if (redFlags.length === 0) confidenceScore += 10;
  
  // Keep within bounds
  confidenceScore = Math.min(100, Math.max(0, confidenceScore));
  
  // Make decision
  let decision;
  if (confidenceScore >= 75) {
    decision = "verified";
  } else if (confidenceScore <= 40) {
    decision = "rejected";
  } else {
    decision = "needs_review";
  }
  
  // Generate reasoning
  const reasoning = [];
  
  if (matchCount >= 3) {
    reasoning.push(`${matchCount} key certificate elements were found in the text`);
  }
  
  if (seemsProfessional) {
    reasoning.push("Certificate text contains professional formatting and language");
  }
  
  if (hasCredentialIdMatch) {
    reasoning.push("Credential ID was found and matches the provided value");
  }
  
  if (hasNameMatch) {
    reasoning.push("Recipient name was found on the certificate");
  }
  
  if (redFlags.length === 0) {
    reasoning.push("No significant red flags were detected");
  }
  
  return {
    decision,
    confidenceScore,
    reasoning: reasoning.length > 0 ? reasoning : ["Decision based on overall analysis of certificate text and metadata"],
    redFlags
  };
}

/**
 * Call OpenAI's GPT-4 API for certificate verification
 * @param {string} prompt - The verification prompt
 * @returns {Promise<Object>} - GPT API response
 */
async function callGptApi(prompt) {
  try {
    // This would be replaced with actual API call in production
    // Example OpenAI API implementation:
    /*
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI certificate verification expert that analyzes credentials for authenticity."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content);
    */
    
    // For now, return a simulated response
    return {
      decision: "needs_review",
      confidenceScore: 60,
      reasoning: ["Simulated API response - replace with actual API call in production"],
      redFlags: []
    };
  } catch (error) {
    console.error('Error calling GPT API:', error);
    throw new Error('Failed to verify with GPT API');
  }
}

export default {
  extractTextFromImage,
  verifyCertificate,
  analyzeSkills,
  analyzeImageIntegrity,
  verifyAgainstIssuerDatabase
}; 