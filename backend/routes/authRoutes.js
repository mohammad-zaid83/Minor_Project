// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, rollNumber, course, semester, phone } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Name, email and password are required' 
            });
        }

        // Check if user exists
        let user = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { rollNumber: rollNumber }
            ]
        });

        if (user) {
            let field = user.email === email.toLowerCase() ? 'Email' : 'Roll Number';
            return res.status(400).json({ 
                success: false,
                message: `${field} already exists` 
            });
        }

        // Create user object
        const userData = {
            name,
            email: email.toLowerCase(),
            password,
            role: role || 'student',
            course: course || 'BCA',
            phone
        };

        // Add student-specific fields
        if (role === 'student' || !role) {
            if (!rollNumber) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Roll number is required for students' 
                });
            }
            userData.rollNumber = rollNumber;
            userData.semester = semester || 1;
        }

        // Create new user
        user = new User(userData);
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_development',
            { expiresIn: '7d' }
        );

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Registration Error:', error);
        
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                success: false,
                message: `${field} already exists` 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ 
                success: false,
                message: 'Account is deactivated. Please contact admin.' 
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_development',
            { expiresIn: '7d' }
        );

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided' 
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_development'
        );

        // Find user
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
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
        
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Check if email exists
// @route   POST /api/auth/check-email
// @access  Public
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        
        res.json({
            success: true,
            exists: !!user
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;