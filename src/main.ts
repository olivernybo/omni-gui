import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import settings from 'electron-settings';
import path from 'path';
import Microphone from 'node-microphone';
import fs from 'fs';
import Whisper from 'whisper-nodejs';

const microphone = new Microphone();

function createWindow() {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false,
		},
		width: 500,
		titleBarStyle: 'hidden',
		resizable: false,
		//frame: false,
		// titleBarOverlay: {
		// 	color: '#2e2e2e',
		// 	symbolColor: '#ff6d4b'
		// },
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, '../index.html'));

	// Open the DevTools.
	//mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.handle('close', () => {
	app.quit();
});

ipcMain.handle('minimize', (event) => {
	BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle('key', async (event, key) => {
	await settings.set('key', key);

	BrowserWindow.fromWebContents(event.sender)?.reload();
});

ipcMain.handle('listen', async (event, isActive) => {
	if (isActive) {
		const stream = microphone.startRecording();

		// if test.wav exists, delete it
		if (fs.existsSync('test.wav')) {
			fs.unlinkSync('test.wav');
		}

		stream.pipe(fs.createWriteStream('test.wav'));
	} else {
		microphone.stopRecording();

		const key = await settings.get('key');

		const whisper = new Whisper(key);

		const translation = await whisper.translate('test.wav', 'whisper-1', 'en');

		// open save dialog
		const { filePath } = await dialog.showSaveDialog({
			defaultPath: 'translation.txt',
			filters: [
				{ name: 'Text Files', extensions: ['txt'] },
			],
			message: 'Save Translation',
		});

		if (filePath) {
			fs.writeFileSync(filePath, translation);
		}
	}
});