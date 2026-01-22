import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// ✅ ADD THIS LINE - MOST IMPORTANT FIX
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setMessage('Position QR code within the scanner');
    
    // Initialize scanner
    const scanner = new Html5QrcodeScanner('qr-reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // QR code scanned
        handleScannedQR(decodedText);
        scanner.clear();
        setScanning(false);
      },
      (error) => {
        console.error('QR Scan error:', error);
      }
    );
  };

  const handleScannedQR = async (qrData) => {
    setLoading(true);
    setMessage('Processing QR code...');
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // ✅ FIXED: Use API_URL instead of localhost:5000
      const response = await fetch(`${API_URL}/api/attendance/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qrData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark attendance');
      }

      // Success
      setScanResult(data.attendance);
      setMessage('✅ Attendance marked successfully!');
      
      // Show success details
      setTimeout(() => {
        alert(`Attendance marked for ${data.attendance.subject} on ${new Date(data.attendance.date).toLocaleDateString()}`);
      }, 500);

    } catch (error) {
      console.error('Attendance marking error:', error);
      setMessage(`❌ Error: ${error.message}`);
      
      // Show error alert
      setTimeout(() => {
        alert(`Failed to mark attendance: ${error.message}`);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = () => {
    setScanResult(null);
    setMessage('');
    setScanning(false);
    
    // Clear previous scanner
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    
    // Start new scan after delay
    setTimeout(() => {
      startScanner();
    }, 100);
  };

  const handleBack = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-700">📱 Scan QR Code</h1>
              <p className="text-gray-600 mt-1">Scan QR code to mark your attendance</p>
            </div>
            <button
              onClick={handleBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Scanner */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">QR Scanner</h2>
            
            <div className="text-center">
              {/* Scanner Area */}
              <div className="mb-6">
                <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
                
                {!scanning && !scanResult && (
                  <div className="mt-6">
                    <button
                      onClick={startScanner}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 disabled:opacity-50"
                    >
                      {loading ? 'Starting Scanner...' : 'Start Scanner'}
                    </button>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {message && (
                <div className={`p-4 rounded-lg mb-6 ${
                  message.includes('✅') ? 'bg-green-50 text-green-700' :
                  message.includes('❌') ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <p className="font-medium">{message}</p>
                </div>
              )}

              {/* Rescan Button */}
              {scanResult && (
                <button
                  onClick={handleRescan}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
                >
                  Scan Another QR
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-700 mb-2">How to Scan:</h3>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Click "Start Scanner" button</li>
                <li>• Allow camera access when prompted</li>
                <li>• Position QR code within the scanner frame</li>
                <li>• Hold steady until scan is complete</li>
                <li>• Attendance will be marked automatically</li>
              </ul>
            </div>
          </div>

          {/* Right: Scan Results */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Attendance Details</h2>
            
            {scanResult ? (
              <div className="space-y-6">
                {/* Success Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="text-4xl mb-4 text-center">✅</div>
                  <h3 className="text-xl font-bold text-center mb-2">Attendance Marked!</h3>
                  <p className="text-green-100 text-center">Your attendance has been recorded successfully</p>
                </div>

                {/* Details Card */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-bold text-gray-700 mb-4">Attendance Record</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subject:</span>
                      <span className="font-semibold">{scanResult.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold">
                        {new Date(scanResult.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold">
                        {new Date(scanResult.date).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-green-600">{scanResult.status}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.href = '/student/dashboard'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-300"
                  >
                    View Dashboard
                  </button>
                  <button
                    onClick={handleRescan}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition duration-300"
                  >
                    Scan Another QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="text-4xl text-gray-400">📱</span>
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Ready to Scan</h3>
                <p className="text-gray-500">Scan a QR code to mark your attendance</p>
                <p className="text-sm text-gray-400 mt-2">
                  The attendance details will appear here after scanning
                </p>
                
                {/* Demo Info */}
                <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-700 mb-2">Note:</p>
                  <p className="text-xs text-yellow-600">
                    For testing: You can generate a QR code from Teacher dashboard and scan it here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;