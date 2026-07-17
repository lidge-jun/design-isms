#!/usr/bin/env node
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, loadInventory, sheetSpecs } from './image-quality-lib.mjs';

const args = process.argv.slice(2); const outIndex = args.indexOf('--out');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(outIndex >= 0 ? args[outIndex + 1] : join(root, '.tmp/image-quality/current'));
const spec = sheetSpecs(loadInventory(root)).find(item => item.id === 'effects-guide');
if (!spec) throw new Error('effects-guide sheet spec missing');
const receipt = await buildSheet(root, spec, out);
console.log(`Effect contact sheet: ${receipt.id}=${receipt.maps.length}, ${receipt.cols}x${receipt.rows} at ${out}`);
