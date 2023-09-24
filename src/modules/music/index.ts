import { IModule } from '../../interfaces/IModule';

export class Music implements IModule {
	handle: string = 'music';
	description: string = 'Module for managing music';

	play(content: string) {
		return `Playing ${content} music`;
	}

	pause() {
		return 'Pausing music';
	}

	resume() {
		return 'Resuming music';
	}

	stop() {
		return 'Stopping music';
	}
}