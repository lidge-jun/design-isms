import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { imageGenerationCommand, validateImageGenerationCommand, validateRecordedImageGeneration } from './image-generation-profiles.mjs';

const candidate = '.tmp/image-candidates/ism/refractive-glass-ui/landing/img-000007/candidate.png';
const historical = ['ima2', 'gen', '--stdin', '-q', 'high', '-s', '1536x1024', '-o', candidate, '--json', '--timeout', '300',
  '--server', 'http://127.0.0.1:3334', '--model', 'oauth/gpt-5.6-sol', '--reasoning-effort', 'high'];
const local = [...historical]; local[13] = 'http://localhost:3333';

test('absent profile preserves exact historical argv across JSON serialization', () => {
  assert.deepEqual(imageGenerationCommand(candidate), historical);
  assert.deepEqual(validateImageGenerationCommand(JSON.parse(JSON.stringify({ candidate, command: historical }))), historical);
});
test('current-local selects exact localhost endpoint without changing model or effort', () => {
  assert.deepEqual(imageGenerationCommand(candidate, 'current-local'), local);
  assert.deepEqual(validateImageGenerationCommand(JSON.parse(JSON.stringify({ candidate, profile: 'current-local', command: local }))), local);
});
test('unknown and explicit null/empty profiles fail closed', () => {
  for (const profile of ['auto', 'historical', '', null, false, {}, '__proto__']) {
    assert.throws(() => imageGenerationCommand(candidate, profile), /unknown/);
    assert.throws(() => validateImageGenerationCommand({ candidate, profile, command: historical }), /unknown/);
  }
});
test('endpoint, model, reasoning, quality, size, timeout and additional flag tampering reject', () => {
  for (const [index, value] of [[13, 'http://127.0.0.1:3333'], [15, 'oauth/gpt-6-astra'], [17, 'low'], [4, 'low'], [6, '1024x1024'], [11, '600']]) {
    const command = [...local]; command[index] = value;
    assert.throws(() => validateImageGenerationCommand({ candidate, profile: 'current-local', command }), /mismatch/);
  }
  assert.throws(() => validateImageGenerationCommand({ candidate, profile: 'current-local', command: [...local, '--mode', 'direct'] }), /mismatch/);
  assert.throws(() => validateImageGenerationCommand({ candidate, command: local }), /mismatch/);
});
test('candidate paths cannot escape staging', () => {
  for (const path of ['/tmp/candidate.png', '.tmp/image-candidates/../candidate.png', 'assets/images/candidate.png']) {
    assert.throws(() => imageGenerationCommand(path), /unsafe/);
  }
});

test('persisted accepted commands stay exact and rejected historical evidence stays readable', () => {
  const dir = new URL('../devlog/_fin/260715_production_upgrade/092_image_generation_attempts/', import.meta.url);
  const index = JSON.parse(readFileSync(new URL('index.json', dir)));
  for (const shard of index.shards) {
    const rows = readFileSync(new URL(shard, dir), 'utf8').trim().split('\n').map(JSON.parse);
    for (const row of rows.filter(value => value.state === 'prepared')) {
      const accepted = rows.some(value => value.attemptId === row.attemptId && value.state === 'review' && value.decision === 'accepted');
      assert.doesNotThrow(() => validateRecordedImageGeneration(row, accepted), row.attemptId);
    }
  }
});

test('rejected legacy shorthand is not runnable/acceptable, and explicit profiles never get an exemption', () => {
  const shorthand = { candidate, command: historical.slice(0, 12) };
  assert.doesNotThrow(() => validateRecordedImageGeneration(shorthand, false));
  assert.throws(() => validateRecordedImageGeneration(shorthand, true), /mismatch/);
  assert.throws(() => validateImageGenerationCommand(shorthand), /mismatch/);
  assert.throws(() => validateRecordedImageGeneration({ ...shorthand, profile: 'current-local' }, false), /mismatch/);
  assert.throws(() => validateRecordedImageGeneration({ ...shorthand, profile: 'unknown' }, false), /unknown/);
});
