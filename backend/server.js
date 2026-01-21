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
  origin: [
    'https://minor-project-frontend-nine.vercel.app',  // ✅ YOUR ACTUAL FRONTEND URL
    'https://minor-project-frontend-nine.vercel.app',  // ✅ Without trailing slash
    'http://localhost:3000',                           // ✅ Local development
    'https://minor-project.vercel.app',                // ✅ Old URL (if exists)
    process.env.FRONTEND_URL                           // ✅ From environment variable
  ].filter(Boolean),                                   // ✅ Remove empty values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

// Middleware
app.use(cors(corsOptions));  // ✅ Use cors with options
app.use(express.json());

// ✅ **Health check endpoint**
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
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
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      attendance: '/api/attendance',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`🌐 Allowed origins: ${corsOptions.origin.join(', ')}`);
});