// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.

import { ipcRenderer } from 'electron';
import Swal from 'sweetalert2';

document.querySelector('.close').addEventListener('click', () => {
	ipcRenderer.invoke('app:close');
});

document.querySelector('.minimize').addEventListener('click', () => {
	ipcRenderer.invoke('app:minimize');
});

document.querySelector('#openai').addEventListener('click', () => {
	Swal.fire({
		title: 'Enter OpenAI API Key',
		input: 'text',
		inputAttributes: {
			autocapitalize: 'off',
		},
		showCancelButton: true,
		confirmButtonText: 'Submit',
	}).then((result) => {
		if (result.isConfirmed) {
			ipcRenderer.invoke('settings:set', 'key', result.value);
		}
	});
});

document.querySelector('#eden').addEventListener('click', () => {
	Swal.fire({
		title: 'Enter Eden API Key',
		input: 'text',
		inputAttributes: {
			autocapitalize: 'off',
		},
		showCancelButton: true,
		confirmButtonText: 'Submit',
	}).then((result) => {
		if (result.isConfirmed) {
			ipcRenderer.invoke('settings:set', 'eden', result.value);
		}
	});
});

const circle = document.querySelector('.circle');
circle.addEventListener('click', () => {
	// toggle active class
	const isActive = circle.classList.toggle('active');

	// Get checkbox
	const checkbox = document.querySelector('.mode') as HTMLInputElement;

	const isTranslating = !checkbox.checked;

	checkbox.disabled = isActive;

	// If translating, add translating class, else add omni class
	if (isTranslating) {
		circle.classList.add('translating');
	} else {
		circle.classList.add('omni');
	}

	// If not active, remove translating and omni classes
	if (!isActive) {
		circle.classList.remove('translating', 'omni');
	}

	ipcRenderer.invoke('omni:listen', isActive, isTranslating);
});

ipcRenderer.on('tts', (event, link) => {
	const audio = new Audio();

	audio.src = link;
	
	audio.play();
});

ipcRenderer.on('image', async (event, link) => {
	const result = await Swal.fire({
		title: 'Generated Image',
		imageUrl: link,
		imageHeight: 256,
		showCancelButton: true,
		confirmButtonText: 'Download',
		cancelButtonText: 'Close',
	});

	if (result.isConfirmed) {
		ipcRenderer.invoke('file:download', link);
	}
});