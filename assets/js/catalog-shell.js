"use strict";
var CatalogShell;
(function (CatalogShell) {
    function escapeHtml(value) {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    CatalogShell.escapeHtml = escapeHtml;
    function escapeAttr(value) { return escapeHtml(value); }
    CatalogShell.escapeAttr = escapeAttr;
    function getRequiredElement(selector) {
        const element = document.querySelector(selector);
        if (!element)
            throw new Error(`Missing required element: ${selector}`);
        return element;
    }
    CatalogShell.getRequiredElement = getRequiredElement;
    function decodeHash(rawHash) {
        const trimmed = rawHash.replace(/^#/, '');
        if (!trimmed)
            return '';
        try {
            return decodeURIComponent(trimmed);
        }
        catch (_error) {
            return '';
        }
    }
    CatalogShell.decodeHash = decodeHash;
    function mount(config) {
        const { elements } = config;
        function openModal(item) {
            elements.modalContent.innerHTML = config.renderModal(item);
            elements.modalOverlay.classList.add('active');
            const hashId = config.getHashId(item);
            if (window.location.hash !== `#${hashId}`) {
                AppRuntime.replaceHistory(`#${hashId}`);
            }
            if (!AppDialogA11y.isOpen(elements.modalOverlay)) {
                AppDialogA11y.open({
                    overlay: elements.modalOverlay,
                    dialog: elements.modalDialog,
                    initialFocus: elements.modalContent.querySelector('[data-shell-initial-focus]')
                        ?? elements.modalContent.querySelector('h2')
                        ?? elements.modalDialog,
                    onRequestClose: () => closeModal()
                });
            }
            config.onModalOpen?.(item, elements.modalDialog);
        }
        function closeModal() {
            if (!elements.modalOverlay.classList.contains('active'))
                return;
            closeLightbox();
            elements.modalOverlay.classList.remove('active');
            elements.modalContent.innerHTML = '';
            if (window.location.hash) {
                AppRuntime.replaceHistory(`${window.location.pathname}${window.location.search}`);
            }
            AppDialogA11y.close(elements.modalOverlay);
            config.onModalClose?.();
        }
        function openLightbox(src, alt) {
            if (!elements.lightbox || !elements.lightboxImage || !elements.lightboxClose)
                return;
            elements.lightboxImage.src = src;
            elements.lightboxImage.alt = alt;
            elements.lightbox.classList.add('active');
            AppDialogA11y.open({
                overlay: elements.lightbox,
                initialFocus: elements.lightboxClose,
                onRequestClose: () => closeLightbox()
            });
        }
        function closeLightbox() {
            if (!elements.lightbox || !elements.lightboxImage)
                return;
            if (!elements.lightbox.classList.contains('active'))
                return;
            elements.lightbox.classList.remove('active');
            elements.lightboxImage.removeAttribute('src');
            elements.lightboxImage.alt = '';
            AppDialogA11y.close(elements.lightbox);
        }
        function hydrateHash() {
            const hashId = decodeHash(window.location.hash);
            if (!hashId) {
                if (elements.modalOverlay.classList.contains('active'))
                    closeModal();
                return;
            }
            const item = config.getItems().find((candidate) => config.getHashId(candidate) === hashId);
            if (item !== undefined)
                openModal(item);
        }
        elements.modalClose.addEventListener('click', () => closeModal());
        elements.lightboxClose?.addEventListener('click', () => closeLightbox());
        window.addEventListener('hashchange', () => hydrateHash());
        return { openModal, closeModal, openLightbox, closeLightbox, hydrateHash };
    }
    CatalogShell.mount = mount;
    function setupLangToggle() {
        const toggle = document.querySelector('#lang-toggle');
        if (!toggle || toggle.dataset.shellLangMounted === 'true')
            return;
        toggle.dataset.shellLangMounted = 'true';
        let currentLang = AppRuntime.readStorage('design-isms-lang') === 'en' ? 'en' : 'ko';
        const sync = () => {
            document.documentElement.lang = currentLang;
            toggle.querySelectorAll('.lang-option').forEach((option) => {
                option.classList.toggle('active', option.dataset.lang === currentLang);
            });
        };
        toggle.addEventListener('click', () => {
            currentLang = currentLang === 'ko' ? 'en' : 'ko';
            AppRuntime.writeStorage('design-isms-lang', currentLang);
            sync();
        });
        sync();
    }
    CatalogShell.setupLangToggle = setupLangToggle;
})(CatalogShell || (CatalogShell = {}));
