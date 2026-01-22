🎓 Student Daily Attendance System Mobile App



Project Overview

A QR-Based Digital Attendance System with role-based access (Student, Teacher, Admin) developed as a BCA Minor Project.


🚀 Live Demo

\- Frontend: http://localhost:3000

\- Backend API: http://localhost:5000

\- API Docs: http://localhost:5000/



✨ Features

For Students:

\- QR Code Scanning via Camera

\- Real-time Attendance Marking

\- Attendance Reports \& Statistics

\- Export reports as CSV



👨‍🏫For Teachers:

\- Generate QR Codes for Classes

\- Set QR Validity Duration

\- View Class Attendance

\- Manage Students



⚙️For Admin:

\- User Management

\- System Analytics

\- Course Management

\- System Configuration



🛠️ Tech Stack

Frontend:

\- React.js

\- Tailwind CSS

\- Progressive Web App (PWA)

\- HTML5 QR Scanner



Backend:

\- Node.js

\- Express.js

\- JWT Authentication

\- REST APIs



Database:

\- MongoDB Atlas (Cloud)

\- Mongoose ODM



Tools:

\- Postman (API Testing)

\- Git (Version Control)

\- VS Code (Development)



📁 Project Structure

Minor\_Project/

├── frontend/ # React Application

│ ├── public/

│ ├── src/

│ │ ├── components/ # React Components

│ │ │ ├── Login.js

│ │ │ ├── QRGenerator.js

│ │ │ ├── QRScanner.js

│ │ │ └── StudentReports.js

│ │ ├── App.js # Main Application

│ │ └── index.js

│ └── package.json

│

├── backend/ # Node.js Server

│ ├── models/ # MongoDB Schemas

│ │ ├── User.js

│ │ ├── Attendance.js

│ │ └── Subject.js

│ ├── routes/ # API Routes

│ │ ├── authRoutes.js

│ │ └── attendanceRoutes.js

│ ├── middleware/ # Authentication

│ │ └── auth.js

│ ├── server.js # Main Server

│ ├── seedData.js # Test Data

│ └── package.json

│

└── PROJECT\_README.md # This File




🚀 Installation \& Setup



1. Clone Repository

```bash

git clone <repository-url>

cd Minor\_Project

2. Backend Setup

bash

cd backend

npm install

Create .env file:



env

MONGO\_URI=your\_mongodb\_connection\_string

JWT\_SECRET=your\_secret\_key

PORT=5000

Start backend:



bash

node server.js

3. Frontend Setup

bash

cd frontend

npm install

npm start

4. Seed Database (Optional)

bash

cd backend

node seedData.js


🔑 Default Credentials

Admin:

Email: admin@college.com
Password: password123


Teacher:

Email: teacher@college.com
Password: password123


Students:

Email: student1@college.com to student5@college.com
Password: password123



📊 API Endpoints

Authentication:

POST /api/auth/register - User registration

POST /api/auth/login - User login

GET /api/auth/check - Verify token



Attendance:

POST /api/attendance/generate-qr - Generate QR code (Teacher)



POST /api/attendance/scan - Scan QR code (Student)



GET /api/attendance/student - Student reports



GET /api/attendance/teacher/:subject - Teacher reports



📸 Screenshots

Homepage	Login	Student Dashboard

https://screenshots/home.png	https://screenshots/login.png	https://screenshots/student.png

Teacher Dashboard	QR Generator	QR Scanner

https://screenshots/teacher.png	https://screenshots/qr-gen.png	https://screenshots/qr-scan.png


📄 Project Report

Complete project documentation available in PROJECT\_REPORT.pdf



👨‍💻 Developers

Name: Mohammad Zaid



Course: BCA, SEM 4



College: Khwaja Moinuddin Chishti Language University, Lucknow

Academic Year: 2025-26



📞 Contact

Email: syedmuhmmadzaid@gmail.com



GitHub: https://github.com/mohammad-zaid83



📜 License

This project is developed for academic purposes.



⭐ Star this project if you found it useful!

