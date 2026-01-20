import React from 'react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">😕</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
          >
            🏠 Go to Homepage
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition duration-300"
          >
            ↩️ Go Back
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-300">
          <p className="text-gray-500 text-sm">
            Student Attendance System • BCA Minor Project
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;