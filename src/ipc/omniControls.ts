import { IIPC } from '../interfaces/IIPC';
import { Omni } from '../omni';

export class OmniControls implements IIPC {
	handle = 'omni';

	async listen(_, isActive, isTranslating) {
		Omni.listen(isActive, isTranslating);
	}
}