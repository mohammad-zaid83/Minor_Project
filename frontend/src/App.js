import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import QRGenerator from "./components/QRGenerator";
import QRScanner from "./components/QRScanner";
import StudentReports from "./components/StudentReports";
import NotFound from "./components/NotFound";

// Temporary Dashboard Components
const StudentDashboard = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">
          🎓 Student Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-700 mb-2">Attendance</h3>
            <p className="text-4xl font-bold text-blue-600">85%</p>
            <p className="text-sm text-blue-500">Current Percentage</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-semibold text-green-700 mb-2">Total Classes</h3>
            <p className="text-4xl font-bold text-green-600">45</p>
            <p className="text-sm text-green-500">This Month</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="font-semibold text-purple-700 mb-2">Present</h3>
            <p className="text-4xl font-bold text-purple-600">38</p>
            <p className="text-sm text-purple-500">Days Present</p>
          </div>
        </div>
        <button
          onClick={() => (window.location.href = "/student/scan-qr")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg mr-4"
        >
          📱 Scan QR Code
        </button>
        <button
          onClick={() => (window.location.href = "/student/reports")}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg mr-4"
        >
          📊 View Reports
        </button>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to logout?")) {
              localStorage.clear();
              window.location.href = "/";
            }
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition duration-300"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  </div>
);

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const handleGenerateQR = () => {
    window.location.href = "/teacher/generate-qr";
  };

  const handleViewReports = () => {
    alert("Attendance Reports feature coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-green-700">
                👨‍🏫 Teacher Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back,{" "}
                <span className="font-semibold text-green-600">
                  {user?.name || "Teacher"}
                </span>
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 md:mt-0 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition duration-300"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl text-blue-600">👥</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-gray-800">45</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl text-green-600">📊</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Today's Attendance</p>
                <p className="text-2xl font-bold text-gray-800">85%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl text-purple-600">📚</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Active Subjects</p>
                <p className="text-2xl font-bold text-gray-800">4</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Generate QR Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Generate QR Code</h3>
            <p className="text-blue-100 mb-6">
              Create QR code for class attendance
            </p>
            <button
              onClick={handleGenerateQR}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-lg transition duration-300"
            >
              Generate Now
            </button>
          </div>

          {/* View Reports Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-2">View Reports</h3>
            <p className="text-green-100 mb-6">
              Check attendance statistics and trends
            </p>
            <button
              onClick={handleViewReports}
              className="w-full bg-white text-green-600 hover:bg-green-50 font-semibold py-3 rounded-lg transition duration-300"
            >
              View Reports
            </button>
          </div>

          {/* Manage Classes Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold mb-2">Manage Classes</h3>
            <p className="text-purple-100 mb-6">
              Add/remove students and subjects
            </p>
            <button
              onClick={() => alert("Class Management coming soon!")}
              className="w-full bg-white text-purple-600 hover:bg-purple-50 font-semibold py-3 rounded-lg transition duration-300"
            >
              Manage
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600">✓</span>
              </div>
              <div>
                <p className="font-medium">Web Technology Class</p>
                <p className="text-sm text-gray-500">
                  Attendance marked for 35 students • 10:30 AM
                </p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600">📱</span>
              </div>
              <div>
                <p className="font-medium">QR Code Generated</p>
                <p className="text-sm text-gray-500">
                  Database Management class • Yesterday
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats] = useState({
    totalUsers: 156,
    activeToday: 89,
    totalCourses: 12,
    pendingRequests: 5,
  });
  const [recentActivity] = useState([
    {
      id: 1,
      action: "New student registered",
      user: "Rahul Sharma",
      time: "10:30 AM",
    },
    {
      id: 2,
      action: "Course added",
      user: "Web Technology",
      time: "Yesterday",
    },
    {
      id: 3,
      action: "Teacher account created",
      user: "Prof. Verma",
      time: "2 days ago",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Stats refreshed!");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-700">
                ⚙️ Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage system settings and users
              </p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "🔄 Refresh"}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-400">
              <p className="text-blue-100 text-sm">
                Students: 145 | Teachers: 8 | Admins: 3
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Today</p>
                <p className="text-3xl font-bold">{stats.activeToday}</p>
              </div>
              <div className="text-3xl">📱</div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-400">
              <p className="text-green-100 text-sm">+12% from yesterday</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Courses</p>
                <p className="text-3xl font-bold">{stats.totalCourses}</p>
              </div>
              <div className="text-3xl">📚</div>
            </div>
            <div className="mt-4 pt-4 border-t border-yellow-400">
              <p className="text-yellow-100 text-sm">
                Active: 10 | Inactive: 2
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Pending Requests</p>
                <p className="text-3xl font-bold">{stats.pendingRequests}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
            <div className="mt-4 pt-4 border-t border-red-400">
              <button className="text-red-100 hover:text-white text-sm">
                Review requests →
              </button>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl text-blue-600 mb-4">👤</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              User Management
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Add, edit, or remove users from the system
            </p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
              Manage Users
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl text-green-600 mb-4">🎓</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Course Management
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Create and manage courses and subjects
            </p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
              Manage Courses
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl text-purple-600 mb-4">📊</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              System Reports
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              View detailed analytics and reports
            </p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg">
              View Reports
            </button>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600">•</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-center text-blue-600 hover:text-blue-700 font-medium">
              View All Activity →
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">
                <div className="flex items-center">
                  <span className="text-xl mr-3">📧</span>
                  <div>
                    <p className="font-medium">Send Bulk Notification</p>
                    <p className="text-sm text-gray-500">
                      Send message to all users
                    </p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">
                <div className="flex items-center">
                  <span className="text-xl mr-3">🔧</span>
                  <div>
                    <p className="font-medium">System Settings</p>
                    <p className="text-sm text-gray-500">
                      Configure application settings
                    </p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">
                <div className="flex items-center">
                  <span className="text-xl mr-3">📁</span>
                  <div>
                    <p className="font-medium">Backup Database</p>
                    <p className="text-sm text-gray-500">
                      Create system backup
                    </p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">
                <div className="flex items-center">
                  <span className="text-xl mr-3">🔄</span>
                  <div>
                    <p className="font-medium">Update System</p>
                    <p className="text-sm text-gray-500">Check for updates</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ NEW SIMPLE HOMEPAGE COMPONENT
const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex flex-col items-center justify-center p-4">
    {/* College Header */}
    <div className="text-center text-white mb-8">
      <h1 className="text-4xl md:text-5xl font-bold mb-2">KMC University</h1>
      <p className="text-lg opacity-90">Department of Computer Applications</p>
    </div>

    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      {/* Project Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          {/* Replace emoji with logo */}
          <img
            src="/CollegeLogo.png"
            alt="College Logo"
            className="w-12 h-12 rounded-full object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Student Attendance System
        </h2>
        <p className="text-gray-600">QR-Based Digital Attendance Solution</p>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-blue-600 text-lg">✓</span>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Secure Login</p>
            <p className="text-sm text-gray-500">Role-based access control</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-green-600 text-lg">⚡</span>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Quick Attendance</p>
            <p className="text-sm text-gray-500">Scan QR code in seconds</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-purple-600 text-lg">📊</span>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Live Reports</p>
            <p className="text-sm text-gray-500">
              Real-time attendance tracking
            </p>
          </div>
        </div>
      </div>

      {/* Login Button */}
      <button
        onClick={() => (window.location.href = "/login")}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-lg transition duration-300 shadow-lg"
      >
        Login to System
      </button>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t text-center">
        <p className="text-gray-500 text-sm">
          BCA Minor Project | Developed by Mohammad Zaid
        </p>
        <p className="text-gray-400 text-xs mt-1">Academic Year 2025-26</p>
      </div>
    </div>

    {/* Quick Links */}
    <div className="mt-8 flex gap-4">
      <button className="text-white/80 hover:text-white text-sm">About</button>
      <button className="text-white/80 hover:text-white text-sm">
        Contact
      </button>
      <button className="text-white/80 hover:text-white text-sm">Help</button>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/scan-qr" element={<QRScanner />} />
        <Route path="/student/reports" element={<StudentReports />} />

        {/* Teacher Routes */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/generate-qr" element={<QRGenerator />} />

        {/* Admin Route */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
