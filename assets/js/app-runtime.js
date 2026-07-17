"use strict";
var AppRuntime;
(function (AppRuntime) {
    function readStorage(key) {
        try {
            return window.localStorage.getItem(key);
        }
        catch (_error) {
            return null;
        }
    }
    AppRuntime.readStorage = readStorage;
    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(key, value);
        }
        catch (_error) { /* session state remains usable */ }
    }
    AppRuntime.writeStorage = writeStorage;
    function replaceHistory(url) {
        try {
            window.history.replaceState(null, '', url);
        }
        catch (_error) { /* embedded previews may reject this */ }
    }
    AppRuntime.replaceHistory = replaceHistory;
    function dismissLoadingOverlay(delay = 0) {
        window.setTimeout(() => {
            document.body.classList.remove('is-loading');
            const overlay = document.getElementById('loading-overlay');
            if (!overlay)
                return;
            overlay.classList.add('fade-out');
            const remove = () => overlay.remove();
            overlay.addEventListener('transitionend', remove, { once: true });
            window.setTimeout(remove, 700);
        }, delay);
    }
    AppRuntime.dismissLoadingOverlay = dismissLoadingOverlay;
    function renderFatal(root, copy, retry) {
        const block = document.createElement('section');
        block.className = 'page-error-state';
        block.setAttribute('role', 'alert');
        const heading = document.createElement('h2');
        heading.textContent = copy.title;
        const body = document.createElement('p');
        body.textContent = copy.body;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'page-error-retry';
        button.textContent = copy.retry;
        button.addEventListener('click', retry, { once: true });
        block.append(heading, body, button);
        root.replaceChildren(block);
        window.requestAnimationFrame(() => button.focus());
    }
    AppRuntime.renderFatal = renderFatal;
    function replaceBrokenImage(image, label) {
        const fallback = document.createElement('span');
        fallback.className = 'ism-img-placeholder';
        fallback.textContent = `${label} — image unavailable`;
        image.replaceWith(fallback);
    }
    AppRuntime.replaceBrokenImage = replaceBrokenImage;
})(AppRuntime || (AppRuntime = {}));
