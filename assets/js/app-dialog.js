"use strict";
/**
 * app-dialog.ts — AppDialogA11y global namespace (Phase 020).
 * Layer-stack dialog accessibility plumbing for classic-script pages:
 * trigger capture, aria-hidden toggling, initial focus, Tab trap,
 * Escape arbitration (top layer only), backdrop close, body scroll
 * lock without layout jump, and focus restore on close.
 *
 * Classic script: no import/export. Consumers (app.js) load AFTER this
 * file. No DOM queries run at top level; everything happens inside
 * open()/close() calls issued by the consumer.
 */
var AppDialogA11y;
(function (AppDialogA11y) {
    const FOCUSABLE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    const stack = [];
    let keydownBound = false;
    let savedBodyOverflow = '';
    let savedBodyPaddingRight = '';
    function focusableIn(dialog) {
        return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR))
            .filter(el => el.offsetParent !== null || el === document.activeElement);
    }
    function lockScroll() {
        if (stack.length !== 1) {
            return;
        }
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        savedBodyOverflow = document.body.style.overflow;
        savedBodyPaddingRight = document.body.style.paddingRight;
        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = scrollbarWidth + 'px';
        }
    }
    function unlockScroll() {
        if (stack.length !== 0) {
            return;
        }
        document.body.style.overflow = savedBodyOverflow;
        document.body.style.paddingRight = savedBodyPaddingRight;
    }
    /**
     * Hide the page landmarks from assistive technology while a dialog is open.
     * The Tab trap already blocks keyboard escape; this closes the virtual-cursor
     * route that would otherwise let a screen reader read the page behind a modal.
     * Only the outermost layer toggles it, so stacked dialogs stay consistent.
     */
    function setBackgroundInert(inert) {
        if (stack.length !== (inert ? 1 : 0)) {
            return;
        }
        const top = stack[stack.length - 1];
        for (const selector of ['header.site-header', 'main', 'footer.site-footer']) {
            const landmark = document.querySelector(selector);
            if (!landmark) {
                continue;
            }
            // A landmark that wraps the open overlay must stay live, otherwise the
            // dialog itself becomes inert and its close paths stop working.
            if (inert && top && landmark.contains(top.overlay)) {
                continue;
            }
            if (inert) {
                landmark.setAttribute('inert', '');
            }
            else {
                landmark.removeAttribute('inert');
            }
        }
    }
    function handleKeydown(event) {
        const top = stack[stack.length - 1];
        if (!top) {
            return;
        }
        if (event.key === 'Escape') {
            event.stopPropagation();
            event.preventDefault();
            top.onRequestClose();
            return;
        }
        if (event.key !== 'Tab') {
            return;
        }
        const focusable = focusableIn(top.dialog);
        if (focusable.length === 0) {
            event.preventDefault();
            top.dialog.focus();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) {
            return;
        }
        const active = document.activeElement;
        const inside = active instanceof HTMLElement && top.dialog.contains(active);
        if (!inside) {
            event.preventDefault();
            first.focus();
            return;
        }
        if (event.shiftKey && (active === first || active === top.dialog)) {
            event.preventDefault();
            last.focus();
        }
        else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }
    function findLayerIndex(overlay) {
        for (let i = stack.length - 1; i >= 0; i -= 1) {
            const layer = stack[i];
            if (layer && layer.overlay === overlay) {
                return i;
            }
        }
        return -1;
    }
    function isOpen(overlay) {
        return findLayerIndex(overlay) !== -1;
    }
    AppDialogA11y.isOpen = isOpen;
    function open(options) {
        if (isOpen(options.overlay)) {
            return;
        }
        const dialog = options.dialog ?? options.overlay;
        const activeEl = document.activeElement;
        const trigger = options.trigger ??
            (activeEl instanceof HTMLElement && activeEl !== document.body ? activeEl : null);
        const layer = {
            overlay: options.overlay,
            dialog,
            trigger,
            onRequestClose: options.onRequestClose,
            backdropHandler: null
        };
        if (options.backdropClose !== false) {
            layer.backdropHandler = (event) => {
                if (event.target === options.overlay) {
                    layer.onRequestClose();
                }
            };
            options.overlay.addEventListener('click', layer.backdropHandler);
        }
        stack.push(layer);
        options.overlay.setAttribute('aria-hidden', 'false');
        lockScroll();
        setBackgroundInert(true);
        if (!keydownBound) {
            document.addEventListener('keydown', handleKeydown, true);
            keydownBound = true;
        }
        const target = options.initialFocus ?? focusableIn(dialog)[0] ?? dialog;
        window.requestAnimationFrame(() => {
            target.focus();
        });
    }
    AppDialogA11y.open = open;
    function close(overlay) {
        const index = findLayerIndex(overlay);
        if (index === -1) {
            return;
        }
        const layer = stack[index];
        stack.splice(index, 1);
        if (!layer) {
            return;
        }
        if (layer.backdropHandler) {
            layer.overlay.removeEventListener('click', layer.backdropHandler);
        }
        layer.overlay.setAttribute('aria-hidden', 'true');
        unlockScroll();
        setBackgroundInert(false);
        if (keydownBound && stack.length === 0) {
            document.removeEventListener('keydown', handleKeydown, true);
            keydownBound = false;
        }
        const below = stack[stack.length - 1];
        if (below) {
            below.dialog.focus();
        }
        else if (layer.trigger && document.contains(layer.trigger)) {
            layer.trigger.focus();
        }
    }
    AppDialogA11y.close = close;
})(AppDialogA11y || (AppDialogA11y = {}));
