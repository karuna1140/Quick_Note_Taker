const { app, BrowserWindow, ipcMain, dialog, Menu, Tray } = require('electron');
const path = require('path');
const fs = require('fs');
const { constants } = require('buffer');
const { type } = require('os');
const { Certificate } = require('crypto');
const { create } = require('domain');

let filePath;

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
    win.on('close', (event) => {
        event.preventDefault();  // stop the window from actually closing
        win.hide();              // hide it instead
    });
}

let tray = null;
app.whenReady().then(() => {
    filePath = path.join(app.getPath('documents'), 'quicknote.txt');
    createWindow();


    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Note',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('menu-new-note');
                    }
                },
                {
                    label: 'Open File',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('menu-open-file');
                    }
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('menu-save');
                    }
                },
                {
                    label: 'Save As',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send('menu-save-as');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => app.quit()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    tray = new Tray(path.join(__dirname, 'tray-icon.png'));
    // Tray context menu
    const trayMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                BrowserWindow.getAllWindows()[0].show();
            }
        },
        {
            label: 'Quit',
            click: () => app.quit()
        }
    ]);
    tray.setToolTip('Quick Note Taker');
    tray.setContextMenu(trayMenu);


    tray.on('double-click', () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win.isVisible()) {
            win.hide();
        } else {
            win.show();
        }
    });
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();

    }
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
