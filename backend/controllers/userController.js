import User from '../models/User.js';
import cloudinary from 'cloudinary';
import asyncHandler from 'express-async-handler';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, location, title, links } = req.body;
    
    // Find user by ID (from auth middleware)
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (title !== undefined) user.title = title;
    if (links) {
      // Update only provided links
      if (links.github !== undefined) user.links.github = links.github;
      if (links.linkedin !== undefined) user.links.linkedin = links.linkedin;
      if (links.portfolio !== undefined) user.links.portfolio = links.portfolio;
      if (links.twitter !== undefined) user.links.twitter = links.twitter;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        location: user.location,
        title: user.title,
        links: user.links
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
export const uploadProfileImage = async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Upload image to cloudinary
    const uploadResult = await cloudinary.v2.uploader.upload(image, {
      folder: 'skillify-profiles',
      width: 500,
      crop: 'fill'
    });
    
    // Update user profile image
    user.profileImage = uploadResult.secure_url;
    await user.save();
    
    res.status(200).json({
      success: true,
      profileImage: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Public
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        profileImage: user.profileImage,
        bio: user.bio,
        location: user.location,
        title: user.title,
        links: user.links
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getCurrentUserProfile = async (req, res) => {
  try {
    console.log('Fetching current user profile for user ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('User not found with ID:', req.user.id);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    console.log('Found user:', user._id);
    console.log('User education data:', user.education);
    
    // Create response with full user profile including education
    const responseData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      title: user.title,
      links: user.links,
      education: user.education || []
    };
    
    console.log('Sending user profile with education:', responseData.education);
    
    res.status(200).json({
      success: true,
      user: responseData
    });
  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * @desc    Upload and update user profile image
 * @route   POST /api/users/profile-image
 * @access  Private
 */
export const updateProfileImage = asyncHandler(async (req, res) => {
  try {
    if (!req.files || !req.files.profileImage) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const imageFile = req.files.profileImage;
    
    // Check file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 5MB'
      });
    }
    
    // Check file type
    if (!imageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Upload to Cloudinary using v2
    const result = await cloudinary.v2.uploader.upload(imageFile.tempFilePath, {
      folder: 'profile_images',
      width: 500,
      height: 500,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto'
    });

    console.log('Cloudinary upload result:', result);

    // Update user profile image in database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profileImage = result.secure_url;
    await user.save();

    console.log('User profile updated with image:', user.profileImage);

    // Return success with image URL
    return res.status(200).json({
      success: true,
      profileImage: result.secure_url,
      message: 'Profile image updated successfully'
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    });
  }
});

// @desc    Get user profile by email
// @route   GET /api/users/profile/email/:email
// @access  Public
export const getProfileByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's gamification data from the user model directly
    const gamificationData = {
      level: user.level || 1,
      badges: user.badges || [],
      achievements: user.achievements || [],
      learningStreak: user.learningStreak || {
        current: 0,
        longest: 0,
        lastActive: new Date().toISOString()
      }
    };
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        title: user.title || '',
        bio: user.bio || '',
        location: user.location || '',
        links: user.links || {},
        gamification: gamificationData
      }
    });
  } catch (error) {
    console.error('Get profile by email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate QR code for user profile
// @route   POST /api/users/generate-qrcode
// @access  Private
export const generateQRCode = async (req, res) => {
  try {
    // Get user id from auth middleware
    const userId = req.user.id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Get the frontend URL from environment or default to localhost:5173
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Create the profile URL with the frontend URL, not the API URL
    const profileUrl = `${frontendURL}/profile/${user.email}`;
    
    // Set options for QR code
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Set file paths
    const qrFileName = `qr_${userId}_${Date.now()}.png`;
    const qrFilePath = path.join(tempDir, qrFileName);
    
    // Generate QR code and save to file
    await QRCode.toFile(qrFilePath, profileUrl, qrOptions);
    
    // Upload to cloudinary
    const uploadResult = await cloudinary.v2.uploader.upload(qrFilePath, {
      folder: 'skillify-qrcodes',
      width: 300,
      height: 300,
      crop: 'fit'
    });
    
    // Update user with QR code URL
    user.qrCodeUrl = uploadResult.secure_url;
    await user.save();
    
    // Clean up temp file
    fs.unlink(qrFilePath, (err) => {
      if (err) console.error('Error deleting temp QR code file:', err);
    });
    
    res.status(200).json({
      success: true,
      qrCodeUrl: uploadResult.secure_url,
      message: 'QR code generated successfully'
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating QR code', 
      error: error.message 
    });
  }
};

// @desc    Get user's QR code
// @route   GET /api/users/qrcode
// @access  Private
export const getUserQRCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // If QR code doesn't exist, generate one
    if (!user.qrCodeUrl) {
      // Get the frontend URL from environment or default to localhost:5173
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      // Create the profile URL with the frontend URL, not the API URL
      const profileUrl = `${frontendURL}/profile/${user.email}`;
      
      // Set options for QR code
      const qrOptions = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Set file paths
      const qrFileName = `qr_${user.id}_${Date.now()}.png`;
      const qrFilePath = path.join(tempDir, qrFileName);
      
      // Generate QR code and save to file
      await QRCode.toFile(qrFilePath, profileUrl, qrOptions);
      
      // Upload to cloudinary
      const uploadResult = await cloudinary.v2.uploader.upload(qrFilePath, {
        folder: 'skillify-qrcodes',
        width: 300,
        height: 300,
        crop: 'fit'
      });
      
      // Update user with QR code URL
      user.qrCodeUrl = uploadResult.secure_url;
      await user.save();
      
      // Clean up temp file
      fs.unlink(qrFilePath, (err) => {
        if (err) console.error('Error deleting temp QR code file:', err);
      });
    }
    
    res.status(200).json({
      success: true,
      qrCodeUrl: user.qrCodeUrl
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving QR code', 
      error: error.message 
    });
  }
};

