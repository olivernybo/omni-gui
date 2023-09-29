import math from './math';

import { IModule } from '../../interfaces/IModule';

export class MathModule implements IModule {
	handle: string = 'math';
	description: string = 'A module for performing mathematical operations';

	public async evaluate(expression: string): Promise<string> {
		try {
			const result = math.evaluate(expression);

			return `The result of ${expression} is ${result}`;
		} catch {
			return 'I could not evaluate that expression';
		}
	}
}