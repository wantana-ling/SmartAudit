const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  connectRDP: (payload) =>
    ipcRenderer.invoke('connect-rdp', payload),

  getDevices: () =>
    ipcRenderer.invoke('get-devices'),

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
