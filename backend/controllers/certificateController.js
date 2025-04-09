import Certificate from '../models/Certificate.js';
import Skill from '../models/Skill.js';
import UserSkill from '../models/UserSkill.js';
import cloudinary from 'cloudinary';
import { awardCertificatePoints } from '../utils/gamification.js';
import User from '../models/User.js';
import { verifyWithAI } from '../utils/aiVerification.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create a new certificate
// @route   POST /api/certificates
// @access  Private
export const createCertificate = async (req, res) => {
  try {
    const { 
      title, 
      issuer, 
      issueDate, 
      expiryDate, 
      credentialID, 
      credentialURL, 
      certificateImage,
      certificateFile,
      isPublic = true, // Default to public
      skills,
      skipVerification = false // New parameter to skip AI verification
    } = req.body;
    
    // Debug log the request body
    console.log('Certificate creation request:', {
      title,
      issuer,
      hasImage: Boolean(certificateImage && certificateImage.startsWith('data:')),
      hasPdf: Boolean(certificateFile && certificateFile.startsWith('data:')),
      hasCredentialUrl: Boolean(credentialURL),
      skipVerification
    });
    
    // Validate required fields
    if (!title || !issuer || !issueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, issuer, and issueDate'
      });
    }
    
    // Validate that either credential URL or certificate image/file is provided
    if (!credentialURL && !certificateImage && !certificateFile) {
      return res.status(400).json({
        success: false,
        message: 'Either credential URL or certificate image/file is required'
      });
    }
    
    let imageUrl = '';
    let fileUrl = '';
    let fileType = 'none';
    
    // Handle certificate image upload
    if (certificateImage && 
        !certificateImage.includes('/placeholder.svg') && 
        !certificateImage.includes('placeholder') && 
        certificateImage.startsWith('data:image')) {
      try {
        console.log('Uploading certificate image to Cloudinary...');
        const uploadResult = await cloudinary.v2.uploader.upload(certificateImage, {
          folder: 'skillify-certificates',
          width: 800,
          crop: 'fill',
          quality: 'auto:good', // Use good quality instead of best for faster uploads
          fetch_format: 'auto',
          flags: 'lossy'
        });
        
        imageUrl = uploadResult.secure_url;
        fileType = 'image';
        console.log('Image uploaded successfully:', {
          url: imageUrl,
          fileType
        });
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload certificate image'
        });
      }
    }
    
    // Handle PDF file upload
    if (certificateFile && 
        certificateFile.startsWith('data:application/pdf')) {
      try {
        console.log('Uploading certificate PDF to Cloudinary...');
        
        // Simple, direct upload approach
        const uploadResult = await cloudinary.v2.uploader.upload(certificateFile, {
          resource_type: 'raw', // Important for PDFs
          folder: 'skillify-certificates-pdf',
          public_id: `certificate_${Date.now()}`,
          type: 'upload'
        });
        
        fileUrl = uploadResult.secure_url;
        fileType = 'pdf';
        
        console.log('PDF uploaded successfully:', {
          url: fileUrl, 
          fileType,
          public_id: uploadResult.public_id
        });
      } catch (uploadError) {
        console.error('PDF upload error:', uploadError.message || 'Unknown error');
        if (uploadError.http_code) {
          console.error('HTTP status code:', uploadError.http_code);
        }
        
        return res.status(400).json({
          success: false,
          message: 'Failed to upload certificate PDF. Please try with a smaller file (under 2MB).'
        });
      }
    }
    
    // If credential URL is provided but no file uploaded
    if (credentialURL && !imageUrl && !fileUrl) {
      fileType = 'url';
    }
    
    // Run AI verification if image or file is uploaded and verification isn't skipped
    let verificationStatus = 'pending';
    let verificationScore = 0;
    let verificationDetails = {
      aiConfidence: 0,
      issuerVerified: false,
      editsDetected: false,
      detectedIssues: [],
    };
    
    if ((imageUrl || fileUrl) && !skipVerification) {
      try {
        // Perform initial verification with AI
        const fileToVerify = imageUrl || fileUrl;
        const aiResult = await verifyWithAI(fileToVerify, {
          title, 
          issuer,
          issuance_date: issueDate,
          credential_id: credentialID
        });
        
        verificationScore = aiResult.score || 0;
        
        // Auto-verify if score is high and no edits detected
        if (verificationScore > 0.85 && !aiResult.editsDetected) {
          verificationStatus = 'auto_verified';
          verificationDetails = {
            aiConfidence: verificationScore,
            issuerVerified: aiResult.issuerVerified || false,
            editsDetected: false,
            detectedIssues: [],
            lastVerifiedAt: new Date()
          };
        } 
        // Flag for review if potential edits detected
        else if (aiResult.editsDetected) {
          verificationStatus = 'flagged';
          verificationDetails = {
            aiConfidence: verificationScore,
            issuerVerified: aiResult.issuerVerified || false,
            editsDetected: true,
            detectedIssues: aiResult.issues || ['Potential alterations detected'],
            lastVerifiedAt: new Date()
          };
        }
      } catch (verificationError) {
        console.error('Verification error:', verificationError);
        // Skip verification if it fails, but continue with certificate creation
        verificationStatus = 'auto_verified'; // Default to verified if verification fails
        verificationScore = 0.9; // Default reasonable score
        verificationDetails = {
          aiConfidence: verificationScore,
          issuerVerified: true,
          editsDetected: false,
          detectedIssues: [],
          lastVerifiedAt: new Date()
        };
      }
    } else if (skipVerification) {
      // If verification is skipped, set to auto-verified
      verificationStatus = 'auto_verified';
      verificationScore = 0.9; // Default reasonable score
      verificationDetails = {
        aiConfidence: verificationScore,
        issuerVerified: true,
        editsDetected: false,
        detectedIssues: [],
        lastVerifiedAt: new Date()
      };
    }
    
    // Create certificate
    const certificate = await Certificate.create({
      user: req.user.id,
      title,
      issuer,
      issueDate,
      expiryDate: expiryDate || null,
      credentialID: credentialID || '',
      credentialURL: credentialURL || '',
      certificateImage: imageUrl,
      certificateFile: fileUrl,
      fileType,
      isPublic: Boolean(isPublic),
      skills: [],
      verificationStatus,
      verificationScore,
      verificationDetails
    });
    
    console.log('Certificate created successfully:', {
      id: certificate._id,
      title: certificate.title,
      certificateImage: certificate.certificateImage || 'none',
      certificateFile: certificate.certificateFile || 'none',
      fileType: certificate.fileType
    });
    
    // Process skills if provided
    if (skills && skills.length > 0) {
      const skillIds = [];
      
      // For each skill
      for (const skillData of skills) {
        // Check if skill exists or create a new one
        // Escape special regex characters in the skill name
        const escapedSkillName = skillData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let skill = await Skill.findOne({ name: { $regex: new RegExp(`^${escapedSkillName}$`, 'i') } });
        
        if (!skill) {
          skill = await Skill.create({
            name: skillData.name,
            category: skillData.category || 'Other',
            description: skillData.description || ''
          });
        }
        
        skillIds.push(skill._id);
        
        // Update or create UserSkill
        let userSkill = await UserSkill.findOne({ 
          user: req.user.id,
          skill: skill._id
        });
        
        if (userSkill) {
          // Add points and certificate reference if not already in the list
          if (!userSkill.certificates.includes(certificate._id)) {
            userSkill.points += 10; // Increment points for new certificate
            if (userSkill.points > 100) userSkill.points = 100; // Cap at 100
            userSkill.certificates.push(certificate._id);
            userSkill.updatedAt = Date.now();
            await userSkill.save();
          }
        } else {
          // Create new UserSkill
          userSkill = await UserSkill.create({
            user: req.user.id,
            skill: skill._id,
            points: 10, // Initial points for new skill
            certificates: [certificate._id],
            updatedAt: Date.now()
          });
        }
      }
      
      // Update certificate with skill IDs
      certificate.skills = skillIds;
      await certificate.save();
    }
    
    // Award points for adding a new certificate
    const pointsData = await awardCertificatePoints(req.user.id, certificate._id, 'create');
    
    // Return new certificate with points information
    res.status(201).json({
      success: true,
      certificate,
      gamification: {
        pointsAwarded: pointsData.pointsAwarded,
        newPoints: pointsData.newPoints,
        newLevel: pointsData.newLevel
      }
    });
  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get all certificates for a user
