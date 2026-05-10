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
    'progress-stepper', 'notification-center'
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
    }
  }

  function revealCards(): string {
    return '<span class="phone-line"></span><div class="demo-reveal-card"></div><div class="demo-reveal-card"></div><div class="demo-reveal-card"></div>';
  }

  function skeletonLines(): string {
    return '<div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div>';
  }
}
