/* global browser, Log, getConversationId, getActiveOrgId, sleep, setupTooltip, BLUE_HIGHLIGHT, RED_WARNING, SUCCESS_GREEN */
'use strict';

class PromptPointersUI {
	constructor() {
		this.state = {
			conversationData: null,
			promptElements: [],
			isScrollingProgrammatically: false
		};

		this.elements = {
			navigationContainer: null
		};

		this.init();
	}

	async init() {
		await Log('PromptPointersUI: Initializing...');
		this.setupMessageListeners();
		this.startDOMObserver();
		
		// Setup window scroll listener with throttling to prevent layout thrashing and lag
		const throttledHighlight = this.throttle(() => this.highlightActiveDot(), 100);
		window.addEventListener('scroll', throttledHighlight, { passive: true });
		window.addEventListener('resize', throttledHighlight, { passive: true });
	}

	throttle(func, limit) {
		let inThrottle;
		return function() {
			const args = arguments;
			const context = this;
			if (!inThrottle) {
				func.apply(context, args);
				inThrottle = true;
				setTimeout(() => inThrottle = false, limit);
			}
		}
	}

	setupMessageListeners() {
		browser.runtime.onMessage.addListener((message) => {
			const myOrgId = getActiveOrgId();
			if (message.type === 'updateConversationData') {
				const msgOrgId = message.data.conversationData?.orgId;
				if (msgOrgId && myOrgId && msgOrgId !== myOrgId) return;
				
				// Ignore updates for different conversations
				const currentConvoId = getConversationId();
				if (message.data.conversationData?.conversationId && currentConvoId &&
					message.data.conversationData.conversationId !== currentConvoId) {
					return;
				}

				this.state.conversationData = message.data.conversationData;
				this.updateUI();
			}
		});
	}

	startDOMObserver() {
		// Periodically verify prompt elements and redraw if DOM changes
		setInterval(() => {
			if (getConversationId() && this.state.conversationData) {
				const currentPromptsCount = this.getDOMPromptElements().length;
				const trackedPromptsCount = this.state.promptElements.length;
				
				// If number of prompts in DOM changed, update the UI
				if (currentPromptsCount !== trackedPromptsCount) {
					this.updateUI();
				}
			} else {
				this.removeUI();
			}
		}, 1000);
	}

	getDOMPromptElements() {
		// Query selectors for Claude's user prompt blocks
		const selectors = [
			'.font-user-message',
			'[data-testid="user-message"]',
			'[data-is-human="true"]'
		];
		
		const elements = [];
		const seen = new Set();
		
		for (const selector of selectors) {
			document.querySelectorAll(selector).forEach(el => {
				// Find high-level message container if possible for better scrolling alignment
				const container = el.closest('.flex.w-full.justify-end') || el.closest('.font-user-message') || el;
				if (!seen.has(container)) {
					seen.add(container);
					elements.push({
						textElement: el,
						container: container
					});
				}
			});
		}
		
		return elements;
	}

