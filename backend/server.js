// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

// ✅ **ENHANCED SECURITY HEADERS**
app.use(helmet({
  contentSecurityPolicy: false, // Adjust as needed for your app
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ✅ **REQUEST LOGGING**
app.use(morgan('combined'));

// ✅ **IMPROVED CORS CONFIGURATION**
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://minor-project-frontend-nine.vercel.app',
      'https://minor-project-frontend.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // Check if origin is in allowed list or starts with allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    );
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.log('❌ Blocked by CORS Policy:', origin);
    callback(new Error(`Origin '${origin}' not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-requested-with'],
  exposedHeaders: ['x-auth-token'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight requests

// ✅ **RATE LIMITING - Prevent Abuse**
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', limiter); // Apply to auth routes
app.use('/api/attendance', limiter); // Apply to attendance routes

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ **ENHANCED HEALTH CHECK ENDPOINT**
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  let dbStatusText = 'disconnected';
  let dbColor = '🔴';
  
  switch(dbStatus) {
    case 0: 
      dbStatusText = 'disconnected'; 
      dbColor = '🔴';
      break;
    case 1: 
      dbStatusText = 'connected'; 
      dbColor = '🟢';
      break;
    case 2: 
      dbStatusText = 'connecting'; 
      dbColor = '🟡';
      break;
    case 3: 
      dbStatusText = 'disconnecting'; 
      dbColor = '🟠';
      break;
  }
  
  const systemInfo = {
    // Server info
    server: {
      status: '🟢 Online',
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      pid: process.pid
    },
    
    // Database info
    database: {
      status: `${dbColor} ${dbStatusText}`,
      host: mongoose.connection.host || 'Not connected',
      name: mongoose.connection.name || 'Not connected',
      models: Object.keys(mongoose.connection.models),
      collections: mongoose.connection.readyState === 1 ? 'Loading...' : []
    },
    
    // Deployment info
    deployment: {
      environment: process.env.NODE_ENV || 'development',
      frontend: 'https://minor-project-frontend-nine.vercel.app',
      backend: 'https://minor-project-backend-9u7l.onrender.com',
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    
    // API info
    api: {
      totalEndpoints: 15, // Update this based on actual count
      status: 'operational',
      version: '1.0.0'
    }
  };
  
  // Try to get collections if DB is connected
  if (mongoose.connection.readyState === 1) {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      systemInfo.database.collections = collections.map(c => c.name);
    } catch (err) {
      systemInfo.database.collections = ['Error fetching collections'];
    }
  }
  
  res.json(systemInfo);
});

// ✅ **IMPROVED MONGODB CONNECTION WITH RETRY LOGIC**
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔗 Attempting MongoDB connection (${i + 1}/${retries})...`);
      
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      });
      
      console.log('✅ MongoDB Atlas Connected Successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`📍 Host: ${mongoose.connection.host}`);
      console.log(`📈 Models: ${Object.keys(mongoose.connection.models).join(', ')}`);
      
      return;
    } catch (error) {
      console.error(`❌ MongoDB Connection Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('💀 All MongoDB connection attempts failed');
        console.log('\n💡 TROUBLESHOOTING TIPS:');
        console.log('1. Check MONGO_URI in Render.com environment variables');
        console.log('2. Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0');
        console.log('3. Check MongoDB Atlas cluster is running');
        console.log('4. Verify internet connectivity');
        console.log('5. Check if database user has correct permissions');
        process.exit(1);
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
  console.log('🔄 Attempting to reconnect in 5 seconds...');
  setTimeout(() => connectDB(3), 5000);
});

// Connect to database
connectDB();

// ✅ **ROUTES**
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// ✅ **TEST ROUTES FOR QUICK VERIFICATION**
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '🎓 Student Attendance System API v1.0',
    endpoints: {
      health: 'GET /api/health',
      test_data: 'GET /api/test/attendance/student/:id',
      auth_register: 'POST /api/auth/register',
      auth_login: 'POST /api/auth/login',
      auth_me: 'GET /api/auth/me',
      attendance_qr_generate: 'POST /api/attendance/generate-qr',
      attendance_mark: 'POST /api/attendance/mark',
      attendance_report: 'GET /api/attendance/report/:studentId'
    },
    status: {
      server: '🟢 Running',
      database: mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected',
      cors: '🟢 Enabled',
      rate_limit: '🟢 Active'
    },
    timestamp: new Date().toISOString()
  });
});

// Test attendance endpoint with sample data
app.get('/api/test/attendance/student/:id', (req, res) => {
  const studentId = req.params.id;
  const now = new Date();
  
  const sampleAttendance = [
    {
      id: 1,
      studentId: studentId,
      subject: 'Mathematics',
      subjectCode: 'MATH101',
      date: now.toISOString().split('T')[0],
      time: '09:00 AM - 10:00 AM',
      status: 'present',
      teacher: 'Dr. Sharma',
      room: 'Room 101',
      markedAt: now.toISOString(),
      deviceId: 'sample-device-001'
    },
    {
      id: 2,
      studentId: studentId,
      subject: 'Physics',
      subjectCode: 'PHY102',
      date: new Date(now.getTime() - 86400000).toISOString().split('T')[0],
      time: '10:00 AM - 11:00 AM',
      status: 'present',
      teacher: 'Prof. Verma',
      room: 'Lab 201',
      markedAt: new Date(now.getTime() - 86400000).toISOString(),
      deviceId: 'sample-device-001'
    },
    {
      id: 3,
      studentId: studentId,
      subject: 'Chemistry',
      subjectCode: 'CHEM103',
      date: new Date(now.getTime() - 172800000).toISOString().split('T')[0],
      time: '11:00 AM - 12:00 PM',
      status: 'absent',
      teacher: 'Dr. Gupta',
      room: 'Lab 301',
      markedAt: null,
      reason: 'Not marked'
    }
  ];
  
  // Calculate statistics
  const totalClasses = sampleAttendance.length;
  const presentCount = sampleAttendance.filter(a => a.status === 'present').length;
  const absentCount = totalClasses - presentCount;
  const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;
  
  res.json({
    success: true,
    message: 'Test attendance data generated successfully',
    student: {
      id: studentId,
      name: 'Test Student',
      rollNumber: 'BCA2023001',
      course: 'BCA',
      semester: 3
    },
    attendance: sampleAttendance,
    statistics: {
      totalClasses,
      present: presentCount,
      absent: absentCount,
      percentage: `${percentage}%`,
      lastUpdated: now.toISOString()
    },
    metadata: {
      generatedAt: now.toISOString(),
      isSampleData: true,
      note: 'This is test data. Connect to MongoDB for real data.'
    }
  });
});

// ✅ **HOME ROUTE WITH BETTER INFO**
app.get('/', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/', description: 'API Information' },
    { method: 'GET', path: '/api/health', description: 'System Health Check' },
    { method: 'GET', path: '/api/test', description: 'Test all endpoints' },
    { method: 'POST', path: '/api/auth/register', description: 'Register new user' },
    { method: 'POST', path: '/api/auth/login', description: 'User login' },
    { method: 'GET', path: '/api/auth/me', description: 'Get current user' },
    { method: 'POST', path: '/api/attendance/generate-qr', description: 'Generate QR for attendance' },
    { method: 'POST', path: '/api/attendance/mark', description: 'Mark attendance via QR scan' },
    { method: 'GET', path: '/api/test/attendance/student/:id', description: 'Test attendance data' }
  ];
  
  res.json({
    message: '🎓 Student Daily Attendance System API',
    version: '1.0.0',
    description: 'QR code-based digital attendance system for educational institutions',
    developer: 'Your Team Name',
    links: {
      frontend: 'https://minor-project-frontend-nine.vercel.app',
      backend: 'https://minor-project-backend-9u7l.onrender.com',
      documentation: '/api/test',
      health: '/api/health',
      github: 'Your GitHub Repository URL'
    },
    status: {
      server: mongoose.connection.readyState === 1 ? '🟢 Operational' : '🔴 Maintenance',
      database: mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected',
      cors: '🟢 Enabled',
      environment: process.env.NODE_ENV || 'development'
    },
    endpoints: endpoints,
    usage: {
      note: 'Use Authorization header for protected routes: "Authorization: Bearer <token>"',
      example: 'curl -H "Authorization: Bearer your_token" https://minor-project-backend-9u7l.onrender.com/api/auth/me'
    },
    support: {
      email: 'your-email@example.com',
      issues: 'GitHub Issues URL'
    },
    timestamp: new Date().toISOString()
  });
});

// ✅ **ECHO ENDPOINT FOR TESTING**
app.post('/api/echo', (req, res) => {
  const requestInfo = {
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Request received successfully',
    request: requestInfo,
    server: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// ✅ **404 HANDLER WITH BETTER MESSAGES**
app.use((req, res) => {
  const suggestions = {
    '/api/auth/register': 'Register a new user (POST)',
    '/api/auth/login': 'Login user (POST)',
    '/api/health': 'Check system health (GET)',
    '/api/test': 'See all available endpoints (GET)'
  };
  
  res.status(404).json({ 
    success: false,
    message: `Endpoint '${req.method} ${req.url}' not found`,
    suggestions: suggestions,
    hint: 'Check the route and HTTP method. Common mistake: Forgetting /api prefix',
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/test/attendance/student/:id',
      'POST /api/echo'
    ],
    documentation: 'Visit /api/test for complete endpoint list'
  });
});

// ✅ **GLOBAL ERROR HANDLER**
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      success: false,
      message: 'CORS Error: Origin not allowed',
      allowedOrigins: [
        'https://minor-project-frontend-nine.vercel.app',
        'http://localhost:3000'
      ],
      yourOrigin: req.headers.origin || 'Not provided'
    });
  }
  
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    requestId: req.headers['x-request-id'] || 'N/A',
    timestamp: new Date().toISOString()
  });
});

// ✅ **GRACEFUL SHUTDOWN HANDLER**
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close HTTP server
    server.close(() => {
      console.log('💤 HTTP server closed');
    });
    
    // Close MongoDB connection
    await mongoose.connection.close(false);
    console.log('📦 MongoDB connection closed');
    
    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// ✅ **START SERVER**
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const startTime = new Date();
  
  console.log('='.repeat(60));
  console.log('🚀 STUDENT ATTENDANCE SYSTEM BACKEND');
  console.log('='.repeat(60));
  console.log(`📡 Local URL: http://${HOST}:${PORT}`);
  console.log(`🌐 Live URL: https://minor-project-backend-9u7l.onrender.com`);
  console.log(`📱 Frontend: https://minor-project-frontend-nine.vercel.app`);
  console.log(`🔗 MongoDB: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
  console.log(`🛡️ Security: CORS Enabled | Rate Limiting Active`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started: ${startTime.toLocaleString()}`);
  console.log('='.repeat(60));
  console.log('✅ QUICK TEST ENDPOINTS:');
  console.log(`1. Health Check:    https://minor-project-backend-9u7l.onrender.com/api/health`);
  console.log(`2. API Info:        https://minor-project-backend-9u7l.onrender.com/`);
  console.log(`3. Test Data:       https://minor-project-backend-9u7l.onrender.com/api/test/attendance/student/123`);
  console.log(`4. All Endpoints:   https://minor-project-backend-9u7l.onrender.com/api/test`);
  console.log('='.repeat(60));
  console.log('📋 To test authentication:');
  console.log('   curl -X POST https://minor-project-backend-9u7l.onrender.com/api/auth/register \\');
  console.log('        -H "Content-Type: application/json" \\');
  console.log('        -d \'{"name":"Test","email":"test@example.com","password":"password123"}\'');
  console.log('='.repeat(60));
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('💡 Try:');
    console.log('   1. Change PORT in .env file');
    console.log('   2. Kill process using port: lsof -ti:${PORT} | xargs kill -9');
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Export for testing
module.exports = app;