const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

// ✅ **FIXED CORS CONFIGURATION**
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://minor-project-frontend-nine.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('❌ Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// ✅ **Health check endpoint**
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  let dbStatusText = 'disconnected';
  
  switch(dbStatus) {
    case 0: dbStatusText = 'disconnected'; break;
    case 1: dbStatusText = 'connected'; break;
    case 2: dbStatusText = 'connecting'; break;
    case 3: dbStatusText = 'disconnecting'; break;
  }
  
  res.json({
    status: 'OK',
    message: 'Student Attendance System Backend',
    frontend: 'https://minor-project-frontend-nine.vercel.app',
    backend: 'https://minor-project-backend-9u7l.onrender.com',
    database: dbStatusText,
    cors: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// ✅ **FIXED MongoDB Connection - Removed deprecated options**
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('💡 Troubleshooting Tips:');
    console.log('1. Check MONGO_URI in Render.com environment variables');
    console.log('2. Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0');
    console.log('3. Check MongoDB Atlas cluster is running');
  });

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// ✅ **Test Routes for Quick Verification**
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is working!',
    endpoints: {
      health: '/api/health',
      test_attendance: '/api/test/attendance/student/:id',
      auth: '/api/auth',
      attendance: '/api/attendance'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test attendance endpoint with sample data
app.get('/api/test/attendance/student/:id', (req, res) => {
  const studentId = req.params.id;
  
  const sampleAttendance = [
    {
      id: 1,
      studentId: studentId,
      subject: 'Mathematics',
      date: new Date().toISOString(),
      status: 'present',
      teacher: 'Dr. Sharma',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      studentId: studentId,
      subject: 'Physics',
      date: new Date(Date.now() - 86400000).toISOString(),
      status: 'present',
      teacher: 'Prof. Verma',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      studentId: studentId,
      subject: 'Chemistry',
      date: new Date(Date.now() - 172800000).toISOString(),
      status: 'absent',
      teacher: 'Dr. Gupta',
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ];
  
  res.json({
    success: true,
    message: 'Test attendance data',
    studentId: studentId,
    attendance: sampleAttendance,
    statistics: {
      totalClasses: 3,
      present: 2,
      absent: 1,
      percentage: '66.7'
    },
    timestamp: new Date().toISOString()
  });
});

// Home route
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Student Attendance System API',
    version: '1.0.0',
    developer: 'Your Name',
    frontend: 'https://minor-project-frontend-nine.vercel.app',
    endpoints: {
      home: '/',
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth',
      attendance: '/api/attendance'
    },
    status: {
      server: 'running',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      cors: 'enabled'
    },
    documentation: 'Check README.md for API documentation'
  });
});

// Simple echo endpoint for testing
app.post('/api/echo', (req, res) => {
  res.json({
    success: true,
    message: 'Request received successfully',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/test',
      'GET /api/test/attendance/student/:id',
      'POST /api/echo'
    ],
    hint: 'Check the route and HTTP method (GET/POST/PUT/DELETE)'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Closing HTTP server...');
  server.close(() => {
    console.log('💤 HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('📦 MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Start server
const PORT = process.env.PORT || 10000; // Render default port
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log('🚀 BACKEND SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log(`📡 Server URL: http://${HOST}:${PORT}`);
  console.log(`🌐 Live URL: https://minor-project-backend-9u7l.onrender.com`);
  console.log(`📱 Frontend: https://minor-project-frontend-nine.vercel.app`);
  console.log(`🔗 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
  console.log('✅ Test these endpoints:');
  console.log(`1. Health Check: https://minor-project-backend-9u7l.onrender.com/api/health`);
  console.log(`2. Test Data: https://minor-project-backend-9u7l.onrender.com/api/test/attendance/student/123`);
  console.log(`3. API Info: https://minor-project-backend-9u7l.onrender.com/`);
  console.log('='.repeat(50));
});