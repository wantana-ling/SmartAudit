const { app, BrowserWindow, ipcMain } = require('electron');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');

// === CONFIG ===
const GATEWAY_IP = '210.1.60.188';  // IP ของ Gateway
const API_PORT = 3000;
const API_BASE = `http://${GATEWAY_IP}:${API_PORT}`; // ✅ CHANGED

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

ipcMain.handle('ping-server', async (event, ip) => {
  try {
    const res = await axios.get(`http://${ip}:${API_PORT}/ping`);
    if (res.data.status === 'ok') {
      return { success: true };
    } else {
      return { success: false };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// ✅ ใช้ FastAPI ดึง IP list แทนการต่อ MySQL ตรง
ipcMain.handle('get-session-ip-list', async () => {
  try {
    // ไปเรียก backend: GET /api/ipserver/list
    const res = await axios.get(`${API_BASE}/api/ipserver/list`);
    const rows = res.data;

    const result = (rows || []).map(row => ({
      ip: row.ip || row.IP || row.address || ''
    })).filter(item => item.ip);

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

// === เชื่อมต่อ RDP ===
ipcMain.handle('connect-rdp', async (event, { ip, username, password }) => {
  try {
    if (process.platform !== 'win32') {
      return { success: false, message: 'Windows only' };
    }
    if (!ip || !username || !password) {
      return { success: false, message: 'Missing ip/username/password' };
    }

    const target = `TERMSRV/${ip}`;
    const cmdkeyCmd = `cmdkey /generic:${target} /user:${username} /pass:${password}`;
    console.log('[connect-rdp] payload:', { ip, username, hasPassword: !!password });

    exec(cmdkeyCmd, (err) => {
      if (err) return console.error('cmdkey error:', err.message);

      const rdpCmd = `mstsc /v:${ip}`;
      exec(rdpCmd, (err2) => {
        if (err2) console.error('mstsc error:', err2.message);
      });
    });

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
  
});

// ipcMain.handle('connect-rdp', async () => {
//   try {
//     const platform = process.platform;

//     if (platform === 'win32') {
//       // สำหรับ Windows
//       const rdpCommand = `mstsc /v:${GATEWAY_IP}`;
//       console.log('🚀 Opening RDP to Gateway on Windows...');
//       exec(rdpCommand, (err) => {
//         if (err) console.error('Windows RDP error:', err.message);
//         else console.log('Windows RDP launched.');
//       });

//     } else if (platform === 'darwin') {
//       // สำหรับ macOS
//       const rdpContent = `
//           full address:s:${GATEWAY_IP}
//           prompt for credentials:i:1
//           screen mode id:i:2
//           desktopwidth:i:1280
//           desktopheight:i:720
//           session bpp:i:32
//           `.trim();

//       const filePath = path.join(require('os').tmpdir(), 'temp_connection.rdp');
//       fs.writeFileSync(filePath, rdpContent);

//       exec(`open "${filePath}"`, (err) => {
//         if (err) console.error('❌ Failed to open .rdp file:', err.message);
//         else console.log('RDP launched via .rdp file.');
//       });
//     } else {
//       console.error(`Unsupported platform: ${platform}`);
//     }

//   } catch (err) {
//     console.error('Connect-rdp Error:', err.message);
//   }
// });

ipcMain.handle('login-request-with-ip', async (event, payload) => {
  console.log('[login-request-with-ip] payload =', payload);

  const { username, password, server_ip } = payload || {};

  if (!username || !password || !server_ip) {
    return { success: false, message: 'Missing username/password/server_ip' };
  }

  try {
    console.log('🌐 Login to:', server_ip, 'User:', username);

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

    if (process.platform === 'darwin') {
      const macRdpPath = '/Applications/Microsoft Remote Desktop.app';
      const exists = fs.existsSync(macRdpPath);
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
    const { spawn } = require('child_process');

    const p = spawn('cmdkey', ['/delete:TERMSRV/' + GATEWAY_IP]);

    p.on('close', (code) => {
      if (code === 0) {
        console.log('++Windows RDP creds deleted++');
      } else {
        console.error('!! Failed to delete RDP creds, exit code:', code);
      }
    });
  }

  if (process.platform !== 'darwin') app.quit();
});

