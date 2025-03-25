// Gemini API handler for text rewriting
// Note: In a production app, you should handle the API key more securely

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Rewrites text using the Gemini API
 * @param text The text to rewrite
 * @returns The rewritten text
 */
export async function rewriteText(text: string): Promise<string> {
	console.log('Rewrite text called with:', text);
	try {
		// Create the request body for Gemini API
		const requestBody = {
			contents: [
				{
					parts: [
						{
							text: `Please rewrite the following text to be more clear and concise:
                            
"${text}"
                            
Just return the improved text without any explanations or additional comments.`
						}
					]
				}
			],
			generationConfig: {
				temperature: 0.7,
				maxOutputTokens: 800
			}
		};

		// Get API key from environment or session storage
		let apiKey;

		if (isBrowser) {
			apiKey = import.meta.env.VITE_GEMINI_API_KEY || sessionStorage.getItem('gemini_api_key');
			console.log('API Key found:', apiKey ? 'Yes' : 'No');
		} else {
			apiKey = import.meta.env.VITE_GEMINI_API_KEY;
		}

		if (!apiKey) {
			console.error('No API key found');
			throw new Error(
				'Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment or save it to session storage.'
			);
		}

		console.log('Making API request to Gemini...');
		// Make the API request to Gemini
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			console.error('API error response:', errorData);
			throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
		}

		const data = await response.json();
		console.log('API response received:', data);

		// Extract the rewritten text from the response
		if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
			const result = data.candidates[0].content.parts[0].text.trim();
			console.log('Rewritten text:', result);
			return result;
		} else {
			console.error('Unexpected API response format:', data);
			throw new Error('Unexpected API response format');
		}
	} catch (error) {
		console.error('Error in rewriteText:', error);
		throw error;
	}
}
