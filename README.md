# CleanWrite

A minimal distraction-free writing app with history and AI rewriting powered by Google Gemini.

## Features

- Distraction-free writing interface
- Text history with easy navigation
- AI-powered text rewriting with Google Gemini
- Keyboard shortcuts for efficient editing

## Keyboard Shortcuts

- `F`: Focus the input line from anywhere in the app
- `ESC`: Cancel editing
- `↑/↓`: Navigate through history
- `Tab`: Rewrite current text with AI
- `Enter`: Submit text

## Setup and Development

1. Clone the repository
2. Install dependencies with `npm install`
3. For AI rewriting feature, you need a Google Gemini API key:
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a `.env` file based on `.env.example` and add your API key
   - Alternatively, you can enter your API key in the app when prompted

```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## Technologies

- [SvelteKit](https://kit.svelte.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Google Gemini API](https://ai.google.dev/)
