/* global browser, Log, BLUE_HIGHLIGHT */
'use strict';

class TemplatesManager {
    constructor() {
        this.templates = [];
        this.menu = null;
        this.init();
    }

    async init() {
        const result = await browser.storage.local.get('prompt_templates');
        this.templates = result.prompt_templates || [
            { name: 'Code Review', text: 'Please review this code for performance, security, and readability:\n\n' },
            { name: 'Summarize', text: 'Summarize the following text into 3 key bullet points:\n\n' },
            { name: 'Explain Like I\'m 5', text: 'Explain the following concept in simple terms that a 5-year-old would understand:\n\n' }
        ];
    }

    async saveTemplates() {
        await browser.storage.local.set({ prompt_templates: this.templates });
    }

    createMenu(anchor) {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
            return;
        }

        this.menu = document.createElement('div');
        this.menu.className = 'ut-template-menu';
        
        const rect = anchor.getBoundingClientRect();
        this.menu.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        this.menu.style.left = `${rect.left}px`;

        this.renderMenu();
        document.body.appendChild(this.menu);

        // Close menu when clicking outside
        const closeHandler = (e) => {
            if (!this.menu.contains(e.target) && !anchor.contains(e.target)) {
                this.menu.remove();
                this.menu = null;
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        document.addEventListener('mousedown', closeHandler);
    }

    renderMenu() {
        this.menu.innerHTML = '';
        
        this.templates.forEach((template, index) => {
            const item = document.createElement('div');
            item.className = 'ut-template-item';
            
            const name = document.createElement('span');
            name.textContent = template.name;
            item.appendChild(name);

            const del = document.createElement('span');
            del.className = 'ut-template-delete';
            del.textContent = '×';
            del.onclick = (e) => {
                e.stopPropagation();
                this.templates.splice(index, 1);
                this.saveTemplates();
                this.renderMenu();
            };
            item.appendChild(del);

            item.onclick = () => {
                this.insertTemplate(template.text);
                this.menu.remove();
                this.menu = null;
            };
            
            this.menu.appendChild(item);
        });

        const add = document.createElement('div');
        add.className = 'ut-template-add';
        add.textContent = '+ Save Current Prompt as Template';
        add.onclick = () => {
            const chatInput = document.querySelector('[data-testid="chat-input"]');
            const text = chatInput?.innerText?.trim();
            if (text) {
                const name = prompt('Enter a name for this template:');
                if (name) {
                    this.templates.push({ name, text });
                    this.saveTemplates();
                    this.renderMenu();
                }
            } else {
                alert('Please type something in the chat box first!');
            }
        };
        this.menu.appendChild(add);
    }

    insertTemplate(text) {
        const chatInput = document.querySelector('[data-testid="chat-input"]');
        if (!chatInput) return;

        chatInput.focus();
        document.execCommand('insertText', false, text);
    }
}

window.templatesManager = new TemplatesManager();
