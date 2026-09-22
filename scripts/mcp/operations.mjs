// Shared, IO-free operation contracts. The factory also runs as source in a fresh realm.
const objectSchema = (properties, required = []) => ({
  type: 'object', properties, required, additionalProperties: false
});
const idSchema = { type: 'string', minLength: 1, maxLength: 128, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' };
const domainSchema = { type: 'string', enum: ['isms', 'effects', 'color', 'typography', 'layout', 'motion'] };
const refSchema = objectSchema({ domain: domainSchema, id: idSchema }, ['domain', 'id']);
const specs = [
  {
    name: 'design.search', summary: 'Find compact catalog entries; follow nextCursor with the same query and domains.',
    inputSchema: objectSchema({ query: { type: 'string', maxLength: 512 },
      domains: { type: 'array', items: domainSchema, minItems: 1, maxItems: 6 },
      limit: { type: 'integer', minimum: 1, maximum: 30, default: 6 },
      cursor: { type: 'string', minLength: 1, maxLength: 20000 } }),
    example: { code: 'return design.search({query:"bottom-sheet",limit:3});' }, requiresData: true
  },
  {
    name: 'design.get', summary: 'Read one entry as summary, guide, full data, or complete code. Code is never clipped.',
    inputSchema: objectSchema({ domain: domainSchema, id: idSchema,
      view: { type: 'string', enum: ['summary', 'guide', 'code', 'full'], default: 'summary' } }, ['domain', 'id']),
    example: { code: 'return design.get({domain:"effects",id:"bottom-sheet",view:"code"});', maxBytes: 65536 }, requiresData: true
  },
  {
    name: 'design.recipes', summary: 'List authored screen recipes, or read one recipe and its allowed alternatives by id.',
    inputSchema: objectSchema({ id: idSchema }),
    example: { code: 'return design.recipes();' }, requiresData: true
  },
  {
    name: 'design.compose', summary: 'Compose a canonical design value, with selected slots, constraints, language, and sources.',
    inputSchema: objectSchema({ recipeId: idSchema, lang: { type: 'string', enum: ['ko', 'en'], default: 'ko' },
      selections: { type: 'object', additionalProperties: refSchema } }, ['recipeId']),
    example: { code: 'return design.compose({recipeId:"settings-workspace",lang:"en"});', maxBytes: 65536 }, requiresData: true
  },
  {
    name: 'design.brief', summary: 'Validate a complete current composition and format its language as Markdown text. Pipe compose into brief.',
    inputSchema: objectSchema({ composition: { type: 'object', description: 'The entire unchanged value returned by design.compose; object key order may differ.' } }, ['composition']),
    example: { code: 'return design.brief({composition:design.compose({recipeId:"settings-workspace",lang:"en"})});', maxBytes: 65536 }, requiresData: true
  },
  {
    name: 'actions.find', summary: 'Discover operation names and summaries without reading catalog data.',
    inputSchema: { type: 'string', maxLength: 512, default: '' },
    example: { code: 'return actions.find("compose");' }, requiresData: false
  },
  {
    name: 'actions.describe', summary: 'Read the input schema and example of one operation without reading catalog data.',
    inputSchema: { type: 'string', minLength: 1, maxLength: 128 },
    example: { code: 'return actions.describe("design.search");' }, requiresData: false
  }
];
function freezeMetadata(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeMetadata(child);
    Object.freeze(value);
  }
  return value;
}
export const OPERATION_SPECS = freezeMetadata(specs);

