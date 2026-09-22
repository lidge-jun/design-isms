/** Deterministic discovery and version-bound cursors, identical in Node and browser. */
namespace DesignCatalog {
  const QUERY_LIMIT = 512;
  const CURSOR_LIMIT = 20000;
  interface SearchContext { query: string; domains: Domain[]; limit: number; cursor?: string; }

  function normalize(value: string): string {
    return value.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
  }
  function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

  function parseSearch(args: SearchArgs): SearchContext {
    const raw = Boundary.record(args, 'Search arguments', 'INVALID_ARGUMENT');
    Boundary.keys(raw, ['query', 'domains', 'limit', 'cursor'], 'INVALID_ARGUMENT');
    const query = raw.query === undefined ? '' : raw.query;
    if (typeof query !== 'string' || query.length > QUERY_LIMIT) {
      return Boundary.fail('INVALID_ARGUMENT', `query must be a string of at most ${QUERY_LIMIT} characters`);
    }
    const normalized = normalize(query);
    if (normalized.length > QUERY_LIMIT) Boundary.fail('INVALID_ARGUMENT', 'Normalized query is too long');
    const limit = raw.limit === undefined ? 6 : raw.limit;
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 30) {
      return Boundary.fail('INVALID_ARGUMENT', 'limit must be an integer from 1 to 30');
    }
    let domains = [...DOMAINS];
    if (raw.domains !== undefined) {
      if (!Array.isArray(raw.domains) || !raw.domains.length || raw.domains.length > DOMAINS.length) {
        return Boundary.fail('INVALID_ARGUMENT', 'domains must contain between 1 and 6 domains');
      }
      if (Reflect.ownKeys(raw.domains).length !== raw.domains.length + 1) {
        return Boundary.fail('INVALID_ARGUMENT', 'domains must be a dense JSON array');
      }
      const values: Domain[] = [];
      for (let index = 0; index < raw.domains.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(raw.domains, String(index));
        if (!descriptor?.enumerable || !('value' in descriptor)) {
          return Boundary.fail('INVALID_ARGUMENT', 'domains must contain data values');
        }
        values.push(Boundary.domain(descriptor.value, 'INVALID_ARGUMENT'));
      }
      domains = [...new Set(values)];
    }
    domains.sort(compare);
    if (raw.cursor !== undefined && (typeof raw.cursor !== 'string' || !raw.cursor.length || raw.cursor.length > CURSOR_LIMIT)) {
      return Boundary.fail('INVALID_CURSOR', 'cursor must be a nonempty bounded string');
    }
    return { query: normalized, domains, limit, ...(raw.cursor === undefined ? {} : { cursor: raw.cursor as string }) };
  }

  // Canonical JSON stays compact and escapes lone surrogates without platform globals.
  // This continuation token provides no authentication or tamper-proof signature.
  function cursorFor(snapshot: Snapshot, context: SearchContext, offset: number): string {
    return 'dc1.' + JSON.stringify([snapshot.contractVersion, snapshot.version, context.query, context.domains, offset]);
  }

  function cursorOffset(snapshot: Snapshot, context: SearchContext, total: number): number {
    if (!context.cursor) return 0;
    const token = context.cursor;
    if (!token.startsWith('dc1.')) {
      return Boundary.fail('INVALID_CURSOR', 'Malformed cursor');
    }
    let tuple: unknown;
    try { tuple = JSON.parse(token.slice(4)); } catch { return Boundary.fail('INVALID_CURSOR', 'Malformed cursor payload'); }
    if (!Array.isArray(tuple) || tuple.length !== 5 || typeof tuple[0] !== 'string' || typeof tuple[1] !== 'string'
      || typeof tuple[2] !== 'string' || !Array.isArray(tuple[3]) || !tuple[3].every(value => typeof value === 'string')
      || typeof tuple[4] !== 'number' || !Number.isSafeInteger(tuple[4]) || tuple[4] < 1) {
      return Boundary.fail('INVALID_CURSOR', 'Invalid cursor fields');
    }
    if (tuple[0] !== snapshot.contractVersion || tuple[1] !== snapshot.version) {
      return Boundary.fail('STALE_CURSOR', 'Cursor belongs to another snapshot version');
    }
    if (token !== cursorFor(snapshot, context, tuple[4]) || tuple[4] >= total) {
      return Boundary.fail('INVALID_CURSOR', 'Cursor does not match this search or result range');
    }
    return tuple[4];
  }

  function texts(entry: Entry, keys: readonly string[]): string[] {
    const values: string[] = [];
    for (const key of keys) {
      const value = entry[key];
      if (typeof value === 'string') values.push(normalize(value));
      else if (Array.isArray(value)) {
        for (const item of value) if (typeof item === 'string') values.push(normalize(item));
      }
    }
    return values;
  }

  function score(entry: Entry, query: string): number {
    if (!query) return 0;
    const names = texts(entry, ['id', 'name', 'nameKr', 'alsoCalled', 'aliases']);
    if (names.includes(query)) return 10000;
    const keywords = texts(entry, ['keywords', 'family', 'category']);
    const prose = texts(entry, ['tagline', 'summary', 'summaryEn', 'description', 'descriptionEn', 'taglineEn', 'bestFor', 'useCases']);
    let total = 0;
    for (const token of new Set(query.split(' '))) {
      if (names.some(value => value.includes(token))) total += 16;
      else if (keywords.some(value => value.includes(token))) total += 8;
      else if (prose.some(value => value.includes(token))) total += 1;
      else return -1;
    }
    return total;
  }

  export function search(snapshot: Snapshot, args: SearchArgs = {}): SearchPage {
    const context = parseSearch(args);
    const ranked: Array<{ domain: Domain; entry: Entry; score: number; key: string }> = [];
    for (const domain of context.domains) {
      for (const entry of snapshot.catalogs[domain]) {
        if (entry.kind === 'anti-pattern') continue;
        const weight = score(entry, context.query);
        if (weight >= 0) ranked.push({ domain, entry, score: weight, key: `${domain}/${String(entry.id)}` });
      }
    }
    ranked.sort((a, b) => b.score - a.score || compare(a.key, b.key));
    const offset = cursorOffset(snapshot, context, ranked.length);
    const items = Object.freeze(ranked.slice(offset, offset + context.limit).map(row => summarize(row.domain, row.entry)));
    const end = offset + items.length;
    return Object.freeze({
      version: snapshot.version, total: ranked.length, items,
      nextCursor: end < ranked.length ? cursorFor(snapshot, context, end) : null,
      complete: end === ranked.length
    });
  }
}
