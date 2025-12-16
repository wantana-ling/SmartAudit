import React, { useState } from 'react';
import '../component/css/login.css';
import securityLogo from '../component/asset/Security Shield.png';
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [authType, setAuthType] = useState('server');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedDomain = domain.trim();

    if (!trimmedUsername) {
      setError("Please enter Username");
      return;
    }

    // if (authType === 'server' && !/^\d+$/.test(trimmedUsername)) {
    //   setError("Please enter your UserID as numbers only.");
    //   return;
    // }

    if (!trimmedPassword) {
      setError("Please enter Password");
      return;
    }

    if (authType === 'ad' && !trimmedDomain) {
      setError("Please enter Domain");
      return;
    }

    let selectedIP = '';
    if (authType === 'server') {
      selectedIP = localStorage.getItem('serverIP');
      if (!selectedIP) {
        setError("Server IP not found. Please set it first.");
        return;
      }
    } else if (authType === 'ad') {
      selectedIP = '192.168.121.123';
    }

    try {
      const result = await window.electronAPI.loginRequestWithIP({
        username: trimmedUsername,
        password: trimmedPassword,
        server_ip: selectedIP,
        domain: authType === 'ad' ? trimmedDomain : null,
        auth_type: authType
      });

      if (result.success) {
        // บันทึกข้อมูลก่อน
        const userInfo = result.user_info;
        
        localStorage.setItem('username', trimmedUsername);
        localStorage.setItem('password', trimmedPassword);
        localStorage.setItem('firstname', userInfo.firstname);

        if (authType === 'ad') {
          localStorage.setItem('domain', trimmedDomain);
        }

        // ✅ ตรวจสอบว่าเครื่องมี mstsc หรือไม่
        const rdpExists = await window.electronAPI.checkRdpInstalled();
        console.log("🧐 RDP exists?", rdpExists);
        if (!rdpExists) {
          alert("Remote Desktop (mstsc.exe) not found. Please install it before continuing.");
          return;
        }

        navigate("/profile");

      } else {
        setError(result.message || "Login failed");
        setUsername('');
        setPassword('');
        setDomain('');
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to server.");
      setUsername('');
      setPassword('');
      setDomain('');
    }
  };

  return (
    <div className="container">
      <div className="box-container">
        <div className="pic-container">
          <img src={securityLogo} alt="securityLogo" />
        </div>
        <div className="text">
          <h1>Login</h1>
          <p>Smart Audit</p>
        </div>

        {localStorage.getItem('serverIP') && (
          <div className="ip-wrapper">
            <span>IP: {localStorage.getItem('serverIP')}</span>
            <span className="change-ip" onClick={() => navigate('/custom-ip')}>
              Change IP
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-input">
          {authType === 'ad' && (
            <input
              type="text"
              placeholder="Domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          )}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="authType"
                value="server"
                checked={authType === 'server'}
                onChange={(e) => setAuthType(e.target.value)}
              />
              <span>Server</span>
            </label>
            <label>
              <input
                type="radio"
                name="authType"
                value="ad"
                checked={authType === 'ad'}
                onChange={(e) => setAuthType(e.target.value)}
              />
              <span>AD</span>
            </label>
          </div>

          <button type="submit">Login</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
