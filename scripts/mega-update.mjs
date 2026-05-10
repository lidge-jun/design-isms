import { readFileSync, writeFileSync } from 'fs';

const ISMS_PATH = new URL('../assets/data/isms.json', import.meta.url).pathname;

// Fame-based order: most recognized design styles first
const FAME_ORDER = [
  'minimalism', 'bauhaus', 'flat-design', 'material-design', 'art-deco',
  'swiss-style', 'brutalism', 'skeuomorphism', 'dark-mode', 'retro-vintage',
  'futurism', 'memphis-design', 'cyberpunk', 'psychedelic', 'vaporwave',
  'y2k', 'maximalism', 'steampunk', 'glassmorphism', 'neumorphism',
  'corporate-memphis', 'neo-brutalism', 'gradient-aurora', 'bento-grid',
  'kawaii', 'japandi', 'organic-design', 'kinetic-typography', 'frutiger-aero',
  'claymorphism', 'dopamine-design', 'anti-design', 'cottagecore', 'solarpunk',
  'indie-web'
];

// English descriptions for i18n
const EN_DESCRIPTIONS = {
  'minimalism': 'An extremely restrained design approach. Expansive whitespace, limited color palettes, and clean typography create interfaces focused on essential content only. Every element must earn its place.',
  'bauhaus': 'Born from the legendary German design school (1919-1933). Geometric forms, primary colors, grid systems, and the unity of art and function. "Form follows function" as a visual language.',
  'flat-design': 'Pure 2D design eliminating all realistic textures and shadows. Solid colors, simple shapes, and crisp typography. Pioneered by Microsoft Metro UI, now the baseline of modern interfaces.',
  'material-design': "Google's comprehensive design system using paper-and-ink metaphors. Subtle shadows create depth hierarchy, bold colors guide interaction, and motion provides continuity across platforms.",
  'art-deco': 'The glamorous 1920s aesthetic revived digitally. Geometric patterns, symmetrical layouts, gold accents on dark backgrounds, and luxury typography convey opulence and sophistication.',
  'swiss-style': 'The International Typographic Style — the bedrock of modern graphic design. Mathematical grids, sans-serif type, asymmetric layouts, and objective photography create clarity and order.',
  'brutalism': 'Raw, unpolished, intentionally rough. Exposed structure, system fonts, harsh contrasts, and deliberately "ugly" aesthetics. A rebellion against polished corporate design conventions.',
  'skeuomorphism': 'Digital interfaces mimicking real-world objects. Leather textures, wood grain, realistic shadows, and 3D buttons. The defining aesthetic of early iPhone and pre-iOS 7 Apple design.',
  'dark-mode': 'Light text on dark backgrounds as a complete design paradigm. Reduces eye strain, saves battery on OLED screens, and creates dramatic visual hierarchies with glow and accent colors.',
  'retro-vintage': 'Nostalgic design callbacks to past decades (1950s-1990s). Aged textures, vintage typography, muted palettes, and analog-era patterns evoke warmth and authenticity.',
  'futurism': 'The 1909 Italian avant-garde movement celebrating speed, technology, and dynamism. Diagonal compositions, motion blur effects, and aggressive typography suggest perpetual forward momentum.',
  'memphis-design': "The rebellious 1980s Italian postmodern movement. Clashing colors, geometric patterns, squiggly lines, and terrazzo textures. Playful, anti-minimalist, and unapologetically loud.",
  'cyberpunk': 'Dystopian futurism meets neon-lit interfaces. Dark backgrounds with electric cyan, magenta, and green. Glitch effects, terminal typography, and high-tech-low-life aesthetic.',
  'psychedelic': '1960s counterculture visual language digitized. Kaleidoscopic colors, optical illusions, flowing organic shapes, and mind-bending patterns. Trippy, immersive, sensory overload.',
  'vaporwave': 'Internet-born nostalgia for 1980s-90s consumer culture. Pastel gradients, Greek statuary, retro tech imagery, and glitch art. Ironic, dreamy, and intentionally dated.',
  'y2k': 'Millennium-era futurism reborn. Chrome effects, metallic gradients, translucent plastics, and bubble shapes. Optimistic techno-utopianism from the turn of the century.',
  'maximalism': "'More is more.' Layered patterns, rich textures, bold colors everywhere, mixed media, and visual abundance. The deliberate opposite of minimalism — embracing excess as beauty.",
  'steampunk': 'Victorian-era technology reimagined. Brass gears, copper pipes, leather straps, and analog gauges meet digital interfaces. A retro-futuristic world powered by steam and imagination.',
  'glassmorphism': 'Frosted glass effect in UI design. Semi-transparent backgrounds with backdrop blur, subtle borders, and layered depth. Inspired by macOS Big Sur and modern AR interfaces.',
  'neumorphism': 'Soft, extruded UI elements emerging from the background. Dual shadows (light and dark) create a clay-like, embossed appearance. A brief but influential hybrid of flat and skeuomorphic design.',
  'corporate-memphis': "The ubiquitous flat illustration style of tech companies. Disproportionate figures, bold colors, simple shapes, and inclusive representation. Facebook's 'Alegria' started the trend.",
  'neo-brutalism': 'Brutalism reborn with color and personality. Bold black borders, bright accent colors, visible shadows, and intentionally rough layouts. Raw energy with modern polish.',
  'gradient-aurora': 'Flowing mesh gradients inspired by northern lights. Soft, organic color transitions creating atmospheric depth. Modern CSS and design tools make complex blends accessible.',
  'bento-grid': 'Japanese lunch box layout for digital interfaces. Neatly organized rectangular modules of varying sizes, clean borders, and systematic content arrangement. Popularized by Apple.',
  'kawaii': 'Japanese cute aesthetic applied to design. Rounded shapes, pastel colors, adorable characters, and playful micro-interactions. Sweet, friendly, and emotionally engaging.',
  'japandi': 'Japanese minimalism meets Scandinavian warmth. Natural materials, muted earth tones, functional simplicity, and wabi-sabi imperfection. Calm, balanced, and organic.',
  'organic-design': 'Biomorphic shapes inspired by nature. Fluid curves, natural textures, earth-tone palettes, and asymmetric forms. Technology harmonizing with the natural world.',
  'kinetic-typography': 'Text as motion and emotion. Animated letterforms, dynamic text layouts, scroll-triggered reveals, and typography that moves, morphs, and responds to interaction.',
  'frutiger-aero': 'Early 2000s clean glossy aesthetic. Sky gradients, nature imagery, glossy bubbles, and Frutiger-family typography. The optimistic "tech meets nature" visual language of Windows Vista era.',
  'claymorphism': '3D clay-like UI elements with soft, rounded forms. Pastel backgrounds, inner shadows creating depth, and playful textures. A tactile, friendly take on digital interfaces.',
  'dopamine-design': 'Bright, happy, maximalist stimulation. Saturated colors, playful animations, rewarding micro-interactions, and visual joy. Designed to trigger pleasure responses.',
  'anti-design': 'Intentionally breaking design rules. Chaotic layouts, clashing colors, distorted type, and visual discomfort. A critical response to design conformity and corporate aesthetics.',
  'cottagecore': 'Pastoral rural nostalgia as digital aesthetic. Wildflowers, gingham patterns, warm earth tones, and handwritten fonts. A retreat from technology into idealized countryside simplicity.',
  'solarpunk': 'Eco-optimistic futurism. Lush greenery integrated with solar technology, Art Nouveau flourishes, and vibrant sustainable design. A hopeful vision of humanity living in harmony with nature.',
  'indie-web': 'Personal, handcrafted web revival. Custom HTML/CSS, quirky layouts, visible personality, and anti-platform ethos. GeoCities nostalgia meets modern web standards.'
};

