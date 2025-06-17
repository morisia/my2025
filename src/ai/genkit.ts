
import {genkit} from 'genkit';
import {googleAI, type GoogleAIPluginArgs} from '@genkit-ai/googleai';

// Prepare arguments for the GoogleAI plugin
const googleAiPluginArgs: GoogleAIPluginArgs = {};

// If GEMINI_API_KEY is found in the environment variables, pass it explicitly
if (process.env.GEMINI_API_KEY) {
  googleAiPluginArgs.apiKey = process.env.GEMINI_API_KEY;
}
// Note: If GOOGLE_API_KEY is used as an alternative, that could also be checked here:
// else if (process.env.GOOGLE_API_KEY) {
//   googleAiPluginArgs.apiKey = process.env.GOOGLE_API_KEY;
// }

export const ai = genkit({
  plugins: [googleAI(googleAiPluginArgs)], // Pass the arguments object
  model: 'googleai/gemini-2.0-flash', // Default model for ai.generate if not specified
});

