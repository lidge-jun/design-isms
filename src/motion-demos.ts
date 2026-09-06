namespace MotionDemos {
  export const demoTypes = [
    'motion-linear',
    'motion-ease-in-out',
    'motion-spring',
    'motion-bounce',
    'motion-elastic',
    'motion-back',
    'motion-fade',
    'motion-slide',
    'motion-scale',
    'motion-blur-reveal',
    'motion-skeleton-shimmer',
    'motion-spinner',
    'motion-progress',
    'motion-pulse',
    'motion-scroll-timeline',
    'motion-scroll-reveal',
    'motion-sticky-transition',
    'motion-expand-collapse',
    'motion-tab-transition',
    'motion-list-reorder'
  ] as const;

  type CubicBezierEasing = {
    kind: 'cubic-bezier';
    points: readonly [number, number, number, number];
  };

  type LinearStop = { value: number; position: number };
  type LinearEasing = { kind: 'linear'; stops: readonly LinearStop[] };
  type Easing = CubicBezierEasing | LinearEasing;

  const numberPattern = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
  const cubicPattern = new RegExp(
    `^cubic-bezier\\(\\s*(${numberPattern})\\s*,\\s*(${numberPattern})\\s*,\\s*(${numberPattern})\\s*,\\s*(${numberPattern})\\s*\\)$`
  );
  const linearStopPattern = new RegExp(`^(${numberPattern})\\s+(${numberPattern})%$`);

  export function parseEasing(value: string): Easing | null {
    const source = value.trim();
    const cubicMatch = cubicPattern.exec(source);
    if (cubicMatch) {
      const values = cubicMatch.slice(1).map(Number);
      const x1 = values[0]; const y1 = values[1]; const x2 = values[2]; const y2 = values[3];
      if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) return null;
      if (![x1, y1, x2, y2].every((item) => Number.isFinite(item))) return null;
      if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null;
      return { kind: 'cubic-bezier', points: [x1, y1, x2, y2] };
    }

    if (!source.startsWith('linear(') || !source.endsWith(')')) return null;
    const body = source.slice(7, -1).trim();
    if (!body) return null;
    const parts = body.split(',');
    if (parts.length < 2) return null;

    const stops: LinearStop[] = [];
    for (const part of parts) {
      const match = linearStopPattern.exec(part.trim());
      if (!match) return null;
      const stop = { value: Number(match[1]), position: Number(match[2]) };
      if (!Number.isFinite(stop.value) || !Number.isFinite(stop.position)) return null;
      if (stop.position < 0 || stop.position > 100) return null;
      const previous = stops[stops.length - 1];
      if (previous && stop.position <= previous.position) return null;
      stops.push(stop);
    }

    const first = stops[0]; const last = stops[stops.length - 1];
    if (!first || !last || first.position !== 0 || last.position !== 100) return null;
    return { kind: 'linear', stops };
  }

  export function curveSvg(easing: string): string {
    const parsed = parseEasing(easing);
    if (!parsed) return '<p class="motion-curve-error" role="status">Invalid easing value</p>';

    const plot = { left: 24, right: 228, top: 14, bottom: 138 };
    const values = parsed.kind === 'cubic-bezier'
      ? [0, parsed.points[1], parsed.points[3], 1]
      : parsed.stops.map((stop) => stop.value);
    const rawMin = Math.min(0, ...values);
    const rawMax = Math.max(1, ...values);
    const padding = Math.max(0.08, (rawMax - rawMin) * 0.1);
    const minY = rawMin - padding;
    const maxY = rawMax + padding;
    const x = (value: number) => plot.left + value * (plot.right - plot.left);
    const y = (value: number) => plot.bottom - ((value - minY) / (maxY - minY)) * (plot.bottom - plot.top);
    const point = (px: number, py: number) => `${formatNumber(x(px))},${formatNumber(y(py))}`;
    const curve = parsed.kind === 'cubic-bezier'
      ? cubicCurve(parsed, point)
      : linearCurve(parsed, point);
    const zeroY = formatNumber(y(0));
    const oneY = formatNumber(y(1));
    const start = point(0, 0).split(',');
    const end = point(1, 1).split(',');

    return `<svg class="motion-curve-svg" viewBox="0 0 240 160" role="img" aria-label="Easing curve"><g class="motion-curve-grid" aria-hidden="true"><path d="M24 ${zeroY}H228 M24 ${oneY}H228 M24 14V138"/></g>${curve}<g class="motion-curve-endpoints" aria-hidden="true"><circle cx="${start[0]}" cy="${start[1]}" r="3"/><circle cx="${end[0]}" cy="${end[1]}" r="3"/></g></svg>`;
  }

  const demoMarkup: Record<string, string> = {
    'motion-linear': '<div class="motion-demo-track"><i class="motion-demo-linear-dot"></i></div>',
    'motion-ease-in-out': '<div class="motion-demo-track"><i class="motion-demo-ease-in-out-dot"></i></div>',
    'motion-spring': '<span class="motion-demo-spring-button">Save</span>',
    'motion-bounce': '<i class="motion-demo-bounce-orb"></i>',
    'motion-elastic': '<i class="motion-demo-elastic-orb"></i>',
    'motion-back': '<div class="motion-demo-track"><i class="motion-demo-back-card"></i></div>',
    'motion-fade': '<div class="motion-demo-fade-card"><b>New state</b><i></i><i></i></div>',
    'motion-slide': '<div class="motion-demo-slide-sheet"><i></i><i></i><i></i></div>',
    'motion-scale': '<div class="motion-demo-scale-dialog"><b></b><i></i><i></i></div>',
    'motion-blur-reveal': '<div class="motion-demo-blur-reveal-copy"><b></b><i></i><i></i></div>',
    'motion-skeleton-shimmer': '<div class="motion-demo-skeleton-block"><i></i><i></i><i></i></div>',
    'motion-spinner': '<i class="motion-demo-spinner-ring"></i><span class="motion-demo-spinner-label">Loading</span>',
    'motion-progress': '<div class="motion-demo-progress-track"><i></i></div><b class="motion-demo-progress-value">진행</b>',
    'motion-pulse': '<div class="motion-demo-pulse-status"><i></i><span>Syncing</span></div>',
    'motion-scroll-timeline': '<div class="motion-demo-scroll-timeline-rail"><i></i></div><div class="motion-demo-scroll-timeline-page"><b></b><i></i><i></i></div>',
    'motion-scroll-reveal': '<div class="motion-demo-scroll-reveal-viewport"><i></i><div><b></b><span></span></div></div>',
    'motion-sticky-transition': '<div class="motion-demo-sticky-transition-stack"><div></div><i></i><i></i></div>',
    'motion-expand-collapse': '<div class="motion-demo-expand-collapse-panel"><b>Details</b><div><i></i><i></i></div></div>',
    'motion-tab-transition': '<div class="motion-demo-tab-transition-tabs"><b></b><i></i></div><div class="motion-demo-tab-transition-panel"><b></b><i></i></div>',
    'motion-list-reorder': '<div class="motion-demo-list-reorder-list"><i data-order="1"></i><i data-order="2"></i><i data-order="3"></i></div>'
  };

  export function render(type: string): string {
    const markup = demoMarkup[type];
    if (!markup) return '';
    return `<div class="motion-demo motion-demo-${type.slice('motion-'.length)}" data-motion-id="${type}" data-playback="idle"><div class="motion-demo-stage" aria-hidden="true">${markup}</div></div>`;
  }

  export type DemoType = typeof demoTypes[number];

  export function isDemoType(value: string): value is DemoType {
    return (demoTypes as readonly string[]).includes(value);
  }

  function cubicCurve(
    easing: CubicBezierEasing,
    point: (x: number, y: number) => string
  ): string {
    const [x1, y1, x2, y2] = easing.points;
    return `<path class="motion-curve-control" d="M${point(0, 0)}L${point(x1, y1)} M${point(x2, y2)}L${point(1, 1)}"/><path class="motion-curve-line" d="M${point(0, 0)}C${point(x1, y1)} ${point(x2, y2)} ${point(1, 1)}"/>`;
  }

  function linearCurve(
    easing: LinearEasing,
    point: (x: number, y: number) => string
  ): string {
    const points = easing.stops.map((stop) => point(stop.position / 100, stop.value)).join(' ');
    return `<polyline class="motion-curve-line" points="${points}"/>`;
  }

  function formatNumber(value: number): string {
    return String(Math.round(value * 100) / 100);
  }
}
