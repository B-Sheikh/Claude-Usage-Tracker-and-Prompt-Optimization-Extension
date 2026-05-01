# Claude Usage Tracker & Prompt Optimization Extension

A powerful browser extension designed to help you track your Claude.ai token usage and seamlessly optimize your prompts for maximum efficiency.

## Overview

This custom extension enhances your Claude.ai experience by providing two core capabilities:
1. **Usage Tracking**: Monitors your token consumption across files, projects, chat history, and AI responses so you know exactly how much of your usage quota remains.
2. **Prompt Optimization**: Injects a custom "Optimize Prompt" button directly into the Claude interface. With a single click, it leverages the Gemini API to format your drafts for optimal LLM results and minimum token usage.

## Installation

### Loading the Extension Manually
1. Download or clone this repository.
2. Go to your browser's extensions page (`chrome://extensions/` for Chrome).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the folder containing this extension's files.

## Features

**✨ Prompt Optimization**
Optimize your drafts directly inside Claude! 
1. Open `content-components/optimize_ui.js` and enter your Gemini API key in the `GEMINI_API_KEY` variable.
2. Click the shiny new "Optimize Prompt" button next to your chat box in Claude.ai.
3. The extension will automatically format and replace your text with the most optimized version.

**Token Tracking**
The extension tracks token usage from:
- **Files** - Documents uploaded to chats.
- **Projects** - Knowledge files and custom instructions.
- **Personal preferences** - Your configured settings.
- **Message history** - Full conversation context.
- **System prompts** - Enabled tools (analysis, artifacts) on a per-chat basis.

Token calculation is handled via [gpt-tokenizer](https://github.com/niieani/gpt-tokenizer).

## UI Elements

Most elements in the chat UI (namely the length, cost, estimate, caching status) feature an intuitive hover tooltip explaining them further. The Prompt Optimization button sits perfectly aligned on the bottom right of your screen.

