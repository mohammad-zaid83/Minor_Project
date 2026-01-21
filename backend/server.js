const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

// ✅ **BEST CORS CONFIGURATION - With YOUR correct URLs**
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    // Allow specific frontend URLs
    const allowedOrigins = [
      'https://minor-project-frontend-nine.vercel.app',  // ✅ YOUR FRONTEND
      'https://minor-project-frontend-nine.vercel.app',  // ✅ Without slash
      'http://localhost:3000',                           // ✅ Local development
      'https://minor-project.vercel.app',                // ✅ Old URL
      'http://localhost:5000'                            // ✅ Backend local
    ];
    
    if (allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.includes('localhost:')) {
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
  res.json({
    status: 'OK',
    message: 'Student Attendance System Backend',
    frontend: 'https://minor-project-frontend-nine.vercel.app',
    backend: 'https://minor-project-backend-9u7l.onrender.com',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
  .then(() => console.log('✅ MongoDB Atlas Connected'))
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Student Attendance System API',
    version: '1.0.0',
    frontend: 'https://minor-project-frontend-nine.vercel.app',
    backend: 'https://minor-project-backend-9u7l.onrender.com',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      attendance: '/api/attendance',
      login: '/api/auth/login',
      register: '/api/auth/register'
    }
  });
});

// Test login endpoint (for testing)
app.post('/api/test-login', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    user: { id: 'test123', name: 'Test User', role: 'student' },
    token: 'test-jwt-token-123'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    availableEndpoints: ['/api/health', '/api/auth', '/api/attendance'] 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server: http://localhost:${PORT}`);
  console.log(`🌐 Live Backend: https://minor-project-backend-9u7l.onrender.com`);
  console.log(`📱 Frontend: https://minor-project-frontend-nine.vercel.app`);
  console.log(`✅ CORS enabled for Vercel and localhost`);
});