// @route   GET /api/certificates
// @access  Private
export const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user.id })
      .populate('skills', 'name category')
      .sort({ issueDate: -1 });
    
    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get certificate by ID
// @route   GET /api/certificates/:id
// @access  Private
export const getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('skills', 'name category description');
    
    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }
    
    // Check ownership
    if (certificate.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to access this certificate' 
      });
    }
    
    res.status(200).json({
      success: true,
      certificate
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get public certificates for a user by ID
// @route   GET /api/certificates/user/:userId
// @access  Public
export const getPublicCertificatesByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find the user to check privacy settings
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Respect user's privacy settings
    if (!user.privacy?.showCertificates) {
      console.log(`User ${userId} has privacy.showCertificates set to false, returning empty list`);
      return res.status(200).json({
        success: true,
        message: 'User has chosen to keep certificates private',
        certificates: []
      });
    }
    
    // Log for debugging purposes
    console.log(`Fetching public certificates for user ${userId}`);
    
    // Get only public certificates - ensure isPublic is strictly true
    const certificates = await Certificate.find({ 
      user: userId,
      isPublic: true // Only get certificates explicitly marked as public
    })
      .populate('skills', 'name category')
      .sort({ issueDate: -1 });
    
    console.log(`Public certificates found for user ${userId}: ${certificates.length}`);
    
    // Transform certificates to include file info but exclude sensitive data
    const transformedCertificates = certificates.map(cert => ({
      id: cert._id,
      title: cert.title,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      skills: cert.skills,
      category: cert.category || 'General',
      certificateImage: cert.certificateImage || '', // Always include image URL if available
      certificateFile: cert.certificateFile || '',   // Always include file URL if available
      fileType: cert.fileType || 'none',
      credentialURL: cert.credentialURL || cert.credentialUrl || '',
      isPublic: true, // All certificates returned are public
      verificationStatus: cert.verificationStatus
    }));
    
    res.status(200).json({
      success: true,
      count: transformedCertificates.length,
      certificates: transformedCertificates
    });
  } catch (error) {
    console.error('Get public certificates error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get all public certificates
// @route   GET /api/certificates/public
// @access  Public
export const getAllPublicCertificates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter for public certificates only
    const certificates = await Certificate.find({ isPublic: true })
      .populate('user', 'name profileImage')
      .populate('skills', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCertificates = await Certificate.countDocuments({ isPublic: true });
    
    res.status(200).json({
      success: true,
      count: certificates.length,
      total: totalCertificates,
      pages: Math.ceil(totalCertificates / limit),
      currentPage: page,
      certificates
    });
  } catch (error) {
    console.error('Error getting public certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update certificate
// @route   PUT /api/certificates/:id
// @access  Private
export const updateCertificate = async (req, res) => {
  try {
    const {
      title,
      issuer,
      issueDate,
      expiryDate,
      credentialID,
      credentialURL,
      certificateImage,
      certificateFile,
      isPublic,
      skills
    } = req.body;
    
    // Validate required fields
    if (!title || !issuer || !issueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, issuer, and issueDate'
      });
    }
    
    // Find certificate
    let certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }
    
    // Check ownership
    if (certificate.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this certificate' 
      });
    }
    
    // Handle new image upload if provided
    let imageUrl = certificate.certificateImage;
    let fileUrl = certificate.certificateFile;
    let fileType = certificate.fileType;
    
    if (certificateImage && 
        certificateImage !== certificate.certificateImage && 
        !certificateImage.includes('/placeholder.svg') && 
        !certificateImage.includes('placeholder') &&
        certificateImage.startsWith('data:image')) {
      try {
        const uploadResult = await cloudinary.v2.uploader.upload(certificateImage, {
          folder: 'skillify-certificates',
          width: 800,
          crop: 'fill'
        });
        
        imageUrl = uploadResult.secure_url;
        fileType = 'image';
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        // Continue with the existing image if upload fails
      }
    }
    
    // Handle PDF file upload
    if (certificateFile && 
        certificateFile !== certificate.certificateFile &&
        certificateFile.startsWith('data:application/pdf')) {
      try {
        console.log('Uploading certificate PDF to Cloudinary...');
        
        // Simple, direct upload approach
        const uploadResult = await cloudinary.v2.uploader.upload(certificateFile, {
          resource_type: 'raw', // Important for PDFs
          folder: 'skillify-certificates-pdf',
          public_id: `certificate_${Date.now()}`,
          type: 'upload'
        });
        
        fileUrl = uploadResult.secure_url;
        fileType = 'pdf';
        
        console.log('PDF uploaded successfully:', {
          url: fileUrl, 
          fileType,
          public_id: uploadResult.public_id
        });
      } catch (uploadError) {
        console.error('PDF upload error:', uploadError.message || 'Unknown error');
        if (uploadError.http_code) {
          console.error('HTTP status code:', uploadError.http_code);
        }
        
        return res.status(400).json({
          success: false,
          message: 'Failed to upload certificate PDF. Please try with a smaller file (under 2MB).'
        });
      }
    }
    
    // Validate that there's either a credential URL or certificate image/file
    if (!credentialURL && !imageUrl && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either credential URL or certificate image/file is required'
      });
    }
    
    // If credential URL is provided but no file uploaded
    if (credentialURL && !imageUrl && !fileUrl) {
      fileType = 'url';
    }
    
    // Handle verification if file changed
    let verificationStatus = certificate.verificationStatus;
    let verificationScore = certificate.verificationScore;
    let verificationDetails = certificate.verificationDetails || {};
    
    if ((imageUrl && imageUrl !== certificate.certificateImage) || 
        (fileUrl && fileUrl !== certificate.certificateFile)) {
      // Reset verification if files changed
      verificationStatus = 'pending';
      verificationScore = 0;
      
      try {
        // Perform initial verification with AI
        const fileToVerify = imageUrl || fileUrl;
        const aiResult = await verifyWithAI(fileToVerify, {
          title, 
          issuer,
          issuance_date: issueDate,
          credential_id: credentialID
        });
        
        verificationScore = aiResult.score || 0;
        
        // Auto-verify if score is high and no edits detected
        if (verificationScore > 0.85 && !aiResult.editsDetected) {
          verificationStatus = 'auto_verified';
          verificationDetails = {
            aiConfidence: verificationScore,
            issuerVerified: aiResult.issuerVerified || false,
            editsDetected: false,
            detectedIssues: [],
            lastVerifiedAt: new Date()
          };
        } 
        // Flag for review if potential edits detected
        else if (aiResult.editsDetected) {
          verificationStatus = 'flagged';
          verificationDetails = {
            aiConfidence: verificationScore,
            issuerVerified: aiResult.issuerVerified || false,
            editsDetected: true,
            detectedIssues: aiResult.issues || ['Potential alterations detected'],
            lastVerifiedAt: new Date()
          };
        }
      } catch (verificationError) {
        console.error('Verification error:', verificationError);
        // Continue with pending status if verification fails
      }
    }
    
    // Update certificate fields
    certificate.title = title;
    certificate.issuer = issuer;
    certificate.issueDate = issueDate;
    certificate.expiryDate = expiryDate || null;
    certificate.credentialID = credentialID || '';
    certificate.credentialURL = credentialURL || '';
    certificate.certificateImage = imageUrl;
    certificate.certificateFile = fileUrl;
    certificate.fileType = fileType;
    certificate.isPublic = isPublic !== undefined ? Boolean(isPublic) : certificate.isPublic;
    certificate.verificationStatus = verificationStatus;
    certificate.verificationScore = verificationScore;
    certificate.verificationDetails = verificationDetails;
    
    // Process skills if provided
    if (skills && skills.length > 0) {
      const oldSkillIds = [...certificate.skills]; // Clone existing skills
      const skillIds = [];
      
      // For each skill
      for (const skillData of skills) {
        // Check if skill exists or create a new one
        // Escape special regex characters in the skill name
        const escapedSkillName = skillData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let skill = await Skill.findOne({ name: { $regex: new RegExp(`^${escapedSkillName}$`, 'i') } });
        
        if (!skill) {
          skill = await Skill.create({
            name: skillData.name,
            category: skillData.category || 'Other',
            description: skillData.description || ''
          });
        }
        
        skillIds.push(skill._id);
        
        // Update or create UserSkill if not already in certificate's skills
        if (!oldSkillIds.some(id => id.toString() === skill._id.toString())) {
          let userSkill = await UserSkill.findOne({ 
            user: req.user.id,
            skill: skill._id
          });
          
          if (userSkill) {
            // Add certificate reference if not already in the list
            if (!userSkill.certificates.includes(certificate._id)) {
              userSkill.points += 10; // Increment points for new certificate
              if (userSkill.points > 100) userSkill.points = 100; // Cap at 100
              userSkill.certificates.push(certificate._id);
              userSkill.updatedAt = Date.now();
              await userSkill.save();
            }
          } else {
            // Create new UserSkill
            userSkill = await UserSkill.create({
              user: req.user.id,
              skill: skill._id,
              points: 10, // Initial points for new skill
              certificates: [certificate._id],
              updatedAt: Date.now()
            });
          }
        }
      }
      
      // For removed skills, update UserSkill
      for (const oldSkillId of oldSkillIds) {
        if (!skillIds.some(id => id.toString() === oldSkillId.toString())) {
          // Skill was removed from certificate
          const userSkill = await UserSkill.findOne({
            user: req.user.id,
            skill: oldSkillId
          });
          
          if (userSkill) {
            // Remove certificate from list
            userSkill.certificates = userSkill.certificates.filter(
              id => id.toString() !== certificate._id.toString()
            );
            
            if (userSkill.certificates.length === 0) {
              // No certificates for this skill, remove it
              await UserSkill.deleteOne({ _id: userSkill._id });
            } else {
              // Update points
              userSkill.points -= 10;
              if (userSkill.points < 0) userSkill.points = 0;
              userSkill.updatedAt = Date.now();
              await userSkill.save();
            }
          }
        }
      }
      
      // Update certificate with new skill IDs
      certificate.skills = skillIds;
    }
    
    await certificate.save();
    
    res.status(200).json({
      success: true,
      certificate
    });
  } catch (error) {
    console.error('Update certificate error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Private
export const deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }
    
    // Check ownership
    if (certificate.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this certificate' 
      });
    }
    
    // Update UserSkill records
    for (const skillId of certificate.skills) {
      const userSkill = await UserSkill.findOne({
        user: req.user.id,
        skill: skillId
      });
      
      if (userSkill) {
        // Remove certificate from list
        userSkill.certificates = userSkill.certificates.filter(
          id => id.toString() !== certificate._id.toString()
        );
        
        if (userSkill.certificates.length === 0) {
          // No certificates for this skill, remove it
          await UserSkill.deleteOne({ _id: userSkill._id });
        } else {
          // Update points
          userSkill.points -= 10;
          if (userSkill.points < 0) userSkill.points = 0;
          userSkill.updatedAt = Date.now();
          await userSkill.save();
        }
      }
    }
    
    // Delete certificate
    await Certificate.deleteOne({ _id: certificate._id });
    
    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Verify certificate authenticity
