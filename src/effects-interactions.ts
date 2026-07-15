/**
 * effects-interactions.ts — EffectsInteractions global namespace (Phase 050).
 * One delegated controller for demo pointer/click/visibility behavior:
 * no per-card global listeners, rAF-batched pointer updates, clamped
 * magnetic/tilt transforms, IntersectionObserver-driven ambient pause,
 * and reduced-motion / coarse-pointer gates.
 *
 * Top-level evaluation contract: no EffectsDemos references during
 * evaluation; effects.js calls mount()/refresh() after all scripts load.
 */
namespace EffectsInteractions {
  export interface Controller { refresh(): void; destroy(): void; }

  const MAX_MAGNETIC_PX = 6;
  const MAX_TILT_DEG = 4;

  export function mount(root: HTMLElement): Controller {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let rafId = 0;
    let pendingPointer: PointerEvent | null = null;
    let observer: IntersectionObserver | null = null;

    function applyPointer(event: PointerEvent): void {
      if (!finePointer.matches || reducedMotion.matches) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const magnetic = target.closest<HTMLElement>('.demo-magnetic');
      if (magnetic) {
        const inner = magnetic.querySelector<HTMLElement>('span');
        if (inner) {
          const rect = magnetic.getBoundingClientRect();
          const dx = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * MAX_MAGNETIC_PX;
          const dy = ((event.clientY - rect.top) / rect.height - 0.5) * 2 * MAX_MAGNETIC_PX;
          inner.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
        }
      }

      const tilt = target.closest<HTMLElement>('.demo-tilt-card');
      if (tilt) {
        const rect = tilt.getBoundingClientRect();
        const rx = ((event.clientY - rect.top) / rect.height - 0.5) * -2 * MAX_TILT_DEG;
        const ry = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * MAX_TILT_DEG;
        tilt.style.transform = 'rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg)';
      }
    }

    function onPointerMove(event: PointerEvent): void {
      pendingPointer = event;
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (pendingPointer) applyPointer(pendingPointer);
        pendingPointer = null;
      });
    }

    function onPointerLeave(event: PointerEvent): void {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>('.demo-magnetic span, .demo-magnetic, .demo-tilt-card');
      if (el instanceof HTMLElement) {
        const inner = el.matches('.demo-magnetic') ? el.querySelector<HTMLElement>('span') : el;
        if (inner) inner.style.transform = '';
      }
    }

    function onClick(event: Event): void {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const action = target.closest<HTMLElement>('[data-demo-action]');
      if (!action) return;
      event.stopPropagation();
      const kind = action.dataset.demoAction ?? '';
      if (kind === 'favorite') {
        const pressed = action.getAttribute('aria-pressed') === 'true';
        action.setAttribute('aria-pressed', String(!pressed));
      } else if (kind === 'copy') {
        action.classList.add('is-copied');
        const live = action.parentElement?.querySelector<HTMLElement>('[aria-live]');
        if (live) live.textContent = '복사됨';
        window.setTimeout(() => {
          action.classList.remove('is-copied');
          if (live) live.textContent = '';
        }, 1500);
      } else {
        action.classList.remove('is-replaying');
        void action.offsetWidth; // restart CSS animation
        action.classList.add('is-replaying');
      }
      root.dispatchEvent(new CustomEvent('effect-demo-statechange', {
        detail: { action: kind },
        bubbles: true
      }));
    }

    function observeCards(): void {
      observer?.disconnect();
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          entry.target.classList.toggle('is-demo-active', entry.isIntersecting);
        });
      }, { rootMargin: '60px 0px' });
      root.querySelectorAll('.effect-card').forEach(el => observer?.observe(el));
    }

    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerout', onPointerLeave);
    root.addEventListener('click', onClick);
    observeCards();

    return {
      refresh(): void {
        observeCards();
      },
      destroy(): void {
        root.removeEventListener('pointermove', onPointerMove);
        root.removeEventListener('pointerout', onPointerLeave);
        root.removeEventListener('click', onClick);
        observer?.disconnect();
        observer = null;
        if (rafId !== 0) window.cancelAnimationFrame(rafId);
      }
    };
  }
}
