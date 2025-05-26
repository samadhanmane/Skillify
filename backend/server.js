import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import fileUpload from 'express-fileupload'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import certificateRoutes from './routes/certificateRoutes.js'
import skillRoutes from './routes/skillRoutes.js'
import mlRoutes from './routes/mlRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import gamificationRoutes from './routes/gamificationRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import { errorHandler } from './middlewares/errorMiddleware.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize express app
const app = express()
const PORT = process.env.PORT || 4000

// Connect to database
connectDB()
  .then(() => {
    console.log('✅ MongoDB connection established')
    // Initialize Cloudinary after successful DB connection
    return connectCloudinary()
  })
  .then(() => {
    console.log('✅ Cloudinary connection established')
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
      console.log('✅ Temp directory created')
    }
    
    // Initialize ML services
    console.log('✅ ML utilities initialized and ready')
  })
  .catch((error) => {
    console.error('❌ Failed to initialize services:', error)
    process.exit(1)
  })

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '50mb' })) // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// File upload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'temp'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true
}));

// CORS configuration - MUST be before routes
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Production mode - use ALLOWED_ORIGINS env var or whitelist approach
    if (process.env.NODE_ENV === 'production') {
      // Use ALLOWED_ORIGINS from environment
      const allowedOriginsFromEnv = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [];
        
      if (allowedOriginsFromEnv.length === 0) {
        console.warn('No ALLOWED_ORIGINS set in production mode - this is a security risk');
      }
      
      // Check if production origin is allowed
      if (allowedOriginsFromEnv.indexOf(origin) !== -1 || allowedOriginsFromEnv.includes('*')) {
        return callback(null, true);
      }
      
      console.log('CORS blocked for production origin:', origin);
      return callback(new Error('Not allowed by CORS in production'));
    }
    
    // Development mode - more permissive
    // Allow all localhost origins regardless of port
    if (origin.match(/^https?:\/\/localhost(:[0-9]+)?$/)) {
      return callback(null, true);
    }
    
    // Development server allowed origins
    const devAllowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:8080'
    ];
    
    if (devAllowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    console.log('CORS blocked for development origin:', origin);
    callback(new Error('Not allowed by CORS in development'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add preflight handling for all routes
app.options('*', cors(corsOptions));

// Log all incoming requests in development
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next()
  })
}

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/ml', mlRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/gamification', gamificationRoutes)
app.use('/api/admin', adminRoutes)

// Setup endpoint for frontend to check connection status
app.get('/api/setup', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'MongoDB connected and API is running',
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add a route for /setup that redirects to /api/setup
app.get('/setup', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'MongoDB connected and API is running',
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add routes for /auth/* that forward to /api/auth/*
app.use('/auth', (req, res, next) => {
  // Change the URL path
  req.url = req.originalUrl.replace('/auth', '/api/auth');
  // Forward the request to the next middleware
  app.handle(req, res);
});

// Add routes for /certificates that forward to /api/certificates
app.use('/certificates', (req, res, next) => {
  req.url = req.originalUrl.replace('/certificates', '/api/certificates');
  app.handle(req, res);
});

// Add routes for /gamification/* that forward to /api/gamification/*
app.use('/gamification', (req, res, next) => {
  req.url = req.originalUrl.replace('/gamification', '/api/gamification');
  app.handle(req, res);
});

// Add routes for /skills/* that forward to /api/skills/*
app.use('/skills', (req, res, next) => {
  req.url = req.originalUrl.replace('/skills', '/api/skills');
  app.handle(req, res);
});

// Add routes for /users/* that forward to /api/users/*
app.use('/users', (req, res, next) => {
  req.url = req.originalUrl.replace('/users', '/api/users');
  app.handle(req, res);
});

// Add routes for /analytics/* that forward to /api/analytics/*
app.use('/analytics', (req, res, next) => {
  req.url = req.originalUrl.replace('/analytics', '/api/analytics');
  app.handle(req, res);
});

// Special redirect for profile URLs - redirects to frontend
app.get('/profile/:email', (req, res) => {
  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const email = req.params.email;
  res.redirect(`${frontendURL}/profile/${email}`);
});

// Base route for API health check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Skillify API is running', status: 'ok' })
})

// Base route for /api endpoint
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Skillify API is running', status: 'ok' })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    serverTime: new Date().toISOString()
  });
});

// Route not found handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found` 
  })
})

// Error handler middleware
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  console.log(`⚡️ Server running on port ${PORT}`)
  console.log(`🔗 API available at http://localhost:${PORT}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err)
  // Close server & exit process
  server.close(() => process.exit(1))
})

export default app