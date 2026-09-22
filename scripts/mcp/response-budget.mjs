// Final-wire fitting belongs to the transport, never the query or code serializer.
import { LIMITS, fault, freezeJSON, rpcResult, safeError, validId, wireBytes } from './protocol.mjs';

function response(id, envelope) {
  return rpcResult(id, {
    content: [{ type: 'text', text: JSON.stringify(envelope) }],
    isError: !envelope.ok
  });
}
function oversized(id) {
  return response(id, { ok: false, error: {
    code: 'RESPONSE_TOO_LARGE', message: 'Complete result does not fit; select fewer fields or increase maxBytes'
  }, logs: [] });
}

/** The runtime string is trusted structure, but only the public fields cross the wire. */
export async function toolResponse(id, envelope, maxBytes = LIMITS.defaultMaxBytes, refitSearch) {
  if (!validId(id) || !Number.isInteger(maxBytes) || maxBytes < LIMITS.minMaxBytes || maxBytes > LIMITS.maxMaxBytes) {
    throw fault('INVALID_ARGUMENT', 'Invalid response ID or byte budget');
  }
  let source;
  try { source = typeof envelope === 'string' ? JSON.parse(envelope) : envelope; }
  catch { source = { ok: false, error: { code: 'INVALID_RESULT', message: 'Runtime returned invalid JSON' }, logs: [] }; }
  let publicValue = source?.ok === true
    ? { ok: true, result: source.result, logs: Array.isArray(source.logs) ? source.logs : [] }
    : { ok: false, error: safeError(source?.error, 'EXECUTION_ERROR'), logs: [] };
  if (source?.logsTruncated) publicValue.logsTruncated = true;
  let reply = response(id, publicValue);
  if (wireBytes(reply) <= maxBytes) return reply;
  if (publicValue.logs.length) {
    publicValue = { ...publicValue, logs: [], logsTruncated: true };
    reply = response(id, publicValue);
    if (wireBytes(reply) <= maxBytes) return reply;
  }
  if (source?.ok && source.searchContext && Array.isArray(source.result?.items) && refitSearch) {
    // Copy before freezing: never retain mutable runtime/caller argument objects.
    const context = freezeJSON(JSON.parse(JSON.stringify(source.searchContext)));
    for (let count = source.result.items.length - 1; count >= 1; count--) {
      const page = await refitSearch(context, count);
      reply = response(id, { ...publicValue, result: page });
      if (wireBytes(reply) <= maxBytes) return reply;
    }
  }
  return oversized(id);
}
