// Fresh guest realm per request. No host callbacks, data objects, or Node globals are injected.
import { parentPort, workerData } from 'node:worker_threads';
import { randomBytes } from 'node:crypto';
import { isNativeError } from 'node:util/types';
import vm from 'node:vm';

const TRANSFER_BYTES = 256 * 1024;
const startedAt = Date.now();
const failure = (code, message) => JSON.stringify({ ok: false, error: { code, message }, logs: [] });
let posted = false;
function post(serialized) {
  if (posted) return;
  posted = true;
  const safe = typeof serialized === 'string' && Buffer.byteLength(serialized, 'utf8') <= TRANSFER_BYTES
    ? serialized : failure('RESPONSE_TOO_LARGE', 'Runtime result exceeds the transfer limit');
  parentPort.postMessage(safe);
  parentPort.close();
}

// This function is compiled from source inside the guest. Its return object stays there.
function guestRuntime(getData, factory, specs, maxBytes) {
  'use strict';
  const registry = factory(getData, specs);
  let completed = null;
  let invoked = false;
  const logs = [];
  let logBytes = 0;
  let logsTruncated = false;
  const transferLimit = 256 * 1024;
  const logLimit = Math.min(8192, maxBytes);
  const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  function fail(code, message) { throw Object.assign(new Error(message), { code }); }
  function bytes(text) {
    let count = 0;
    for (const character of text) {
      const point = character.codePointAt(0);
      count += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    }
    return count;
  }
  function copyJson(root) {
    let nodes = 0;
    const active = new Set();
    function copy(value, depth) {
      if (++nodes > 100000 || depth > 64) fail('RESULT_NOT_JSON', 'Result is too complex');
      if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value !== 'object') fail('RESULT_NOT_JSON', 'Return only finite JSON values');
      if (active.has(value)) fail('RESULT_NOT_JSON', 'Cyclic results are not JSON');
      active.add(value);
      const array = Array.isArray(value);
      const prototype = Object.getPrototypeOf(value);
      if (array && prototype !== Array.prototype) fail('RESULT_NOT_JSON', 'Return plain JSON arrays');
      if (!array && prototype !== null && prototype !== Object.prototype) {
        fail('RESULT_NOT_JSON', 'Return plain JSON objects');
      }
      const keys = Reflect.ownKeys(value);
      if (array && keys.length !== value.length + 1) fail('RESULT_NOT_JSON', 'Return dense JSON arrays');
      const result = array ? [] : Object.create(null);
      for (const key of keys) {
        if (array && key === 'length') continue;
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (typeof key !== 'string' || !descriptor?.enumerable || !has(descriptor, 'value') || key === 'toJSON') {
          fail('RESULT_NOT_JSON', 'Result contains non-JSON fields or accessors');
        }
        if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) {
          fail('RESULT_NOT_JSON', 'Result contains non-JSON array fields');
        }
        Object.defineProperty(result, key, { value: copy(descriptor.value, depth + 1), enumerable: true });
      }
      if (array && result.length !== value.length) fail('RESULT_NOT_JSON', 'Return dense JSON arrays');
      active.delete(value);
      return result;
    }
    return copy(root, 0);
  }
  function serialize(value) {
    const serialized = JSON.stringify(copyJson(value));
    if (bytes(serialized) > transferLimit) fail('RESPONSE_TOO_LARGE', 'Runtime result exceeds the transfer limit');
    return serialized;
  }
  function log(...args) {
    if (logsTruncated) return;
    const line = args.map(value => typeof value === 'string' ? value
      : value === undefined ? 'undefined' : serialize(value)).join(' ');
    const size = bytes(JSON.stringify(line));
    if (logs.length >= 64 || logBytes + size > logLimit) { logsTruncated = true; return; }
    logs.push(line);
    logBytes += size;
  }
  function errorResult(error) {
    let code = 'EXECUTION_ERROR';
    let message = 'Code execution failed';
    if (error !== null && (typeof error === 'object' || typeof error === 'function')) {
      const ownCode = Object.getOwnPropertyDescriptor(error, 'code');
      const ownMessage = Object.getOwnPropertyDescriptor(error, 'message');
      if (ownCode && has(ownCode, 'value') && typeof ownCode.value === 'string'
        && /^[A-Z][A-Z0-9_]{0,63}$/.test(ownCode.value)) code = ownCode.value;
      if (ownMessage && has(ownMessage, 'value') && typeof ownMessage.value === 'string') {
        message = ownMessage.value.slice(0, 512);
      }
    }
    return JSON.stringify({ ok: false, error: { code, message }, logs: [] });
  }
  function success(value) {
    try {
      const searchContext = registry.getSearchContext(value);
      completed = serialize({ ok: true, result: copyJson(value), logs,
        ...(logsTruncated ? { logsTruncated: true } : {}), ...(searchContext ? { searchContext } : {}) });
    } catch (error) { completed = errorResult(error); }
  }
  const design = Object.freeze(Object.fromEntries(['search', 'get', 'recipes', 'compose', 'brief']
    .map(name => [name, Object.freeze(args => registry.invoke('design.' + name, args))])));
  const actions = Object.freeze({ find: Object.freeze(query => registry.find(query)),
    describe: Object.freeze(name => registry.describe(name)) });
  Object.defineProperties(globalThis, {
    design: { value: design }, actions: { value: actions },
    console: { value: Object.freeze({ log, info: log, warn: log, error: log, debug: log }) }
  });

  // Prevent guest edits to shared intrinsics from forging WeakMap brands or changing core behavior.
  // The realm is discarded after this call, so this does not change the host's intrinsics.
  const seen = new Set();
  function harden(value) {
    if (value === null || (typeof value !== 'object' && typeof value !== 'function') || seen.has(value)) return;
    seen.add(value);
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
      if (has(descriptor, 'value')) harden(descriptor.value);
      else { harden(descriptor.get); harden(descriptor.set); }
    }
    harden(Object.getPrototypeOf(value));
    Object.freeze(value);
  }
  for (const name of ['SharedArrayBuffer', 'Atomics', 'WebAssembly']) {
    Object.defineProperty(globalThis, name, { value: undefined, writable: false, configurable: false });
  }
  for (const name of Object.getOwnPropertyNames(globalThis)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    if (!has(descriptor, 'value') || descriptor.value === globalThis) continue;
    harden(descriptor.value);
    Object.defineProperty(globalThis, name, { ...descriptor, writable: false, configurable: false });
  }
  return Object.freeze({
    start(task) {
      if (invoked) fail('EXECUTION_ERROR', 'Execution already started');
      invoked = true;
      // The promise never crosses realms; even never-settling async work stays under host supervision.
      void Promise.resolve().then(task).then(success, error => { completed = errorResult(error); });
    },
    read() { return completed; }
  });
}