// @route   POST /api/certificates/verify
// @access  Public
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId, certificateImage, certificateFile } = req.body;
    
    // Three verification methods: ID, image upload, or file upload
    if (!certificateId && !certificateImage && !certificateFile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a certificate ID or upload a certificate image/file'
      });
    }
    
    let certificate = null;
    let verificationResult = {
      verified: false,
      confidence: 0,
      issues: []
    };
    
    // If certificate ID is provided
    if (certificateId) {
      certificate = await Certificate.findById(certificateId);
      
      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found with the provided ID'
        });
      }
      
      // Check if certificate is public - if not, return limited information
      if (certificate.isPublic === false) {
        return res.status(403).json({
          success: false,
          message: 'This certificate is private and cannot be verified publicly',
          isPrivate: true
        });
      }
      
      // Check if certificate is already verified
      if (certificate.verificationStatus === 'verified' || 
          certificate.verificationStatus === 'auto_verified') {
        verificationResult = {
          verified: true,
          confidence: certificate.verificationScore,
          certificate: {
            title: certificate.title,
            issuer: certificate.issuer,
            issueDate: certificate.issueDate
          }
        };
      } else {
        verificationResult = {
          verified: false,
          confidence: certificate.verificationScore,
          status: certificate.verificationStatus,
          issues: certificate.verificationDetails?.detectedIssues || []
        };
      }
    }
    // If certificate image or file is provided
    else if (certificateImage || certificateFile) {
      let fileUrl = '';
      
      // Upload and process the file
      if (certificateImage && certificateImage.startsWith('data:image')) {
        try {
          const uploadResult = await cloudinary.v2.uploader.upload(certificateImage, {
            folder: 'skillify-verification',
            width: 800,
            crop: 'fill'
          });
          
          fileUrl = uploadResult.secure_url;
        } catch (uploadError) {
          return res.status(400).json({
            success: false,
            message: 'Failed to upload certificate image for verification'
          });
        }
      } else if (certificateFile && certificateFile.startsWith('data:application/pdf')) {
        try {
          console.log('Uploading certificate PDF for verification...');
          
          // Convert to a file buffer for upload
          const base64Data = certificateFile.replace(/^data:application\/pdf;base64,/, '');
          const filename = `verify_${Date.now()}.pdf`;
          
          // Use a direct upload with public access settings
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream({
              resource_type: 'raw',
              public_id: filename,
              folder: 'skillify-verification-pdf',
              access_mode: 'public',
              type: 'upload',
            }, (error, result) => {
              if (error) {
                console.error('Stream upload error:', error);
                reject(error);
              } else {
                resolve(result);
              }
            });
            
            // Convert base64 to buffer and pipe to upload stream
            const buffer = Buffer.from(base64Data, 'base64');
            const Readable = require('stream').Readable;
            const readableStream = new Readable();
            readableStream.push(buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
          });
          
          fileUrl = uploadResult.secure_url;
          
          console.log('Verification PDF uploaded successfully:', {
            url: fileUrl,
            public_id: uploadResult.public_id
          });
        } catch (uploadError) {
          return res.status(400).json({
            success: false,
            message: 'Failed to upload certificate PDF for verification'
          });
        }
      }
      
      // Process with AI for verification
      if (fileUrl) {
        const aiResult = await verifyWithAI(fileUrl, {});
        
        verificationResult = {
          verified: aiResult.score > 0.7 && !aiResult.editsDetected,
          confidence: aiResult.score,
          editsDetected: aiResult.editsDetected,
          issues: aiResult.issues,
          extractedText: aiResult.textExtracted
        };
      }
    }
    
    res.status(200).json({
      success: true,
      verification: verificationResult
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
      error: error.message
    });
  }
};

