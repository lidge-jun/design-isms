#!/usr/bin/env node
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSheet, loadInventory, sheetSpecs } from './image-quality-lib.mjs';

const args = process.argv.slice(2); const outIndex = args.indexOf('--out');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(outIndex >= 0 ? args[outIndex + 1] : join(root, '.tmp/image-quality/current'));
const specs = sheetSpecs(loadInventory(root)).filter(spec => spec.id.startsWith('ism-slot-'));
const receipts = [];
for (const spec of specs) receipts.push(await buildSheet(root, spec, out));
console.log(`ISM contact sheets: ${receipts.map(item => `${item.id}=${item.maps.length}`).join(', ')} at ${out}`);
