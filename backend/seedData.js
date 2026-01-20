const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('./models/User');
const Attendance = require('./models/Attendance');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const seedDatabase = async () => {
    try {
        console.log('🌱 Seeding database...');

        // Clear existing data
        await User.deleteMany({});
        await Attendance.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create Admin
        const admin = new User({
            name: 'System Admin',
            email: 'admin@college.com',
            password: hashedPassword,
            role: 'admin',
            phone: '9876543210'
        });
        await admin.save();
        console.log('👑 Admin created');

        // Create Teacher
        const teacher = new User({
            name: 'Prof. Sharma',
            email: 'teacher@college.com',
            password: hashedPassword,
            role: 'teacher',
            course: 'BCA',
            phone: '9876543211'
        });
        await teacher.save();
        console.log('👨‍🏫 Teacher created');

        // Create Students
        const students = [];
        for (let i = 1; i <= 5; i++) {
            const student = new User({
                name: `Student ${i}`,
                email: `student${i}@college.com`,
                password: hashedPassword,
                role: 'student',
                rollNumber: `BCA202300${i}`,
                course: 'BCA',
                semester: 6,
                phone: `98765432${10 + i}`
            });
            students.push(student);
            await student.save();
        }
        console.log(`🎓 ${students.length} students created`);

        // Create sample attendance records
        const attendanceRecords = [];
        const subjects = ['Web Technology', 'Database Management', 'Software Engineering'];
        const today = new Date();

        for (let i = 0; i < 15; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            students.forEach(student => {
                const record = new Attendance({
                    studentId: student._id,
                    studentName: student.name,
                    rollNumber: student.rollNumber,
                    subject: subjects[Math.floor(Math.random() * subjects.length)],
                    date: date,
                    status: Math.random() > 0.2 ? 'present' : 'absent',
                    markedBy: teacher._id
                });
                attendanceRecords.push(record);
            });
        }

        await Attendance.insertMany(attendanceRecords);
        console.log(`📝 ${attendanceRecords.length} attendance records created`);

        console.log('✅ Database seeded successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('Admin: admin@college.com / password123');
        console.log('Teacher: teacher@college.com / password123');
        console.log('Students: student1@college.com to student5@college.com / password123');

        mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
};

// Run seeding
seedDatabase();