// Load all history batches
const batches = [];
for (let i = 1; i <= 4; i++) {
  try {
    const data = JSON.parse(readFileSync(`/tmp/batch${i}_history.json`, 'utf8'));
    batches.push(...data);
  } catch (e) {
    console.warn(`Warning: batch${i} not found`);
  }
}
const historyMap = Object.fromEntries(batches.map(b => [b.id, b.history]));
console.log(`Loaded ${batches.length} history entries from Grok`);

// Load current data
const isms = JSON.parse(readFileSync(ISMS_PATH, 'utf8'));
const ismMap = Object.fromEntries(isms.map(x => [x.id, x]));

// Reorder + update
const updated = FAME_ORDER.map(id => {
  const ism = ismMap[id];
  if (!ism) { console.error(`Missing ISM: ${id}`); process.exit(1); }

  // Update history if we have Grok data
  if (historyMap[id]) {
    ism.history = historyMap[id];
  }

  // Add English description
  if (EN_DESCRIPTIONS[id]) {
    ism.descriptionEn = EN_DESCRIPTIONS[id];
  }

  return ism;
});

// Verify
console.log(`Total: ${updated.length} isms`);
console.log(`Histories updated: ${Object.keys(historyMap).length}`);
console.log(`English descriptions added: ${Object.keys(EN_DESCRIPTIONS).length}`);

// Check all ISMs accounted for
const missing = isms.filter(x => !FAME_ORDER.includes(x.id));
if (missing.length) {
  console.error('Missing from order:', missing.map(x => x.id));
  process.exit(1);
}

writeFileSync(ISMS_PATH, JSON.stringify(updated, null, 2));
console.log('isms.json updated successfully!');

// Show new order
updated.forEach((x, i) => {
  const histLen = x.history?.length || 0;
  const hasEn = x.descriptionEn ? 'EN' : '--';
  console.log(`  ${String(i+1).padStart(2)}. ${x.name} (hist:${histLen} ${hasEn})`);
});
