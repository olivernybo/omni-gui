import { ipcMain } from 'electron';

import { IIPC } from '../interfaces/IIPC';
import { AppControls } from './appControls';
import { Settings } from './settings';
import { OmniControls } from './omniControls';

export const setup = () => {
	register(new AppControls());
	register(new Settings());
	register(new OmniControls());
};

const register = (ipc: IIPC) => {
	// Get all methods of the request object
	const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ipc)).filter(method => method !== 'constructor');

	// Register all methods. Format: handle:method
	for (const method of methods) {
		// ipcMain.handle(`${method}:${handle}`, ipc[method]);
		ipcMain.handle(`${ipc.handle}:${method}`, ipc[method]);
	}

	// Log the registration
	const allMethods = methods.join(', ');
	console.log(`Registered [ ${allMethods} ] with handle $${ipc.handle} from ${ipc.constructor.name}`);
};