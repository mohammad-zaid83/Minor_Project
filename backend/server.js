const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

// ✅ **CORRECTED CORS CONFIGURATION**
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    // ✅ FIXED: Clear allowed origins list
    const allowedOrigins = [
      'https://minor-project-frontend-nine.vercel.app',  // Your Vercel frontend
      'http://localhost:3000',                           // Local frontend
      'http://localhost:5173',                           // Vite dev server
      'http://127.0.0.1:3000',                          // Alternative localhost
      'http://localhost:5000'                            // For testing
    ];
    
    // ✅ FIXED: Only allow specific origins, NOT all vercel.app
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

// ✅ **Health check endpoint - UPDATED**
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Student Attendance System Backend',
    frontend: 'https://minor-project-frontend-nine.vercel.app',
    backend: 'https://minor-project-backend-9u7l.onrender.com',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cors: 'enabled',
    timestamp: new Date().toISOString(),
    allowed_origins: [
      'https://minor-project-frontend-nine.vercel.app',
      'http://localhost:3000'
    ]
  });
});

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,  // Increased timeout
  socketTimeoutMS: 45000
})
  .then(() => console.log('✅ MongoDB Atlas Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('💡 Tip: Check MONGO_URI in .env file');
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// ✅ **TEST ROUTES FOR ATTENDANCE**
app.get('/api/test/attendance/student/:id', (req, res) => {
  const studentId = req.params.id;
  console.log(`📊 Test attendance request for student: ${studentId}`);
  
  // Test data
  res.json({
    success: true,
    message: 'Test attendance data',
    studentId: studentId,
    attendance: [
      {
        id: 1,
        subject: 'Mathematics',
        date: '2024-01-15',
        status: 'present',
        teacher: 'Dr. Sharma'
      },
      {
        id: 2,
        subject: 'Physics',
        date: '2024-01-15',
        status: 'present',
        teacher: 'Prof. Verma'
      }
    ],
    total: 2
  });
});

// Home route
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Student Attendance System API',
    version: '1.0.0',
    frontend: 'https://minor-project-frontend-nine.vercel.app',
    backend: 'https://minor-project-backend-9u7l.onrender.com',
    endpoints: {
      health: '/api/health',
      test: '/api/test/attendance/student/:id',
      auth: '/api/auth',
      attendance: '/api/attendance'
    },
    cors: {
      enabled: true,
      allowed_origins: ['Vercel Frontend', 'localhost:3000']
    }
  });
});

// ✅ **SIMPLE CORS HEADERS FOR ALL REQUESTS (Extra Safety)**
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://minor-project-frontend-nine.vercel.app',
    'http://localhost:3000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    availableEndpoints: [
      '/',
      '/api/health',
      '/api/auth',
      '/api/attendance',
      '/api/test/attendance/student/:id'
    ],
    hint: 'Check spelling and HTTP method (GET/POST)'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend Server running on: http://${HOST}:${PORT}`);
  console.log(`🌐 Live Backend: https://minor-project-backend-9u7l.onrender.com`);
  console.log(`📱 Frontend: https://minor-project-frontend-nine.vercel.app`);
  console.log(`✅ CORS enabled for:`);
  console.log(`   - https://minor-project-frontend-nine.vercel.app`);
  console.log(`   - http://localhost:3000`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/api/test/attendance/student/1`);
});