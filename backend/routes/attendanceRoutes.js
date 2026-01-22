const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Middleware to verify token
const { auth } = require('../middleware/auth');

// ✅ FIX 1: Add student/:id route for frontend
// @route   GET /api/attendance/student/:id
// @desc    Get attendance for specific student by ID (for dashboard)
// @access  Student only (their own data)
router.get('/student/:id', auth, async (req, res) => {
    try {
        const requestedStudentId = req.params.id;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        // Check if user is accessing their own data or is admin/teacher
        if (currentUserRole === 'student' && requestedStudentId !== currentUserId) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. You can only view your own attendance.' 
            });
        }

        const { subject } = req.query;
        
        let query = { studentId: requestedStudentId };
        
        // Subject filter
        if (subject && subject !== 'all') {
            query.subject = subject;
        }

        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .limit(50);

        // Calculate statistics
        const totalClasses = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            attendance,
            statistics: {
                totalClasses,
                present: presentCount,
                absent: totalClasses - presentCount,
                percentage
            },
            count: attendance.length,
            studentId: requestedStudentId
        });

    } catch (error) {
        console.error('Get attendance by ID error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// @route   GET /api/attendance/student
// @desc    Get attendance for current student (from token)
// @access  Student only
router.get('/student', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Students only.' 
            });
        }

        const { subject, startDate, endDate } = req.query;
        
        let query = { studentId: req.user.id };
        
        // Subject filter
        if (subject && subject !== 'all') {
            query.subject = subject;
        }
        
        // Date filter
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .limit(100);

        // Calculate statistics
        const totalClasses = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            attendance,
            statistics: {
                totalClasses,
                present: presentCount,
                absent: totalClasses - presentCount,
                percentage
            },
            count: attendance.length
        });

    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ FIX 2: Add test endpoint for debugging
// @route   GET /api/attendance/test/:id
// @desc    Test endpoint for attendance (no auth required for testing)
// @access  Public (for testing only)
router.get('/test/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Sample data for testing
        const sampleAttendance = [
            {
                _id: '1',
                studentId: studentId,
                studentName: 'John Doe',
                rollNumber: '2023001',
                subject: 'Mathematics',
                date: new Date(),
                status: 'present',
                markedBy: 'teacher123',
                sessionId: 'QR_12345'
            },
            {
                _id: '2',
                studentId: studentId,
                studentName: 'John Doe',
                rollNumber: '2023001',
                subject: 'Physics',
                date: new Date(Date.now() - 86400000), // Yesterday
                status: 'present',
                markedBy: 'teacher456',
                sessionId: 'QR_12346'
            },
            {
                _id: '3',
                studentId: studentId,
                studentName: 'John Doe',
                rollNumber: '2023001',
                subject: 'Chemistry',
                date: new Date(Date.now() - 172800000), // 2 days ago
                status: 'absent',
                markedBy: 'teacher789',
                sessionId: 'QR_12347'
            }
        ];

        const totalClasses = sampleAttendance.length;
        const presentCount = sampleAttendance.filter(a => a.status === 'present').length;
        const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            message: 'Test attendance data',
            attendance: sampleAttendance,
            statistics: {
                totalClasses,
                present: presentCount,
                absent: totalClasses - presentCount,
                percentage
            },
            note: 'This is sample data for testing'
        });

    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ FIX 3: Health check for attendance routes
// @route   GET /api/attendance/health
// @desc    Health check for attendance routes
// @access  Public
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Attendance routes are working',
        endpoints: {
            studentById: 'GET /api/attendance/student/:id',
            student: 'GET /api/attendance/student',
            test: 'GET /api/attendance/test/:id',
            generateQR: 'POST /api/attendance/generate-qr',
            scan: 'POST /api/attendance/scan',
            teacher: 'GET /api/attendance/teacher/:subject'
        },
        timestamp: new Date().toISOString()
    });
});