	updateUI() {
		if (!getConversationId() || !this.state.conversationData) {
			this.removeUI();
			return;
		}

		const humanMessages = (this.state.conversationData.messages || []).filter(m => m.sender === 'human');
		const domPrompts = this.getDOMPromptElements();
		
		this.state.promptElements = domPrompts;

		// 1. Inject Inline Token Badges to each prompt element in the DOM
		domPrompts.forEach((prompt, index) => {
			const msgData = humanMessages[index];
			if (!msgData) return;

			// Check if badge is already injected
			let badge = prompt.container.querySelector('.ut-prompt-token-badge');
			if (!badge) {
				badge = document.createElement('div');
				badge.className = 'ut-prompt-token-badge';
				
				// Mount badge inside the user message bubble or adjacent
				const bubble = prompt.container.querySelector('.bg-bg-200, .bg-bg-300, div.font-user-message') || prompt.textElement;
				if (bubble) {
					bubble.style.position = 'relative';
					bubble.appendChild(badge);
				} else {
					prompt.container.appendChild(badge);
				}
			}
			
			badge.textContent = `${msgData.tokenCount.toLocaleString()} tokens`;
			badge.title = `Prompt token usage: ${msgData.tokenCount.toLocaleString()} tokens`;
		});

		// 2. Render Floating Prompt Navigation Pointers
		if (humanMessages.length === 0) {
			this.removeUI();
			return;
		}

		let nav = document.getElementById('ut-prompt-nav');
		if (!nav) {
			nav = document.createElement('div');
			nav.id = 'ut-prompt-nav';
			nav.className = 'ut-prompt-navigation';
			document.body.appendChild(nav);
			this.elements.navigationContainer = nav;
		}

		nav.innerHTML = ''; // Clear prior buttons
		
		humanMessages.forEach((msg, index) => {
			const dot = document.createElement('div');
			dot.className = 'ut-prompt-nav-dot';
			dot.textContent = index + 1;
			dot.dataset.index = index;

			// Handle Scroll Navigation
			dot.addEventListener('click', () => {
				const target = domPrompts[index]?.container;
				if (target) {
					this.scrollToElement(target);
				}
			});

			// Setup Tooltip with snippet and token count
			const tooltip = document.createElement('div');
			tooltip.className = 'bg-bg-500 text-text-000 ut-tooltip font-normal font-ui';
			tooltip.style.maxWidth = '250px';
			tooltip.style.textAlign = 'left';
			tooltip.style.whiteSpace = 'normal';
			tooltip.style.wordBreak = 'break-word';
			
			const textSnippet = msg.text ? (msg.text.substring(0, 80) + (msg.text.length > 80 ? '...' : '')) : 'User Prompt';
			tooltip.innerHTML = `<strong style="color: ${BLUE_HIGHLIGHT}">Prompt ${index + 1}</strong> (${msg.tokenCount.toLocaleString()} tokens)<br/><span style="color: #bbb; font-size: 0.95em;">${this.escapeHTML(textSnippet)}</span>`;
			document.body.appendChild(tooltip);
			
			setupTooltip(dot, tooltip, { topOffset: 5 });
			nav.appendChild(dot);
		});

		// Set initial highlights
		this.highlightActiveDot();
	}

	highlightActiveDot() {
		if (this.state.isScrollingProgrammatically) return;
		const nav = this.elements.navigationContainer || document.getElementById('ut-prompt-nav');
		if (!nav) return;

		const dots = nav.querySelectorAll('.ut-prompt-nav-dot');
		const domPrompts = this.state.promptElements;
		if (dots.length === 0 || domPrompts.length === 0) return;

		let activeIndex = 0;
		let minDistance = Infinity;

		domPrompts.forEach((prompt, index) => {
			const rect = prompt.container.getBoundingClientRect();
			// Calculate distance to middle of viewport
			const distance = Math.abs(rect.top - (window.innerHeight / 2));
			if (distance < minDistance) {
				minDistance = distance;
				activeIndex = index;
			}
		});

		dots.forEach((dot, index) => {
			if (index === activeIndex) {
				dot.classList.add('active');
				// Scroll dot into view inside the navigator container if it overflows
				dot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			} else {
				dot.classList.remove('active');
			}
		});
	}

	removeUI() {
		const nav = document.getElementById('ut-prompt-nav');
		if (nav) nav.remove();
		this.elements.navigationContainer = null;
		
		document.querySelectorAll('.ut-prompt-token-badge').forEach(badge => badge.remove());
		this.state.promptElements = [];
	}

	scrollToElement(element) {
		if (!element) return;
		
		this.state.isScrollingProgrammatically = true;
		
		// Find scrollable parent container in Claude.ai's layout
		let parent = element.parentElement;
		let scrollContainer = null;
		
		while (parent && parent !== document.body) {
			const style = window.getComputedStyle(parent);
			if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
				scrollContainer = parent;
				break;
			}
			parent = parent.parentElement;
		}

		if (scrollContainer) {
			const parentRect = scrollContainer.getBoundingClientRect();
			const elementRect = element.getBoundingClientRect();
			// Scroll target to top of viewport with some offset
			const targetScrollTop = scrollContainer.scrollTop + (elementRect.top - parentRect.top) - 20;
			
			scrollContainer.scrollTo({
				top: Math.max(0, targetScrollTop),
				behavior: 'smooth'
			});
		} else {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
		
		// Reset scroll flag after smooth transition finishes
		setTimeout(() => {
			this.state.isScrollingProgrammatically = false;
			this.highlightActiveDot(); // Ensure active dot highlights correctly after scroll completes
		}, 800);
	}

	escapeHTML(str) {
		return str.replace(/[&<>'"]/g, 
			tag => ({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				"'": '&#39;',
				'"': '&quot;'
			}[tag] || tag)
		);
	}
}

// Self initialize
const promptPointersUI = new PromptPointersUI();
