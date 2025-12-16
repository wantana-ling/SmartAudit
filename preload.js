const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ✅ ส่ง payload ตรง ๆ (ไม่ห่อ {payload})
  connectRDP: (payload) =>
    ipcRenderer.invoke('connect-rdp', payload),

  // (อันนี้ถ้าไม่ได้ใช้ก็ปล่อยไว้ได้)
  getDevices: () =>
    ipcRenderer.invoke('get-devices'),

  // ✅ เปลี่ยน user_id -> username ให้ตรงกับ FastAPI + main.js
  loginRequestWithIP: ({ username, password, server_ip }) =>
    ipcRenderer.invoke('login-request-with-ip', { username, password, server_ip }),

  pingServer: (ip) =>
    ipcRenderer.invoke('ping-server', ip),

  getSessionIPList: () =>
    ipcRenderer.invoke('get-session-ip-list'),

  checkRdpInstalled: () =>
    ipcRenderer.invoke('check-rdp-installed'),

  getHostname: () =>
    ipcRenderer.invoke('get-hostname'),

  getHostInfo: () =>
    ipcRenderer.invoke('get-host-info')
});