// @route   POST /api/attendance/generate-qr
// @desc    Generate QR code for attendance
// @access  Teacher only
router.post('/generate-qr', auth, async (req, res) => {
    try {
        // Check if user is teacher
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Teachers only.' 
            });
        }

        const { subject, duration = 10 } = req.body; // duration in minutes
        
        // Create unique session ID
        const sessionId = `QR_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // QR data
        const qrData = {
            sessionId,
            teacherId: req.user.id,
            teacherName: req.user.name,
            subject,
            expiresAt: Date.now() + (duration * 60000),
            timestamp: new Date().toISOString()
        };

        // Generate QR code
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

        res.json({
            success: true,
            message: 'QR code generated successfully',
            qrCode,
            sessionId,
            expiresIn: duration,
            expiresAt: qrData.expiresAt,
            data: qrData
        });

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// @route   POST /api/attendance/scan
// @desc    Scan QR code and mark attendance
// @access  Student only
router.post('/scan', auth, async (req, res) => {
    try {
        // Check if user is student
        if (req.user.role !== 'student') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Students only.' 
            });
        }

        const { qrData } = req.body;
        
        if (!qrData) {
            return res.status(400).json({ 
                success: false,
                message: 'QR code data is required' 
            });
        }

        // Parse QR data
        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch (parseError) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid QR code data format' 
            });
        }
        
        const { sessionId, teacherId, subject, expiresAt } = parsedData;

        // Check if QR is expired
        if (Date.now() > expiresAt) {
            return res.status(400).json({ 
                success: false,
                message: 'QR code has expired' 
            });
        }

        // Check if already marked attendance for this session
        const existingAttendance = await Attendance.findOne({
            studentId: req.user.id,
            sessionId
        });

        if (existingAttendance) {
            return res.status(400).json({ 
                success: false,
                message: 'Attendance already marked for this session' 
            });
        }

        // Get student details
        const student = await User.findById(req.user.id);

        // Create attendance record
        const attendance = new Attendance({
            studentId: req.user.id,
            studentName: student?.name || req.user.name,
            rollNumber: student?.rollNumber || 'N/A',
            subject,
            markedBy: teacherId,
            qrCode: qrData,
            sessionId,
            status: 'present'
        });

        await attendance.save();

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            attendance: {
                id: attendance._id,
                subject,
                date: attendance.date,
                status: attendance.status,
                sessionId
            }
        });

    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// @route   GET /api/attendance/teacher/:subject
// @desc    Get attendance for a subject (teacher view)
// @access  Teacher only
router.get('/teacher/:subject', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Teachers only.' 
            });
        }

        const { subject } = req.params;
        const { date } = req.query;

        let query = { subject };
        
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(query)
            .populate('studentId', 'name rollNumber email')
            .sort({ date: -1 })
            .limit(100);

        // Group by date
        const attendanceByDate = {};
        attendance.forEach(record => {
            const dateStr = record.date.toISOString().split('T')[0];
            if (!attendanceByDate[dateStr]) {
                attendanceByDate[dateStr] = [];
            }
            attendanceByDate[dateStr].push(record);
        });

        res.json({
            success: true,
            subject,
            totalRecords: attendance.length,
            attendanceByDate,
            attendance,
            dates: Object.keys(attendanceByDate)
        });

    } catch (error) {
        console.error('Teacher attendance error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

// ✅ FIX 4: Get all attendance (for admin)
// @route   GET /api/attendance/all
// @desc    Get all attendance records (admin only)
// @access  Admin only
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Admin only.' 
            });
        }

        const { page = 1, limit = 50, subject, studentId } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        if (subject && subject !== 'all') {
            query.subject = subject;
        }
        
        if (studentId) {
            query.studentId = studentId;
        }

        const attendance = await Attendance.find(query)
            .populate('studentId', 'name rollNumber')
            .populate('markedBy', 'name')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Attendance.countDocuments(query);

        res.json({
            success: true,
            attendance,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            count: attendance.length
        });

    } catch (error) {
        console.error('Get all attendance error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;