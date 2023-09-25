import fetch from 'node-fetch';
import settings from 'electron-settings';
import { BrowserWindow } from 'electron';

export class Eden {
	static async tts(text): Promise<string> {
		const key = await settings.get('eden');

		const response = await fetch('https://api.edenai.run/v2/audio/text_to_speech', {
			method: 'POST',
			headers: {
				authorization: `Bearer ${key}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				text,
				providers: 'microsoft',
				language: 'en-US',
				option: 'MALE',
				settings: {
					microsoft: 'en-US-CoraNeural',
				},
				rate: '10',
				pitch: 0,
				volume: 0,
				sampling_rate: '200000',
				audio_format: 'wav',
				response_as_dict: false,
			})
		});

		const json = await response.json();

		return json[0].audio_resource_url;
	}

	static async say(text) {
		const link = await Eden.tts(text);

		BrowserWindow.getFocusedWindow().webContents.send('tts', link);
	}
}