const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getDBConnection } = require('./db'); 
const os = require('os');

// === CONFIG ===
const GATEWAY_IP = '210.1.60.188';  // IP ของ Gateway
// const USERNAME = 'Administrator';

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
    const res = await axios.get(`http://${ip}:3000/ping`);
    if (res.data.status === 'ok') {
      return { success: true };
    } else {
      return { success: false };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('get-session-ip-list', async () => {
  try {
    const connection = await getDBConnection(); 
    const [rows] = await connection.execute('SELECT DISTINCT ip FROM devices'); 
    const result = rows.map(row => ({ ip: row.ip })); 
    console.log("Device IPs:", result);
    return result;
  } catch (err) {
    console.error('DB fetch IP error:', err);
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
ipcMain.handle('connect-rdp', async () => {
  try {
    const platform = process.platform;

    if (platform === 'win32') {
      // สำหรับ Windows
      const rdpCommand = `mstsc /v:${GATEWAY_IP}`;
      console.log('🚀 Opening RDP to Gateway on Windows...');
      exec(rdpCommand, (err) => {
        if (err) console.error('Windows RDP error:', err.message);
        else console.log('Windows RDP launched.');
      });

    }
    // สำหรับ macOS
    else if (platform === 'darwin') {
      const rdpContent = `
          full address:s:${GATEWAY_IP}
          prompt for credentials:i:1
          screen mode id:i:2
          desktopwidth:i:1280
          desktopheight:i:720
          session bpp:i:32
          `.trim();

      const filePath = path.join(require('os').tmpdir(), 'temp_connection.rdp');
      fs.writeFileSync(filePath, rdpContent);

      exec(`open "${filePath}"`, (err) => {
        if (err) console.error('❌ Failed to open .rdp file:', err.message);
        else console.log('RDP launched via .rdp file.');
      });
    } else {
      console.error(`Unsupported platform: ${platform}`);
    }

  } catch (err) {
    console.error('Connect-rdp Error:', err.message);
  }
});

ipcMain.handle('login-request-with-ip', async (event, { user_id, password, server_ip }) => {
  try {
    console.log('🌐 Login to:', server_ip, 'User:', user_id);

    const response = await axios.post(
      `http://${server_ip}:3000/api/login`,
      {
        user_id,
        password
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        message: 'Login successful',
        user_info: response.data.user
      };
    } else {
      return {
        success: false,
        message: response.data.message
      };
    }
  } catch (err) {
    console.error('Login With IP Error:', err.message);
    return {
      success: false,
      message: 'Cannot connect to server at ' + server_ip
    };
  }
});

ipcMain.handle('check-rdp-installed', async () => {
  try {
    if (process.platform === 'win32') {
      const system32Path = path.join(process.env.WINDIR, 'System32', 'mstsc.exe');
      const exists = fs.existsSync(system32Path);
      console.log("RDP Installed ? :", exists);
      return exists;
    }

    if (process.platform === 'darwin') {
      const macRdpPath = '/Applications/Microsoft Remote Desktop.app';
      const exists = fs.existsSync(macRdpPath);
      console.log("RDP Installed ? :", exists);
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
  if (process.platform !== 'darwin') app.quit();
});


