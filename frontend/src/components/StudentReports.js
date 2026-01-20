import React, { useState, useEffect } from 'react';

const StudentReports = () => {
  const [attendance, setAttendance] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async (subject = 'all') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      let url = 'http://localhost:5000/api/attendance/student';
      if (subject !== 'all') {
        url += `?subject=${subject}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch attendance');
      }

      setAttendance(data.attendance || []);
      setStatistics(data.statistics || {});
      
      // Extract unique subjects
      const uniqueSubjects = [...new Set(data.attendance.map(item => item.subject))];
      setSubjects(['all', ...uniqueSubjects]);

    } catch (error) {
      console.error('Fetch attendance error:', error);
      alert('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !attendance.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-700">📊 Attendance Reports</h1>
              <p className="text-gray-600 mt-1">View your attendance history and statistics</p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleBack}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-blue-600">📚</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.totalClasses || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-green-600">✓</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Present</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.present || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-red-600">✗</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Absent</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.absent || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl text-purple-600">%</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Attendance %</p>
                  <p className={`text-2xl font-bold ${
                    parseFloat(statistics.percentage || 0) >= 75 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {statistics.percentage || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filter by Subject</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => handleSubjectChange(subject)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedSubject === subject
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subject === 'all' ? 'All Subjects' : subject}
              </button>
            ))}
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Attendance History</h2>
            <p className="text-gray-600 text-sm">
              Showing {attendance.length} records {selectedSubject !== 'all' ? `for ${selectedSubject}` : ''}
            </p>
          </div>

          {attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(record.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-gray-100 rounded-full">
                <span className="text-3xl text-gray-400">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Attendance Records</h3>
              <p className="text-gray-500">Your attendance records will appear here</p>
              <p className="text-sm text-gray-400 mt-2">
                Scan QR codes in class to mark attendance
              </p>
            </div>
          )}

          {/* Export Button */}
          {attendance.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={() => {
                  // Simple export to CSV
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + ["Date,Subject,Status,Time"]
                    .concat(attendance.map(record => 
                      `${formatDate(record.date)},${record.subject},${record.status},${new Date(record.date).toLocaleTimeString()}`
                    ))
                    .join("\n");
                  
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "attendance_report.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                📥 Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReports;