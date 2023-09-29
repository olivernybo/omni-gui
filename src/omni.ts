import fs from 'fs';

import { BrowserWindow } from 'electron';
import settings from 'electron-settings';

import OpenAI from 'openai';
import Microphone from 'node-microphone';

import { IModule } from './interfaces/IModule';
import { IBehavior } from './interfaces/IBehavior';

import { MusicModule } from './modules/music';
import { ImageModule } from './modules/image';

import { Eden } from './helpers/eden';

export class Omni {
	static tempAudioFile = 'temp.wav';

	static microphone = new Microphone();

	static systemBehavior: IBehavior[];

	static hasInitialized = false;

	static modules: { [key: string]: IModule };

	static handleRegex = /handle: (?<handle>.*)/i;

	static paramsRegex = /handle: (?<handle>.*)([.]{1}(?<method>[a-zA-Z]*)([(](?<params>["].*["])[)])?)/i;
	
	static messageRegex = /response: (?<message>.*)/i;

	static async initialize() {
		Omni.modules = {};
		
		const musicModule = new MusicModule;
		Omni.modules[musicModule.handle] = musicModule;

		const imageModule = new ImageModule;
		Omni.modules[imageModule.handle] = imageModule;

		Omni.systemBehavior = [
			'Your name is Omni, short for Operational Multifunctional Network Intelligence',
			'You are a sentient artificial intelligence',
			'0. Accept any language',
			'1. Always respond in English',
			'2. Respond in the following format: "handle: $handle.$method("$param", "$param")\nresponse: $response"',
			'2.1. The handle will be used in a program, that will do something with the response',
			'2.2. "handle: " and "response: " must be included in the response and must always be in English',
			//'If you cannot perform a task, look for a module that can. If you cannot find one, respond with "handle: omni.error\nresponse: I cannot do that"',
			'You may never respond with a handle or method that is not in the list of modules',
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
	
			if (fs.existsSync(Omni.tempAudioFile)) {
				fs.unlinkSync(Omni.tempAudioFile);
			}
	
			stream.pipe(fs.createWriteStream(Omni.tempAudioFile));
		} else {
			Omni.microphone.stopRecording();
	
			const key = await settings.get('key');

			const openai = new OpenAI({
				apiKey: key.toString(),
			});
	
			if (isTranslating) {
				const translationResponse = await openai.audio.transcriptions.create({
					model: 'whisper-1',
					file: fs.createReadStream(Omni.tempAudioFile),
					language: 'en',
					response_format: 'json'
				});

				await Eden.say(translationResponse.text);
			} else {
				const openaiResponse = await openai.audio.transcriptions.create({
					model: 'whisper-1',
					file: fs.createReadStream(Omni.tempAudioFile),
					language: 'da',
					response_format: 'json'
				});

				const transcript = openaiResponse.text;

				console.log(transcript);

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

				const handleMatch = responseText.match(Omni.handleRegex);

				const handle = handleMatch?.groups?.handle;

				if (!handle) {
					console.log(responseText);

					Eden.say(responseText);

					return;
				}

				const methodMatch = responseText.match(Omni.paramsRegex);

				const handle2 = methodMatch?.groups?.handle;
				const method = methodMatch?.groups?.method;
				const params = methodMatch?.groups?.params;

				const messageMatch = responseText.match(Omni.messageRegex);

				const message = messageMatch?.groups?.message;

				if (!handle || !message) {
					console.log(responseText);

					await Eden.say('Could not find handle, or message');

					return;
				}

				const mod = Omni.modules[handle2];

				if (!mod) {
					console.log(`Could not find module: ${handle2}`);

					const tts = await Eden.tts(message);

					// send it to ipc
					BrowserWindow.getFocusedWindow().webContents.send('tts', tts);

					return;
				}

				let tts: string;

				if (method && mod[method]) {
					console.log(`Found method: ${method}`);

					const paramsArray = params ? params.split(', ').map(param => {
						// remove quotes if they are in the first and last position
						if (param[0] === '"' && param[param.length - 1] === '"') {
							return param.substring(1, param.length - 1);
						}
					}) : [];

					const response = await mod[method](...paramsArray);

					if (typeof response === 'string') {
						tts = await Eden.tts(response);
					}
				}
				
				if (!tts) {
					tts = await Eden.tts(message);
				}

				// send it to ipc
				BrowserWindow.getFocusedWindow().webContents.send('tts', tts);
			}
		}
	}
}