// ==================== DNS FIX - Add this at the VERY TOP ====================
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import aiRoutes from './routes/ai';
import reviewRoutes from './routes/reviews';

// Load environment variables
dotenv.config();

// ==================== DEBUG ENVIRONMENT VARIABLES ====================
console.log('='.repeat(60));
console.log('🔍 ENVIRONMENT VARIABLES CHECK');
console.log('='.repeat(60));

// Check Groq API Key
const groqApiKey = process.env.GROQ_API_KEY;
console.log('📡 GROQ_API_KEY:', groqApiKey ? '✅ SET' : '❌ NOT SET');
if (groqApiKey) {
  console.log('   - Prefix:', groqApiKey.substring(0, 5) + '...');
  console.log('   - Length:', groqApiKey.length);
  console.log('   - Starts with gsk_:', groqApiKey.startsWith('gsk_'));
} else {
  console.log('   - ⚠️  Groq API key not found in environment variables!');
}

// Check other keys
console.log('📡 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('📡 HF_API_KEY:', process.env.HF_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('📡 JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('📡 MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET');
console.log('='.repeat(60));

// Initialize express app
const app = express();

// ✅ FIX: Parse PORT as number
const PORT: number = parseInt(process.env.PORT || '5000', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/textile_marketplace';
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ==================== MIDDLEWARE ====================

// ✅ CORS - Allow all origins for testing (like your other project)
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any origin for testing
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));

// Security middleware (simplified for testing)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginEmbedderPolicy: { policy: "require-corp" }
}));

// Compression for faster responses
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== DATABASE CONNECTION ====================

// ✅ Connect to MongoDB with DNS fix and proper logging
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('🔍 MONGODB_URI exists?', uri ? 'Yes' : 'No');
    
    if (!uri) {
      console.error('❌ MONGODB_URI is not defined');
      return;
    }
    
    console.log('🔍 Attempting to connect to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      maxPoolSize: 10,
      minPoolSize: 2
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.db?.databaseName}`);
    console.log(`🔗 Connection state: ${mongoose.connection.readyState}`);
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB');
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`🛑 Received ${signal}. Closing connections...`);
  try {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ==================== ROUTES ====================

// ✅ Simple health check (for load balancers) - like your other project
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ✅ Root endpoint - like your other project
app.get('/', (req, res) => {
  res.json({
    name: 'TextileHub API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Detailed health check endpoint
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const healthCheck = {
    success: true,
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: NODE_ENV,
    mongodb: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      database: mongoose.connection.db?.databaseName || 'unknown',
      host: mongoose.connection.host || 'unknown'
    },
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
    },
    version: '1.0.0'
  };
  res.status(200).json(healthCheck);
});

// AI Health Check with Key Info
app.get('/api/ai/health', (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  res.json({
    status: 'OK',
    groq: apiKey ? 'Configured ✅' : 'Not Configured ❌',
    keyPrefix: apiKey ? apiKey.substring(0, 5) + '...' : 'None',
    keyLength: apiKey ? apiKey.length : 0,
    keyFormat: apiKey ? (apiKey.startsWith('gsk_') ? 'Valid format ✅' : 'Invalid format ❌') : 'N/A',
    timestamp: new Date().toISOString(),
  });
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewRoutes);

// ==================== ERROR HANDLING ====================

// ✅ 404 handler for undefined routes - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }
  
  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      details: `Invalid ${err.path}: ${err.value}`
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: 'Duplicate key error',
      details: `${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Please log in again.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired. Please log in again.'
    });
  }

  if (err.name === 'NotBeforeError') {
    return res.status(401).json({
      success: false,
      error: 'Token not active yet. Please wait.'
    });
  }
  
  // Default error response
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== START SERVER ====================

// ✅ Connect to database first, then start server
connectDB();

// ✅ Start server listening on 0.0.0.0 (like your other project)
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Client URL: ${CLIENT_URL}`);
  console.log('='.repeat(60));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

export default app;