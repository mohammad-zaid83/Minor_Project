import React, { useState, useEffect } from 'react';

const StudentReports = () => {
  const [attendance, setAttendance] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Initialize and fetch data
  useEffect(() => {
    fetchAttendance();
  }, []);

  // Internal function to get backend URL (not exposed in UI)
  const getBackendUrl = () => {
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    const currentHost = window.location.hostname;
    
    if (currentHost.includes('vercel.app')) {
      return 'https://minor-project-backend-9u7l.onrender.com';
    } else if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:5000';
    } else {
      return 'https://minor-project-backend-9u7l.onrender.com';
    }
  };

  const fetchAttendance = async (subject = 'all') => {
    setLoading(true);
    setError('');
    setConnectionStatus('Fetching data...');
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        setError('Please login first');
        setLoading(false);
        setConnectionStatus('Authentication required');
        return;
      }

      // Get backend URL internally
      const backendUrl = getBackendUrl();
      
      // Build API URL
      let url = `${backendUrl}/api/attendance/student`;
      
      // Add student ID if available
      const studentId = user.id || user._id;
      if (studentId) {
        url += `/${studentId}`;
      }
      
      if (subject !== 'all') {
        url += `?subject=${encodeURIComponent(subject)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        // Try test endpoint
        const testResponse = await fetch(`${backendUrl}/api/attendance/test/${studentId || 'test'}`);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          processAttendanceData(testData, subject);
          setConnectionStatus('Connected (Demo Data)');
          return;
        }
        throw new Error(`Unable to fetch data (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch attendance');
      }

      processAttendanceData(data, subject);
      setConnectionStatus('Connected ✓');
      
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message || 'Failed to load attendance data');
      setConnectionStatus('Connection Error');
      
      // Fallback to sample data
      const sampleData = getSampleData();
      setAttendance(sampleData);
      setStatistics(calculateStatistics(sampleData));
      setSubjects(['all', 'Mathematics', 'Physics', 'Chemistry']);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process attendance data
  const processAttendanceData = (data, subject) => {
    const attendanceData = data.attendance || data.data || [];
    setAttendance(attendanceData);
    setStatistics(data.statistics || calculateStatistics(attendanceData));
    
    // Extract unique subjects
    const uniqueSubjects = [...new Set(attendanceData.map(item => item.subject))].filter(Boolean);
    setSubjects(['all', ...uniqueSubjects]);
  };

  // Helper function to calculate statistics
  const calculateStatistics = (attendanceData) => {
    const totalClasses = attendanceData.length;
    const presentCount = attendanceData.filter(a => a.status === 'present').length;
    const absentCount = attendanceData.filter(a => a.status === 'absent').length;
    const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : '0.0';
    
    return {
      totalClasses,
      present: presentCount,
      absent: absentCount,
      percentage
    };
  };

  // Sample data for fallback
  const getSampleData = () => {
    return [
      {
        _id: '1',
        subject: 'Mathematics',
        date: new Date().toISOString(),
        status: 'present',
        teacher: 'Dr. Sharma'
      },
      {
        _id: '2',
        subject: 'Physics',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'present',
        teacher: 'Prof. Verma'
      },
      {
        _id: '3',
        subject: 'Chemistry',
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'absent',
        teacher: 'Dr. Gupta'
      },
      {
        _id: '4',
        subject: 'Mathematics',
        date: new Date(Date.now() - 259200000).toISOString(),
        status: 'present',
        teacher: 'Dr. Sharma'
      },
      {
        _id: '5',
        subject: 'Computer Science',
        date: new Date(Date.now() - 345600000).toISOString(),
        status: 'present',
        teacher: 'Prof. Singh'
      }
    ];
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    fetchAttendance(subject === 'all' ? 'all' : subject);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleRefresh = () => {
    fetchAttendance(selectedSubject === 'all' ? 'all' : selectedSubject);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // ✅ CLEAN LOADING COMPONENT (URL REMOVED)
  if (loading && !attendance.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-600 rounded-full absolute top-0 left-0 animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-800">Loading Attendance Data</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your records</p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
            <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${connectionStatus.includes('Connected') ? 'bg-green-500' : 'bg-blue-500'}`}></span>
            <span className="text-sm text-blue-700">{connectionStatus}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ✅ HEADER - CLEAN VERSION (URL REMOVED) */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Attendance Dashboard</h1>
                  <p className="text-blue-100 mt-1">Track your academic attendance performance</p>
                </div>
              </div>
              
              {/* Connection Status Badge */}
              <div className="mt-4 inline-flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus.includes('Connected') ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                <span className="text-sm bg-white/10 px-3 py-1 rounded-full">
                  {connectionStatus}
                </span>
              </div>
              
              {error && (
                <div className="mt-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-100 text-sm">{error}</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6 md:mt-0">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-medium disabled:opacity-50 flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh Data
                  </>
                )}
              </button>
              <button
                onClick={handleBack}
                className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-medium flex items-center transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards - IMPROVED DESIGN */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl text-blue-600">📚</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.totalClasses || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl text-green-600">✓</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Present</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.present || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl text-red-600">✗</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Absent</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.absent || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl text-purple-600">%</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Attendance</p>
                  <p className={`text-2xl font-bold ${
                    parseFloat(statistics.percentage || 0) >= 75 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {statistics.percentage || 0}%
                  </p>
                  <p className={`text-xs mt-1 ${parseFloat(statistics.percentage || 0) >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(statistics.percentage || 0) >= 75 ? '✓ Good' : '⚠️ Needs improvement'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject Filter - IMPROVED */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Filter by Subject</h2>
            <div className="text-sm text-gray-500 mt-1 md:mt-0">
              Showing {attendance.length} records
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectChange(subject)}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    selectedSubject === subject
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {subject === 'all' ? '📚 All Subjects' : subject}
                </button>
              ))
            ) : (
              <p className="text-gray-500">No subjects available</p>
            )}
          </div>
        </div>

        {/* Attendance Table - IMPROVED */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Attendance History</h2>
            <p className="text-gray-600 text-sm mt-1">
              {selectedSubject !== 'all' ? `Showing data for ${selectedSubject}` : 'All subjects'}
            </p>
          </div>

          {attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Teacher
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {attendance.map((record, index) => (
                    <tr key={record._id || index} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(record.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">{record.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(record.date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-gray-500 text-xs">👤</span>
                          </div>
                          <span>{record.teacher || 'Not specified'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full">
                <span className="text-4xl text-blue-400">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Attendance Records Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Your attendance records will appear here once you start marking attendance in classes.
              </p>
              <p className="text-sm text-gray-400 mt-3">
                Scan QR codes provided by your teachers to mark attendance
              </p>
              {error && (
                <button
                  onClick={handleRefresh}
                  className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md"
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* Footer with Export */}
          {attendance.length > 0 && (
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const headers = ["Date,Subject,Status,Time,Teacher"];
                    const rows = attendance.map(record => 
                      `"${formatDate(record.date)}","${record.subject || ''}","${record.status || ''}","${new Date(record.date).toLocaleTimeString()}","${record.teacher || ''}"`
                    );
                    
                    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `attendance_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export as CSV
                </button>
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact your class coordinator or system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentReports;