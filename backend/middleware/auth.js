// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ **AUTHENTICATION MIDDLEWARE WITH ENHANCED SECURITY**
const auth = async (req, res, next) => {
    const startTime = Date.now();
    
    try {
        // Get token from multiple possible sources
        let token = extractToken(req);
        
        if (!token) {
            logAuthAttempt(req, 'NO_TOKEN', false, startTime);
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required. Please login first.',
                code: 'AUTH_REQUIRED',
                hint: 'Add Authorization header: Bearer <token>'
            });
        }

        // ✅ **VERIFY JWT TOKEN**
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_development',
            { algorithms: ['HS256'] }
        );
        
        // ✅ **FIND USER WITH ACTIVE STATUS CHECK**
        const user = await User.findOne({ 
            _id: decoded.userId,
            isActive: true 
        }).select('-password');
        
        if (!user) {
            logAuthAttempt(req, 'USER_NOT_FOUND', false, startTime, decoded.userId);
            return res.status(401).json({ 
                success: false,
                message: 'User account not found or deactivated',
                code: 'USER_INACTIVE',
                action: 'Please contact administrator'
            });
        }

        // ✅ **ADDITIONAL SECURITY CHECKS**
        
        // 1. Check if token was issued before password change (if you add passwordChangedAt field)
        if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
            logAuthAttempt(req, 'TOKEN_EXPIRED_PASSWORD_CHANGE', false, startTime, user._id);
            return res.status(401).json({ 
                success: false,
                message: 'Password was changed. Please login again.',
                code: 'PASSWORD_CHANGED'
            });
        }

        // 2. Check user's last login time (optional security)
        const maxInactiveDays = 30; // Max 30 days inactive
        if (user.lastLogin) {
            const daysSinceLastLogin = Math.floor((Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastLogin > maxInactiveDays) {
                console.warn(`⚠️ User ${user.email} inactive for ${daysSinceLastLogin} days`);
            }
        }

        // ✅ **ADD USER DATA TO REQUEST WITH SECURITY CONTEXT**
        req.user = {
            _id: user._id,
            id: user._id,
            userId: user._id, // Multiple formats for compatibility
            email: user.email,
            role: user.role,
            name: user.name,
            rollNumber: user.rollNumber,
            course: user.course,
            semester: user.semester,
            permissions: getUserPermissions(user.role) // Add permissions based on role
        };
        
        req.token = token;
        req.authTime = new Date();
        req.authMethod = 'jwt';

        // ✅ **UPDATE LAST ACTIVITY (Optional - for monitoring)**
        try {
            await User.findByIdAndUpdate(user._id, { 
                lastActivity: new Date() 
            }, { new: true });
        } catch (updateError) {
            console.warn('Could not update last activity:', updateError.message);
        }

        logAuthAttempt(req, 'SUCCESS', true, startTime, user._id);
        next();
        
    } catch (error) {
        const userId = req.user?._id || 'unknown';
        logAuthAttempt(req, error.name, false, startTime, userId, error.message);
        
        // ✅ **SPECIFIC ERROR HANDLING**
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid or malformed authentication token',
                code: 'INVALID_TOKEN',
                action: 'Please login again to get a new token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Session expired. Please login again.',
                code: 'TOKEN_EXPIRED',
                expiresAt: error.expiredAt
            });
        }
        
        if (error.name === 'NotBeforeError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token not yet valid',
                code: 'TOKEN_NOT_ACTIVE',
                activeFrom: error.date
            });
        }
        
        console.error('🔐 Auth middleware unexpected error:', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            path: req.path,
            method: req.method
        });
        
        res.status(500).json({ 
            success: false,
            message: 'Authentication system error',
            code: 'AUTH_SYSTEM_ERROR',
            timestamp: new Date().toISOString()
        });
    }
};

// ✅ **ROLE-BASED ACCESS CONTROL MIDDLEWARE**
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required before checking roles',
                code: 'AUTH_REQUIRED_FOR_ROLE'
            });
        }

        const userRole = req.user.role;
        
        if (!allowedRoles.includes(userRole)) {
            logAuthorizationAttempt(req, 'ROLE_DENIED', userRole, allowedRoles);
            
            return res.status(403).json({ 
                success: false,
                message: `Access denied. This action requires ${allowedRoles.join(' or ')} role.`,
                code: 'ROLE_PERMISSION_DENIED',
                userRole: userRole,
                requiredRoles: allowedRoles,
                hint: `You are logged in as ${userRole}`
            });
        }

        logAuthorizationAttempt(req, 'ROLE_ALLOWED', userRole, allowedRoles);
        next();
    };
};