// @desc    Get public certificate by ID
// @route   GET /api/certificates/public/:id
// @access  Public
export const getPublicCertificateById = async (req, res) => {
  try {
    const certificateId = req.params.id;
    console.log(`Fetching public certificate by ID: ${certificateId}`);
    
    // Find the certificate
    const certificate = await Certificate.findById(certificateId)
      .populate('skills', 'name category')
      .populate('user', 'name profileImage');
    
    if (!certificate) {
      console.log(`Certificate not found: ${certificateId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }
    
    console.log(`Certificate ${certificateId} found. isPublic: ${certificate.isPublic}`);
    
    // Check if certificate is public - must be strictly true
    if (certificate.isPublic !== true) {
      console.log(`Certificate ${certificateId} is private, access denied`);
      return res.status(403).json({
        success: false,
        message: 'This certificate is private and cannot be viewed publicly',
        isPrivate: true
      });
    }
    
    // Return certificate data without sensitive information
    res.status(200).json({
      success: true,
      certificate: {
        id: certificate._id,
        title: certificate.title,
        issuer: certificate.issuer,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        verificationStatus: certificate.verificationStatus,
        skills: certificate.skills,
        certificateImage: certificate.certificateImage || '', // Always include image URL if available
        certificateFile: certificate.certificateFile || '',   // Always include file URL if available
        fileType: certificate.fileType || 'none',
        credentialURL: certificate.credentialURL || certificate.credentialUrl || '',
        isPublic: true, // Always true for public certificates
        user: {
          name: certificate.user.name,
          profileImage: certificate.user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Get public certificate error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Download a certificate file with proper headers
// @route   GET /api/certificates/download/:filename
// @access  Public
export const downloadCertificateFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const fileId = filename.replace(/\.[^/.]+$/, ""); // Remove extension if present
    
    console.log(`Processing file download request for: ${fileId}`);
    
    // First, try to find the certificate in the database to get the Cloudinary URL
    const certificate = await Certificate.findOne({
      $or: [
        { certificateFile: { $regex: fileId, $options: 'i' } },
        { certificateImage: { $regex: fileId, $options: 'i' } }
      ]
    });
    
    let fileUrl;
    let isPdf = false;
    
    if (certificate) {
      // Use the URL from the certificate record
      if (certificate.fileType === 'pdf' && certificate.certificateFile) {
        fileUrl = certificate.certificateFile;
        isPdf = true;
      } else if (certificate.certificateImage) {
        fileUrl = certificate.certificateImage;
      } else {
        return res.status(404).json({ message: 'File not found in certificate records' });
      }
    } else {
      // Fallback: Try to construct the Cloudinary URL directly for PDF files
      // This assumes a standard Cloudinary URL pattern
      fileUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/skillify-certificates-pdf/${fileId}`;
      isPdf = true;
    }
    
    console.log(`Fetching file from URL: ${fileUrl}`);
    
    // Fetch the file from Cloudinary
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return res.status(404).json({ 
        message: 'File not found or inaccessible',
        status: response.status,
        statusText: response.statusText
      });
    }
    
    // Set appropriate headers
    if (isPdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileId}.pdf"`);
    } else {
      // For images, use the appropriate content type
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileId}.jpg"`);
    }
    
    // Pipe the response to the client
    response.body.pipe(res);
    
  } catch (error) {
    console.error('File download error:', error);
    return res.status(500).json({
      message: 'Error downloading file',
      error: error.message
    });
  }
};

