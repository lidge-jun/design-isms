"use strict";
var EffectsDemos;
(function (EffectsDemos) {
    EffectsDemos.demoTypes = [
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
        'route-wipe-transition', 'favorite-burst', 'success-checkmark', 'copy-confirmation',
        'sticky-section-reveal', 'scroll-snap-carousel', 'scroll-zoom-hero', 'parallax-depth-cards', 'scroll-linked-progress-sections',
        'typewriter-caret', 'word-rotate-swap', 'gradient-text-sweep', 'glitch-text-flicker', 'marquee-text-loop',
        'svg-wave-divider', 'gradient-morph-blob', 'dot-grid-pulse', 'floating-particles-field', 'video-scrim-hero',
        'spotlight-follow', 'hover-ripple-feedback', 'pointer-glow-border', 'drag-affordance-cursor', 'lens-zoom-hover',
        'flip-card-reveal', 'accordion-morph-expand', 'list-reorder-flip', 'page-turn-transition', 'hero-expand-navigation',
        'toggle-switch-morph', 'confetti-success-burst', 'shake-validation-error', 'progress-ring-completion', 'long-press-context-reveal'
    ];
    function isDemoType(value) {
        return EffectsDemos.demoTypes.includes(value);
    }
    EffectsDemos.isDemoType = isDemoType;
    function render(type) {
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
            case 'sticky-section-reveal': return '<div class="demo-visual-stage demo-sticky-reveal-stage"><div class="demo-sticky-reveal-stack" aria-hidden="true"><i></i><i></i><i></i></div><span class="demo-sticky-reveal-pin">Pinned</span></div>';
            case 'scroll-snap-carousel': return '<div class="demo-visual-stage demo-snap-carousel-stage"><div class="demo-snap-carousel-track" aria-hidden="true"><i></i><i></i><i></i></div><div class="demo-snap-carousel-dots" aria-hidden="true"><i></i><i></i><i></i></div></div>';
            case 'scroll-zoom-hero': return '<div class="demo-visual-stage demo-zoom-hero-stage"><div class="demo-zoom-hero-media" aria-hidden="true"></div><strong class="demo-zoom-hero-copy">EXPLORE</strong></div>';
            case 'parallax-depth-cards': return '<div class="demo-visual-stage demo-depth-cards-stage"><i class="demo-depth-card back" aria-hidden="true"></i><i class="demo-depth-card middle" aria-hidden="true"></i><i class="demo-depth-card front" aria-hidden="true"></i></div>';
            case 'scroll-linked-progress-sections': return '<div class="demo-visual-stage demo-section-progress-stage"><div class="demo-section-progress-rail" aria-hidden="true"><i></i><i></i><i></i><b></b></div><div class="demo-section-progress-copy" aria-hidden="true"><span></span><span></span><span></span></div></div>';
            case 'typewriter-caret': return '<div class="demo-visual-stage demo-typewriter-stage"><div class="demo-typewriter-line"><span class="demo-typewriter-fill"></span><i class="demo-typewriter-caret" aria-hidden="true"></i></div><span class="demo-typewriter-caption">TYPE</span></div>';
            case 'word-rotate-swap': return '<div class="demo-visual-stage demo-word-swap-stage"><span class="demo-word-swap-prefix">Make it</span><span class="demo-word-swap-window"><i>clear</i><i>bold</i><i>alive</i></span></div>';
            case 'gradient-text-sweep': return '<div class="demo-visual-stage demo-gradient-sweep-stage"><strong class="demo-gradient-sweep-copy">SPECTRA</strong><i class="demo-gradient-sweep-band" aria-hidden="true"></i></div>';
            case 'glitch-text-flicker': return '<div class="demo-visual-stage demo-glitch-flicker-stage"><span class="demo-glitch-flicker-copy base">SIGNAL</span><span class="demo-glitch-flicker-copy cyan" aria-hidden="true">SIGNAL</span><span class="demo-glitch-flicker-copy coral" aria-hidden="true">SIGNAL</span></div>';
            case 'marquee-text-loop': return '<div class="demo-visual-stage demo-marquee-loop-stage"><div class="demo-marquee-loop-track" aria-hidden="true"><span>MOTION</span><i></i><span>TYPE</span><i></i><span>MOTION</span><i></i><span>TYPE</span></div></div>';
            case 'svg-wave-divider': return '<div class="demo-visual-stage demo-wave-divider-stage"><div class="demo-wave-divider-copy"><span></span><span></span></div><svg class="demo-wave-divider-svg" viewBox="0 0 180 48" aria-hidden="true"><path d="M0 24 C30 2 60 46 90 24 S150 2 180 24 V48 H0 Z"></path></svg></div>';
            case 'gradient-morph-blob': return '<div class="demo-visual-stage demo-morph-blob-stage"><i class="demo-morph-blob one" aria-hidden="true"></i><i class="demo-morph-blob two" aria-hidden="true"></i><strong class="demo-morph-blob-copy">FORM</strong></div>';
            case 'dot-grid-pulse': return '<div class="demo-visual-stage demo-dot-pulse-stage"><div class="demo-dot-pulse-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>';
            case 'floating-particles-field': return '<div class="demo-visual-stage demo-particle-field-stage"><strong>ORBIT</strong><div class="demo-particle-field" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>';
            case 'video-scrim-hero': return '<div class="demo-visual-stage demo-video-scrim-stage"><div class="demo-video-scrim-frame" aria-hidden="true"><i></i><i></i><i></i></div><div class="demo-video-scrim-shade"></div><div class="demo-video-scrim-copy"><strong>FIELD NOTES</strong><span>Play story</span></div></div>';
            case 'spotlight-follow': return '<div class="demo-visual-stage demo-follow-spot-stage"><div class="demo-follow-spot-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="demo-follow-spot-light" aria-hidden="true"></span><b class="demo-follow-spot-pointer" aria-hidden="true"></b></div>';
            case 'hover-ripple-feedback': return '<div class="demo-visual-stage demo-ripple-feedback-stage"><button class="demo-ripple-feedback-button" type="button">Select</button><i class="demo-ripple-feedback-ring one" aria-hidden="true"></i><i class="demo-ripple-feedback-ring two" aria-hidden="true"></i></div>';
            case 'pointer-glow-border': return '<div class="demo-visual-stage demo-glow-border-stage"><article class="demo-glow-border-card"><span></span><span></span><i class="demo-glow-border-orbit" aria-hidden="true"></i></article></div>';
            case 'drag-affordance-cursor': return '<div class="demo-visual-stage demo-drag-cursor-stage"><div class="demo-drag-cursor-list" aria-hidden="true"><i></i><i></i><i></i></div><svg class="demo-drag-cursor-pointer" viewBox="0 0 20 24" aria-hidden="true"><path d="M3 2 L17 14 L10 15 L7 22 Z"></path></svg></div>';
            case 'lens-zoom-hover': return '<div class="demo-visual-stage demo-lens-zoom-stage"><div class="demo-lens-zoom-image" aria-hidden="true"><i></i><i></i><i></i></div><div class="demo-lens-zoom-lens" aria-hidden="true"><b></b></div></div>';
            case 'flip-card-reveal': return '<div class="demo-visual-stage demo-flip-reveal-stage"><div class="demo-flip-reveal-card"><section class="front"><i></i><span></span></section><section class="back"><strong>DETAIL</strong><span></span></section></div></div>';
            case 'accordion-morph-expand': return '<div class="demo-visual-stage demo-morph-accordion-stage"><div class="demo-morph-accordion-list"><section><b></b><i></i></section><section class="active"><b></b><i></i><span></span><span></span></section><section><b></b><i></i></section></div></div>';
            case 'list-reorder-flip': return '<div class="demo-visual-stage demo-reorder-flip-stage"><div class="demo-reorder-flip-list" aria-label="Reordering list preview"><i>A</i><i>B</i><i>C</i></div></div>';
            case 'page-turn-transition': return '<div class="demo-visual-stage demo-page-turn-stage"><div class="demo-page-turn-book"><section class="under"><strong>02</strong><i></i><i></i></section><section class="turning"><strong>01</strong><i></i><i></i></section></div></div>';
            case 'hero-expand-navigation': return '<div class="demo-visual-stage demo-hero-nav-expand-stage"><nav class="demo-hero-nav-expand-nav" aria-label="Navigation preview"><b></b><span>Work</span><span>About</span><span>Notes</span></nav><div class="demo-hero-nav-expand-hero"><strong>ATLAS</strong><i></i></div></div>';
            case 'toggle-switch-morph': return '<div class="demo-visual-stage demo-toggle-morph-stage"><button class="demo-toggle-morph-control" type="button" role="switch" aria-checked="false"><i></i><b></b></button><span>ACTIVE</span></div>';
            case 'confetti-success-burst': return '<div class="demo-visual-stage demo-confetti-burst-stage"><div class="demo-confetti-burst-check" aria-hidden="true"><i></i></div><div class="demo-confetti-burst-pieces" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>';
            case 'shake-validation-error': return '<div class="demo-visual-stage demo-validation-shake-stage"><div class="demo-validation-shake-field"><span>Email address</span><i aria-hidden="true"></i></div><p>Check this field</p></div>';
            case 'progress-ring-completion': return '<div class="demo-visual-stage demo-completion-ring-stage"><div class="demo-completion-ring" aria-label="Progress complete"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><strong>100</strong></div></div>';
            case 'long-press-context-reveal': return '<div class="demo-visual-stage demo-long-press-stage"><button class="demo-long-press-target" type="button">Hold</button><i class="demo-long-press-progress" aria-hidden="true"></i><div class="demo-long-press-menu"><span>Save</span><span>Share</span><span>Archive</span></div></div>';
        }
    }
    EffectsDemos.render = render;
    function revealCards() {
        return '<span class="phone-line"></span><div class="demo-reveal-card"></div><div class="demo-reveal-card"></div><div class="demo-reveal-card"></div>';
    }
    function skeletonLines() {
        return '<div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div><div class="demo-skeleton-line"></div>';
    }
})(EffectsDemos || (EffectsDemos = {}));
