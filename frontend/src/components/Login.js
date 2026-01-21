import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ CORRECT: Define API_URL at TOP LEVEL (outside component)
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ NOW USING API_URL defined at top
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("lastLogin", new Date().toLocaleString());

      // Redirect based on role
      let redirectPath = "/";
      switch (data.user.role) {
        case "student":
          redirectPath = "/student/dashboard";
          break;
        case "teacher":
          redirectPath = "/teacher/dashboard";
          break;
        case "admin":
          redirectPath = "/admin/dashboard";
          break;
        default:
          redirectPath = "/";
      }

      navigate(redirectPath);
    } catch (error) {
      alert(error.message || "Login failed. Please check credentials.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-blue-600">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">
              Login as
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["student", "teacher", "admin"].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-3 px-4 rounded-lg text-center transition ${
                    role === r
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Demo Credentials */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-2">
              Demo Credentials:
            </p>
            <p className="text-xs text-blue-600">
              {role === "admin" && "admin@college.com / password123"}
              {role === "teacher" && "teacher@college.com / password123"}
              {role === "student" && "student1@college.com / password123"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Also: student2@college.com to student5@college.com
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-gray-400 text-sm">
            Student Attendance System • BCA Minor Project
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;