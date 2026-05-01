/* global browser, Log, BLUE_HIGHLIGHT, SUCCESS_GREEN, RED_WARNING */
'use strict';

const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // <-- Enter your API key here

class OptimizeUI {
	constructor() {
		this.uiReady = false;
		this.button = null;

		this.init();
	}

	async init() {
		this.createButton();
		this.startObserver();
		this.uiReady = true;
	}

	createButton() {
		this.button = document.createElement('button');
		this.button.id = 'ut-optimize-btn';
		this.button.innerHTML = `
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2c84db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
				<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"></path>
				<path d="m14 7 3 3"></path>
				<path d="M5 6v4"></path>
				<path d="M19 14v4"></path>
				<path d="M10 2v2"></path>
				<path d="M7 8H3"></path>
				<path d="M21 16h-4"></path>
				<path d="M11 3H9"></path>
			</svg>
			Optimize Prompt
		`;
		this.button.className = 'text-xs ut-button';
		this.button.style.cssText = `
			background: #2d2d2d;
			color: #d4d4d4;
			border: 1px solid #454545;
			padding: 6px 12px;
			border-radius: 4px;
			margin-left: 12px;
			cursor: pointer;
			transition: background-color 0.2s, transform 0.1s, border-color 0.2s;
			display: flex;
			align-items: center;
			justify-content: center;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		`;

		this.button.addEventListener('mouseover', () => {
			this.button.style.background = '#3e3e3e';
			this.button.style.borderColor = '#2c84db';
			this.button.style.color = '#ffffff';
		});
		this.button.addEventListener('mouseout', () => {
			this.button.style.background = '#2d2d2d';
			this.button.style.borderColor = '#454545';
			this.button.style.color = '#d4d4d4';
		});
		this.button.addEventListener('mousedown', () => {
			this.button.style.background = '#505050';
			this.button.style.transform = 'translateY(1px)';
		});
		this.button.addEventListener('mouseup', () => {
			this.button.style.transform = 'translateY(0)';
		});

		this.button.addEventListener('click', () => this.handleOptimize());
	}

	async handleOptimize() {
		if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')) {
			alert('Please open content-components/optimize_ui.js and set your GEMINI_API_KEY at the top of the file.');
			return;
		}

		const chatInput = document.querySelector('[data-testid="chat-input"]');
		if (!chatInput) return;

		const originalText = chatInput.innerText.trim();
		if (!originalText) return;

		const originalBtnText = this.button.textContent;
		this.button.textContent = '⏳ Optimizing...';
		this.button.disabled = true;
		this.button.style.opacity = '0.7';

		try {
			const optimizedText = await this.callGeminiAPI(originalText);
			if (optimizedText) {
				this.replaceTextInProseMirror(chatInput, optimizedText);
			}
		} catch (err) {
			console.error('Optimization failed:', err);
			alert('Optimization failed: ' + err.message);
		} finally {
			this.button.textContent = originalBtnText;
			this.button.disabled = false;
			this.button.style.opacity = '1';
		}
	}

	async callGeminiAPI(prompt) {
		const systemInstruction = "Optimize the following prompt for best results and minimum token usage with an LLM. Return ONLY the optimized prompt, no extra text.";
		const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				contents: [{
					parts: [{ text: prompt }]
				}],
				systemInstruction: {
					parts: [{ text: systemInstruction }]
				}
			})
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'API Request Failed');
		}

		const data = await response.json();
		return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
	}

	replaceTextInProseMirror(chatInput, newText) {
		chatInput.focus();
		
		// Select all text to replace it
		const range = document.createRange();
		range.selectNodeContents(chatInput);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
		
		// Dispatch a paste event, which ProseMirror natively intercepts and handles perfectly
		const dataTransfer = new DataTransfer();
		dataTransfer.setData('text/plain', newText);
		const pasteEvent = new ClipboardEvent('paste', {
			clipboardData: dataTransfer,
			bubbles: true,
			cancelable: true
		});
		chatInput.dispatchEvent(pasteEvent);
	}

	startObserver() {
		// Run a simple interval to inject the button if it's missing.
		// `usage_ui` creates `#ut-chat-stat-line` below the chat input, we can append to its left container or right container.
		setInterval(() => {
			if (!document.body.contains(this.button)) {
				const statLineRight = document.getElementById('ut-stat-right');
				if (statLineRight) {
					// Append it to the right side container (below chat box)
					statLineRight.appendChild(this.button);
				} else {
					// If ut-stat-right is not yet available, we can fallback to the toolbar explicitly
					// near the model selector so it doesn't accidentally pick the top header.
					const modelSelector = document.querySelector('[data-testid="model-selector-dropdown"]');
					if (modelSelector) {
						const toolbar = modelSelector.parentElement;
						if (toolbar && !toolbar.contains(this.button)) {
							toolbar.appendChild(this.button);
						}
					}
				}
			}
		}, 1000);
	}
}

// Initialize
const optimizeUI = new OptimizeUI();
