# Claude Usage Tracker & Prompt Optimization Extension

A powerful browser extension designed to help you track your Claude.ai token usage and seamlessly optimize your prompts for maximum efficiency.

## Features

**✨ Prompt Optimization & Tools**
Optimize your drafts and manage your workflow directly inside Claude!
- **Optimize**: Click the "Optimize" button to leverage the Gemini API to format your prompts for optimal LLM results and minimum token usage.
- **Prompt Templates**: Save, manage, and insert frequently used prompt templates with a dedicated template library.
- **Focus Mode**: Toggle a distraction-free "Zen" mode to hide sidebars and headers, letting you focus entirely on your conversation.

**📊 Analytics & Tracking**
- **Usage Tracking**: Monitors token consumption across files, projects, chat history, and AI responses.
- **Analytics Dashboard**: View a detailed 30-day history of your token usage with interactive charts and peak usage statistics.
- **Context Visualizer**: Real-time progress bar showing how much of Claude's 200k context window you've consumed.
- **Cost Estimation**: Live USD cost estimation for every message, helping you manage your budget.
- **Theme Sync**: Automatically synchronizes with Claude's light/dark mode for a seamless visual experience.

## Installation

1. Download or clone this repository.
2. Go to your browser's extensions page (`chrome://extensions/` for Chrome).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the folder containing this extension's files.
5. **Set up Optimization**: Open `content-components/optimize_ui.js` and enter your Gemini API key in the `GEMINI_API_KEY` variable.

## Technical Details

- **Token Counting**: Handled via [gpt-tokenizer](https://github.com/niieani/gpt-tokenizer) (o200k_base).
- **Storage**: Uses `chrome.storage.local` for persistence of templates, usage history, and settings.
- **UI**: Injected directly into the Claude.ai DOM using a custom Layout Manager for stability.


And one last thing, the api key I added in the `content-components/optimize_ui.js`, is just some dummy one I added to attract users for fun, hope you had a nice laugh on how bad I was to include my api key in the code, the joke is just on you the whole time.
