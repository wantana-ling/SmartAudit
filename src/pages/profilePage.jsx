import React, { useEffect, useState } from 'react';
import pic from '../component/asset/p.webp';
import '../component/css/profile.css';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const navigate = useNavigate();
  const [ipList, setIpList] = useState([]);
  const [selectedIP, setSelectedIP] = useState('');

  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");

  const rawFirstname = localStorage.getItem('firstname');
  const firstname =
    (!rawFirstname || rawFirstname === 'undefined' || rawFirstname === 'null')
      ? 'User'
      : rawFirstname;
 
  const gatewayIP = localStorage.getItem('serverIP');
  const API_PORT = 3000;
  const API_BASE = gatewayIP ? `http://${gatewayIP}:${API_PORT}` : '';

  useEffect(() => {
    if (!gatewayIP) {
      alert('Gateway IP not found. Please select IP again.');
      navigate('/'); 
    }
  }, [gatewayIP, navigate]);

  useEffect(() => {
    const fetchIPs = async () => {
      try {
        const list = await window.electronAPI.getSessionIPList();
        console.log("Fetched IP List:", list);
        setIpList(list);
      } catch (err) {
        console.error("Failed to fetch IPs:", err);
      }
    };
    fetchIPs();
  }, []);

  const handleEnterServer = async () => {
    if (!selectedIP) return alert("Please select IP.");
    if (!username || !password) return alert("Missing login credentials.");

    try {
      const { hostname, ips } = await window.electronAPI.getHostInfo();
      const deviceIP = ips?.[0] || 'unknown';

      console.log('[ENTER SERVER]', {
        gatewayIP,
        selectedIP,
        hostname,
        deviceIP,
      });

      const res1 = await fetch(`${API_BASE}/api/host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: hostname,
          user: username,
          ip: deviceIP,
        }),
      });
      const data1 = await res1.json();

      const res2 = await fetch(`${API_BASE}/api/ipserver/select-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: selectedIP }),
      });
      const data2 = await res2.json();

      console.log("API #1:", data1);
      console.log("API #2:", data2);

      localStorage.setItem('selectedIP', selectedIP);

      const rdpRes = await window.electronAPI.connectRDP({
        username,
        password,
      });

      if (rdpRes?.success === false) {
        alert(rdpRes.message || 'RDP failed');
      }

    } catch (err) {
      console.error('ENTER SERVER failed:', err);
      alert('Failed to enter server (check console).');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    navigate('/login');
  };

  return (
    <div className="container">
      <div className="box-container">
        <div className="profile">
          <img src={pic} alt="Profile" />
        </div>

        <p className="name">{firstname}</p>
        <p className="position">Security Operation</p>

        <div className="dropdown-container">
          <select value={selectedIP} onChange={(e) => setSelectedIP(e.target.value)}>
            <option value="">Select IP Server</option>
            {Array.isArray(ipList) && ipList.length > 0 ? (
              ipList.map((item, index) => (
                <option key={index} value={item?.ip || item?.IP}>
                  {item?.ip || item?.IP}
                </option>
              ))
            ) : (
              <option disabled>No IPs found</option>
            )}
          </select>
        </div>

        <div className="server-info">
          <button className="enter-btn" onClick={handleEnterServer}>
            ENTER SERVER
          </button>
        </div>

        <div className="profile-container">
          <button className="logout-button" onClick={handleLogout}>
            LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
