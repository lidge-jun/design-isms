namespace CatalogShell {
  export interface Elements {
    grid: HTMLElement;
    resultCount: HTMLElement;
    modalOverlay: HTMLElement;
    modalDialog: HTMLElement;
    modalClose: HTMLButtonElement;
    modalContent: HTMLElement;
    lightbox: HTMLElement | null;
    lightboxClose: HTMLButtonElement | null;
    lightboxImage: HTMLImageElement | null;
  }

  export interface Config<T> {
    elements: Elements;
    getItems: () => T[];
    getHashId: (item: T) => string;
    renderModal: (item: T) => string;
    onModalOpen?: (item: T, dialog: HTMLElement) => void;
    onModalClose?: () => void;
  }

  export interface Controller<T> {
    openModal: (item: T) => void;
    closeModal: () => void;
    openLightbox: (src: string, alt: string) => void;
    closeLightbox: () => void;
    hydrateHash: () => void;
  }

  export function escapeHtml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  export function escapeAttr(value: string): string { return escapeHtml(value); }

  export function getRequiredElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing required element: ${selector}`);
    return element;
  }

  export function decodeHash(rawHash: string): string {
    const trimmed = rawHash.replace(/^#/, '');
    if (!trimmed) return '';
    try {
      return decodeURIComponent(trimmed);
    } catch (_error: unknown) {
      return '';
    }
  }

  export function mount<T>(config: Config<T>): Controller<T> {
    const { elements } = config;

    function openModal(item: T): void {
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
          initialFocus: elements.modalContent.querySelector<HTMLElement>('[data-shell-initial-focus]')
            ?? elements.modalContent.querySelector<HTMLElement>('h2')
            ?? elements.modalDialog,
          onRequestClose: () => closeModal()
        });
      }
      config.onModalOpen?.(item, elements.modalDialog);
    }

    function closeModal(): void {
      if (!elements.modalOverlay.classList.contains('active')) return;
      closeLightbox();
      elements.modalOverlay.classList.remove('active');
      elements.modalContent.innerHTML = '';
      if (window.location.hash) {
        AppRuntime.replaceHistory(`${window.location.pathname}${window.location.search}`);
      }
      AppDialogA11y.close(elements.modalOverlay);
      config.onModalClose?.();
    }

    function openLightbox(src: string, alt: string): void {
      if (!elements.lightbox || !elements.lightboxImage || !elements.lightboxClose) return;
      elements.lightboxImage.src = src;
      elements.lightboxImage.alt = alt;
      elements.lightbox.classList.add('active');
      AppDialogA11y.open({
        overlay: elements.lightbox,
        initialFocus: elements.lightboxClose,
        onRequestClose: () => closeLightbox()
      });
    }

    function closeLightbox(): void {
      if (!elements.lightbox || !elements.lightboxImage) return;
      if (!elements.lightbox.classList.contains('active')) return;
      elements.lightbox.classList.remove('active');
      elements.lightboxImage.removeAttribute('src');
      elements.lightboxImage.alt = '';
      AppDialogA11y.close(elements.lightbox);
    }

    function hydrateHash(): void {
      const hashId = decodeHash(window.location.hash);
      if (!hashId) {
        if (elements.modalOverlay.classList.contains('active')) closeModal();
        return;
      }
      const item = config.getItems().find((candidate) => config.getHashId(candidate) === hashId);
      if (item !== undefined) openModal(item);
    }

    elements.modalClose.addEventListener('click', () => closeModal());
    elements.lightboxClose?.addEventListener('click', () => closeLightbox());
    window.addEventListener('hashchange', () => hydrateHash());

    return { openModal, closeModal, openLightbox, closeLightbox, hydrateHash };
  }

  export function setupLangToggle(): void {
    const toggle = document.querySelector<HTMLButtonElement>('#lang-toggle');
    if (!toggle || toggle.dataset.shellLangMounted === 'true') return;
    toggle.dataset.shellLangMounted = 'true';
    let currentLang = AppRuntime.readStorage('design-isms-lang') === 'en' ? 'en' : 'ko';
    const sync = (): void => {
      document.documentElement.lang = currentLang;
      toggle.querySelectorAll<HTMLElement>('.lang-option').forEach((option) => {
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
}
