const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveNote: (text) => ipcRenderer.invoke('save-note', text),
    saveAs: (text) => ipcRenderer.invoke('save-as', text),
    loadNote: () => ipcRenderer.invoke('load-note'),
    deleteAll: () => ipcRenderer.invoke('delete-notes'),
    confirmNewNote: () => ipcRenderer.invoke('confirm-new-note'), // ✅ FIXED
    openFile: () => ipcRenderer.invoke('open-file')
});