async function run() {
  const payload = JSON.parse(workerData);
  const context = vm.createContext(Object.create(null), {
    codeGeneration: { strings: false, wasm: false }, microtaskMode: 'afterEvaluate'
  });
  // A private lexical name avoids guest identifier collisions; it is not a sandbox credential.
  const channel = 'runtime_' + randomBytes(16).toString('hex');
  const bootstrap = `const ${channel} = (() => {
    'use strict';
    ${payload.coreSources.map(file => file.source).join('\n')}
    const factory = (${payload.factorySource});
    let data;
    function getData() {
      if (!data) {
        const input = JSON.parse(${JSON.stringify(payload.sourceJson)});
        const snapshot = DesignCatalog.create(input);
        const recipeList = DesignRecipes.parse(input.recipes, snapshot);
        data = Object.freeze({catalog:DesignCatalog, recipes:DesignRecipes, snapshot, recipeList});
      }
      return data;
    }
    return (${guestRuntime.toString()})(getData, factory, JSON.parse(${JSON.stringify(payload.metadataJson)}), ${payload.maxBytes});
  })(); void 0;`;
  const remaining = () => Math.max(1, payload.timeoutMs - (Date.now() - startedAt));
  new vm.Script(bootstrap, { filename: 'design-bootstrap.js' }).runInContext(context, { timeout: remaining() });
  let program;
  try {
    program = new vm.Script(`${channel}.start(async () => { 'use strict';\n${payload.code}\n}); void 0;`, { filename: 'design-code.js' });
  } catch { post(failure('SYNTAX_ERROR', 'Code must be a valid JavaScript function body')); return; }
  // Only undefined or strings leave this realm. No guest promises/objects reach host serializers.
  program.runInContext(context, { timeout: remaining() });
  const poll = new vm.Script(`${channel}.read()`, { filename: 'design-result.js' });
  while (!posted && Date.now() - startedAt < payload.timeoutMs) {
    const result = poll.runInContext(context, { timeout: remaining() });
    if (typeof result === 'string') { post(result); return; }
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  post(failure('EXECUTION_TIMEOUT', 'Execution exceeded its deadline'));
}

run().catch(error => {
  const timedOut = isNativeError(error)
    && Object.getOwnPropertyDescriptor(error, 'code')?.value === 'ERR_SCRIPT_EXECUTION_TIMEOUT';
  post(timedOut
    ? failure('EXECUTION_TIMEOUT', 'Execution exceeded its deadline')
    : failure('EXECUTION_ERROR', 'Execution or serialization failed'));
});
