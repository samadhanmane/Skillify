// @desc    Get public certificate by ID
// @route   GET /api/certificates/public/:id
// @access  Public
export const getPublicCertificateById = async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    // Find the certificate
    const certificate = await Certificate.findById(certificateId)
      .populate('skills', 'name category')
      .populate('user', 'name profileImage');
    
    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }
    
    // Check if certificate is public
    if (!certificate.isPublic) {
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
        certificateImage: certificate.certificateImage, // Include certificate image URL
        certificateFile: certificate.certificateFile,   // Include certificate PDF URL
        fileType: certificate.fileType,                // Include file type
        credentialURL: certificate.credentialURL,      // Include credential URL
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