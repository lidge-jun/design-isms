#!/usr/bin/env node
// Local stdio only. Executable JavaScript is supervised by execution.mjs, not sandboxed here.
import {
  LIMITS, PROTOCOL_VERSIONS, SERVER_INFO, TOOL_DEFINITION, createLineWriter,
  hasOwn, isMain, isRecord, parseToolArguments, readLines, rpcError, rpcResult,
  safeError, strictRecord, validId
} from './protocol.mjs';
import { toolResponse } from './response-budget.mjs';

export async function runServer({ input = process.stdin, output = process.stdout } = {}) {
  const writer = createLineWriter(output);
  const active = new Map();
  let initialized = false;
  let runtime;
  let transportError;
  const abortAll = () => { for (const entry of active.values()) entry.controller.abort(); };
  const stop = () => { abortAll(); input.destroy(); };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

  async function execute(request, args, controller) {
    let reply;
    try {
      runtime ??= import('./execution.mjs');
      const { executeCode, searchPrefix } = await runtime;
      const envelope = await executeCode(args.code, {
        timeoutMs: args.timeoutMs, maxBytes: args.maxBytes, signal: controller.signal
      });
      reply = await toolResponse(request.id, envelope, args.maxBytes, searchPrefix);
    } catch (error) {
      reply = await toolResponse(request.id, {
        ok: false, error: safeError(error, 'EXECUTION_ERROR'), logs: []
      }, args.maxBytes);
    }
    await writer.write(reply);
  }

  function startCall(request, args) {
    const controller = new AbortController();
    const entry = { controller, promise: null };
    active.set(request.id, entry);
    entry.promise = execute(request, args, controller).catch(error => {
      transportError = error;
      abortAll();
      input.destroy(error);
    }).finally(() => { active.delete(request.id); });
  }

  function notification(request) {
    if (request.method !== 'notifications/cancelled') return;
    const params = request.params;
    if (!isRecord(params) || !validId(params.requestId)) return;
    active.get(params.requestId)?.controller.abort();
  }

  async function dispatch(request) {
    const hasId = isRecord(request) && hasOwn(request, 'id');
    // A syntactically recognizable notification is never answered.
    if (isRecord(request) && request.jsonrpc === '2.0' && typeof request.method === 'string' && !hasId) {
      notification(request);
      return;
    }
    if (!isRecord(request) || request.jsonrpc !== '2.0' || !hasId || !validId(request.id)
      || typeof request.method !== 'string'
      || Object.keys(request).some(key => !['jsonrpc', 'id', 'method', 'params'].includes(key))) {
      await writer.write(rpcError(null, -32600, 'Invalid JSON-RPC request'));
      return;
    }
    const { id, method } = request;
    if (active.has(id)) {
      await writer.write(rpcError(id, -32600, 'Request ID is already active'));
      return;
    }
    try {
      const params = request.params === undefined ? {} : request.params;
      if (method === 'ping') {
        strictRecord(params, ['_meta']);
        await writer.write(rpcResult(id, {}));
        return;
      }
      if (method === 'initialize') {
        if (initialized) { await writer.write(rpcError(id, -32600, 'Already initialized')); return; }
        strictRecord(params, ['protocolVersion', 'capabilities', 'clientInfo', '_meta']);
        if (typeof params.protocolVersion !== 'string' || params.protocolVersion.length > 64
          || !isRecord(params.capabilities) || !isRecord(params.clientInfo)
          || typeof params.clientInfo.name !== 'string' || typeof params.clientInfo.version !== 'string') {
          await writer.write(rpcError(id, -32602, 'Invalid initialization parameters'));
          return;
        }
        const protocolVersion = PROTOCOL_VERSIONS.includes(params.protocolVersion)
          ? params.protocolVersion : PROTOCOL_VERSIONS.at(-1);
        initialized = true;
        await writer.write(rpcResult(id, {
          protocolVersion, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO
        }));
        return;
      }
      if (!initialized) { await writer.write(rpcError(id, -32002, 'Initialize before using tools')); return; }
      if (method === 'tools/list') {
        strictRecord(params, ['_meta']);
        await writer.write(rpcResult(id, { tools: [TOOL_DEFINITION] }));
        return;
      }
      if (method === 'tools/call') {
        strictRecord(params, ['name', 'arguments', '_meta']);
        if (params.name !== TOOL_DEFINITION.name) {
          await writer.write(rpcError(id, -32602, 'Unknown tool'));
          return;
        }
        const args = parseToolArguments(params.arguments);
        if (active.size >= LIMITS.concurrentCalls) {
          await writer.write(rpcError(id, -32001, 'Too many in-flight tool calls'));
          return;
        }
        startCall(request, args);
        return;
      }
      await writer.write(rpcError(id, -32601, 'Method not found'));
    } catch (error) {
      if (error?.code !== 'INVALID_ARGUMENT') throw error;
      await writer.write(rpcError(id, -32602, error.message));
    }
  }

  try {
    for await (const frame of readLines(input, LIMITS.frameBytes)) {
      if (transportError) throw transportError;
      if (frame.error) {
        await writer.write(rpcError(null, -32700, frame.error.message));
        continue;
      }
      let request;
      try { request = JSON.parse(frame.text); }
      catch { await writer.write(rpcError(null, -32700, 'Invalid JSON')); continue; }
      await dispatch(request);
    }
    // EOF owns teardown: cancel immediately, then flush cancellation replies and cleanup.
    abortAll();
    await Promise.all([...active.values()].map(entry => entry.promise));
    if (transportError) throw transportError;
  } finally {
    abortAll();
    await Promise.allSettled([...active.values()].map(entry => entry.promise));
    process.off('SIGTERM', stop);
    process.off('SIGINT', stop);
    await writer.close();
  }
}

if (isMain(import.meta.url)) {
  runServer().catch(error => {
    process.stderr.write(`design-isms MCP: ${safeError(error).message}\n`);
    process.exitCode = 1;
  });
}
