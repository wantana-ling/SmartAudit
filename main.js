const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');

// === CONFIG ===
const GATEWAY_IP = '192.168.121.195';  // IP ของ Gateway

// === Create Window ===
function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 563,
    title: 'Smart Audit',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  win.loadFile(path.join(__dirname, 'build', 'index.html'));
}

// === เชื่อมต่อ API สำหรับ login ===
ipcMain.handle('login-request', async (event, { user_id, password }) => {
  try {
    console.log('🔍 Login Request:', user_id, password); // Debug log

    const response = await axios.post(
      'http://192.168.121.195:3000/login',
      {
        user_id: parseInt(user_id),
        password: password
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
        user_info: response.data.user_info
      };
    } else {
      return {
        success: false,
        message: response.data.message
      };
    }
  } catch (err) {
    console.error('❌ Login Error:', err.response?.data || err.message);
    return {
      success: false,
      message: 'Error connecting to the server'
    };
  }
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
        if (err) console.error('❌ Windows RDP error:', err.message);
        else console.log('✅ Windows RDP launched.');
      });

    } else if (platform === 'darwin') {
      // สำหรับ macOS
      const rdpUrl = `rdp://${GATEWAY_IP}`;
      const openCommand = `open "${rdpUrl}"`;
      console.log('🚀 Opening RDP to Gateway on macOS...');
      exec(openCommand, (err) => {
        if (err) console.error('❌ macOS RDP error:', err.message);
        else console.log('✅ macOS RDP launched.');
      });

    } else {
      console.error(`❌ Unsupported platform: ${platform}`);
    }

  } catch (err) {
    console.error('❌ connect-rdp Error:', err.message);
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


