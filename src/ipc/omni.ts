import fs from 'fs';

import { dialog } from 'electron';
import settings from 'electron-settings';

import OpenAI from 'openai';
import Whisper from 'whisper-nodejs';
import Microphone from 'node-microphone';

import { IIPC } from '../interfaces/IIPC';

export class Omni implements IIPC {
	handle = 'omni';

	static microphone = new Microphone();

	async listen(_, isActive, isTranslating) {
		if (isActive) {
			const stream = Omni.microphone.startRecording();
	
			// if test.wav exists, delete it
			if (fs.existsSync('test.wav')) {
				fs.unlinkSync('test.wav');
			}
	
			stream.pipe(fs.createWriteStream('test.wav'));
		} else {
			Omni.microphone.stopRecording();
	
			const key = await settings.get('key');
	
			const whisper = new Whisper(key);
	
			if (isTranslating) {
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
			} else {
				const transcript = await whisper.transcribe('test.wav', 'whisper-1');

				const openai = new OpenAI({
					apiKey: key.toString(),
				});

				openai.chat.completions.create({
					messages: [
						//...systemBehavior,
						{
							role: 'user',
							content: transcript,
						},
					],
					model: 'gpt-3.5-turbo'
				}).then(async (response) => {
					const responseText = response.choices[0].message.content;

					// open save dialog
					const { filePath } = await dialog.showSaveDialog({
						defaultPath: 'omni.txt',
						filters: [
							{ name: 'Text Files', extensions: ['txt'] },
						],
						message: 'Save Omni response',
					});

					if (filePath) {
						fs.writeFileSync(filePath, responseText);
					}
				});
			}
		}
	}
}