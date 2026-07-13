// Preload — pont sécurisé entre Electron et l'interface web
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('niroApp', {
  platform: process.platform,
  isApp: true,
})