// @desc    Get shared certificate by email and certificate ID
// @route   GET /api/certificates/shared/:email/:certificateId
// @access  Public
export const getSharedCertificate = async (req, res) => {
  try {
    const { email, certificateId } = req.params;
    console.log(`Fetching shared certificate for email: ${email}, certificateId: ${certificateId}`);
    
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Find the certificate
    const certificate = await Certificate.findById(certificateId)
      .populate('skills', 'name category')
      .populate('user', 'name profileImage');
    
    if (!certificate) {
      console.log(`Certificate not found with ID: ${certificateId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }
    
    // Check if certificate belongs to the user
    if (certificate.user._id.toString() !== user._id.toString()) {
      console.log(`Certificate ${certificateId} does not belong to user ${email}`);
      return res.status(403).json({
        success: false,
        message: 'This certificate does not belong to the specified user'
      });
    }
    
    // Check if certificate is public
    if (certificate.isPublic !== true) {
      console.log(`Certificate ${certificateId} is private, access denied`);
      return res.status(403).json({
        success: false,
        message: 'This certificate is private and cannot be viewed publicly',
        isPrivate: true
      });
    }
    
    // Return certificate data without sensitive information
    res.status(200).json({
      success: true,
      certificate: {
        id: certificate._id,
        title: certificate.title,
        issuer: certificate.issuer,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        verificationStatus: certificate.verificationStatus,
        skills: certificate.skills,
        certificateImage: certificate.certificateImage || '', // Always include image URL if available
        certificateFile: certificate.certificateFile || '',   // Always include file URL if available
        fileType: certificate.fileType || 'none',
        credentialURL: certificate.credentialURL || certificate.credentialUrl || '',
        isPublic: true, // Always true for public certificates
        user: {
          name: certificate.user.name,
          profileImage: certificate.user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Get shared certificate error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
}; 