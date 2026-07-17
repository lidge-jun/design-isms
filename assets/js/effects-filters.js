"use strict";
/**
 * effects-filters.ts — EffectsFilters global namespace (Phase 050).
 * Owns family/device filter state, URL query persistence, and filter-row
 * rendering for the effects catalog. effects.js consumes this after all
 * classic scripts have evaluated; nothing here runs at top level.
 *
 * Top-level evaluation contract: this file must not reference EffectsDemos
 * or any later namespace during evaluation.
 */
var EffectsFilters;
(function (EffectsFilters) {
    function readParam(params, key, valid) {
        const value = params.get(key);
        return value && valid.has(value) ? value : 'all';
    }
    function create(effects, mounts, onChange) {
        const families = Array.from(new Set(effects.map(e => e.family)));
        const devices = Array.from(new Set(effects.map(e => e.category)));
        const params = new URLSearchParams(window.location.search);
        const state = {
            family: readParam(params, 'family', new Set(families)),
            device: readParam(params, 'device', new Set(devices)),
            query: params.get('q') ?? ''
        };
        function persist() {
            const next = new URLSearchParams(window.location.search);
            for (const [key, value] of [['family', state.family], ['device', state.device], ['q', state.query]]) {
                if (value && value !== 'all')
                    next.set(key, value);
                else
                    next.delete(key);
            }
            const qs = next.toString();
            AppRuntime.replaceHistory(window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
        }
        function renderRow(row, values, active, kind) {
            row.innerHTML = ['all', ...values].map(value => {
                const pressed = value === active ? 'true' : 'false';
                const label = value === 'all' ? 'All' : value;
                return '<button type="button" class="filter-btn effects-filter-btn' + (value === active ? ' active' : '') + '"' +
                    ' data-filter-kind="' + kind + '" data-filter-value="' + value.replace(/"/g, '&quot;') + '"' +
                    ' aria-pressed="' + pressed + '">' + label + '</button>';
            }).join('');
        }
        function renderRows() {
            renderRow(mounts.familyRow, families, state.family, 'family');
            renderRow(mounts.deviceRow, devices, state.device, 'device');
        }
        function emit() {
            persist();
            renderRows();
            onChange({ ...state });
        }
        function handleClick(event) {
            const target = event.target;
            if (!(target instanceof Element))
                return;
            const button = target.closest('[data-filter-kind]');
            if (!button)
                return;
            const kind = button.dataset.filterKind;
            const value = button.dataset.filterValue ?? 'all';
            if (kind === 'family')
                state.family = value;
            else if (kind === 'device')
                state.device = value;
            emit();
        }
        mounts.familyRow.addEventListener('click', handleClick);
        mounts.deviceRow.addEventListener('click', handleClick);
        renderRows();
        return {
            getState: () => ({ ...state }),
            setQuery(query) {
                state.query = query;
                persist();
                onChange({ ...state });
            },
            reset() {
                state.family = 'all';
                state.device = 'all';
                state.query = '';
                emit();
            },
            destroy() {
                mounts.familyRow.removeEventListener('click', handleClick);
                mounts.deviceRow.removeEventListener('click', handleClick);
            }
        };
    }
    EffectsFilters.create = create;
    function matches(effect, state) {
        if (state.family !== 'all' && effect.family !== state.family)
            return false;
        if (state.device !== 'all' && effect.category !== state.device)
            return false;
        if (state.query.trim() === '')
            return true;
        const haystack = [
            effect.id, effect.name, effect.nameKr, effect.family, effect.category,
            effect.summary, ...effect.alsoCalled, ...effect.bestFor
        ].join(' ').toLowerCase();
        return haystack.includes(state.query.trim().toLowerCase());
    }
    EffectsFilters.matches = matches;
})(EffectsFilters || (EffectsFilters = {}));
