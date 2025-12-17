const { app, BrowserWindow, ipcMain } = require('electron');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');

// === CONFIG ===
let GATEWAY_IP = null;   // ✅ dynamic
const API_PORT = 3000;

// helper
const getApiBase = () => {
  if (!GATEWAY_IP) return null;
  return `http://${GATEWAY_IP}:${API_PORT}`;
};

// === Create Window ===
function createWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 650,
    title: 'Smart Audit',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  win.loadFile(path.join(__dirname, 'build', 'index.html'));
}

// ✅ set gateway ip from renderer (Select IP / Login)
ipcMain.handle('set-gateway-ip', async (event, ip) => {
  GATEWAY_IP = ip;
  console.log('✅ Gateway IP set to:', GATEWAY_IP);
  return { success: true, gateway_ip: GATEWAY_IP };
});

// (optional) get current gateway ip
ipcMain.handle('get-gateway-ip', async () => {
  return { success: true, gateway_ip: GATEWAY_IP };
});

ipcMain.handle('ping-server', async (event, ip) => {
  try {
    const res = await axios.get(`http://${ip}:${API_PORT}/ping`);
    return res.data?.status === 'ok' ? { success: true } : { success: false };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// ✅ ใช้ FastAPI ดึง IP list
ipcMain.handle('get-session-ip-list', async () => {
  try {
    const API_BASE = getApiBase();
    if (!API_BASE) return [];

    const res = await axios.get(`${API_BASE}/api/ipserver/list`);
    const rows = res.data;

    const result = (rows || [])
      .map(row => ({ ip: row.ip || row.IP || row.address || '' }))
      .filter(item => item.ip);

    console.log('Device IPs from API:', result);
    return result;
  } catch (err) {
    console.error('API fetch IP error:', err.message);
    return [];
  }
});

ipcMain.handle('get-hostname', async () => {
  const host = os.hostname();
  console.log('[Electron] Hostname:', host);
  return host;
});

ipcMain.handle('get-host-info', async () => {
  const nets = os.networkInterfaces();
  const ips = Object.values(nets)
    .flat()
    .filter(Boolean)
    .filter(n => n.family === 'IPv4' && !n.internal)
    .map(n => n.address);

  const info = { hostname: os.hostname(), ips };
  console.log('[Electron] Host info:', info);
  return info;
});

// === เชื่อมต่อ RDP (ไปที่ Gateway เสมอ) ===
ipcMain.handle('connect-rdp', async (event, { username, password }) => {
  try {
    if (process.platform !== 'win32') {
      return { success: false, message: 'Windows only' };
    }
    if (!GATEWAY_IP) {
      return { success: false, message: 'Gateway IP not set' };
    }
    if (!username || !password) {
      return { success: false, message: 'Missing username/password' };
    }

    const target = `TERMSRV/${GATEWAY_IP}`;
    const cmdkeyCmd = `cmdkey /generic:${target} /user:${username} /pass:${password}`;
    console.log('[connect-rdp] payload:', { target, gateway: GATEWAY_IP, username, hasPassword: !!password });

    exec(cmdkeyCmd, (err) => {
      if (err) return console.error('cmdkey error:', err.message);

      const rdpCmd = `mstsc /v:${GATEWAY_IP}`;
      exec(rdpCmd, (err2) => {
        if (err2) console.error('mstsc error:', err2.message);
      });
    });

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// ✅ Login (ใช้ server_ip ที่ user เลือก แล้ว set เป็น gateway ip ด้วย)
ipcMain.handle('login-request-with-ip', async (event, payload) => {
  console.log('[login-request-with-ip] payload =', payload);

  const { username, password, server_ip } = payload || {};
  if (!username || !password || !server_ip) {
    return { success: false, message: 'Missing username/password/server_ip' };
  }

  // ✅ set gateway ip จากตอน login เลย
  GATEWAY_IP = server_ip;
  console.log('✅ Gateway IP set (from login) to:', GATEWAY_IP);

  try {
    const response = await axios.post(
      `http://${server_ip}:${API_PORT}/api/login`,
      { username, password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return { success: true, message: 'Login successful', user_info: response.data };
  } catch (err) {
    console.error('Login With IP Error:', err?.response?.status, err?.response?.data || err.message);
    return {
      success: false,
      message: err?.response?.data?.detail || err?.response?.data?.message || 'Login failed',
    };
  }
});

ipcMain.handle('check-rdp-installed', async () => {
  try {
    if (process.platform === 'win32') {
      const system32Path = path.join(process.env.WINDIR, 'System32', 'mstsc.exe');
      const exists = fs.existsSync(system32Path);
      console.log('RDP Installed ? :', exists);
      return exists;
    }
    return false;
  } catch (err) {
    console.error('check-rdp-installed error:', err.message);
    return false;
  }
});

// === Electron lifecycle ===
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform === 'win32') {
    if (GATEWAY_IP) {
      const p = spawn('cmdkey', ['/delete:TERMSRV/' + GATEWAY_IP]);
      p.on('close', (code) => {
        if (code === 0) console.log('++Windows RDP creds deleted++');
        else console.error('!! Failed to delete RDP creds, exit code:', code);
      });
    }
  }

  if (process.platform !== 'darwin') app.quit();
});
