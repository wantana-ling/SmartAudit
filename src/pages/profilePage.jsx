import React, { useEffect, useState } from 'react';
import pic from '../component/asset/p.webp';
import '../component/css/profile.css';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const navigate = useNavigate();
  const [ipList, setIpList] = useState([]);
  const [selectedIP, setSelectedIP] = useState('');

  const username  = localStorage.getItem("username");
  const password  = localStorage.getItem("password");
  const firstname = localStorage.getItem('firstname') || 'User';

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

  // ✅ ใช้พอร์ต 3000 ให้ตรงกับ backend จริง
  const API_BASE = 'http://210.1.60.188:3000';

  const handleEnterServer = async () => {
  if (!selectedIP) return alert("Please select IP.");
  if (!username || !password) return alert("Missing login credentials.");

  try {
    // ✅ ขอ host + ip จาก Electron
    const { hostname, ips } = await window.electronAPI.getHostInfo();
    const deviceIP = ips?.[0] || 'unknown';
    console.log('[ENTER SERVER] Hostname:', hostname, 'Device IP:', deviceIP);

    // ✅ ส่งทั้ง host และ ip ไป API
    const res = await fetch(`${API_BASE}/api/host`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: hostname, user: username, ip: deviceIP }),
    });

    const data = await res.json().catch(() => ({}));
    console.log('[/api/host] response:', data);

    // ✅ เปิด RDP ต่อ
    localStorage.setItem('selectedIP', selectedIP);
    window.electronAPI.connectRDP(username, password, selectedIP);
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
          <button className="enter-btn" onClick={handleEnterServer}>ENTER SERVER</button>
        </div>

        <div className="profile-container">
          <button className="logout-button" onClick={handleLogout}>LOGOUT</button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
