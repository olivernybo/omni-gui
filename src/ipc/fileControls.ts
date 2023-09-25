import fs from 'fs';
import { dialog } from 'electron';
import fetch from 'node-fetch';

import { IIPC } from '../interfaces/IIPC';
import { Eden } from '../helpers/eden';

export class FileControls implements IIPC {
	handle = 'file';

	async download(_, url: string) {
		const response = await fetch(url);
		const buffer = await response.buffer();

		const result = await dialog.showSaveDialog({
			title: 'Save Image',
			buttonLabel: 'Save',
			defaultPath: `~/Downloads/untitled.png`,
			filters: [
				{ name: 'Image', extensions: ['png'] },
				{ name: 'All Files', extensions: ['*'] }
			]
		});

		if (!result.canceled) {
			fs.writeFileSync(result.filePath, buffer);
			Eden.say('Image saved');
		}
	}
}