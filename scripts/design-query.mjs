#!/usr/bin/env node
// Unix interface: one invocation in, one complete value out; diagnostics stay structured.
import { OPERATION_SPECS, createOperationRegistry } from './mcp/operations.mjs';
import {
  LIMITS, createLineWriter, fault, isMain, readLines, safeError, strictRecord, wireBytes
} from './mcp/protocol.mjs';

export async function runQuery({ input = process.stdin, output = process.stdout, argv = process.argv.slice(2) } = {}) {
  const writer = createLineWriter(output);
  let failed = false;
  let data;
  let loader;
  const getData = () => {
    if (!data) throw fault('DATA_UNAVAILABLE', 'Catalog data has not been loaded');
    return data;
  };
  const ensureData = async () => {
    if (!data) {
      loader ??= import('./design-core-loader.mjs');
      const { loadDesignCore } = await loader;
      const { catalog, recipes, snapshot, recipeList } = loadDesignCore();
      data = { catalog, recipes, snapshot, recipeList };
    }
  };
  async function emit(value) {
    if (wireBytes(value) > LIMITS.cliOutputBytes) {
      failed = true;
      await writer.write({ error: {
        code: 'RESPONSE_TOO_LARGE', message: 'Complete result exceeds 65536 bytes; request a smaller view'
      } });
    } else await writer.write(value);
  }
  async function reject(error) {
    failed = true;
    await emit({ error: safeError(error) });
  }
  async function invocation(line) {
    let value;
    try { value = JSON.parse(line); }
    catch { throw fault('INVALID_JSON', 'Input line is not valid JSON'); }
    const request = strictRecord(value, ['op', 'args']);
    if (typeof request.op !== 'string') throw fault('INVALID_ARGUMENT', 'op must be a string');
    const spec = OPERATION_SPECS.find(item => item.name === request.op);
    if (!spec) throw fault('UNKNOWN_OPERATION', 'Unknown operation; use actions.find for discovery');
    if (spec.requiresData) await ensureData();
    const registry = createOperationRegistry(getData, OPERATION_SPECS, { maxOperations: 100 });
    return registry.invoke(request.op, request.args);
  }
  try {
    if (argv.length) {
      if (argv.length === 1 && argv[0] === '--help') {
        await emit({ operations: OPERATION_SPECS });
      } else {
        await reject(fault('INVALID_ARGUMENT', 'Use --help or supply NDJSON invocations on stdin'));
      }
    } else {
      for await (const line of readLines(input, LIMITS.cliInputBytes)) {
        if (line.error) { await reject(line.error); continue; }
        let result;
        try { result = await invocation(line.text); }
        catch (error) { await reject(error); continue; }
        await emit(result);
      }
    }
  } finally { await writer.close(); }
  return failed ? 1 : 0;
}

if (isMain(import.meta.url)) {
  runQuery().then(code => { process.exitCode = code; }).catch(error => {
    process.stderr.write(`design-query: ${safeError(error).message}\n`);
    process.exitCode = 1;
  });
}
