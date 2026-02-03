// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student',
        required: true
    },
    rollNumber: {
        type: String,
        unique: true,
        sparse: true, // Allows null values but ensures uniqueness
        trim: true
    },
    course: {
        type: String,
        default: 'BCA'
    },
    semester: {
        type: Number,
        min: 1,
        max: 6,
        validate: {
            validator: function(value) {
                // Semester required only for students
                if (this.role === 'student') {
                    return value >= 1 && value <= 6;
                }
                return true;
            },
            message: 'Semester is required for students and must be between 1-6'
        }
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name if needed
UserSchema.virtual('fullName').get(function() {
    return this.name;
});

module.exports = mongoose.model('User', UserSchema);