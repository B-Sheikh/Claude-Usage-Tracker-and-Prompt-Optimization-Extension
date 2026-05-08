/* global browser, Log, BLUE_HIGHLIGHT, SUCCESS_GREEN, RED_WARNING */
'use strict';

const GEMINI_API_KEY = '<GEMINI_API_KEY>'; // <-- Enter your API key here

class OptimizeUI {
	constructor() {
		this.uiReady = false;
		this.button = null;
		this.templatesBtn = null;
		this.focusBtn = null;
		this.container = null;
		this.isFocusMode = false;

		this.init();
	}

	async init() {
		this.createButtons();
		this.startObserver();
		this.uiReady = true;
	}

	createButtons() {
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
			Optimize
		`;
		this.button.className = 'text-xs ut-button';
		this.button.style.cssText = `
			background: #2d2d2d;
			color: #d4d4d4;
			border: 1px solid #454545;
			padding: 5px 12px;
			height: 28px;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
			display: flex;
			align-items: center;
			justify-content: center;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
			font-weight: 500;
			white-space: nowrap;
		`;

		this.templatesBtn = document.createElement('button');
		this.templatesBtn.id = 'ut-templates-btn';
		this.templatesBtn.innerHTML = `
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2c84db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
				<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
			</svg>
			Templates
		`;
		this.templatesBtn.className = 'text-xs ut-button';
		this.templatesBtn.style.cssText = this.button.style.cssText;

		this.focusBtn = document.createElement('button');
		this.focusBtn.id = 'ut-focus-btn';
		this.focusBtn.innerHTML = `
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2c84db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"></circle>
				<circle cx="12" cy="12" r="3"></circle>
			</svg>
		`;
		this.focusBtn.title = 'Toggle Focus Mode';
		this.focusBtn.className = 'text-xs ut-button';
		this.focusBtn.style.cssText = this.button.style.cssText + 'width: 32px; padding: 0;';

		this.container = document.createElement('div');
		this.container.id = 'ut-optimize-container';
		this.container.style.cssText = `
			display: flex;
			gap: 8px;
			align-items: center;
			margin-right: 16px;
			padding-right: 16px;
			border-right: 1px solid rgba(255,255,255,0.1);
		`;
		this.container.appendChild(this.button);
		this.container.appendChild(this.templatesBtn);
		this.container.appendChild(this.focusBtn);

		[this.button, this.templatesBtn, this.focusBtn].forEach(btn => {
			btn.addEventListener('mouseover', () => {
				btn.style.background = '#3e3e3e';
				btn.style.borderColor = '#2c84db';
				btn.style.color = '#ffffff';
			});
			btn.addEventListener('mouseout', () => {
				btn.style.background = '#2d2d2d';
				btn.style.borderColor = '#454545';
				btn.style.color = '#d4d4d4';
			});
			btn.addEventListener('mousedown', () => {
				btn.style.background = '#505050';
				btn.style.transform = 'translateY(1px)';
			});
			btn.addEventListener('mouseup', () => {
				btn.style.transform = 'translateY(0)';
			});
		});

		this.button.addEventListener('click', () => this.handleOptimize());
		this.templatesBtn.addEventListener('click', () => window.templatesManager.createMenu(this.templatesBtn));
		this.focusBtn.addEventListener('click', () => {
			this.isFocusMode = !this.isFocusMode;
			document.body.classList.toggle('ut-focus-mode', this.isFocusMode);
			this.focusBtn.style.borderColor = this.isFocusMode ? SUCCESS_GREEN : '#454545';
			this.focusBtn.style.background = this.isFocusMode ? 'rgba(34, 197, 94, 0.1)' : '#2d2d2d';
			this.focusBtn.querySelector('svg').setAttribute('stroke', this.isFocusMode ? SUCCESS_GREEN : '#2c84db');
		});
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
		const systemInstruction = "Optimize the following prompt for best results and minimum token usage with an LLM. Return ONLY the optimized prompt, no extra text. And dont ask any back questions";
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

		// Execute insertText command to replace the selection.
		// This natively triggers the appropriate input events for ProseMirror.
		document.execCommand('insertText', false, newText);
	}

	startObserver() {
		// Run a simple interval to inject the container if missing.
		setInterval(() => {
			if (!document.body.contains(this.container)) {
				const statLineRight = document.getElementById('ut-stat-right');
				if (statLineRight) {
					statLineRight.prepend(this.container);
				} else {
					const modelSelector = document.querySelector('[data-testid="model-selector-dropdown"]');
					if (modelSelector) {
						const toolbar = modelSelector.parentElement;
						if (toolbar && !toolbar.contains(this.container)) {
							toolbar.appendChild(this.container);
						}
					}
				}
			}
		}, 1000);
	}
}

// Initialize
const optimizeUI = new OptimizeUI();
