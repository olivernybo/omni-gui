import { IModule } from '../../interfaces/IModule';

export class QuestionModule implements IModule {
	handle: string = 'question';
	description: string = 'A module for asking questions.';

	public askQuestion() {
		return null;
	}
}