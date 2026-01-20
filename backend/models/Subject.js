const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    subjectCode: {
        type: String,
        required: true,
        unique: true
    },
    subjectName: {
        type: String,
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    teacherName: String,
    semester: Number,
    course: String,
    schedule: {
        day: String,
        time: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subject', Subject.js);