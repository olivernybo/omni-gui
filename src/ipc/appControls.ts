import { BrowserWindow, IpcMainInvokeEvent, app } from 'electron';
import { IIPC } from '../interfaces/IIPC';

export class AppControls implements IIPC {
	handle = 'app';

	close() {
		app.quit();
	}

	minimize(event: IpcMainInvokeEvent) {
		BrowserWindow.fromWebContents(event.sender)?.minimize();
	}
}