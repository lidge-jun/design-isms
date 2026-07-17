/**
 * effects-filters.ts — EffectsFilters global namespace (Phase 050).
 * Owns family/device filter state, URL query persistence, and filter-row
 * rendering for the effects catalog. effects.js consumes this after all
 * classic scripts have evaluated; nothing here runs at top level.
 *
 * Top-level evaluation contract: this file must not reference EffectsDemos
 * or any later namespace during evaluation.
 */
namespace EffectsFilters {
  export interface FilterableEffect {
    id: string;
    name: string;
    nameKr: string;
    family: string;
    category: string;
    summary: string;
    alsoCalled: readonly string[];
    bestFor: readonly string[];
  }

  export interface State { family: string; device: string; query: string; }

  export interface Controller {
    getState(): State;
    setQuery(query: string): void;
    reset(): void;
    destroy(): void;
  }

  interface Mounts {
    familyRow: HTMLElement;
    deviceRow: HTMLElement;
  }

  function readParam(params: URLSearchParams, key: string, valid: Set<string>): string {
    const value = params.get(key);
    return value && valid.has(value) ? value : 'all';
  }

  export function create(
    effects: readonly FilterableEffect[],
    mounts: Mounts,
    onChange: (state: State) => void
  ): Controller {
    const families = Array.from(new Set(effects.map(e => e.family)));
    const devices = Array.from(new Set(effects.map(e => e.category)));
    const params = new URLSearchParams(window.location.search);

    const state: State = {
      family: readParam(params, 'family', new Set(families)),
      device: readParam(params, 'device', new Set(devices)),
      query: params.get('q') ?? ''
    };

    function persist(): void {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of [['family', state.family], ['device', state.device], ['q', state.query]] as const) {
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
      }
      const qs = next.toString();
      AppRuntime.replaceHistory(window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    }

    function renderRow(row: HTMLElement, values: string[], active: string, kind: 'family' | 'device'): void {
      row.innerHTML = ['all', ...values].map(value => {
        const pressed = value === active ? 'true' : 'false';
        const label = value === 'all' ? 'All' : value;
        return '<button type="button" class="filter-btn effects-filter-btn' + (value === active ? ' active' : '') + '"' +
          ' data-filter-kind="' + kind + '" data-filter-value="' + value.replace(/"/g, '&quot;') + '"' +
          ' aria-pressed="' + pressed + '">' + label + '</button>';
      }).join('');
    }

    function renderRows(): void {
      renderRow(mounts.familyRow, families, state.family, 'family');
      renderRow(mounts.deviceRow, devices, state.device, 'device');
    }

    function emit(): void {
      persist();
      renderRows();
      onChange({ ...state });
    }

    function handleClick(event: Event): void {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLElement>('[data-filter-kind]');
      if (!button) return;
      const kind = button.dataset.filterKind;
      const value = button.dataset.filterValue ?? 'all';
      if (kind === 'family') state.family = value;
      else if (kind === 'device') state.device = value;
      emit();
    }

    mounts.familyRow.addEventListener('click', handleClick);
    mounts.deviceRow.addEventListener('click', handleClick);
    renderRows();

    return {
      getState: () => ({ ...state }),
      setQuery(query: string): void {
        state.query = query;
        persist();
        onChange({ ...state });
      },
      reset(): void {
        state.family = 'all';
        state.device = 'all';
        state.query = '';
        emit();
      },
      destroy(): void {
        mounts.familyRow.removeEventListener('click', handleClick);
        mounts.deviceRow.removeEventListener('click', handleClick);
      }
    };
  }

  export function matches(effect: FilterableEffect, state: State): boolean {
    if (state.family !== 'all' && effect.family !== state.family) return false;
    if (state.device !== 'all' && effect.category !== state.device) return false;
    if (state.query.trim() === '') return true;
    const haystack = [
      effect.id, effect.name, effect.nameKr, effect.family, effect.category,
      effect.summary, ...effect.alsoCalled, ...effect.bestFor
    ].join(' ').toLowerCase();
    return haystack.includes(state.query.trim().toLowerCase());
  }
}
