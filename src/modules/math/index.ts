import math from './math';

import { IModule } from '../../interfaces/IModule';

export class MathModule implements IModule {
	handle: string = 'math';
	description: string = 'A module for performing mathematical operations';

	public async formula(...expressions: string[]) {
		const expression = expressions.join(' ');

		const result = math.evaluate(expression);

		return `The result of ${expression} is ${result}`;
	}
}