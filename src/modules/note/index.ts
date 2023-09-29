import path from 'path';
import fs from 'fs';

import settings from 'electron-settings';

import OpenAI from 'openai';

import { IModule } from '../../interfaces/IModule';
import { IBehavior } from '../..//interfaces/IBehavior';

export class NoteModule implements IModule {
	handle: string = 'note';
	description: string = 'A module for taking notes. The createNote method takes a title and content and creates a note. The readNote method takes a title and returns the content of the note.';

	private notesFolder = 'notes';

	private systemBehavior: IBehavior[] = [
		{ role: 'system', content: 'Your job is to detect if a note that exists relates to a given title. If it does, return the file name. If it does not, return false.' },
	];

	constructor() {
		this.createFolderIfNotExists();
	}

	private listNotes(): string[] {
		const notes = fs.readdirSync(this.notesFolder);

		return notes;
	}

	public async createNote(title: string, content: string): Promise<string> {
		const list = this.listNotes();

		for (const note of list) {
			if (title.includes(note)) {
				// append to note
				const notePath = path.join(this.notesFolder, note);

				fs.appendFileSync(notePath, `\n${content}`);

				return `Appended to note ${title}`;
			}
		}

		// ask gpt if the title fits any of the notes
		const apiKey = await settings.get('key');
		
		const openai = new OpenAI({
			apiKey: apiKey.toString(),
		});

		const response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [
				...this.systemBehavior,
				{
					role: 'system',
					content: `Here is a list of notes: ${list.join('\n')}`,
				},
				{
					role: 'user',
					content: title,
				},
			],
		}).then(res => res.choices[0].message.content);

		if (list.includes(response)) {
			const notePath = path.join(this.notesFolder, response);

			fs.appendFileSync(notePath, content);

			return `Appended to note ${response}`;
		} else {
			const notePath = path.join(this.notesFolder, title);

			fs.writeFileSync(notePath, content);

			return `Created note ${title}`;
		}
	}

	private async createFolderIfNotExists(): Promise<void> {
		const notesFolder = this.notesFolder;

		if (!fs.existsSync(notesFolder)) {
			fs.mkdirSync(notesFolder);
		}
	}

	public async readNote(title: string): Promise<string> {
		const list = this.listNotes();

		for (const note of list) {
			if (title.includes(note)) {
				// append to note
				const notePath = path.join(this.notesFolder, note);

				const content = fs.readFileSync(notePath).toString();

				return content;
			}
		}

		// ask gpt if the title fits any of the notes
		const apiKey = await settings.get('key');
		
		const openai = new OpenAI({
			apiKey: apiKey.toString(),
		});

		const response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [
				...this.systemBehavior,
				{
					role: 'system',
					content: `Here is a list of notes: ${list.join('\n')}`,
				},
				{
					role: 'user',
					content: title,
				},
			],
		}).then(res => res.choices[0].message.content);

		if (list.includes(response)) {
			const notePath = path.join(this.notesFolder, response);

			const content = fs.readFileSync(notePath).toString();

			return content;
		} else {
			return `Could not find note ${title}`;
		}
	}
}