/** Closure-free: no module binding may be referenced from this function body. */
export function createOperationRegistry(getData, specs, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)
    || Reflect.ownKeys(options).some(key => key !== 'maxOperations')) {
    throw Object.assign(new Error('Invalid operation registry configuration'), { code: 'INVALID_ARGUMENT' });
  }
  const limitDescriptor = Object.getOwnPropertyDescriptor(options, 'maxOperations');
  const maxOperations = limitDescriptor ? limitDescriptor.value : 100;
  if (typeof getData !== 'function' || !Number.isSafeInteger(maxOperations) || maxOperations < 1) {
    throw Object.assign(new Error('Invalid operation registry configuration'), { code: 'INVALID_ARGUMENT' });
  }
  let used = 0;
  const continuations = new WeakMap();
  const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  function fail(code, message) { throw Object.assign(new Error(message), { code }); }
  function consume() {
    if (++used > maxOperations) fail('OPERATION_LIMIT', 'Operation limit exceeded');
  }
  function freeze(value) {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  }
  // Descriptor-based copying refuses accessors, toJSON, sparse arrays, and foreign behavior.
  // Proxy traps can execute in the guest; the outer Worker deadline supervises those traps.
  function jsonCopy(root, code = 'INVALID_ARGUMENT') {
    let nodes = 0;
    const active = new Set();
    function copy(value, depth) {
      if (++nodes > 100000 || depth > 64) fail(code, 'JSON value is too complex');
      if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value !== 'object') fail(code, 'Expected JSON data');
      if (active.has(value)) fail(code, 'Cyclic values are not JSON');
      active.add(value);
      const isArray = Array.isArray(value);
      const proto = Object.getPrototypeOf(value);
      if (isArray) {
        const ctor = proto && Object.getOwnPropertyDescriptor(proto, 'constructor')?.value;
        if (typeof ctor !== 'function' || Object.getOwnPropertyDescriptor(ctor, 'name')?.value !== 'Array'
          || Object.getOwnPropertyDescriptor(ctor, 'prototype')?.value !== proto) fail(code, 'Expected plain JSON arrays');
      }
      if (!isArray && proto !== null) {
        const ctor = Object.getOwnPropertyDescriptor(proto, 'constructor')?.value;
        if (Object.getPrototypeOf(proto) !== null || typeof ctor !== 'function'
          || Object.getOwnPropertyDescriptor(ctor, 'name')?.value !== 'Object'
          || Object.getOwnPropertyDescriptor(ctor, 'prototype')?.value !== proto) fail(code, 'Expected plain JSON objects');
      }
      const result = isArray ? [] : Object.create(null);
      const keys = Reflect.ownKeys(value);
      if (isArray && keys.length !== value.length + 1) fail(code, 'Expected dense JSON arrays');
      for (const key of keys) {
        if (isArray && key === 'length') continue;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (typeof key !== 'string' || !descriptor?.enumerable || !has(descriptor, 'value')
          || key === '__proto__' || key === 'constructor' || key === 'prototype' || key === 'toJSON') {
          fail(code, 'Expected enumerable JSON data fields');
        }
        if (isArray && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) fail(code, 'Invalid array key');
        result[key] = copy(descriptor.value, depth + 1);
      }
      if (isArray && result.length !== value.length) fail(code, 'Expected dense JSON arrays');
      active.delete(value);
      return result;
    }
    return copy(root, 0);
  }
  function record(value, allowed, code = 'INVALID_ARGUMENT') {
    const result = jsonCopy(value, code);
    if (result === null || typeof result !== 'object' || Array.isArray(result)) fail(code, 'Expected an argument object');
    for (const key of Object.keys(result)) if (!allowed.includes(key)) fail(code, 'Unknown argument field');
    return result;
  }
  const metadata = freeze(jsonCopy(specs));
  function text(value, max, empty = false) {
    if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) {
      fail('INVALID_ARGUMENT', 'Expected bounded text');
    }
    return value;
  }
  function doFind(query = '') {
    const words = text(query, 512, true).normalize('NFKC').toLowerCase().trim().split(/\s+/u).filter(Boolean);
    return freeze(metadata.filter(spec => words.every(word => `${spec.name} ${spec.summary}`.toLowerCase().includes(word)))
      .map(({ name, summary, requiresData }) => ({ name, summary, requiresData })));
  }
  function doDescribe(name) {
    text(name, 128);
    const spec = metadata.find(item => item.name === name);
    if (!spec) fail('UNKNOWN_OPERATION', 'Unknown operation: ' + name);
    return spec;
  }
  function same(a, b) {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object'
      || Array.isArray(a) !== Array.isArray(b)) return false;
    const left = Object.keys(a).sort();
    const right = Object.keys(b).sort();
    return left.length === right.length && left.every((key, index) => key === right[index] && same(a[key], b[key]));
  }
  function brief(data, args) {
    const input = record(args, ['composition']);
    const value = input.composition;
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_COMPOSITION', 'Expected a full composition');
    if (typeof value.version !== 'string') fail('INVALID_COMPOSITION', 'Composition version is required');
    if (value.version !== data.snapshot.version) fail('STALE_COMPOSITION', 'Composition belongs to another snapshot');
    let canonical;
    try {
      if (!Array.isArray(value.slots) || (value.lang !== 'ko' && value.lang !== 'en')) throw new Error();
      const recipe = data.recipes.detail(data.recipeList, value.recipeId);
      if (value.slots.length !== recipe.slots.length) throw new Error();
      const selections = Object.create(null);
      for (const slot of value.slots) {
        if (!slot || typeof slot.id !== 'string' || has(selections, slot.id)
          || !recipe.slots.some(expected => expected.id === slot.id)) throw new Error();
        selections[slot.id] = slot.ref;
      }
      canonical = data.recipes.compose(data.snapshot, data.recipeList, { recipeId: value.recipeId, selections, lang: value.lang });
      if (!same(value, canonical)) throw new Error();
    } catch { fail('INVALID_COMPOSITION', 'Composition must equal a complete current canonical composition'); }
    return freeze({ version: canonical.version, recipeId: canonical.recipeId, lang: canonical.lang,
      text: data.recipes.formatBrief(canonical) });
  }
  function invoke(op, args) {
    consume();
    doDescribe(op);
    if (op === 'actions.find') return doFind(args);
    if (op === 'actions.describe') return doDescribe(args);
    const data = getData();
    switch (op) {
      case 'design.search': {
        const input = freeze(jsonCopy(args === undefined ? {} : args));
        const result = data.catalog.search(data.snapshot, input);
        continuations.set(result, freeze({ version: data.snapshot.version, args: input }));
        return result;
      }
      case 'design.get': return data.catalog.get(data.snapshot, jsonCopy(args));
      case 'design.recipes': {
        const input = record(args === undefined ? {} : args, ['id']);
        return freeze(has(input, 'id')
          ? { version: data.snapshot.version, recipe: data.recipes.detail(data.recipeList, text(input.id, 128)) }
          : { version: data.snapshot.version, items: data.recipes.list(data.recipeList) });
      }
      case 'design.compose': return data.recipes.compose(data.snapshot, data.recipeList, jsonCopy(args));
      case 'design.brief': return brief(data, args);
      default: return fail('UNKNOWN_OPERATION', 'Unknown operation: ' + op);
    }
  }
  return Object.freeze({ invoke,
    find(query) { consume(); return doFind(query); },
    describe(name) { consume(); return doDescribe(name); },
    getSearchContext(value) { return continuations.get(value); }
  });
}
