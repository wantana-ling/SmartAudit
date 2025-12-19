import React, { useState, useEffect } from 'react';
import '../component/css/IP.css';
import securityLogo from '../component/asset/Security Shield.png';
import { useNavigate } from "react-router-dom";

const LoginIPPage = () => {
  const [serverIP, setServerIP] = useState('');
  const [rememberIP, setRememberIP] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedIP = localStorage.getItem('savedIP');
    if (savedIP) {
      setServerIP(savedIP);
      setRememberIP(true);
    }
  }, []);

  const handleSave = async () => {
    const trimmedIP = serverIP.trim();

    if (!trimmedIP) {
      setError("Please enter a valid IP address.");
      return;
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(trimmedIP)) {
      setError("Please enter a valid IPv4 address.");
      return;
    }

    const parts = trimmedIP.split('.').map(n => Number(n));
    const validRange = parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255);
    if (!validRange) {
      setError("Please enter a valid IPv4 address.");
      return;
    }

    try {
      setIsChecking(true);
      setError('');

      const result = await window.electronAPI.pingServer(trimmedIP);

      if (result?.success) {
        localStorage.setItem('serverIP', trimmedIP);

        if (rememberIP) {
          localStorage.setItem('savedIP', trimmedIP);
        } else {
          localStorage.removeItem('savedIP');
        }

        navigate("/login");
      } else {
        setError("Unable to connect to Server.");
      }
    } catch (err) {
      console.error('ping error:', err);
      setError("An error occurred while connecting to the server.");
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
            placeholder="Smartaudit server IP"
            value={serverIP}
            onChange={(e) => {
              setServerIP(e.target.value);
              setError('');
            }}
            disabled={isChecking}
          />

          <div className="checkbox-container">
            <input
              type="checkbox"
              id="rememberIP"
              checked={rememberIP}
              onChange={(e) => setRememberIP(e.target.checked)}
              disabled={isChecking}
            />
            <label htmlFor="rememberIP">Remember IP</label>
          </div>

          <button onClick={handleSave} disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Save'}
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default LoginIPPage;
