const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let filePath;

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    filePath = path.join(app.getPath('documents'), 'quicknote.txt');
    createWindow();
});


// ✅ Confirm before new note
ipcMain.handle('confirm-new-note', async () => {
    const result = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Discard', 'Cancel'],
        defaultId: 1,
        message: 'Unsaved changes will be lost. Continue?'
    });

    return { confirmed: result.response === 0 };
});


// ✅ Save
ipcMain.handle('save-note', async (e, text) => {
    fs.writeFileSync(filePath, text);
    return { success: true, filePath };
});


// ✅ Save As
ipcMain.handle('save-as', async (e, text) => {
    const result = await dialog.showSaveDialog({
        defaultPath: 'note.txt'
    });

    if (!result.canceled) {
        fs.writeFileSync(result.filePath, text);
        return { success: true, filePath: result.filePath };
    }

    return { success: false };
});


// ✅ Open file
ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });

    if (result.canceled) {
        return { success: false };
    }

    const filePath = result.filePaths[0]; // FIXED (was wrong)
    const content = fs.readFileSync(filePath, 'utf-8');

    return { success: true, content, filePath };
});


// ✅ Load default note
ipcMain.handle('load-note', async () => {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
});


// ✅ Delete
ipcMain.handle('delete-notes', async () => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    return { success: true };
});