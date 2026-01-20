const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Middleware to verify token
const { auth } = require('../middleware/auth');

// @route   POST /api/attendance/generate-qr
// @desc    Generate QR code for attendance
// @access  Teacher only
router.post('/generate-qr', auth, async (req, res) => {
    try {
        // Check if user is teacher
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Teachers only.' });
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
            message: 'QR code generated successfully',
            qrCode,
            sessionId,
            expiresIn: duration,
            expiresAt: qrData.expiresAt
        });

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/attendance/scan
// @desc    Scan QR code and mark attendance
// @access  Student only
router.post('/scan', auth, async (req, res) => {
    try {
        // Check if user is student
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Access denied. Students only.' });
        }

        const { qrData } = req.body;
        
        // Parse QR data
        const parsedData = JSON.parse(qrData);
        const { sessionId, teacherId, subject, expiresAt } = parsedData;

        // Check if QR is expired
        if (Date.now() > expiresAt) {
            return res.status(400).json({ message: 'QR code has expired' });
        }

        // Check if already marked attendance for this session
        const existingAttendance = await Attendance.findOne({
            studentId: req.user.id,
            sessionId
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'Attendance already marked for this session' });
        }

        // Create attendance record
        const attendance = new Attendance({
            studentId: req.user.id,
            studentName: req.user.name,
            rollNumber: req.user.rollNumber,
            subject,
            markedBy: teacherId,
            qrCode: qrData,
            sessionId
        });

        await attendance.save();

        res.json({
            message: 'Attendance marked successfully',
            attendance: {
                id: attendance._id,
                subject,
                date: attendance.date,
                status: attendance.status
            }
        });

    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/attendance/student
// @desc    Get attendance for a student
// @access  Student only
router.get('/student', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { startDate, endDate, subject } = req.query;
        
        let query = { studentId: req.user.id };
        
        // Date filter
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Subject filter
        if (subject) {
            query.subject = subject;
        }

        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .limit(100);

        // Calculate statistics
        const totalClasses = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

        res.json({
            attendance,
            statistics: {
                totalClasses,
                present: presentCount,
                absent: totalClasses - presentCount,
                percentage
            }
        });

    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/attendance/teacher/:subject
// @desc    Get attendance for a subject (teacher view)
// @access  Teacher only
router.get('/teacher/:subject', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied' });
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
            .populate('studentId', 'name rollNumber')
            .sort({ date: -1 });

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
            subject,
            totalRecords: attendance.length,
            attendanceByDate,
            attendance
        });

    } catch (error) {
        console.error('Teacher attendance error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;