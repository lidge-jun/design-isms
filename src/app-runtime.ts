namespace AppRuntime {
  export interface ErrorCopy { title: string; body: string; retry: string; }

  export function readStorage(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch (_error: unknown) { return null; }
  }

  export function writeStorage(key: string, value: string): void {
    try { window.localStorage.setItem(key, value); } catch (_error: unknown) { /* session state remains usable */ }
  }

  export function replaceHistory(url: string): void {
    try { window.history.replaceState(null, '', url); } catch (_error: unknown) { /* embedded previews may reject this */ }
  }

  export function dismissLoadingOverlay(delay = 0): void {
    window.setTimeout(() => {
      document.body.classList.remove('is-loading');
      const overlay = document.getElementById('loading-overlay');
      if (!overlay) return;
      overlay.classList.add('fade-out');
      const remove = (): void => overlay.remove();
      overlay.addEventListener('transitionend', remove, { once: true });
      window.setTimeout(remove, 700);
    }, delay);
  }

  export function renderFatal(root: HTMLElement, copy: ErrorCopy, retry: () => void): void {
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

  export function replaceBrokenImage(image: HTMLImageElement, label: string): void {
    const fallback = document.createElement('span');
    fallback.className = 'ism-img-placeholder';
    fallback.textContent = `${label} — image unavailable`;
    image.replaceWith(fallback);
  }
}
