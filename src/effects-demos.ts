namespace EffectsDemos {
  export const demoTypes = [
    'bottom-sheet', 'full-screen-mobile-modal', 'drawer-navigation', 'sticky-cta-bar',
    'scroll-reveal', 'staggered-cards', 'press-scale', 'swipe-action', 'skeleton-loading',
    'toast', 'segmented-control', 'image-lightbox', 'sticky-tab-bar', 'pull-to-refresh',
    'floating-action-button', 'mobile-stepper-form', 'mobile-empty-state', 'inline-validation',
    'mega-menu', 'command-palette', 'split-pane', 'resizable-sidebar', 'data-table',
    'master-detail', 'kanban-board', 'breadcrumb', 'context-menu', 'tooltip', 'popover',
    'modal-dialog', 'toast-stack', 'inline-edit', 'drag-reorder', 'virtual-list',
    'sticky-table-header', 'dashboard-kpi-cards', 'filter-sidebar', 'pagination',
    'desktop-wizard', 'tabs', 'accordion', 'carousel', 'date-picker', 'file-dropzone',
    'progress-stepper', 'notification-center',
    'scroll-progress-indicator', 'layered-parallax', 'horizontal-scroll-gallery',
    'split-text-reveal', 'text-scramble', 'number-ticker', 'aurora-mesh-background',
    'spotlight-grid-background', 'grain-noise-drift', 'magnetic-button', 'cursor-trail',
    'tilt-hover-card', 'crossfade-view-transition', 'shared-element-transition',
    'route-wipe-transition', 'favorite-burst', 'success-checkmark', 'copy-confirmation'
  ] as const;

  export type DemoType = typeof demoTypes[number];

  export function isDemoType(value: string): value is DemoType {
    return (demoTypes as readonly string[]).includes(value);
  }

  export function render(type: DemoType): string {
    switch (type) {
      case 'bottom-sheet': return '<span class="phone-line"></span><span class="phone-line short"></span><div class="demo-overlay"></div><div class="demo-sheet"><span class="phone-line"></span><span class="phone-pill"></span></div>';
      case 'full-screen-mobile-modal': return '<span class="phone-line"></span><span class="phone-card"></span><div class="demo-overlay"></div><div class="demo-full"><span class="phone-line"></span><span class="phone-line short"></span><span class="phone-pill"></span></div>';
      case 'drawer-navigation': return '<span class="phone-line"></span><span class="phone-card"></span><div class="demo-overlay"></div><div class="demo-drawer"><span class="phone-line"></span><span class="phone-line short"></span><span class="phone-line"></span></div>';
      case 'sticky-cta-bar': return '<span class="phone-line"></span><span class="phone-card"></span><span class="phone-card"></span><span class="phone-card"></span><div class="demo-sticky-bar"></div>';
      case 'scroll-reveal': return revealCards();
      case 'staggered-cards': return revealCards();
      case 'press-scale': return '<span class="phone-line"></span><div class="demo-press-button"></div>';
      case 'swipe-action': return '<span class="phone-line"></span><div class="demo-swipe-action"><div class="demo-swipe-row"></div></div>';
      case 'skeleton-loading': return skeletonLines();
      case 'toast': return '<span class="phone-line"></span><span class="phone-card"></span><div class="demo-toast"></div>';
      case 'segmented-control': return '<span class="phone-line"></span><div class="demo-segment"></div>';
      case 'image-lightbox': return '<span class="phone-line"></span><div class="demo-lightbox-thumb"></div>';
      case 'sticky-tab-bar': return '<span class="phone-line"></span><span class="phone-card"></span><div class="demo-tabbar"><i></i><i></i><i></i></div>';
      case 'pull-to-refresh': return '<span class="phone-line"></span><div class="demo-refresh"></div><span class="phone-card"></span><span class="phone-card"></span>';
      case 'floating-action-button': return '<span class="phone-line"></span><span class="phone-card"></span><span class="demo-fab"></span>';
      case 'mobile-stepper-form': return '<div class="demo-stepper"><i></i><i></i><i></i></div><span class="phone-line"></span><span class="phone-card"></span><span class="phone-pill"></span>';
      case 'mobile-empty-state': return '<div class="demo-empty-icon"></div><span class="phone-line short"></span><span class="phone-pill"></span>';
      case 'inline-validation': return '<div class="demo-input invalid"></div><div class="demo-validation"></div>';
      case 'mega-menu': return '<div class="demo-desktop-nav"></div><div class="demo-mega-menu"><i></i><i></i><i></i></div>';
      case 'command-palette': return '<div class="demo-command"><span></span><i></i><i></i><i></i></div>';
      case 'split-pane': return '<div class="demo-split"><i></i><b></b><i></i></div>';
      case 'resizable-sidebar': return '<div class="demo-resizable"><i></i><b></b></div>';
      case 'data-table': return '<div class="demo-table"><i></i><i></i><i></i><i></i></div>';
      case 'master-detail': return '<div class="demo-master-detail"><i></i><i></i><b></b></div>';
      case 'kanban-board': return '<div class="demo-kanban"><i></i><i></i><i></i></div>';
      case 'breadcrumb': return '<div class="demo-breadcrumb"><i></i><i></i><i></i></div><span class="phone-card"></span>';
      case 'context-menu': return '<span class="phone-card"></span><div class="demo-context-menu"><i></i><i></i><i></i></div>';
      case 'tooltip': return '<span class="demo-dot-button"></span><div class="demo-tooltip"></div>';
      case 'popover': return '<span class="demo-dot-button"></span><div class="demo-popover"><i></i><i></i></div>';
      case 'modal-dialog': return '<span class="phone-card"></span><div class="demo-overlay"></div><div class="demo-dialog"><i></i><i></i></div>';
      case 'toast-stack': return '<span class="phone-line"></span><div class="demo-toast-stack"><i></i><i></i><i></i></div>';
      case 'inline-edit': return '<div class="demo-inline-edit"><span></span><input aria-label="demo" value="Edit"></div>';
      case 'drag-reorder': return '<div class="demo-drag-list"><i></i><i></i><i></i></div>';
      case 'virtual-list': return '<div class="demo-virtual-list"><i></i><i></i><i></i><i></i></div>';
      case 'sticky-table-header': return '<div class="demo-sticky-table"><b></b><i></i><i></i><i></i></div>';
      case 'dashboard-kpi-cards': return '<div class="demo-kpi-grid"><i></i><i></i><i></i><i></i></div>';
      case 'filter-sidebar': return '<div class="demo-filter-layout"><aside></aside><main></main></div>';
      case 'pagination': return '<div class="demo-pagination"><i></i><i></i><i></i><i></i></div>';
      case 'desktop-wizard': return '<div class="demo-wizard"><i></i><i></i><i></i></div><span class="phone-card"></span>';
      case 'tabs': return '<div class="demo-tabs"><i></i><i></i><i></i></div><span class="phone-card"></span>';
      case 'accordion': return '<div class="demo-accordion"><i></i><i></i><i></i></div>';
      case 'carousel': return '<div class="demo-carousel"><i></i><i></i><i></i></div>';
      case 'date-picker': return '<div class="demo-calendar"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
      case 'file-dropzone': return '<div class="demo-dropzone"><i></i><span></span></div>';
      case 'progress-stepper': return '<div class="demo-progress-stepper"><i></i><i></i><i></i><b></b></div>';
      case 'notification-center': return '<div class="demo-notification-panel"><i></i><i></i><i></i></div>';
      case 'scroll-progress-indicator': return '<div class="demo-visual-stage demo-scroll-indicator"><div class="demo-scroll-track" aria-hidden="true"><div class="demo-scroll-progress"></div></div><article class="demo-scroll-copy" aria-label="Reading progress preview"><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i></article></div>';
      case 'layered-parallax': return '<div class="demo-visual-stage demo-parallax-scene"><i class="demo-parallax-layer back" aria-hidden="true"></i><i class="demo-parallax-layer mid" aria-hidden="true"></i><i class="demo-parallax-layer front" aria-hidden="true"></i></div>';
      case 'horizontal-scroll-gallery': return '<div class="demo-visual-stage demo-gallery-window"><div class="demo-gallery-track" aria-hidden="true"><i></i><i></i><i></i></div><div class="demo-gallery-dots" aria-hidden="true"><i></i><i></i><i></i></div></div>';
      case 'split-text-reveal': return '<div class="demo-visual-stage demo-split-reveal"><p class="demo-split-copy"><span>Design</span><span>in</span><span>motion</span></p></div>';
      case 'text-scramble': return '<div class="demo-visual-stage demo-text-scramble"><span class="demo-scramble-glyphs" aria-label="Loading">L0ΛD!NG</span></div>';
      case 'number-ticker': return '<div class="demo-visual-stage demo-number-ticker"><div class="demo-ticker-window" aria-label="Count 5"><div class="demo-ticker-column" aria-hidden="true"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div></div></div>';
      case 'aurora-mesh-background': return '<div class="demo-visual-stage demo-aurora-stage"><i class="demo-aurora-blob" aria-hidden="true"></i></div>';
      case 'spotlight-grid-background': return '<div class="demo-visual-stage demo-grid-stage"><i class="demo-grid-spotlight" aria-hidden="true"></i></div>';
      case 'grain-noise-drift': return '<div class="demo-visual-stage demo-grain-stage"><i class="demo-grain" aria-hidden="true"></i></div>';
      case 'magnetic-button': return '<div class="demo-visual-stage demo-magnetic-stage"><button class="demo-magnetic" type="button"><span>Open menu</span></button></div>';
      case 'cursor-trail': return '<div class="demo-visual-stage demo-cursor-trail"><i class="demo-cursor-path" aria-hidden="true"></i><i class="demo-cursor-dot" aria-hidden="true"></i><i class="demo-cursor-dot" aria-hidden="true"></i><i class="demo-cursor-dot" aria-hidden="true"></i><i class="demo-cursor-dot" aria-hidden="true"></i></div>';
      case 'tilt-hover-card': return '<div class="demo-visual-stage demo-tilt-stage"><article class="demo-tilt-card" aria-label="Interactive card"><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i></article></div>';
      case 'crossfade-view-transition': return '<div class="demo-visual-stage demo-crossfade-stage"><div class="demo-crossfade-panel">View A</div><div class="demo-crossfade-panel next">View B</div></div>';
      case 'shared-element-transition': return '<div class="demo-visual-stage demo-shared-stage"><i class="demo-shared-large" aria-hidden="true"></i><i class="demo-shared-small" aria-hidden="true"></i></div>';
      case 'route-wipe-transition': return '<div class="demo-visual-stage demo-route-stage"><div class="demo-route-page" aria-label="Route preview"></div><i class="demo-route-wipe" aria-hidden="true"></i></div>';
      case 'favorite-burst': return '<div class="demo-visual-stage demo-favorite-stage"><button class="demo-favorite-core" type="button" aria-pressed="false" data-demo-action="favorite" aria-label="즐겨찾기 토글">♥</button><i class="demo-burst-particle" aria-hidden="true"></i><i class="demo-burst-particle" aria-hidden="true"></i><i class="demo-burst-particle" aria-hidden="true"></i><i class="demo-burst-particle" aria-hidden="true"></i></div>';
      case 'success-checkmark': return '<div class="demo-visual-stage demo-success-stage"><i class="demo-success-ring" aria-hidden="true"></i><span class="demo-success-label">완료</span></div>';
      case 'copy-confirmation': return '<div class="demo-visual-stage demo-copy-stage"><button class="demo-copy-confirm" type="button" data-demo-action="copy"><span class="demo-copy-label">Copy code</span><span class="demo-copied-label">Copied</span></button><span class="sr-only" aria-live="polite"></span></div>';
    }
  }

  function revealCards(): string {
    return '<span class="phone-line"></span><div class="demo-reveal-card"></div><div class="demo-reveal-card"></div><div class="demo-reveal-card"></div>';
  }

  function skeletonLines(): string {
    return '<div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div>';
  }
}
