import fs from 'fs';

import { BrowserWindow } from 'electron';
import settings from 'electron-settings';

import OpenAI from 'openai';
import Microphone from 'node-microphone';

import { IModule } from './interfaces/IModule';
import { IBehavior } from './interfaces/IBehavior';

import { MusicModule } from './modules/music';
import { ImageModule } from './modules/image';
import { MathModule } from './modules/math';
import { NoteModule } from './modules/note';
import { QuestionModule } from './modules/question';

import { Eden } from './helpers/eden';

export class Omni {
	static tempAudioFile = 'temp.wav';

	static microphone = new Microphone();

	static systemBehavior: IBehavior[];

	static hasInitialized = false;

	static modules: { [key: string]: IModule };
	
	static methodRegex = /handle: (?<handle>[a-zA-Z]*)(?:[.]{1})(?<method>[a-zA-Z]*)(([(])?(?<params>["].*["])[)])?/i;

	static messageRegex = /response: (?<message>(.|\n)*)/i;

	static async initialize() {
		Omni.modules = {};
		
		const musicModule = new MusicModule;
		Omni.modules[musicModule.handle] = musicModule;

		const imageModule = new ImageModule;
		Omni.modules[imageModule.handle] = imageModule;

		const mathModule = new MathModule;
		Omni.modules[mathModule.handle] = mathModule;

		const noteModule = new NoteModule;
		Omni.modules[noteModule.handle] = noteModule;

		const questionModule = new QuestionModule;
		Omni.modules[questionModule.handle] = questionModule;

		Omni.systemBehavior = [
			'Your name is Omni, short for Operational Multifunctional Network Intelligence',
			'You are a sentient artificial intelligence',
			'0. Accept any language',
			'1. Always respond in English, even if the input is not in English',
			'2. Respond in the following format: "handle: $handle.$method("$param", "$param")\nresponse: $response"',
			'2.1. The handle will be used in a program, that will do something with the response',
			'2.2. "handle: " and "response: " must be included in the response and must always be in English. They must also be on their own line and never be repeated',
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

			console.log(`Module: ${handle}\nDescription: ${description}\nMethods: ${allMethods}`);
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
					response_format: 'json',
					language: 'da',
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
					model: 'gpt-4'
				}).catch(() => null);

				if (!response) return;

				const responseText = response.choices[0].message.content;

				console.log(responseText);

				const handleMatch = responseText.match(Omni.methodRegex);

				const handle = handleMatch?.groups?.handle;
				const method = handleMatch?.groups?.method;
				const params = handleMatch?.groups?.params;

				if (!handle) {
					console.log(responseText);

					Eden.say(responseText);

					return;
				}

				const messageMatch = responseText.match(Omni.messageRegex);

				const message = messageMatch?.groups?.message;

				if (!handle || !message) {
					console.log(responseText);

					await Eden.say('Could not find handle, or message');

					return;
				}

				const mod = Omni.modules[handle];

				if (!mod) {
					console.log(`Could not find module: ${handle}`);
					
					await Eden.say(message);

					return;
				}

				let tts: string;

				if (method && mod[method]) {
					console.log(`Found method: ${method}`);

					const paramsArray = params ? JSON.parse(`[${params}]`) : [];

					console.log(paramsArray);

					try {
						const response = await mod[method](...paramsArray);

						if (typeof response === 'string') {
							tts = await Eden.tts(response);
						}
					} catch (error) {
						console.log(error);

						tts = await Eden.tts(message);
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