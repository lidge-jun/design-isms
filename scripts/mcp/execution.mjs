// Per-call supervision. Worker/VM limits are not an OS memory or security sandbox.
import { Worker } from 'node:worker_threads';
import { createOperationRegistry, OPERATION_SPECS } from './operations.mjs';

const TRANSFER_BYTES = 256 * 1024;
const CODE_BYTES = 32768;
const MAX_ACTIVE = 4;
const WORKER_URL = new URL('./execution-worker.mjs', import.meta.url);
let active = 0;
let bundlePromise;
let refitData;

function errorEnvelope(code, message) {
  return JSON.stringify({ ok: false, error: { code, message }, logs: [] });
}

// Importing this module for tools/list does not read any catalog or generated JS.
async function bundle() {
  if (!bundlePromise) {
    bundlePromise = import('../design-core-loader.mjs').then(adapter => {
      const source = adapter.readSourceSnapshot();
      return { adapter, source, sourceJson: JSON.stringify(source), coreSources: adapter.readCoreSources() };
    }).catch(error => { bundlePromise = undefined; throw error; });
  }
  return bundlePromise;
}

/** Return only a serialized internal envelope; final MCP wire fitting is a transport concern. */
export async function executeCode(code, { timeoutMs = 3000, maxBytes = 8192, signal } = {}) {
  if (typeof code !== 'string' || !code.trim() || Buffer.byteLength(code, 'utf8') > CODE_BYTES
    || !Number.isInteger(timeoutMs) || timeoutMs < 50 || timeoutMs > 10000
    || !Number.isInteger(maxBytes) || maxBytes < 1024 || maxBytes > 65536) {
    return errorEnvelope('INVALID_ARGUMENT', 'Invalid code, timeoutMs, or maxBytes');
  }
  if (signal?.aborted) return errorEnvelope('EXECUTION_CANCELLED', 'Execution cancelled');
  if (active >= MAX_ACTIVE) return errorEnvelope('CONCURRENCY_LIMIT', 'Too many active executions');
  active++;
  try {
    const data = await bundle();
    if (signal?.aborted) return errorEnvelope('EXECUTION_CANCELLED', 'Execution cancelled');
    const payload = JSON.stringify({ code, timeoutMs, maxBytes,
      sourceJson: data.sourceJson, coreSources: data.coreSources,
      metadataJson: JSON.stringify(OPERATION_SPECS), factorySource: createOperationRegistry.toString() });
    return await supervise(payload, timeoutMs, signal);
  } catch {
    return errorEnvelope('EXECUTION_ERROR', 'Unable to initialize the design runtime');
  } finally { active--; }
}

function supervise(payload, timeoutMs, signal) {
  return new Promise(resolve => {
    let worker;
    let settled = false;
    let timer;
    const finish = serialized => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancelled);
      if (!worker) { resolve(serialized); return; }
      // Keep error/exit handlers until termination settles, avoiding an unhandled error race.
      worker.terminate().then(() => {
        worker.removeAllListeners();
        resolve(serialized);
      }, () => {
        worker.removeAllListeners();
        resolve(errorEnvelope('EXECUTION_ERROR', 'Worker termination failed'));
      });
    };
    const cancelled = () => finish(errorEnvelope('EXECUTION_CANCELLED', 'Execution cancelled'));
    timer = setTimeout(() => finish(errorEnvelope('EXECUTION_TIMEOUT', 'Execution exceeded its deadline')), timeoutMs);
    signal?.addEventListener('abort', cancelled, { once: true });
    if (signal?.aborted) { cancelled(); return; }
    try {
      worker = new Worker(WORKER_URL, {
        workerData: payload, env: {}, execArgv: [], stdout: true, stderr: true,
        resourceLimits: { maxOldGenerationSizeMb: 96, maxYoungGenerationSizeMb: 16, stackSizeMb: 4 }
      });
      // Never forward worker diagnostics onto the protocol streams.
      worker.stdout.resume();
      worker.stderr.resume();
      worker.on('message', message => {
        if (typeof message !== 'string' || Buffer.byteLength(message, 'utf8') > TRANSFER_BYTES) {
          finish(errorEnvelope('EXECUTION_ERROR', 'Invalid runtime transfer'));
        } else finish(message);
      });
      worker.on('error', () => finish(errorEnvelope('EXECUTION_CRASH', 'Execution worker failed')));
      worker.on('exit', () => finish(errorEnvelope('EXECUTION_CRASH', 'Execution worker exited without a result')));
    } catch { finish(errorEnvelope('EXECUTION_ERROR', 'Unable to start execution worker')); }
  });
}

/** Refit a branded search using trusted core code and captured call-time arguments. */
export async function searchPrefix(searchContext, count) {
  const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
  if (!searchContext || typeof searchContext !== 'object' || Array.isArray(searchContext)
    || Object.keys(searchContext).some(key => key !== 'version' && key !== 'args')
    || typeof searchContext.version !== 'string' || !Number.isInteger(count) || count < 1 || count > 30) {
    fail('INVALID_ARGUMENT', 'Invalid search continuation context');
  }
  const data = await bundle();
  if (searchContext.version !== data.source.version) fail('STALE_CURSOR', 'Search belongs to another snapshot');
  if (!refitData) refitData = data.adapter.loadDesignCore({ source: data.source });
  const registry = createOperationRegistry(() => refitData, OPERATION_SPECS);
  // Revalidate before replacing limit; an invalid field must not be silently removed.
  const original = registry.invoke('design.search', searchContext.args);
  if (count > original.items.length) fail('INVALID_ARGUMENT', 'Cannot enlarge a search prefix');
  const captured = registry.getSearchContext(original).args;
  const result = registry.invoke('design.search', { ...captured, limit: count });
  return JSON.parse(JSON.stringify(result));
}
