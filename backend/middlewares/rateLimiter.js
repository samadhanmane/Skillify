import rateLimit from 'express-rate-limit';

// Base rate limiter config
const baseOptions = {
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { 
    success: false, 
    message: 'Too many requests, please try again later.' 
  }
};

// General API limiter - 100 requests per minute
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per window
});

// Auth routes limiter - 10 requests per minute
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per window
  message: { 
    success: false, 
    message: 'Too many authentication attempts, please try again later.' 
  }
});

// ML routes limiter - 20 requests per minute
export const mlLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per window
  message: { 
    success: false, 
    message: 'Too many ML processing requests, please try again later.' 
  }
});

// Strict limiter for sensitive operations - 5 requests per minute
export const strictLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per window
  message: { 
    success: false, 
    message: 'Too many sensitive operations, please try again later.' 
  }
});

export default {
  apiLimiter,
  authLimiter,
  mlLimiter,
  strictLimiter
}; 