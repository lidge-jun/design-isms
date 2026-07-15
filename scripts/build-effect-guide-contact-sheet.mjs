/**
 * build-effect-guide-contact-sheet.mjs — disposable local review sheet.
 * Composites all 46 effect guide previews into .tmp/effects-guide-contact-sheet.webp
 * (not committed; .tmp/ is ignored).
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const effects = JSON.parse(readFileSync(join(root, 'assets/data/effects.json'), 'utf8'));
const previewsRoot = join(root, 'assets/images/thumbs/effects');
const outDir = join(root, '.tmp');
const outPath = join(outDir, 'effects-guide-contact-sheet.webp');

const cell = { w: 384, h: 256 };
const cols = 6;
const rows = Math.ceil(effects.length / cols);
const labelH = 24;

mkdirSync(outDir, { recursive: true });

const composites = [];
for (let i = 0; i < effects.length; i += 1) {
  const effect = effects[i];
  const previewPath = join(previewsRoot, effect.id, 'guide.webp');
  const col = i % cols;
  const row = Math.floor(i / cols);
  const left = col * cell.w;
  const top = row * (cell.h + labelH);
  if (existsSync(previewPath)) {
    const buf = await sharp(previewPath).resize(cell.w, cell.h).toBuffer();
    composites.push({ input: buf, left, top });
  }
  const svg = `<svg width="${cell.w}" height="${labelH}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="100%" height="100%" fill="#11120F"/>` +
    `<text x="6" y="16" font-family="monospace" font-size="12" fill="#F1F1EB">${String(i + 1).padStart(2, '0')} ${effect.id}</text></svg>`;
  composites.push({ input: Buffer.from(svg), left, top: top + cell.h });
}

await sharp({
  create: {
    width: cols * cell.w,
    height: rows * (cell.h + labelH),
    channels: 3,
    background: '#F1F1EB'
  }
})
  .composite(composites)
  .webp({ quality: 70 })
  .toFile(outPath);

console.log(`contact sheet: ${outPath} (${effects.length} previews, ${cols}x${rows})`);
