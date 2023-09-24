import { IModule } from '../../interfaces/IModule';

export class Music implements IModule {
	handle: string = 'music';
	description: string = 'Module for managing music';

	play(content: string) {
		console.log(`playing ${content} music`);
	}

	pause() {
		console.log('pausing music');
	}

	resume() {
		console.log('resuming music');
	}

	stop() {
		console.log('stopping music');
	}
}