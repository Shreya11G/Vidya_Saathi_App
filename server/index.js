import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import streakRoutes from './routes/streakRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;




/**
 * Security Middleware Setup
 * - helmet: Sets various HTTP headers for security
 * - rateLimit: Prevents brute force attacks
 * - CORS: Controls cross-origin requests
 */
app.use(helmet());

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration for secure cross-origin requests
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Body Parsing Middleware
 * - express.json(): Parses JSON payloads
 * - express.urlencoded(): Parses URL-encoded payloads
 * - cookieParser(): Parses cookies from request headers
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * MongoDB Connection
 * Connects to MongoDB database with proper error handling
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// API Routes Setup
// All routes are prefixed with /api for clear API structure
 
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quiz', quizRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'VidyaSathi API is running',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
// Catches all unhandled errors and returns appropriate responses
 
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Handle 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});


// Start Server
 //Initialize the server and listen on specified port
app.listen(PORT, () => {
  console.log(` VidyaSathi Server is running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

//shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});