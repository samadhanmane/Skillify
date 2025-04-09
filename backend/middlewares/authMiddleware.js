import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - verify token and set req.user
export const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token and make sure user exists
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found or token is invalid' 
        });
      }
      
      // Set user on request object
      req.user = user;
      
      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Token expired' 
        });
      }
      
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, authentication failed' 
      });
    }
  } else {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token provided' 
    });
  }
};

// Admin middleware - verify user is an admin
export const admin = (req, res, next) => {
  // Check both methods of admin identification
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
    // Log for debugging
    console.log('Admin access granted to:', req.user.email);
    next();
  } else {
    // Log for debugging
    console.log('Admin access denied for:', req.user?.email, 'Role:', req.user?.role, 'isAdmin:', req.user?.isAdmin);
    return res.status(403).json({
      success: false,
      message: 'Not authorized as an admin'
    });
  }
};

// Admin middleware for route protection
export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`Error: ${err.message}`);
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}; 