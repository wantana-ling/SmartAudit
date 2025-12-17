import React, { useState } from 'react';
import '../component/css/IP.css';
import securityLogo from '../component/asset/Security Shield.png';
import { useNavigate } from "react-router-dom";

const LoginIPPage = () => {
  const [serverIP, setServerIP] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  const isValidIPv4 = (ip) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;

    const parts = ip.split('.').map(n => Number(n));
    return parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255);
  };

  const handleSave = async () => {
    const trimmedIP = serverIP.trim();

    if (!trimmedIP) {
      setError("Please enter a valid IP address.");
      return;
    }

    if (!isValidIPv4(trimmedIP)) {
      setError("Please enter a valid IPv4 address (0-255).");
      return;
    }

    try {
      setIsChecking(true);
      setError('');

      const result = await window.electronAPI.pingServer(trimmedIP);

      if (result?.success) {
        localStorage.setItem('serverIP', trimmedIP);
        navigate("/login");
      } else {
        setError("❌ Unable to connect to Server.");
      }
    } catch (err) {
      console.error('ping error:', err);
      setError("❌ An error occurred while connecting to the server.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container">
      <div className="box-container">
        <div className="pic-container">
          <img src={securityLogo} alt="securityLogo" />
        </div>

        <div className="text">
          <h1>Select IP</h1>
          <p>Smart Audit</p>
        </div>

        <div className="text-input">
          <input
            type="text"
            placeholder="Smart audit server IP"
            value={serverIP}
            disabled={isChecking}
            onChange={(e) => {
              setServerIP(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />

          <button onClick={handleSave} disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Save'}
          </button>

          <button
            className="back-button"
            onClick={() => navigate('/login')}
            disabled={isChecking}
          >
            Back
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default LoginIPPage;
