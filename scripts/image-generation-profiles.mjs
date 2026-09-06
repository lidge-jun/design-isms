import { safeRelativePath, stableJson } from './image-quality-lib.mjs';

// Absence alone means the historical profile. Never reinterpret existing rows.
export function imageGenerationCommand(candidate, profile) {
  if (!safeRelativePath(candidate) || !candidate.startsWith('.tmp/image-candidates/') || !candidate.endsWith('/candidate.png')) {
    throw new Error('unsafe generation candidate');
  }
  if (profile !== undefined && profile !== 'current-local') throw new Error(`unknown image generation profile: ${String(profile)}`);
  const server = profile === undefined ? 'http://127.0.0.1:3334' : 'http://localhost:3333';
  return ['ima2', 'gen', '--stdin', '-q', 'high', '-s', '1536x1024', '-o', candidate, '--json', '--timeout', '300',
    '--server', server, '--model', 'oauth/gpt-5.6-sol', '--reasoning-effort', 'high'];
}

export function validateImageGenerationCommand(prepared) {
  const expected = imageGenerationCommand(prepared.candidate, prepared.profile);
  if (stableJson(prepared.command) !== stableJson(expected)) throw new Error('generation command/profile mismatch');
  return expected;
}

// Old rejected experiments predate explicit routing. Preserve their evidence,
// but never execute or accept it through this compatibility path.
export function validateRecordedImageGeneration(prepared, accepted) {
  imageGenerationCommand(prepared.candidate, prepared.profile); // Reject unknown profiles even on rejected rows.
  if (accepted || Object.hasOwn(prepared, 'profile')) validateImageGenerationCommand(prepared);
}
