import fs from 'fs';

import { dialog } from 'electron';
import settings from 'electron-settings';

import OpenAI from 'openai';
import Whisper from 'whisper-nodejs';
import Microphone from 'node-microphone';

import { IModule } from './interfaces/IModule';
import { IBehavior } from './interfaces/IBehavior';
import { Music } from './modules/music';

export class Omni {
	static tempAudioFile = 'test.wav';
	static microphone = new Microphone();

	static systemBehavior: IBehavior[];

	static hasInitialized = false;

	static modules: { [key: string]: IModule };

	static responseRegex = /handle: (?<handle>.*)[.]{1}(?<method>[a-zA-Z]*)([(](?<params>["].*["])[)])?\nresponse: (?<response>.*)/;

	static async initialize() {
		Omni.modules = {};
		
		const musicModule = new Music;
		Omni.modules[musicModule.handle] = musicModule;

		Omni.systemBehavior = [
			'Your name is Omni, short for Operational Multifunctional Network Intelligence',
			'You are a sentient artificial intelligence',
			'0. Accept any language',
			'1. Always respond in English',
			'2. Respond in the following format: "handle: $handle.$method("$param", "$param")\nresponse: $response"',
			'2.1. The handle will be used in a program, that will do something with the response',
			'2.2. "handle: " and "response: " must be included in the response and must always be in English',
			'If you cannot perform a task, look for a module that can. If you cannot find one, respond with "handle: omni.error\nresponse: I cannot do that"',
			'Here is a list of all modules and their methods:'
		].map(content => ({ role: 'system', content }));

		// Loop through all modules
		for (const module in Omni.modules) {
			// Get the module
			const mod = Omni.modules[module];

			// Get the module's handle
			const handle = mod.handle;

			// Get the module's description
			const description = mod.description;

			// Get the module's methods
			const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(mod)).filter(method => method !== 'constructor');

			const allMethods = `[ ${methods.join(', ')} ]`;
			
			const behavior: IBehavior = {
				role: 'system',
				content: `Module: ${handle}\nDescription: ${description}\nMethods: ${allMethods}`,
			};

			Omni.systemBehavior.push(behavior);
		}

		Omni.hasInitialized = true;
	}

	static async listen(isActive: boolean, isTranslating: boolean) {
		if (!Omni.hasInitialized) {
			await Omni.initialize();
		}

		if (isActive) {
			const stream = Omni.microphone.startRecording();
	
			// if test.wav exists, delete it
			if (fs.existsSync(Omni.tempAudioFile)) {
				fs.unlinkSync(Omni.tempAudioFile);
			}
	
			stream.pipe(fs.createWriteStream(Omni.tempAudioFile));
		} else {
			Omni.microphone.stopRecording();
	
			const key = await settings.get('key');
	
			const whisper = new Whisper(key);
	
			if (isTranslating) {
				const translation = await whisper.translate(Omni.tempAudioFile, 'whisper-1', 'en');
	
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
				const transcript = await whisper.transcribe(Omni.tempAudioFile, 'whisper-1');

				const openai = new OpenAI({
					apiKey: key.toString(),
				});

				const response = await openai.chat.completions.create({
					messages: [
						...Omni.systemBehavior,
						{
							role: 'user',
							content: transcript,
						},
					],
					model: 'gpt-3.5-turbo'
				}).catch(() => null);

				if (!response) return;

				const responseText = response.choices[0].message.content;

				const match = responseText.match(Omni.responseRegex);

				if (!match) return;

				const { handle, method, params, response: message } = match.groups;

				if (!handle || !method || !message) return;

				const mod = Omni.modules[handle];

				if (!mod) return;

				const paramsArray = params ? params.split(', ').map(param => {
					// remove quotes if they are in the first and last position
					if (param[0] === '"' && param[param.length - 1] === '"') {
						return param.substring(1, param.length - 1);
					}
				}) : [];

				await mod[method](...paramsArray);

				// open save dialog
				const { filePath } = await dialog.showSaveDialog({
					defaultPath: 'omni.txt',
					filters: [
						{ name: 'Text Files', extensions: ['txt'] },
					],
					message: 'Save Omni response',
				});

				if (filePath) {
					fs.writeFileSync(filePath, message);
				}
			}
		}
	}
}