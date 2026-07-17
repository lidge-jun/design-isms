"use strict";
(() => {
    const mountElement = document.getElementById('faq-categories');
    if (!mountElement)
        return;
    const mount = mountElement;
    const allowedTags = new Set(['P', 'STRONG', 'EM', 'CODE', 'UL', 'LI', 'A']);
    const localeKey = 'design-isms-lang';
    let data = null;
    let locale = readLocale();
    let openItemId = null;
    let loadPromise = null;
    function readLocale() {
        return AppRuntime.readStorage(localeKey) === 'en' ? 'en' : 'ko';
    }
    function saveLocale(nextLocale) {
        AppRuntime.writeStorage(localeKey, nextLocale);
    }
    function isRecord(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    function hasLocales(value) {
        return isRecord(value) && typeof value.ko === 'string' && value.ko.length > 0
            && typeof value.en === 'string' && value.en.length > 0;
    }
    function validateData(value) {
        if (!isRecord(value) || typeof value.version !== 'string' || !Array.isArray(value.categories)) {
            throw new Error('FAQ data has an invalid top-level shape.');
        }
        if (value.categories.length !== 3)
            throw new Error('FAQ data must contain three categories.');
        const categoryIds = new Set();
        const itemIds = new Set();
        let itemCount = 0;
        value.categories.forEach((categoryValue) => {
            if (!isRecord(categoryValue) || typeof categoryValue.id !== 'string'
                || typeof categoryValue.icon !== 'string' || !hasLocales(categoryValue.title)
                || !Array.isArray(categoryValue.items)) {
                throw new Error('FAQ category data is invalid.');
            }
            if (categoryIds.has(categoryValue.id))
                throw new Error(`Duplicate category id: ${categoryValue.id}`);
            categoryIds.add(categoryValue.id);
            categoryValue.items.forEach((itemValue) => {
                if (!isRecord(itemValue) || typeof itemValue.id !== 'string'
                    || !hasLocales(itemValue.question) || !hasLocales(itemValue.answerHtml)
                    || !Array.isArray(itemValue.sources) || itemValue.sources.length === 0
                    || typeof itemValue.reviewedOn !== 'string') {
                    throw new Error('FAQ item data is invalid.');
                }
                if (itemIds.has(itemValue.id))
                    throw new Error(`Duplicate FAQ item id: ${itemValue.id}`);
                itemIds.add(itemValue.id);
                itemCount += 1;
                itemValue.sources.forEach((sourceValue) => {
                    if (!isRecord(sourceValue) || typeof sourceValue.label !== 'string'
                        || typeof sourceValue.url !== 'string') {
                        throw new Error(`Invalid source in FAQ item: ${itemValue.id}`);
                    }
                    let parsed;
                    try {
                        parsed = new URL(sourceValue.url);
                    }
                    catch (_error) {
                        throw new Error(`Invalid source URL in FAQ item: ${itemValue.id}`);
                    }
                    if (parsed.protocol !== 'https:')
                        throw new Error(`Source URL must use HTTPS: ${itemValue.id}`);
                });
            });
        });
        if (itemCount !== 18)
            throw new Error('FAQ data must contain eighteen items.');
    }
    function sanitizeHtml(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        const output = document.createDocumentFragment();
        function cleanNode(node, parent) {
            if (node.nodeType === Node.TEXT_NODE) {
                parent.appendChild(document.createTextNode(node.textContent || ''));
                return;
            }
            if (!(node instanceof Element))
                return;
            if (!allowedTags.has(node.tagName)) {
                Array.from(node.childNodes).forEach((child) => cleanNode(child, parent));
                return;
            }
            const cleanElement = document.createElement(node.tagName.toLowerCase());
            if (node.tagName === 'A') {
                const href = node.getAttribute('href');
                if (href) {
                    try {
                        const parsed = new URL(href, window.location.href);
                        if (parsed.protocol === 'https:') {
                            cleanElement.setAttribute('href', parsed.href);
                            cleanElement.setAttribute('target', '_blank');
                            cleanElement.setAttribute('rel', 'noopener');
                        }
                    }
                    catch (_error) {
                        // Invalid links remain as plain anchor text without a destination.
                    }
                }
            }
            Array.from(node.childNodes).forEach((child) => cleanNode(child, cleanElement));
            parent.appendChild(cleanElement);
        }
        Array.from(template.content.childNodes).forEach((node) => cleanNode(node, output));
        return output;
    }
    function makeChevron() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('faq-chevron');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.5');
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'm6 9 6 6 6-6');
        svg.appendChild(path);
        return svg;
    }
    function renderSources(item) {
        const section = document.createElement('div');
        section.className = 'faq-sources';
        const label = document.createElement('p');
        label.className = 'faq-sources-label';
        label.textContent = locale === 'ko' ? '출처' : 'Sources';
        section.appendChild(label);
        const list = document.createElement('ul');
        item.sources.forEach((source) => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = source.url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = `${source.label} ${locale === 'ko' ? '(새 창)' : '(opens in a new tab)'}`;
            listItem.appendChild(link);
            list.appendChild(listItem);
        });
        section.appendChild(list);
        return section;
    }
    function handleQuestionKeydown(event) {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
            return;
        const buttons = Array.from(mount.querySelectorAll('.faq-question'));
        const currentIndex = buttons.indexOf(event.currentTarget);
        if (currentIndex < 0 || buttons.length === 0)
            return;
        event.preventDefault();
        let nextIndex = currentIndex;
        if (event.key === 'ArrowDown')
            nextIndex = (currentIndex + 1) % buttons.length;
        if (event.key === 'ArrowUp')
            nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home')
            nextIndex = 0;
        if (event.key === 'End')
            nextIndex = buttons.length - 1;
        const nextButton = buttons[nextIndex];
        if (nextButton)
            nextButton.focus();
    }
    function toggleItem(itemId, button, answer) {
        const willOpen = openItemId !== itemId;
        mount.querySelectorAll('.faq-question[aria-expanded="true"]').forEach((other) => {
            other.setAttribute('aria-expanded', 'false');
        });
        mount.querySelectorAll('.faq-answer:not([hidden])').forEach((other) => {
            other.hidden = true;
        });
        openItemId = willOpen ? itemId : null;
        button.setAttribute('aria-expanded', String(willOpen));
        answer.hidden = !willOpen;
    }
    function render() {
        if (!data)
            return;
        mount.replaceChildren();
        document.documentElement.lang = locale;
        document.title = locale === 'ko' ? 'FAQ — Design -isms' : 'FAQ — Design -isms';
        const heroCopy = document.querySelector('.faq-hero p');
        if (heroCopy) {
            heroCopy.textContent = locale === 'ko'
                ? 'AI와 함께 설계하는 작업 방식, 현재 디자인 흐름, 그리고 개발자를 위한 구현 실전 가이드.'
                : 'How to design with AI, current design directions, and a hands-on implementation guide for developers.';
        }
        data.categories.forEach((category) => {
            const section = document.createElement('section');
            section.className = 'faq-category';
            section.setAttribute('aria-labelledby', `faq-${category.id}-title`);
            const heading = document.createElement('h2');
            heading.className = 'faq-category-title';
            heading.id = `faq-${category.id}-title`;
            const icon = document.createElement('img');
            icon.className = 'faq-category-icon';
            icon.src = category.icon;
            icon.alt = '';
            icon.setAttribute('aria-hidden', 'true');
            const headingText = document.createElement('span');
            headingText.textContent = category.title[locale];
            heading.append(icon, headingText);
            section.appendChild(heading);
            const list = document.createElement('div');
            list.className = 'faq-list';
            category.items.forEach((item) => {
                const article = document.createElement('article');
                article.className = 'faq-item';
                const answerId = `faq-answer-${item.id}`;
                const questionId = `faq-question-${item.id}`;
                const question = document.createElement('button');
                question.type = 'button';
                question.className = 'faq-question';
                question.id = questionId;
                question.setAttribute('aria-expanded', String(openItemId === item.id));
                question.setAttribute('aria-controls', answerId);
                const questionText = document.createElement('span');
                questionText.textContent = item.question[locale];
                question.append(questionText, makeChevron());
                const answer = document.createElement('div');
                answer.className = 'faq-answer';
                answer.id = answerId;
                answer.setAttribute('role', 'region');
                answer.setAttribute('aria-labelledby', questionId);
                answer.hidden = openItemId !== item.id;
                answer.appendChild(sanitizeHtml(item.answerHtml[locale]));
                answer.appendChild(renderSources(item));
                question.addEventListener('click', () => toggleItem(item.id, question, answer));
                question.addEventListener('keydown', handleQuestionKeydown);
                article.append(question, answer);
                list.appendChild(article);
            });
            section.appendChild(list);
            mount.appendChild(section);
        });
        mount.setAttribute('aria-busy', 'false');
    }
    function updateLocaleToggle() {
        const toggle = document.getElementById('lang-toggle');
        if (!toggle)
            return;
        toggle.setAttribute('aria-label', locale === 'ko' ? 'Switch language to English' : '언어를 한국어로 전환');
        toggle.querySelectorAll('.lang-option').forEach((option) => {
            option.classList.toggle('active', option.dataset.lang === locale);
        });
    }
    function showError(error) {
        mount.setAttribute('aria-busy', 'false');
        console.error('FAQ load failed:', error);
        AppRuntime.renderFatal(mount, locale === 'ko'
            ? { title: 'FAQ를 불러오지 못했습니다', body: '연결을 확인한 뒤 다시 시도해 주세요.', retry: '다시 시도' }
            : { title: 'Could not load the FAQ', body: 'Check the connection and try again.', retry: 'Try again' }, () => { void loadFaq(); });
    }
    function loadFaq() {
        if (loadPromise)
            return loadPromise;
        mount.setAttribute('aria-busy', 'true');
        loadPromise = fetch('./assets/data/faq.json')
            .then((response) => {
            if (!response.ok)
                throw new Error(`FAQ request failed with status ${response.status}`);
            return response.json();
        })
            .then((value) => {
            validateData(value);
            data = value;
            render();
            updateLocaleToggle();
        })
            .catch(showError)
            .finally(() => { loadPromise = null; });
        return loadPromise;
    }
    const langToggle = document.getElementById('lang-toggle');
    langToggle?.addEventListener('click', () => {
        locale = locale === 'ko' ? 'en' : 'ko';
        saveLocale(locale);
        render();
        updateLocaleToggle();
    });
    updateLocaleToggle();
    void loadFaq();
})();
