window.addEventListener('DOMContentLoaded', async () => {

    const note = document.getElementById('note');
    const status = document.getElementById('status');

    const newNoteBtn = document.getElementById('new-note');
    const openFileBtn = document.getElementById('open-file');
    const saveBtn = document.getElementById('save');
    const saveAsBtn = document.getElementById('saveas');
    const deleteBtn = document.getElementById('delete');
    const loadBtn = document.getElementById('load');

    let lastSaved = '';
    let currentFilePath = '';

    // ✅ Load on start
    const initialData = await window.electronAPI.loadNote();
    note.value = initialData;
    lastSaved = initialData;

    // ✅ Open File
    openFileBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.openFile();

        if (result.success) {
            note.value = result.content;
            lastSaved = result.content;
            currentFilePath = result.filePath;
            status.textContent = `Opened: ${result.filePath}`;
        } else {
            status.textContent = 'Open cancelled.';
        }
    });

    // ✅ New Note
    newNoteBtn.addEventListener('click', async () => {
        if (note.value !== lastSaved) {
            const res = await window.electronAPI.confirmNewNote();
            if (!res.confirmed) {
                status.textContent = 'New note cancelled.';
                return;
            }
        }

        note.value = '';
        lastSaved = '';
        currentFilePath = '';
        status.textContent = 'New note started.';
    });

    // ✅ Save
    saveBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.saveNote(note.value);
        lastSaved = note.value;
        status.textContent = `Saved!`;
    });

    // ✅ Save As
    saveAsBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.saveAs(note.value);

        if (result.success) {
            lastSaved = note.value;
            currentFilePath = result.filePath;
            status.textContent = `Saved to: ${result.filePath}`;
        } else {
            status.textContent = "Save As cancelled";
        }
    });

    // ✅ Delete
    deleteBtn.addEventListener('click', async () => {
        const confirmDelete = confirm("Delete all notes?");
        if (!confirmDelete) return;

        await window.electronAPI.deleteAll();
        note.value = '';
        lastSaved = '';
        status.textContent = "Deleted!";
    });

    // ✅ Load Note (default file)
    loadBtn.addEventListener('click', async () => {
        const data = await window.electronAPI.loadNote();
        note.value = data;
        lastSaved = data;
        status.textContent = "Note loaded!";
    });

    // ✅ Auto Save
    let timer;
    note.addEventListener('input', () => {
        clearTimeout(timer);

        timer = setTimeout(async () => {
            if (note.value !== lastSaved) {
                await window.electronAPI.saveNote(note.value);
                lastSaved = note.value;

                const time = new Date().toLocaleTimeString();
                status.textContent = "Auto saved at " + time;
            }
        }, 3000);
    });

    window.electronAPI.onMenuAction('menu-new-note', () => {
        newNoteBtn.click();
    });
    window.electronAPI.onMenuAction('menu-open-file', () => {
        openFileBtn.click();
    });
    window.electronAPI.onMenuAction('menu-save', () => {
        saveBtn.click();
    });
    window.electronAPI.onMenuAction('menu-save-as', () => {
        saveAsBtn.click();
    });
});




