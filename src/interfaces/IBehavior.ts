export interface IBehavior {
	role: 'function' | 'system' | 'user' | 'assistant';
	content: string;
}
