"use strict";
var NavDropdown;
(function (NavDropdown) {
    const OPEN_CLASS = 'is-open';
    let mounted = null;
    function setExpanded(open) {
        if (!mounted)
            return;
        mounted.root.classList.toggle(OPEN_CLASS, open);
        mounted.trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function isOpen() {
        return mounted ? mounted.root.classList.contains(OPEN_CLASS) : false;
    }
    function focusableItems() {
        if (!mounted)
            return [];
        return Array.from(mounted.list.querySelectorAll('a[data-catalog-target]'))
            .filter((item) => item.getAttribute('aria-disabled') !== 'true');
    }
    function moveFocus(delta) {
        const items = focusableItems();
        if (items.length === 0)
            return;
        const active = document.activeElement;
        const index = items.findIndex((item) => item === active);
        const next = index < 0 ? (delta > 0 ? 0 : items.length - 1) : (index + delta + items.length) % items.length;
        items[next]?.focus();
    }
    function onDocumentClick(event) {
        if (!mounted || !isOpen())
            return;
        const target = event.target;
        if (target instanceof Node && !mounted.root.contains(target))
            setExpanded(false);
    }
    function onKeydown(event) {
        if (!mounted)
            return;
        if (event.key === 'Escape' && isOpen()) {
            setExpanded(false);
            mounted.trigger.focus();
            return;
        }
        if (!isOpen())
            return;
        const inDropdown = event.target instanceof Node && mounted.root.contains(event.target);
        if (!inDropdown)
            return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveFocus(1);
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveFocus(-1);
        }
    }
    function guardDisabled(event) {
        const target = event.target;
        if (!(target instanceof Element))
            return;
        const item = target.closest('a[data-catalog-target]');
        if (item instanceof HTMLAnchorElement && item.getAttribute('aria-disabled') === 'true') {
            event.preventDefault();
        }
    }
    function mount() {
        const root = document.querySelector('[data-nav-axis="catalog"]');
        if (!root)
            return;
        const trigger = root.querySelector('[data-catalog-trigger]');
        const list = root.querySelector('#catalog-nav-list');
        if (!trigger || !list)
            return;
        mounted = { root, trigger, list };
        trigger.addEventListener('click', () => setExpanded(!isOpen()));
        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setExpanded(true);
                focusableItems()[0]?.focus();
            }
        });
        list.addEventListener('click', guardDisabled);
        document.addEventListener('click', onDocumentClick);
        document.addEventListener('keydown', onKeydown);
    }
    NavDropdown.mount = mount;
    document.addEventListener('DOMContentLoaded', () => mount());
})(NavDropdown || (NavDropdown = {}));
