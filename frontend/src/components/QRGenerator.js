import React, { useState } from 'react';

const QRGenerator = () => {
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(10);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerateQR = async () => {
    if (!subject.trim()) {
      alert('Please enter subject name');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/attendance/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          duration: parseInt(duration)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate QR');
      }

      setQrCode(data.qrCode);
      setGenerated(true);
      
      alert(`QR Code generated successfully! Valid for ${duration} minutes.`);

    } catch (error) {
      alert('Error: ' + error.message);
      console.error('QR Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setDuration(10);
    setQrCode('');
    setGenerated(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-700">📱 Generate QR Code</h1>
              <p className="text-gray-600 mt-1">Create QR code for class attendance</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">QR Settings</h2>
            
            <div className="space-y-6">
              {/* Subject Input */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Web Technology, Database Management"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={generated}
                />
              </div>

              {/* Duration Select */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  QR Validity Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={generated}
                >
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  QR code will expire after selected time
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateQR}
                disabled={loading || generated}
                className={`w-full py-3 rounded-lg font-semibold transition duration-300 ${
                  generated
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : loading
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating QR...
                  </span>
                ) : generated ? (
                  '✅ QR Generated Successfully'
                ) : (
                  'Generate QR Code'
                )}
              </button>

              {/* Reset Button */}
              {generated && (
                <button
                  onClick={handleReset}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition duration-300"
                >
                  Generate New QR
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-bold text-yellow-700 mb-2">Instructions:</h3>
              <ul className="text-sm text-yellow-600 space-y-1">
                <li>• Enter subject name for which you want to take attendance</li>
                <li>• Select how long the QR code should be valid</li>
                <li>• Display the QR code on projector/screen</li>
                <li>• Students will scan it using their phones</li>
                <li>• Attendance will be automatically recorded</li>
              </ul>
            </div>
          </div>

          {/* Right: QR Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">QR Code</h2>
            
            {qrCode ? (
              <div className="text-center">
                {/* QR Code Image */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <img 
                    src={qrCode} 
                    alt="Attendance QR Code" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>

                {/* QR Details */}
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-700">Subject: {subject}</p>
                    <p className="text-sm text-blue-600">Valid for: {duration} minutes</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-bold text-green-700 mb-2">What to do next:</h3>
                    <ul className="text-sm text-green-600 text-left space-y-1">
                      <li>• Display this QR code on projector/screen</li>
                      <li>• Ask students to scan with their phones</li>
                      <li>• Attendance will be automatically recorded</li>
                      <li>• QR will expire in {duration} minutes</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      // Download QR code
                      const link = document.createElement('a');
                      link.href = qrCode;
                      link.download = `qr-${subject}-${new Date().getTime()}.png`;
                      link.click();
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition duration-300"
                  >
                    📥 Download QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="text-4xl text-gray-400">📱</span>
                </div>
                <p className="text-gray-500">Generate a QR code to get started</p>
                <p className="text-sm text-gray-400 mt-2">
                  The QR code will appear here after generation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;