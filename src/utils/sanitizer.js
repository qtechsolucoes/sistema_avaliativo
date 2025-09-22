// src/utils/sanitizer.js - UTILITÁRIOS DE SANITIZAÇÃO

/**
 * Sanitiza texto para prevenir XSS
 * Remove/escapa caracteres perigosos para exibição segura
 */

export class HTMLSanitizer {
    /**
     * Escapa caracteres HTML perigosos
     */
    static escapeHTML(text) {
        if (typeof text !== 'string') return '';

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '`': '&#96;',
            '=': '&#x3D;'
        };

        return text.replace(/[&<>"'`=/]/g, char => map[char]);
    }

    /**
     * Remove todas as tags HTML
     */
    static stripHTML(html) {
        if (typeof html !== 'string') return '';

        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    /**
     * Sanitiza atributos perigosos
     */
    static sanitizeAttributes(element) {
        const dangerousAttrs = [
            'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
            'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
            'onselect', 'onkeydown', 'onkeypress', 'onkeyup',
            'javascript:', 'data:', 'vbscript:'
        ];

        dangerousAttrs.forEach(attr => {
            if (element.hasAttribute(attr)) {
                element.removeAttribute(attr);
            }
        });

        // Sanitiza href e src
        ['href', 'src'].forEach(attr => {
            const value = element.getAttribute(attr);
            if (value && (value.startsWith('javascript:') || value.startsWith('data:') || value.startsWith('vbscript:'))) {
                element.removeAttribute(attr);
            }
        });
    }

    /**
     * Cria elemento DOM seguro com texto
     */
    static createSafeElement(tagName, textContent = '', className = '') {
        const element = document.createElement(tagName);
        element.textContent = this.escapeHTML(textContent);
        if (className) {
            element.className = className;
        }
        return element;
    }

    /**
     * Define texto seguro em elemento
     */
    static setSafeText(element, text) {
        if (!element) return;
        element.textContent = this.escapeHTML(text);
    }

    /**
     * Define HTML sanitizado em elemento (apenas tags seguras)
     */
    static setSafeHTML(element, html) {
        if (!element) return;

        // Lista de tags permitidas
        const allowedTags = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div'];

        // Cria elemento temporário
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Remove tags não permitidas
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(el => {
            if (!allowedTags.includes(el.tagName.toLowerCase())) {
                el.replaceWith(...el.childNodes);
            } else {
                this.sanitizeAttributes(el);
            }
        });

        element.innerHTML = temp.innerHTML;
    }

    /**
     * Valida e sanitiza input do usuário
     */
    static sanitizeUserInput(input, maxLength = 1000) {
        if (typeof input !== 'string') return '';

        // Remove caracteres de controle
        let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

        // Limita tamanho
        sanitized = sanitized.slice(0, maxLength);

        // Escapa HTML
        sanitized = this.escapeHTML(sanitized);

        return sanitized.trim();
    }
}

/**
 * Utilitários para criação segura de notificações
 */
export class SafeNotification {
    /**
     * Cria notificação de aviso segura
     */
    static createWarning(title, message, duration = 10000) {
        const container = document.createElement('div');
        container.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg z-50 max-w-md';

        const content = document.createElement('div');
        content.className = 'flex items-start';

        const icon = document.createElement('div');
        icon.className = 'flex-shrink-0 mr-3';
        icon.innerHTML = `
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
        `;

        const textContainer = document.createElement('div');
        textContainer.className = 'flex-1';

        const titleEl = document.createElement('p');
        titleEl.className = 'font-bold';
        HTMLSanitizer.setSafeText(titleEl, title);

        const messageEl = document.createElement('p');
        messageEl.className = 'text-sm mt-1';
        HTMLSanitizer.setSafeText(messageEl, message);

        const closeButton = document.createElement('button');
        closeButton.className = 'ml-4 text-yellow-700 hover:text-yellow-900 font-bold text-lg';
        closeButton.textContent = '✕';
        closeButton.onclick = () => container.remove();

        textContainer.appendChild(titleEl);
        textContainer.appendChild(messageEl);
        content.appendChild(icon);
        content.appendChild(textContainer);
        content.appendChild(closeButton);
        container.appendChild(content);

        document.body.appendChild(container);

        // Remove automaticamente após duration
        if (duration > 0) {
            setTimeout(() => {
                if (container.parentElement) {
                    container.remove();
                }
            }, duration);
        }

        return container;
    }

    /**
     * Cria notificação de erro segura
     */
    static createError(title, message, duration = 0) {
        const container = document.createElement('div');
        container.className = 'fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50 max-w-md';

        const content = document.createElement('div');
        content.className = 'flex items-start';

        const icon = document.createElement('div');
        icon.className = 'flex-shrink-0 mr-3';
        icon.innerHTML = `
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
        `;

        const textContainer = document.createElement('div');
        textContainer.className = 'flex-1';

        const titleEl = document.createElement('p');
        titleEl.className = 'font-bold';
        HTMLSanitizer.setSafeText(titleEl, title);

        const messageEl = document.createElement('p');
        messageEl.className = 'text-sm mt-1';
        HTMLSanitizer.setSafeText(messageEl, message);

        const closeButton = document.createElement('button');
        closeButton.className = 'ml-4 text-red-700 hover:text-red-900 font-bold text-lg';
        closeButton.textContent = '✕';
        closeButton.onclick = () => container.remove();

        textContainer.appendChild(titleEl);
        textContainer.appendChild(messageEl);
        content.appendChild(icon);
        content.appendChild(textContainer);
        content.appendChild(closeButton);
        container.appendChild(content);

        document.body.appendChild(container);

        // Remove automaticamente após duration (se > 0)
        if (duration > 0) {
            setTimeout(() => {
                if (container.parentElement) {
                    container.remove();
                }
            }, duration);
        }

        return container;
    }

    /**
     * Cria notificação de sucesso segura
     */
    static createSuccess(title, message, duration = 5000) {
        const container = document.createElement('div');
        container.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50 max-w-md';

        const content = document.createElement('div');
        content.className = 'flex items-start';

        const icon = document.createElement('div');
        icon.className = 'flex-shrink-0 mr-3';
        icon.innerHTML = `
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
        `;

        const textContainer = document.createElement('div');
        textContainer.className = 'flex-1';

        const titleEl = document.createElement('p');
        titleEl.className = 'font-bold';
        HTMLSanitizer.setSafeText(titleEl, title);

        const messageEl = document.createElement('p');
        messageEl.className = 'text-sm mt-1';
        HTMLSanitizer.setSafeText(messageEl, message);

        const closeButton = document.createElement('button');
        closeButton.className = 'ml-4 text-green-700 hover:text-green-900 font-bold text-lg';
        closeButton.textContent = '✕';
        closeButton.onclick = () => container.remove();

        textContainer.appendChild(titleEl);
        textContainer.appendChild(messageEl);
        content.appendChild(icon);
        content.appendChild(textContainer);
        content.appendChild(closeButton);
        container.appendChild(content);

        document.body.appendChild(container);

        // Remove automaticamente após duration
        if (duration > 0) {
            setTimeout(() => {
                if (container.parentElement) {
                    container.remove();
                }
            }, duration);
        }

        return container;
    }
}

// Exporta para compatibilidade
export const sanitizeHTML = HTMLSanitizer.escapeHTML;
export const stripHTML = HTMLSanitizer.stripHTML;
export const sanitizeUserInput = HTMLSanitizer.sanitizeUserInput;