// ✅ **QR-SPECIFIC AUTHENTICATION (For QR Scanning)**
const qrAuth = async (req, res, next) => {
    try {
        // QR scanning might use different auth (device token, session token, etc.)
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'QR Session token required',
                code: 'QR_TOKEN_REQUIRED'
            });
        }

        // For QR, we might accept shorter-lived tokens or device tokens
        const decoded = jwt.verify(
            token, 
            process.env.QR_JWT_SECRET || process.env.JWT_SECRET,
            { maxAge: '15m' } // QR tokens valid for 15 minutes max
        );

        // QR tokens should contain device info for security
        if (!decoded.deviceId) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid QR session token',
                code: 'INVALID_QR_TOKEN'
            });
        }

        // Find user
        const user = await User.findOne({ 
            _id: decoded.userId,
            isActive: true 
        }).select('-password');

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found for QR session',
                code: 'QR_USER_NOT_FOUND'
            });
        }

        // Add QR-specific user context
        req.user = {
            _id: user._id,
            email: user.email,
            role: user.role,
            name: user.name,
            rollNumber: user.rollNumber,
            deviceId: decoded.deviceId, // Important for attendance tracking
            qrSession: true
        };

        req.qrToken = token;
        req.authMethod = 'qr';
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'QR session expired. Please generate new QR.',
                code: 'QR_SESSION_EXPIRED'
            });
        }
        
        res.status(401).json({ 
            success: false,
            message: 'QR authentication failed',
            code: 'QR_AUTH_FAILED',
            error: error.message
        });
    }
};

// ✅ **TEACHER-SPECIFIC MIDDLEWARE (For QR Generation)**
const requireTeacher = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            message: 'Teacher authentication required'
        });
    }

    if (req.user.role !== 'teacher') {
        return res.status(403).json({ 
            success: false,
            message: 'Only teachers can perform this action',
            userRole: req.user.role
        });
    }

    // Additional teacher-specific checks
    if (req.method === 'POST' && req.path.includes('/generate-qr')) {
        // Rate limiting for QR generation (optional)
        const teacherId = req.user._id;
        // Add rate limiting logic here if needed
    }

    next();
};

// ✅ **STUDENT-SPECIFIC MIDDLEWARE (For Attendance Marking)**
const requireStudent = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            message: 'Student authentication required'
        });
    }

    if (req.user.role !== 'student') {
        return res.status(403).json({ 
            success: false,
            message: 'Only students can perform this action',
            userRole: req.user.role
        });
    }

    // Student-specific validation for attendance
    if (req.method === 'POST' && req.path.includes('/mark-attendance')) {
        if (!req.user.rollNumber) {
            return res.status(400).json({ 
                success: false,
                message: 'Student roll number is required',
                code: 'ROLL_NUMBER_MISSING'
            });
        }
    }

    next();
};

// ✅ **HELPER FUNCTIONS**

// Extract token from multiple sources
function extractToken(req) {
    // 1. From Authorization header (Bearer token)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.replace('Bearer ', '');
    }
    
    // 2. From query parameter (for websockets or specific cases)
    if (req.query.token) {
        return req.query.token;
    }
    
    // 3. From x-auth-token header
    if (req.header('x-auth-token')) {
        return req.header('x-auth-token');
    }
    
    // 4. From cookies (if using cookies)
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    
    return null;
}

// Get permissions based on user role
function getUserPermissions(role) {
    const permissions = {
        student: [
            'view_own_profile',
            'update_own_profile',
            'scan_qr',
            'view_own_attendance',
            'download_own_report'
        ],
        teacher: [
            'view_own_profile',
            'update_own_profile',
            'generate_qr',
            'view_student_attendance',
            'mark_attendance_manually',
            'generate_reports',
            'manage_subjects'
        ],
        admin: [
            'manage_users',
            'manage_teachers',
            'manage_students',
            'view_all_attendance',
            'generate_system_reports',
            'manage_system_settings',
            'all_permissions'
        ]
    };
    
    return permissions[role] || permissions.student;
}

// Log authentication attempts
function logAuthAttempt(req, status, success, startTime, userId = 'unknown', errorMsg = null) {
    const duration = Date.now() - startTime;
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.header('user-agent'),
        userId: userId,
        status: status,
        success: success,
        durationMs: duration,
        error: errorMsg
    };
    
    // Log to console with appropriate emoji
    const emoji = success ? '✅' : '❌';
    console.log(`${emoji} Auth Attempt: ${status} | User: ${userId} | Path: ${req.path} | ${duration}ms`);
    
    // In production, you might want to save to database
    // await AuthLog.create(logEntry);
}

// Log authorization attempts
function logAuthorizationAttempt(req, status, userRole, requiredRoles) {
    console.log(`🔐 Authorization: ${status} | UserRole: ${userRole} | Required: ${requiredRoles.join(',')} | Path: ${req.path}`);
}

// ✅ **EXPORT ALL MIDDLEWARES**
module.exports = { 
    auth, 
    requireRole, 
    qrAuth,
    requireTeacher,
    requireStudent,
    getUserPermissions // Export helper if needed elsewhere
};