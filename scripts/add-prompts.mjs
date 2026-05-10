import { readFileSync, writeFileSync } from 'fs';

const isms = JSON.parse(readFileSync('assets/data/isms.json', 'utf8'));

const promptMap = {
  minimalism: [
    "A minimalist landing page screenshot. Expansive white space, thin sans-serif typography, single hero image with restrained color palette of white and charcoal. Clean grid layout, no decorative elements, content breathes in open space. Clean mockup, no browser chrome, realistic UI elements.",
    "A minimalist e-commerce shop page. Product displayed on pure white background, minimal navigation, generous padding between elements. Monochrome color scheme with subtle gray accents. Single-column product grid, understated add-to-cart button. Clean mockup, no browser chrome, realistic UI elements.",
    "A minimalist portfolio website. Large typography for project titles, ample negative space, black and white photography. Grid-based layout with mathematical precision, no unnecessary ornamentation. Clean mockup, no browser chrome, realistic UI elements."
  ],
  brutalism: [
    "A brutalist landing page screenshot. Raw, unpolished design with system monospace fonts, broken asymmetric grid layout, stark black and white with aggressive red accents. Exposed HTML-like structure, deliberately crude aesthetics, high-contrast elements. Clean mockup, no browser chrome, realistic UI elements.",
    "A brutalist e-commerce shop page. Black background with white monospace text, products displayed in raw grid with thick borders, no rounded corners, harsh red price tags. Anti-aesthetic product presentation, deliberately uncomfortable layout. Clean mockup, no browser chrome, realistic UI elements.",
    "A brutalist blog layout. Dense monospace text on white background, blue hyperlinks, no images, visible borders and harsh grid lines. Resembles early web pages, deliberately stripped of modern polish. Clean mockup, no browser chrome, realistic UI elements."
  ],
  neumorphism: [
    "A neumorphic dashboard UI screenshot. Soft extruded elements on light gray (#E0E5EC) background, subtle outer and inset shadows creating depth. Rounded cards with statistics, progress bars with soft shadow effects, monochromatic color scheme. Clean mockup, no browser chrome, realistic UI elements.",
    "A neumorphic login page. Centered card with soft shadow extrusion on pale gray background, input fields with inset shadows, rounded submit button with outer glow effect. Minimal color, depth created entirely through shadow manipulation. Clean mockup, no browser chrome, realistic UI elements.",
    "A neumorphic music player interface. Soft extruded play/pause/skip buttons, circular progress indicator with inset track, volume slider with raised knob. All on light gray background with subtle shadow depth, no flat colors. Clean mockup, no browser chrome, realistic UI elements."
  ],
  glassmorphism: [
    "A glassmorphic landing page screenshot. Frosted glass cards floating over a vibrant purple-to-teal gradient background. Translucent white panels with backdrop blur effect, subtle white borders, depth layering. Content visible through semi-transparent layers. Clean mockup, no browser chrome, realistic UI elements.",
    "A glassmorphic card UI design. Multiple frosted glass cards overlapping on a colorful gradient background, each with varying transparency levels. Thin white borders, blurred backdrop showing through, floating effect with subtle shadows. Clean mockup, no browser chrome, realistic UI elements.",
    "A glassmorphic mobile app interface. Translucent navigation bar and content cards on a vivid gradient background of purple and green. Frosted glass effect with backdrop blur, rounded corners, floating elements with depth. Clean mockup, no browser chrome, realistic UI elements."
  ],
  skeuomorphism: [
    "A skeuomorphic calculator app interface. Realistic glossy buttons with 3D bevels, metallic brushed aluminum frame, subtle reflections and realistic shadows. Buttons that look physically pressable, LED-style display, textured background. Clean mockup, no browser chrome, realistic UI elements.",
    "A skeuomorphic notepad application. Realistic torn paper edge at top, lined paper texture, leather-bound spine on left side, realistic pencil icon, subtle paper grain texture. Drop shadows creating physical depth illusion. Clean mockup, no browser chrome, realistic UI elements.",
    "A skeuomorphic bookshelf UI. Realistic wooden shelves with grain texture, books with leather spines and embossed titles, subtle lighting from above, realistic shadows beneath each book. Rich textures mimicking physical materials. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "flat-design": [
    "A flat design landing page screenshot. Solid color blocks with no gradients or shadows, simple geometric icons, bold sans-serif typography. Vibrant blue, red, green, and orange color sections, 2D illustrations, clean minimal interface. Clean mockup, no browser chrome, realistic UI elements.",
    "A flat design dashboard interface. Color-coded cards with solid fills, simple line icons, bold statistics in large type. No shadows, no gradients, no 3D effects. Pure 2D geometric shapes, vivid primary colors on white background. Clean mockup, no browser chrome, realistic UI elements.",
    "A flat design mobile app interface. Bright solid color header, simple outlined icons, flat buttons with solid fills, no depth or shadow effects. Clean typography, geometric shapes, minimal decorative elements, 2D illustration style. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "material-design": [
    "A Material Design landing page screenshot. Card-based layout with subtle elevation shadows, floating action button (FAB) in vibrant purple, ripple effect indicators. Bold typography, intentional color hierarchy with deep purple (#6200EE) and teal accents. Clean mockup, no browser chrome, realistic UI elements.",
    "A Material Design email app interface. Inbox with card-style email items, subtle elevation layers, floating compose button (FAB) in accent teal, material icons, bottom navigation bar. Purple primary color, clean white cards with systematic spacing. Clean mockup, no browser chrome, realistic UI elements.",
    "A Material Design e-commerce shop page. Product cards with elevation shadows, bold category headers, teal accent buttons, systematic 8dp grid spacing. Material icons, bottom navigation, floating cart button. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "swiss-style": [
    "A Swiss/International Style poster layout web page. Strict mathematical grid, Helvetica typography in various weights, asymmetric composition. Black, white, and red color scheme, high-quality black-and-white photography, clean rational hierarchy. Clean mockup, no browser chrome, realistic UI elements.",
    "A Swiss/International Style corporate website. Rigid grid structure, Helvetica headings, asymmetric layout with strong horizontal and vertical lines. Minimal color (black, white, red accent), large-scale photography, rational information hierarchy. Clean mockup, no browser chrome, realistic UI elements.",
    "A Swiss/International Style magazine layout web page. Multi-column grid, Helvetica typography, asymmetric balance of text and photography. Black and white with red accents, clean mathematical proportions, no decorative elements. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "art-deco": [
    "An Art Deco style landing page screenshot. Geometric patterns with gold (#D4AF37) on dark navy (#1A1A2E), symmetrical layout, ornamental borders and dividers. Tall serif typography, fan and sunburst motifs, luxurious feel with metallic accents. Clean mockup, no browser chrome, realistic UI elements.",
    "An Art Deco hotel website. Gold and navy color scheme, geometric border patterns, symmetrical layout with ornate dividers. Elegant serif typography, chevron and zigzag motifs, photographs framed with geometric Art Deco borders. Clean mockup, no browser chrome, realistic UI elements.",
    "An Art Deco event invitation page. Symmetrical geometric composition, gold metallic accents on dark navy, ornamental fan and sunburst patterns. Elegant tall serif typography, decorative borders, luxurious vintage aesthetic. Clean mockup, no browser chrome, realistic UI elements."
  ],
  bauhaus: [
    "A Bauhaus-inspired landing page screenshot. Primary colors (red, blue, yellow) on white background, geometric shapes (circles, triangles, squares), functional sans-serif typography. Asymmetric grid layout, form follows function, bold color blocks. Clean mockup, no browser chrome, realistic UI elements.",
    "A Bauhaus-inspired art gallery website. Primary color accents, geometric composition with circles and rectangles, clean sans-serif typography. Asymmetric grid showcasing artwork, functional navigation, no decorative ornamentation. Clean mockup, no browser chrome, realistic UI elements.",
    "A Bauhaus-inspired e-commerce shop. Bold primary color blocks (red, blue, yellow), geometric product cards, functional sans-serif labels. Clean grid layout, minimal ornamentation, every element serves a purpose. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "memphis-design": [
    "A Memphis Design style landing page screenshot. Bold clashing colors (coral, teal, yellow), geometric patterns with squiggles and dots, playful postmodern composition. Chunky shapes, pattern-filled backgrounds, deliberately discordant color combinations. Clean mockup, no browser chrome, realistic UI elements.",
    "A Memphis Design event poster page. Vibrant clashing colors, geometric shapes scattered playfully, bold sans-serif and decorative typography. Zigzag patterns, polka dots, triangles and squiggles as decorative elements, postmodern irreverence. Clean mockup, no browser chrome, realistic UI elements.",
    "A Memphis Design e-commerce shop. Bright coral, teal, and yellow color blocks, playful product cards with geometric pattern backgrounds, bold chunky buttons. Postmodern layout with clashing patterns, fun and irreverent aesthetic. Clean mockup, no browser chrome, realistic UI elements."
  ],
  vaporwave: [
    "A vaporwave landing page screenshot. Neon pink and cyan colors on dark background, retro Greek statue imagery, glitch effects, gradient-heavy design. 80s/90s nostalgia aesthetic with Japanese text, grid patterns, purple-pink-blue color transitions. Clean mockup, no browser chrome, realistic UI elements.",
    "A vaporwave music player interface. Neon gradient from pink to purple to blue, retro pixel-style controls, glitch art effects. Palm trees, sunset gradient, Japanese characters, old Windows-style UI elements reimagined with neon colors. Clean mockup, no browser chrome, realistic UI elements.",
    "A vaporwave e-commerce shop. Neon pink and cyan product cards on dark purple background, retro-futuristic typography, gradient backgrounds. Glitch effects, nostalgic 90s computing aesthetics, marble textures mixed with neon accents. Clean mockup, no browser chrome, realistic UI elements."
  ],
  y2k: [
    "A Y2K style landing page screenshot. Chrome/silver metallic elements, holographic gradients, translucent bubble shapes, cyber-optimistic aesthetic. Futuristic sans-serif fonts, metallic textures, iridescent colors, tech-utopia vibes from circa 2000. Clean mockup, no browser chrome, realistic UI elements.",
    "A Y2K fashion website. Chrome text effects, hot pink and turquoise accents on silver background, holographic product frames, bubble-shaped UI elements. Futuristic millennium aesthetic with glossy translucent panels. Clean mockup, no browser chrome, realistic UI elements.",
    "A Y2K mobile app interface. Holographic gradient backgrounds, chrome-finish buttons, translucent bubble shapes, iridescent color shifts. Futuristic millennium aesthetic with metallic silver base and pink-turquoise accents. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "retro-vintage": [
    "A retro/vintage landing page screenshot. Warm sepia tones, classic serif typography, subtle paper grain texture, hand-drawn illustration style. Muted earth tones (#D4A373, #6B4226), aged poster aesthetic, decorative borders, nostalgic warmth. Clean mockup, no browser chrome, realistic UI elements.",
    "A retro/vintage cafe website. Warm brown and cream color scheme, hand-lettered style headings, aged paper texture backgrounds. Illustrated coffee elements, serif typography, ornamental dividers, cozy nostalgic atmosphere. Clean mockup, no browser chrome, realistic UI elements.",
    "A retro/vintage event poster web page. Warm sepia and earth tones, bold serif typography, woodcut-style illustrations. Grain texture overlay, aged paper effect, decorative vintage borders, classic poster composition. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "dark-mode": [
    "A dark mode dashboard interface. Deep charcoal (#121212) background with vivid purple (#BB86FC) and teal (#03DAC6) accent colors, high contrast text. Card-based layout with dark elevated surfaces, glowing accent indicators, OLED-friendly true blacks. Clean mockup, no browser chrome, realistic UI elements.",
    "A dark mode streaming app interface. Near-black background, content thumbnails with subtle dark cards, vibrant accent highlights. Top navigation with dark surface elevation, smooth gradients, cinema-like dark atmosphere with vivid content colors. Clean mockup, no browser chrome, realistic UI elements.",
    "A dark mode e-commerce shop. Dark charcoal background, product images on slightly elevated dark cards, teal and purple accent buttons. High-contrast white text, dark navigation bar, modern premium feel with strategic color accents. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "organic-design": [
    "An organic/biomorphic landing page screenshot. Flowing blob shapes, natural earth tones (#606C38, #DDA15E), curved organic forms instead of rectangles. Nature-inspired color palette, soft flowing lines, plant-like decorative elements, warm and alive feeling. Clean mockup, no browser chrome, realistic UI elements.",
    "An organic/biomorphic wellness app interface. Soft blob shapes as content containers, earthy green and sand color palette, curved navigation elements. Botanical illustrations, flowing organic lines, natural material textures, calming and grounded aesthetic. Clean mockup, no browser chrome, realistic UI elements.",
    "An organic/biomorphic e-commerce shop. Flowing curved product cards with blob shapes, earth tone color scheme with olive green and warm sand. Organic form buttons, nature-inspired layout that avoids rigid rectangles, soft natural shadows. Clean mockup, no browser chrome, realistic UI elements."
  ],
  cyberpunk: [
    "A cyberpunk landing page screenshot. Neon red (#FF003C) and cyan (#00F0FF) on near-black background, glitch distortion effects, futuristic HUD-style interface elements. Angular geometric shapes, scanline effects, dystopian tech aesthetic with electric purple accents. Clean mockup, no browser chrome, realistic UI elements.",
    "A cyberpunk game UI interface. Dark background with neon red and cyan HUD elements, holographic displays, glitch effects, angular geometric frames. Health bars, minimap, inventory slots in futuristic dystopian style with electric glow effects. Clean mockup, no browser chrome, realistic UI elements.",
    "A cyberpunk e-commerce shop. Near-black background with neon product highlighting in red and cyan, glitch text effects, angular card shapes. Futuristic price displays, electric glow borders, dystopian tech aesthetic with scanline overlays. Clean mockup, no browser chrome, realistic UI elements."
  ],
  maximalism: [
    "A maximalist landing page screenshot. Layered patterns, multiple ornate decorative elements, bold clashing colors (hot pink, gold, royal blue, lime green). Rich textures, excessive ornamentation, every surface decorated, controlled visual chaos. Clean mockup, no browser chrome, realistic UI elements.",
    "A maximalist fashion website. Overwhelming pattern-on-pattern layering, bold hot pink and gold color scheme, ornate typography mixing multiple decorative fonts. Collage-style imagery, lush textures, no empty space, deliberate visual excess. Clean mockup, no browser chrome, realistic UI elements.",
    "A maximalist editorial web page. Dense layered layout with overlapping images and text, rich colors and patterns, ornate decorative borders. Multiple typefaces, gilded accents, botanical and geometric patterns filling every surface. Clean mockup, no browser chrome, realistic UI elements."
  ],
  japandi: [
    "A Japandi-style landing page screenshot. Muted neutral palette (#D4C5A9, #2C3639), clean composition with generous negative space, natural material textures (wood, linen, stone). Minimal but warm, combines Japanese wabi-sabi imperfection with Scandinavian functionality. Clean mockup, no browser chrome, realistic UI elements.",
    "A Japandi interior shop website. Warm neutral tones, natural wood and stone textures, clean grid layout with ample breathing room. Muted photography of minimal furniture, serene calm composition, earthy beige and dark charcoal color scheme. Clean mockup, no browser chrome, realistic UI elements.",
    "A Japandi lifestyle blog. Warm neutral color palette, clean serif and sans-serif typography pairing, natural material background textures. Generous whitespace, peaceful composition, muted earth tones with occasional warm brown accents. Clean mockup, no browser chrome, realistic UI elements."
  ],
  kawaii: [
    "A kawaii-style landing page screenshot. Soft pastel pink (#FFB7C5), mint green (#A0E7E5), and peach colors, rounded bubble shapes everywhere. Cute character mascots, oversized rounded buttons, sparkle and star decorations, adorable and sweet aesthetic. Clean mockup, no browser chrome, realistic UI elements.",
    "A kawaii e-commerce shop page. Pastel color scheme with pink, mint, and light yellow, rounded product cards with cute character stamps. Bubbly typography, star and heart decorative elements, soft rounded buttons, playfully adorable layout. Clean mockup, no browser chrome, realistic UI elements.",
    "A kawaii mobile app interface. Soft pastel palette, rounded UI elements with cute character icons, bubbly navigation with heart and star accents. Pink and mint color scheme, oversized rounded buttons, sweet and friendly aesthetic throughout. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "corporate-memphis": [
    "A Corporate Memphis SaaS landing page screenshot. Flat-style illustrations of diverse abstract human figures, purple (#6C63FF) and pink (#FF6584) color scheme. Clean layout with illustrated hero section, simple geometric character illustrations, modern tech startup aesthetic. Clean mockup, no browser chrome, realistic UI elements.",
    "A Corporate Memphis pricing page. Three-column pricing tiers with flat character illustrations, purple accent buttons, clean white background with gray (#3F3D56) text. Abstract human figures demonstrating features, friendly corporate tech aesthetic. Clean mockup, no browser chrome, realistic UI elements.",
    "A Corporate Memphis onboarding flow. Step-by-step screens with flat geometric character illustrations, purple and pink accent colors, progress indicators. Friendly abstract human figures guiding users, clean SaaS startup aesthetic. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "gradient-aurora": [
    "A gradient/aurora landing page screenshot. Vibrant mesh gradient background flowing from purple (#764BA2) to blue (#667EEA) to pink (#F093FB). Fluid color transitions, ethereal aurora borealis-like color blending, white text floating over vivid gradient backdrop. Clean mockup, no browser chrome, realistic UI elements.",
    "A gradient/aurora SaaS dashboard. Vibrant gradient accent panels flowing from blue to purple to pink, mesh gradient cards, aurora-like color transitions on dark background. Fluid color blending for charts and indicators, ethereal modern tech aesthetic. Clean mockup, no browser chrome, realistic UI elements.",
    "A gradient/aurora mobile app interface. Flowing mesh gradient background from blue to purple to pink, white UI elements floating over vibrant aurora colors. Fluid gradient buttons, ethereal color transitions, modern premium aesthetic. Clean mockup, no browser chrome, realistic UI elements."
  ],
  claymorphism: [
    "A claymorphic landing page screenshot. Soft 3D clay-like UI elements on pastel background, inflated rounded shapes with soft shadows, puffy button and card designs. Pastel colors (#F0E6FF, #FFE5EC, #E8F5E9), playful 3D rendered aesthetic, toy-like depth. Clean mockup, no browser chrome, realistic UI elements.",
    "Claymorphic app icons design. 3D clay-rendered icons with soft pastel colors, inflated rounded shapes, subtle soft shadows. Puffy toy-like aesthetic, each icon looks hand-sculpted from colored clay, warm playful depth on light background. Clean mockup, no browser chrome, realistic UI elements.",
    "A claymorphic e-commerce shop. Soft 3D clay product cards on pastel background, puffy rounded buttons, inflated UI elements with gentle shadows. Toy-like 3D aesthetic with lavender, pink, and mint pastel tones, playful and tactile feeling. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "neo-brutalism": [
    "A neo-brutalist landing page screenshot. Thick black borders on every element, vivid fill colors (orange #FF5733, yellow #FFC300), hard offset box-shadows. Bold sans-serif typography, raw aesthetic combined with modern vibrant colors, deliberately unrefined but energetic. Clean mockup, no browser chrome, realistic UI elements.",
    "A neo-brutalist blog layout. Thick black-bordered article cards with vivid yellow and orange fills, hard black drop shadows offset to bottom-right. Bold chunky headings, raw grid layout, modern color palette with deliberately unpolished borders. Clean mockup, no browser chrome, realistic UI elements.",
    "A neo-brutalist e-commerce shop. Products in thick black-bordered cards with bright fill colors, hard offset shadows, bold price typography. Vivid orange and yellow palette with black outlines, modern raw energy, chunky interactive elements. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "kinetic-typography": [
    "A kinetic typography landing page screenshot. Massive oversized text filling the viewport, bold black and white typography with selective red (#FF4500) and blue (#1E90FF) accents. Text as the primary visual element, letters overlapping and scaling dynamically, editorial type-driven design. Clean mockup, no browser chrome, realistic UI elements.",
    "A kinetic typography portfolio site. Large-scale animated-looking type compositions, words scaling from small to viewport-filling size. Black text on white with strategic orange and blue accents, scroll-driven text transformations implied in static layout. Clean mockup, no browser chrome, realistic UI elements.",
    "A kinetic typography agency website. Enormous display typography dominating the layout, overlapping text layers, bold black and white with vibrant accent colors. Dynamic diagonal text arrangements, editorial poster-like composition, type as art. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "frutiger-aero": [
    "A Frutiger Aero landing page screenshot. Glossy translucent UI elements, nature imagery (leaves, water, sky) blended with clean technology interface. Bright blue (#00A3E0) and green (#7BC043) color scheme, optimistic glass-like buttons, eco-tech harmony aesthetic circa 2006-2013. Clean mockup, no browser chrome, realistic UI elements.",
    "A Frutiger Aero dashboard interface. Glossy translucent panels over a nature-inspired background (sky, water), bright blue and green accents. Rounded glossy buttons, clean Frutiger-style typography, optimistic tech-meets-nature aesthetic with glass-like depth. Clean mockup, no browser chrome, realistic UI elements.",
    "A Frutiger Aero mobile app interface. Glossy buttons with nature imagery (leaves, water droplets) integrated into the UI, bright blue and green accents. Translucent panels, eco-optimistic aesthetic, clean rounded shapes with glass-like reflections. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "bento-grid": [
    "A Bento Grid features page screenshot. Apple-style modular rounded rectangular boxes arranged in a grid, each containing a distinct feature with icon and description. Clean (#F5F5F7) background, subtle shadows, varied box sizes creating visual rhythm, modern premium layout. Clean mockup, no browser chrome, realistic UI elements.",
    "A Bento Grid dashboard interface. Modular rounded rectangular panels of varying sizes arranged in a clean grid, each showing different data visualizations and metrics. Apple-inspired design with subtle borders, near-white background, dark text, blue accents. Clean mockup, no browser chrome, realistic UI elements.",
    "A Bento Grid e-commerce shop. Products displayed in modular rounded rectangular cards of varying sizes, Apple-style clean layout. Near-white background, subtle shadows, systematic grid spacing, premium minimalist aesthetic. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "dopamine-design": [
    "A Dopamine Design landing page screenshot. Hyper-vivid colors (coral #FF6F61, gold #FFD700, turquoise #00CED1, hot pink #FF1493), oversized rounded shapes, joy-inducing visual energy. Bold playful typography, Gen-Z aesthetic, every element radiating happiness and excitement. Clean mockup, no browser chrome, realistic UI elements.",
    "A Dopamine Design mobile app interface. Hyper-saturated vivid colors, large rounded buttons and cards, playful bouncy aesthetic. Hot pink, turquoise, and gold color pops, oversized friendly typography, designed to trigger instant visual delight. Clean mockup, no browser chrome, realistic UI elements.",
    "A Dopamine Design e-commerce shop. Vivid coral, gold, and turquoise product cards, oversized rounded buy buttons, bold playful price typography. Gen-Z hyper-color aesthetic, joy-inducing layout with maximum visual energy and happiness. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "anti-design": [
    "An anti-design landing page screenshot. Deliberately broken grid, clashing neon yellow (#CCFF00) and magenta (#FF00FF) on black, mismatched typography. Rules intentionally violated, overlapping elements, chaotic but purposeful composition, experimental defiance of conventions. Clean mockup, no browser chrome, realistic UI elements.",
    "An anti-design portfolio website. Chaotic overlapping text and images, clashing neon colors, deliberately ugly typography mixing. Broken grid layout, elements rotated at random angles, intentional visual discomfort as artistic statement. Clean mockup, no browser chrome, realistic UI elements.",
    "An anti-design event poster page. Aggressive neon yellow and magenta clashing, broken typography, overlapping layers of text and geometric shapes. Deliberately disorienting composition, every design rule intentionally broken, experimental visual rebellion. Clean mockup, no browser chrome, realistic UI elements."
  ],
  psychedelic: [
    "A psychedelic landing page screenshot. Swirling organic patterns, vivid neon colors (pink #FF6EC7, green #39FF14, orange #FF4500, purple #8B00FF). Trippy distorted typography, flowing organic shapes, kaleidoscopic pattern backgrounds, mind-bending visual experience. Clean mockup, no browser chrome, realistic UI elements.",
    "A psychedelic music festival website. Swirling colorful patterns, vivid neon rainbow gradients, distorted wavy typography. Kaleidoscopic backgrounds, flowing organic shapes, trippy color transitions from pink to green to purple, 60s-inspired visual explosion. Clean mockup, no browser chrome, realistic UI elements.",
    "A psychedelic event poster web page. Intense swirling patterns in vivid neon colors, distorted melting typography, flowing organic shapes. Kaleidoscopic symmetrical composition, trippy color blending of pink, green, orange, and purple, mind-expanding visual design. Clean mockup, no browser chrome, realistic UI elements."
  ],
  cottagecore: [
    "A cottagecore landing page screenshot. Warm cream (#F5E6D3) and soft brown tones, floral pattern accents, hand-drawn illustration style. Cozy rural aesthetic with wildflower decorations, soft serif typography, vintage lace-like borders, warm nostalgic pastoral feeling. Clean mockup, no browser chrome, realistic UI elements.",
    "A cottagecore e-commerce shop. Warm cream and soft brown color scheme, floral-patterned product card backgrounds, handcraft aesthetic. Wildflower illustrations as decorative elements, soft rounded buttons, cozy warm typography, artisan pastoral feeling. Clean mockup, no browser chrome, realistic UI elements.",
    "A cottagecore lifestyle blog. Warm cream background with pressed flower decorations, soft brown serif typography, cozy editorial layout. Hand-drawn botanical illustrations, vintage-style dividers, pastoral photography, gentle nostalgic warmth throughout. Clean mockup, no browser chrome, realistic UI elements."
  ],
  steampunk: [
    "A steampunk landing page screenshot. Brass and copper metallic textures, gear and cog decorative elements, dark brown (#2F1B0E) Victorian industrial aesthetic. Ornate serif typography, clockwork mechanisms as UI elements, riveted metal panels, fantasy-industrial fusion. Clean mockup, no browser chrome, realistic UI elements.",
    "A steampunk dashboard interface. Brass-framed gauge displays, gear-shaped navigation elements, dark leather and copper textures. Victorian industrial instrument panel aesthetic, ornate serif typography, riveted metal borders, clockwork data visualization. Clean mockup, no browser chrome, realistic UI elements.",
    "A steampunk e-commerce shop. Products displayed on aged leather and brass-bordered cards, gear motif decorative elements, dark brown Victorian industrial palette. Copper metallic accents, ornate serif typography, clockwork-inspired price displays. Clean mockup, no browser chrome, realistic UI elements."
  ],
  solarpunk: [
    "A solarpunk landing page screenshot. Lush green (#2D6A4F) and bright yellow (#FFD60A) eco-optimistic palette, nature and technology harmoniously integrated. Solar panel and plant motifs, clean sustainable-tech aesthetic, bright hopeful atmosphere, organic shapes with futuristic elements. Clean mockup, no browser chrome, realistic UI elements.",
    "A solarpunk eco app interface. Green and yellow color scheme, plant-growth data visualizations, solar energy dashboards. Nature-integrated technology aesthetic, organic curved UI elements with sustainable-tech icons, optimistic bright eco-utopia feeling. Clean mockup, no browser chrome, realistic UI elements.",
    "A solarpunk e-commerce shop. Green and yellow eco-optimistic palette, products displayed with plant and nature integration, sustainable-tech aesthetic. Solar and botanical motifs, organic curved product cards, bright hopeful eco-utopia shopping experience. Clean mockup, no browser chrome, realistic UI elements."
  ],
  futurism: [
    "A Futurism-inspired landing page screenshot. Dynamic diagonal lines and angular geometric shapes, bold black (#1A1A1A) and orange-red (#FF4500) palette. Speed and motion implied through tilted compositions, sharp angular typography, energetic forward-thrust aesthetic. Clean mockup, no browser chrome, realistic UI elements.",
    "A Futurism-inspired portfolio website. Dynamic diagonal compositions, angular geometric overlapping shapes, bold typography at aggressive angles. Black background with vibrant orange-red and gold accents, speed-line decorative elements, energetic forward motion aesthetic. Clean mockup, no browser chrome, realistic UI elements.",
    "A Futurism-inspired event poster page. Sharp diagonal compositions, angular geometric shapes in motion, bold tilted typography. Black and white with orange-red and gold accents, implied speed and dynamism, aggressive angular energy throughout. Clean mockup, no browser chrome, realistic UI elements."
  ],
  "indie-web": [
    "An indie web personal homepage screenshot. Handmade quirky aesthetic on warm cream (#FFF8E7) background, hand-drawn doodles, personality-rich layout. Mix of playful fonts, retro web counter, guestbook link, 88x31 pixel buttons, authentic personal expression, deliberately non-corporate. Clean mockup, no browser chrome, realistic UI elements.",
    "An indie web blog layout. Personal quirky design on warm cream background, hand-drawn decorations, varied text sizes and colors. Sidebar with personal links and webrings, retro aesthetic with modern sensibility, authentic and non-templated feel. Clean mockup, no browser chrome, realistic UI elements.",
    "An indie web link garden page. Curated collection of links on warm cream background, each with hand-written-style descriptions, quirky category headers. Retro pixel art decorations, coral and teal accent colors, personal curation aesthetic, cozy digital garden feel. Clean mockup, no browser chrome, realistic UI elements."
  ]
};

for (const ism of isms) {
  const prompts = promptMap[ism.id];
  if (!prompts) {
    console.error(`Missing prompts for: ${ism.id}`);
    continue;
  }
  ism.prompts = ism.images.map((img, i) => ({
    file: img.file,
    prompt: prompts[i],
    model: "gpt-image-2",
    quality: "high",
    size: "1536x1024"
  }));
}

writeFileSync('assets/data/isms.json', JSON.stringify(isms, null, 2) + '\n');
console.log(`Done. Added prompts to ${isms.length} isms (${isms.reduce((s, i) => s + i.prompts.length, 0)} total prompts).`);
