/** JSON boundary and immutable catalog lookup. No adapters, DOM, or IO. */
namespace DesignCatalog {
  const indexes = new WeakMap<Snapshot, Readonly<Record<Domain, ReadonlyMap<string, Entry>>>>();
  const SNAPSHOT_FIELDS = ['contractVersion', 'version', 'catalogs', 'recipes', 'guides', 'effectDocs', 'effectSnippets'];

  // Clone descriptors rather than stringify: reject lossy values and never invoke toJSON/getters.
  function cloneJson(value: unknown, ancestors = new Set<object>(), depth = 0): unknown {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'object' || depth > 64 || ancestors.has(value)) {
      return Boundary.fail('INVALID_SNAPSHOT', 'Snapshot must be finite, acyclic JSON with depth at most 64');
    }
    if (!Array.isArray(value)) Boundary.record(value, 'Snapshot record', 'INVALID_SNAPSHOT');
    ancestors.add(value);
    const result: Record<string, unknown> | unknown[] = Array.isArray(value) ? [] : Object.create(null) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (Array.isArray(value) && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || !descriptor || !descriptor.enumerable || !('value' in descriptor)) {
        return Boundary.fail('INVALID_SNAPSHOT', 'Snapshot supports enumerable JSON data properties only');
      }
      if (Array.isArray(value) && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) {
        return Boundary.fail('INVALID_SNAPSHOT', 'Snapshot arrays cannot have named properties');
      }
      Object.defineProperty(result, key, {
        value: cloneJson(descriptor.value, ancestors, depth + 1), enumerable: true
      });
    }
    if (Array.isArray(value) && Object.keys(value).length !== value.length) {
      return Boundary.fail('INVALID_SNAPSHOT', 'Snapshot arrays cannot contain holes');
    }
    ancestors.delete(value);
    return Object.freeze(result);
  }

  function validateEntry(domain: Domain, value: unknown): Entry {
    const entry = Boundary.record(value, domain, 'INVALID_SNAPSHOT');
    Boundary.id(entry.id, 'INVALID_SNAPSHOT');
    Boundary.text(entry.name, 'name', 'INVALID_SNAPSHOT', 500);
    Boundary.text(entry.nameKr, 'nameKr', 'INVALID_SNAPSHOT', 500);
    Boundary.text(domain === 'isms' ? entry.tagline : entry.summary, 'summary', 'INVALID_SNAPSHOT');
    if (domain === 'isms') Boundary.text(entry.description, 'description', 'INVALID_SNAPSHOT');
    if (entry.kind !== undefined && entry.kind !== 'style' && entry.kind !== 'anti-pattern') {
      Boundary.fail('INVALID_SNAPSHOT', 'Unknown catalog kind');
    }
    if (entry.kind === 'anti-pattern' && (domain !== 'isms' || entry.id !== 'ai-slop')) {
      Boundary.fail('INVALID_SNAPSHOT', 'Only isms/ai-slop may be an anti-pattern');
    }
    if (domain === 'isms' && entry.id === 'ai-slop' && entry.kind !== 'anti-pattern') {
      Boundary.fail('INVALID_SNAPSHOT', 'isms/ai-slop must be an anti-pattern');
    }
    for (const field of ['keywords', 'alsoCalled', 'aliases', 'bestFor', 'useCases']) {
      if (entry[field] !== undefined) Boundary.strings(entry[field], field, 'INVALID_SNAPSHOT');
    }
    for (const field of ['descriptionEn', 'summaryEn', 'taglineEn', 'family', 'category']) {
      if (entry[field] !== undefined) Boundary.text(entry[field], field, 'INVALID_SNAPSHOT');
    }
    return entry;
  }

  function validateGuides(entry: Entry): void {
    for (const key of ['layout', 'typography', 'color', 'motion']) {
      const fields = Boundary.record(entry[key], key, 'INVALID_SNAPSHOT');
      for (const value of Object.values(fields)) Boundary.text(value, key, 'INVALID_SNAPSHOT');
    }
    for (const key of ['dos', 'donts']) Boundary.strings(entry[key], key, 'INVALID_SNAPSHOT');
    if (entry.implementation !== undefined) {
      const implementation = Boundary.record(entry.implementation, 'implementation', 'INVALID_SNAPSHOT');
      Boundary.text(implementation.summary, 'implementation.summary', 'INVALID_SNAPSHOT');
      for (const key of ['components', 'build', 'checks']) {
        Boundary.strings(implementation[key], key, 'INVALID_SNAPSHOT');
      }
    }
  }

  function validateDocs(entry: Entry): void {
    for (const key of ['background', 'history']) Boundary.text(entry[key], key, 'INVALID_SNAPSHOT');
    for (const key of ['useWhen', 'anatomy', 'misuse', 'implementationNotes']) {
      Boundary.strings(entry[key], key, 'INVALID_SNAPSHOT');
    }
    for (const [key, fields] of [['examples', ['context', 'description']], ['researchRefs', ['label', 'url']]] as const) {
      const rows = entry[key];
      if (!Array.isArray(rows)) Boundary.fail('INVALID_SNAPSHOT', `${key} must be an array`);
      for (const row of rows) {
        const record = Boundary.record(row, key, 'INVALID_SNAPSHOT');
        for (const field of fields) Boundary.text(record[field], field, 'INVALID_SNAPSHOT');
      }
    }
  }

  function validateSnippet(entry: Entry): void {
    for (const key of ['html', 'css']) Boundary.text(entry[key], key, 'INVALID_SNAPSHOT');
    // Expansion snippets have HTML/CSS only; preserve absence rather than fabricate metadata.
    if (entry.reducedMotion !== undefined) Boundary.text(entry.reducedMotion, 'reducedMotion', 'INVALID_SNAPSHOT');
    if (entry.js !== undefined && typeof entry.js !== 'string') Boundary.fail('INVALID_SNAPSHOT', 'js must be a string');
    for (const key of ['supports', 'a11yNotes', 'sourceRefs']) {
      if (entry[key] !== undefined) Boundary.strings(entry[key], key, 'INVALID_SNAPSHOT');
    }
  }

  function validateAuxiliary(raw: unknown, ids: ReadonlyMap<string, Entry>, validate: (entry: Entry) => void): void {
    const entries = Boundary.record(raw, 'Auxiliary records', 'INVALID_SNAPSHOT');
    for (const [id, entry] of Object.entries(entries)) {
      Boundary.id(id, 'INVALID_SNAPSHOT');
      if (!ids.has(id)) Boundary.fail('INVALID_SNAPSHOT', 'Auxiliary record has no catalog entry');
      validate(Boundary.record(entry, id, 'INVALID_SNAPSHOT'));
    }
  }

  export function create(source: SourceSnapshot): Snapshot {
    const raw = Boundary.record(cloneJson(source), 'SourceSnapshot', 'INVALID_SNAPSHOT');
    Boundary.keys(raw, SNAPSHOT_FIELDS, 'INVALID_SNAPSHOT');
    Boundary.text(raw.contractVersion, 'contractVersion', 'INVALID_SNAPSHOT', 80);
    Boundary.text(raw.version, 'version', 'INVALID_SNAPSHOT', 256);
    const catalogs = Boundary.record(raw.catalogs, 'catalogs', 'INVALID_SNAPSHOT');
    Boundary.keys(catalogs, DOMAINS, 'INVALID_SNAPSHOT');
    const index = {} as Record<Domain, ReadonlyMap<string, Entry>>;
    for (const domain of DOMAINS) {
      const entries = catalogs[domain];
      if (!Array.isArray(entries)) Boundary.fail('INVALID_SNAPSHOT', `${domain} must be an array`);
      const byId = new Map<string, Entry>();
      for (const value of entries) {
        const entry = validateEntry(domain, value);
        const id = Boundary.id(entry.id, 'INVALID_SNAPSHOT');
        if (byId.has(id)) Boundary.fail('DUPLICATE_REF', `Duplicate ${domain}/${id}`);
        byId.set(id, entry);
      }
      index[domain] = byId;
    }
    validateAuxiliary(raw.guides, index.isms, validateGuides);
    validateAuxiliary(raw.effectDocs, index.effects, validateDocs);
    const snippets = Boundary.record(raw.effectSnippets, 'effectSnippets', 'INVALID_SNAPSHOT');
    Boundary.text(snippets.version, 'effectSnippets.version', 'INVALID_SNAPSHOT');
    validateAuxiliary(snippets.snippets, index.effects, validateSnippet);
    const recipes = Boundary.record(raw.recipes, 'recipes', 'INVALID_SNAPSHOT');
    if (recipes.version !== 1 || !Array.isArray(recipes.recipes)) {
      Boundary.fail('INVALID_SNAPSHOT', 'Recipes require version 1 and a recipes array');
    }
    // Recipe slot and cross-reference validation belongs to DesignRecipes.parse.
    // All public data was cloned and recursively frozen before this boundary cast.
    const snapshot = raw as unknown as Snapshot;
    indexes.set(snapshot, index);
    return snapshot;
  }

  export function resolve(snapshot: Snapshot, ref: Ref): Entry {
    const args = Boundary.record(ref, 'ref', 'INVALID_ARGUMENT');
    Boundary.keys(args, ['domain', 'id'], 'INVALID_ARGUMENT');
    const domain = Boundary.domain(args.domain, 'INVALID_ARGUMENT');
    const id = Boundary.id(args.id, 'INVALID_ARGUMENT');
    const index = indexes.get(snapshot);
    if (!index) return Boundary.fail('INVALID_SNAPSHOT', 'Use create() to construct the snapshot');
    const entry = index[domain].get(id);
    return entry ?? Boundary.fail('UNKNOWN_REFERENCE', `Unknown ${domain}/${id}`);
  }

  export function summarize(domain: Domain, entry: Entry): Summary {
    // Entries originate at create()/resolve(); summary owns only projection.
    const summary: Summary = {
      ref: Object.freeze({ domain, id: entry.id as string }),
      name: entry.name as string,
      nameKr: entry.nameKr as string,
      summary: (domain === 'isms' ? entry.tagline || entry.description : entry.summary) as string,
      ...(entry.kind === 'style' || entry.kind === 'anti-pattern' ? { kind: entry.kind } : {})
    };
    return Object.freeze(summary);
  }
}
