import path from 'path';

import dotenv from 'dotenv';
import { Environment } from 'env-types';

import { app, BrowserWindow } from 'electron';
import reload from 'electron-reload';

import * as ipc from './ipc';

dotenv.config({ path: path.join(__dirname, '../.env') });
Environment.load();

if (Environment.DEVELOPMENT) {
	// reload index.html and the css folder
	reload(path.join(__dirname, '../index.html'), {});
	reload(path.join(__dirname, '../css/**'), {});
}

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
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, '../index.html'));

	if (Environment.DEVELOPMENT) {
		// Open the DevTools.
		if (Environment.OPEN_DEV_TOOLS) {
			mainWindow.webContents.openDevTools();
		}
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	ipc.setup();
	createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	app.quit();
});
