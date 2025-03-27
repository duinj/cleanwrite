// Gemini AI service using the official Google Generative AI SDK
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getContextString, hasContext, getCurrentTone } from '$lib/stores/context';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Initializes and returns a Gemini model instance
 * @returns The Gemini model instance
 */
function getGeminiModel() {
	// Get API key from environment or session storage
	let apiKey;

	if (isBrowser) {
		apiKey = import.meta.env.VITE_GEMINI_API_KEY || sessionStorage.getItem('gemini_api_key');
	} else {
		apiKey = import.meta.env.VITE_GEMINI_API_KEY;
	}

	if (!apiKey) {
		throw new Error(
			'Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment or save it to session storage.'
		);
	}

	// Initialize the API with your API key
	const genAI = new GoogleGenerativeAI(apiKey);

	// Access Gemini 2.0 Flash model
	return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

/**
 * Rewrites text using the Gemini API
 * @param text The text to rewrite
 * @returns The rewritten text
 */
export async function rewriteText(text: string): Promise<string> {
	try {
		const model = getGeminiModel();

		// Check if we have context to use
		const hasWritingContext = hasContext();
		const contextString = getContextString();
		const currentTone = getCurrentTone();

		let prompt = '';

		// Build the tone instruction
		const toneInstruction = currentTone ? `Use a ${currentTone} tone in your writing.` : '';

		if (hasWritingContext && contextString) {
			// If we have context, use it to inform the rewrite
			prompt = `You are assisting with writing content. Here is the previous content that provides context:

${contextString}

Please rewrite the following text to be more clear, concise, and consistent with the previous content.
${toneInstruction}
Just return the improved text without any explanations or additional comments:

"${text}"`;
		} else {
			// Default prompt without context
			prompt = `Please rewrite the following text to be more clear and concise. 
${toneInstruction}
Just return the improved text without any explanations or additional comments:
		
"${text}"`;
		}

		// Generate content with the model
		const result = await model.generateContent(prompt);
		const response = await result.response;
		// Trim the response to remove unwanted whitespace including newlines
		return response.text().trim();
	} catch (error) {
		console.error('Error in rewriteText:', error);
		throw error;
	}
}