// @desc    Add education to user profile
// @route   POST /api/users/education
// @access  Private
export const addEducation = async (req, res) => {
  try {
    const { degree, university, location, graduationYear, startYear } = req.body;
    
    console.log('Adding education:', req.body);
    console.log('User ID:', req.user.id);
    
    if (!degree || !university) {
      return res.status(400).json({
        success: false,
        message: 'Please provide degree and university'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('Found user:', user._id);
    console.log('Current education:', user.education);
    
    // Add new education with a forced ObjectId
    const mongoose = await import('mongoose');
    
    // Create new education entry with explicit ID
    const newEducation = {
      _id: new mongoose.Types.ObjectId(), // Ensure a valid MongoDB ObjectId
      degree,
      university,
      location: location || '',
      graduationYear: graduationYear || '',
      startYear: startYear || ''
    };
    
    // Initialize education array if it doesn't exist
    if (!user.education) {
      user.education = [];
    }
    
    user.education.push(newEducation);
    
    await user.save();
    
    // Transform education array for response to include id property
    const transformedEducation = user.education.map(edu => ({
      id: edu._id.toString(),
      degree: edu.degree,
      university: edu.university,
      location: edu.location || '',
      graduationYear: edu.graduationYear || '',
      startYear: edu.startYear || ''
    }));
    
    console.log('Updated education:', transformedEducation);
    
    res.status(201).json({
      success: true,
      message: 'Education added successfully',
      education: transformedEducation
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Update education
// @route   PUT /api/users/education/:id
// @access  Private
export const updateEducation = async (req, res) => {
  try {
    const { degree, university, location, graduationYear, startYear } = req.body;
    
    console.log('Updating education:', req.params.id, req.body);
    console.log('User ID:', req.user.id);
    
    if (!degree || !university) {
      return res.status(400).json({
        success: false,
        message: 'Please provide degree and university'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('Current education:', user.education);
    
    // Find the education entry to update
    const educationId = req.params.id;
    const educationEntry = user.education.id(educationId);
    
    if (!educationEntry) {
      console.error(`No education found with ID: ${educationId}`);
      return res.status(404).json({
        success: false,
        message: 'Education entry not found'
      });
    }
    
    console.log('Found education to update:', educationEntry);
    
    // Update education fields
    educationEntry.degree = degree;
    educationEntry.university = university;
    educationEntry.location = location || '';
    educationEntry.graduationYear = graduationYear || '';
    educationEntry.startYear = startYear || '';
    
    await user.save();
    
    // Transform education array for response
    const transformedEducation = user.education.map(edu => ({
      id: edu._id.toString(),
      degree: edu.degree,
      university: edu.university,
      location: edu.location || '',
      graduationYear: edu.graduationYear || '',
      startYear: edu.startYear || ''
    }));
    
    console.log('Updated education:', transformedEducation);
    
    res.status(200).json({
      success: true,
      message: 'Education updated successfully',
      education: transformedEducation
    });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Delete education
// @route   DELETE /api/users/education/:id
// @access  Private
export const deleteEducation = async (req, res) => {
  try {
    console.log('Deleting education:', req.params.id);
    console.log('User ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('Current education:', user.education);
    
    // Find the education entry to delete
    const educationId = req.params.id;
    const educationEntry = user.education.id(educationId);
    
    if (!educationEntry) {
      console.error(`No education found with ID: ${educationId}`);
      return res.status(404).json({
        success: false,
        message: 'Education entry not found'
      });
    }
    
    console.log('Found education to delete:', educationEntry);
    
    // Remove the education entry
    educationEntry.deleteOne();
    await user.save();
    
    // Transform remaining education array for response
    const transformedEducation = user.education.map(edu => ({
      id: edu._id.toString(),
      degree: edu.degree,
      university: edu.university,
      location: edu.location || '',
      graduationYear: edu.graduationYear || '',
      startYear: edu.startYear || ''
    }));
    
    console.log('Remaining education:', transformedEducation);
    
    res.status(200).json({
      success: true,
      message: 'Education deleted successfully',
      education: transformedEducation
    });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Generate resume from user profile
// @route   POST /api/users/generate-resume
// @access  Private
export const generateResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user skills from UserSkill model
    const userSkills = await mongoose.model('UserSkill').find({ user: req.user.id })
      .populate('skill', 'name category description');
    
    console.log(`Found ${userSkills.length} user skills from database`);
    
    // Log the skills to verify what's being found
    console.log('User skills found:', userSkills.map(us => ({
      name: us.skill.name,
      category: us.skill.category,
      points: us.points
    })));
    
    // Get certificates separately
    const certificates = await mongoose.model('Certificate').find({ user: req.user.id });
    
    // Prepare user data for resume generation
    const userData = {
      personalInformation: {
        fullName: user.name,
        email: user.email,
        phoneNumber: '', // You might want to add this to user schema
        location: user.location,
        linkedIn: user.links.linkedin || null,
        gitHub: user.links.github || null,
        portfolio: user.links.portfolio || null
      },
      summary: user.bio || `Professional with experience in ${user.title || 'technology'}`,
      
      // Map user skills to the expected format
      skills: userSkills.map(userSkill => ({
        title: userSkill.skill.name,
        category: userSkill.skill.category || 'Other',
        level: userSkill.points >= 80 ? 'expert' :
               userSkill.points >= 60 ? 'advanced' :
               userSkill.points >= 40 ? 'intermediate' : 'beginner',
        experience: `${userSkill.points}/100`,
        description: userSkill.skill.description || `${userSkill.skill.name} skills`
      })),
      
      education: user.education.map(edu => ({
        degree: edu.degree,
        university: edu.university,
        location: edu.location,
        graduationYear: edu.graduationYear
      })),
      certifications: certificates.map(cert => ({
        title: cert.title,
        issuingOrganization: cert.issuer,
        year: new Date(cert.issueDate).getFullYear().toString()
      }))
    };
    
    // Generate resume data
    try {
      // Generate sample sections based on user data
      const resumeData = {
        data: {
          ...userData,
          
          // Add some generated sections based on the available info
          experience: [
            {
              jobTitle: user.title || "Professional",
              company: user.title ? `${user.title} Professional` : "Recent Company",
              location: user.location || "Remote",
              duration: "Current",
              responsibility: user.bio 
                ? user.bio 
                : `Professional with expertise in ${userData.skills.slice(0, 3).map(s => s.title).join(', ')}.`
            }
          ],
          projects: [
            {
              title: "Professional Portfolio",
              description: `Portfolio showcasing skills in ${userData.skills.slice(0, 3).map(s => s.title).join(', ')}`,
              technologiesUsed: userData.skills.slice(0, 6).map(s => s.title)
            }
          ],
          additionalSkills: "Team Collaboration, Git Version Control, REST API Design",
        },
        think: "Resume generated based on user profile data."
      };
      
      res.status(200).json({
        success: true,
        resume: resumeData
      });
    } catch (apiError) {
      console.error('Resume generation error:', apiError);
      res.status(500).json({ 
        success: false,
        message: 'Failed to generate resume', 
        error: apiError.message 
      });
    }
  } catch (error) {
    console.error('Generate resume error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get user's education
// @route   GET /api/users/education
// @access  Private
export const getUserEducation = async (req, res) => {
  try {
    console.log('Fetching education for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Make sure education exists as an array
    const educationArray = user.education || [];
    
    // Transform education array to include id property instead of _id
    const transformedEducation = educationArray.map(edu => ({
      id: edu._id.toString(),
      degree: edu.degree,
      university: edu.university,
      location: edu.location || '',
      graduationYear: edu.graduationYear || '',
      startYear: edu.startYear || ''
    }));
    
    console.log('Retrieved education data:', transformedEducation);
    
    res.status(200).json({
      success: true,
      education: transformedEducation
    });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
}; 