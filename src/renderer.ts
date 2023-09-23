// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.

import { ipcRenderer } from 'electron';
import Swal from 'sweetalert2';

document.querySelector('.close').addEventListener('click', () => {
	ipcRenderer.invoke('close');
});

document.querySelector('.minimize').addEventListener('click', () => {
	ipcRenderer.invoke('minimize');
});

document.querySelector('.key').addEventListener('click', () => {
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
			ipcRenderer.invoke('key', result.value);
		}
	});
});

document.querySelector('.circle').addEventListener('click', () => {
	// toggle active class
	const isActive = document.querySelector('.circle').classList.toggle('active');

	ipcRenderer.invoke('listen', isActive);
});