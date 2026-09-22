// Stdio framing and immutable public MCP limits. No catalog imports here.
import { fileURLToPath } from 'node:url';
import { readFileSync, realpathSync } from 'node:fs';

export const LIMITS = Object.freeze({
  frameBytes: 131072, cliInputBytes: 65536, cliOutputBytes: 65536,
  codeBytes: 32768, idBytes: 64, concurrentCalls: 4, descriptionBytes: 2000,
  defaultMaxBytes: 8192, minMaxBytes: 1024, maxMaxBytes: 65536,
  defaultTimeoutMs: 3000, minTimeoutMs: 50, maxTimeoutMs: 10000,
  errorMessageBytes: 256
});
export const PROTOCOL_VERSIONS = Object.freeze(['2024-11-05', '2025-03-26', '2025-06-18']);
const packageMetadata = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
export const SERVER_INFO = Object.freeze({ name: packageMetadata.name, version: packageMetadata.version });

export function freezeJSON(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeJSON(child);
    Object.freeze(value);
  }
  return value;
}

export const TOOL_DEFINITION = freezeJSON({
  name: 'execute_code',
  description: 'Query the read-only Design Atlas using JavaScript and return a JSON value. '
    + 'Discover small operations with actions.find(query?) and actions.describe(name). '
    + 'Use design.search(args), design.get(args), design.recipes(args), design.compose(args), '
    + 'and design.brief({composition}). Operations are synchronous; compose returns data, brief converts it to text. '
    + 'Example: return design.search({query:"minimal",limit:3}); '
    + 'Search returns versioned references and a nextCursor; get retrieves a selected summary, guide, code, or full entry. '
    + 'Only direct original search pages may shrink to fit the response budget; other values are returned whole or fail. '
    + 'Use ordinary JS map/filter and return the final value. console.log records bounded diagnostic strings. '
    + 'No filesystem, network, imports, shell, or Node APIs are provided. This is a trusted local execution convenience, '
    + 'not a hostile-code security sandbox. maxBytes counts the entire JSON-RPC response including newline. '
    + 'Start with discovery, select references, then retrieve only the implementation material needed.',
  inputSchema: {
    type: 'object', additionalProperties: false, required: ['code'],
    properties: {
      code: { type: 'string', minLength: 1, maxLength: LIMITS.codeBytes,
        description: `JavaScript body with return; at most ${LIMITS.codeBytes} UTF-8 bytes.` },
      maxBytes: { type: 'integer', minimum: LIMITS.minMaxBytes, maximum: LIMITS.maxMaxBytes,
        default: LIMITS.defaultMaxBytes },
      timeoutMs: { type: 'integer', minimum: LIMITS.minTimeoutMs, maximum: LIMITS.maxTimeoutMs,
        default: LIMITS.defaultTimeoutMs }
    }
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
});

export const utf8Bytes = value => Buffer.byteLength(value, 'utf8');
export const jsonLine = value => JSON.stringify(value) + '\n';
export const wireBytes = value => utf8Bytes(jsonLine(value));
export const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const hasOwn = (value, key) => Object.hasOwn(value, key);
export const validId = value => Number.isSafeInteger(value)
  || (typeof value === 'string' && utf8Bytes(value) <= LIMITS.idBytes);
export function isMain(url) {
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(url)); }
  catch { return false; }
}

export function fault(code, message) { return Object.assign(new Error(message), { code }); }
export function strictRecord(value, keys, code = 'INVALID_ARGUMENT') {
  if (!isRecord(value) || Object.keys(value).some(key => !keys.includes(key))) {
    throw fault(code, 'Expected an object with only the documented fields');
  }
  return value;
}

export function safeError(error, fallback = 'INTERNAL_ERROR') {
  const code = typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code)
    ? error.code : fallback;
  const message = typeof error?.message === 'string' && utf8Bytes(error.message) <= LIMITS.errorMessageBytes
    ? error.message : 'Operation failed; inspect the request and retry';
  return { code, message };
}

export function rpcResult(id, result) { return { jsonrpc: '2.0', id, result }; }
export function rpcError(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } }; }
export function parseToolArguments(value) {
  const args = strictRecord(value, ['code', 'maxBytes', 'timeoutMs']);
  if (typeof args.code !== 'string' || !args.code.trim() || utf8Bytes(args.code) > LIMITS.codeBytes) {
    throw fault('INVALID_ARGUMENT', `code must contain 1..${LIMITS.codeBytes} UTF-8 bytes`);
  }
  const maxBytes = args.maxBytes ?? LIMITS.defaultMaxBytes;
  const timeoutMs = args.timeoutMs ?? LIMITS.defaultTimeoutMs;
  if ((hasOwn(args, 'maxBytes') && args.maxBytes === null) || !Number.isInteger(maxBytes)
    || maxBytes < LIMITS.minMaxBytes || maxBytes > LIMITS.maxMaxBytes) {
    throw fault('INVALID_ARGUMENT', 'maxBytes is outside the supported integer range');
  }
  if ((hasOwn(args, 'timeoutMs') && args.timeoutMs === null) || !Number.isInteger(timeoutMs)
    || timeoutMs < LIMITS.minTimeoutMs || timeoutMs > LIMITS.maxTimeoutMs) {
    throw fault('INVALID_ARGUMENT', 'timeoutMs is outside the supported integer range');
  }
  return { code: args.code, maxBytes, timeoutMs };
}

/** Buffer bytes until LF, so split Unicode survives. Oversized records are discarded once. */
export async function* readLines(input, maxBytes) {
  let parts = [], size = 0, oversized = false;
  const decode = bytes => {
    try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) }; }
    catch { return { error: { code: 'INVALID_UTF8', message: 'Input must be valid UTF-8' } }; }
  };
  const finish = () => {
    const result = oversized
      ? { error: { code: 'INPUT_TOO_LARGE', message: `Input line exceeds ${maxBytes} bytes` } }
      : decode(Buffer.concat(parts, size));
    parts = []; size = 0; oversized = false;
    return result;
  };
  for await (const chunk of input) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    let start = 0;
    while (start < buffer.length) {
      const newline = buffer.indexOf(10, start);
      const end = newline < 0 ? buffer.length : newline;
      if (!oversized) {
        const length = end - start;
        if (size + length > maxBytes) { oversized = true; parts = []; size = 0; }
        else if (length) { parts.push(Buffer.from(buffer.subarray(start, end))); size += length; }
      }
      if (newline < 0) break;
      yield finish();
      start = newline + 1;
    }
  }
  if (size || oversized) yield finish();
}

/** Serial callback completion applies backpressure and captures pipe failures. */
export function createLineWriter(output) {
  let tail = Promise.resolve();
  let failure;
  const onError = error => { failure = error; };
  output.on('error', onError);
  return {
    write(value) {
      const line = jsonLine(value);
      const pending = tail.then(() => {
        if (failure) throw failure;
        return new Promise((resolve, reject) => {
          output.write(line, error => error ? reject(error) : resolve());
        });
      });
      // Keep rejection handled until callers collect their in-flight work.
      tail = pending.catch(error => { failure = error; });
      return pending;
    },
    async close() { await tail; output.off('error', onError); if (failure) throw failure; }
  };
}
