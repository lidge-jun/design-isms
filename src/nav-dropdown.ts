namespace NavDropdown {
  const OPEN_CLASS = 'is-open';

  interface Mounted {
    root: HTMLElement;
    trigger: HTMLButtonElement;
    list: HTMLElement;
  }

  let mounted: Mounted | null = null;

  function setExpanded(open: boolean): void {
    if (!mounted) return;
    mounted.root.classList.toggle(OPEN_CLASS, open);
    mounted.trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function isOpen(): boolean {
    return mounted ? mounted.root.classList.contains(OPEN_CLASS) : false;
  }

  function focusableItems(): HTMLAnchorElement[] {
    if (!mounted) return [];
    return Array.from(mounted.list.querySelectorAll<HTMLAnchorElement>('a[data-catalog-target]'))
      .filter((item) => item.getAttribute('aria-disabled') !== 'true');
  }

  function moveFocus(delta: number): void {
    const items = focusableItems();
    if (items.length === 0) return;
    const active = document.activeElement;
    const index = items.findIndex((item) => item === active);
    const next = index < 0 ? (delta > 0 ? 0 : items.length - 1) : (index + delta + items.length) % items.length;
    items[next]?.focus();
  }

  function onDocumentClick(event: MouseEvent): void {
    if (!mounted || !isOpen()) return;
    const target = event.target;
    if (target instanceof Node && !mounted.root.contains(target)) setExpanded(false);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!mounted) return;
    if (event.key === 'Escape' && isOpen()) {
      setExpanded(false);
      mounted.trigger.focus();
      return;
    }
    if (!isOpen()) return;
    const inDropdown = event.target instanceof Node && mounted.root.contains(event.target);
    if (!inDropdown) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(-1); }
  }

  function guardDisabled(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest('a[data-catalog-target]');
    if (item instanceof HTMLAnchorElement && item.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
    }
  }

  export function mount(): void {
    const root = document.querySelector<HTMLElement>('[data-nav-axis="catalog"]');
    if (!root) return;
    const trigger = root.querySelector<HTMLButtonElement>('[data-catalog-trigger]');
    const list = root.querySelector<HTMLElement>('#catalog-nav-list');
    if (!trigger || !list) return;
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

  document.addEventListener('DOMContentLoaded', () => mount());
}
