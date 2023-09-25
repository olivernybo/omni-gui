import settings from 'electron-settings';
import { IIPC } from '../interfaces/IIPC';

export class SettingsControls implements IIPC {
	handle = 'settings';

	async set(_, key: string, value: string) {
		await settings.set(key, value);
	}
}