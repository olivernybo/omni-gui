/*
const axios = require('axios').default;

const options = {
  method: 'POST',
  url: 'https://api.edenai.run/v2/audio/text_to_speech',
  headers: {
    authorization: 'Bearer 🔑 Your_API_Key',
  },
  data: {
    show_original_response: false,
    fallback_providers: '',
    providers: 'amazon,google,ibm,microsoft',
    language: 'fr',
    text: 'Bonjour Je m'appelle Jane',
    option: 'FEMALE',
  },
};

axios
  .request(options)
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });
*/

import fetch from 'node-fetch';
import settings from 'electron-settings';

export class Eden {
	static async tts(text): Promise<string> {
		const key = await settings.get('eden');

		const response = await fetch('https://api.edenai.run/v2/audio/text_to_speech', {
			method: 'POST',
			headers: {
				authorization: `Bearer ${key}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				text,
				providers: 'microsoft',
				language: 'en-US',
				option: 'MALE',
				settings: {
					microsoft: 'en-US-EricNeural',
				},
				rate: 0,
				pitch: 0,
				volume: 0,
				sampling_rate: 0,
				audio_format: 'wav',
				response_as_dict: false,
			})
		});

		const json = await response.json();

		return json[0].audio_resource_url;
	}
}