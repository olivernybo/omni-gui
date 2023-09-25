import { BrowserWindow } from 'electron';
import settings from 'electron-settings';
import OpenAI from 'openai';

import { IModule } from '../../interfaces/IModule';

export class ImageModule implements IModule {
	handle = 'image';
	description = 'Module for managing images';

	async generateImage(prompt: string) {
		const apiKey = await settings.get('key');

		const openai = new OpenAI({
			apiKey: apiKey.toString(),
		});

		const image = await openai.images.generate({
			prompt,
			n: 1,
			size: '256x256'
		});

		const imageUrl = image.data[0].url;
		
		BrowserWindow.getFocusedWindow().webContents.send('image', imageUrl);

		return `Generated image of ${prompt}`;
	}
}