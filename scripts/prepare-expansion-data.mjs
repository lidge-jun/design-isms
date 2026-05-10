import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const effects = JSON.parse(readFileSync(join(root, 'assets/data/effects.json'), 'utf8'));
const outDir = join(root, 'devlog/260510_nav_taxonomy_effect_docs');

const referenceEntries = [
  ref('editorial-typography', 'Editorial Typography', '에디토리얼 타이포그래피', 'ISM Candidate', 'P0',
    '큰 제목, 본문 리듬, 여백, 컬럼 구조로 콘텐츠의 목소리를 만드는 타이포그래피 중심 스타일.',
    ['typography', 'editorial', 'hierarchy', 'layout'], ''),
  ref('variable-typography', 'Variable Typography', '가변 타이포그래피', 'ISM Candidate', 'P0',
    'variable font 축과 responsive type scale을 활용해 화면 크기와 상태에 따라 글자의 표정이 변하는 웹 타이포그래피.',
    ['typography', 'variable-font', 'responsive', 'motion'], ''),
  ref('monospace-terminal-ui', 'Monospace / Terminal UI', '모노스페이스 터미널 UI', 'ISM Candidate', 'P0',
    '개발자 도구, AI 콘솔, 로그 뷰어처럼 고정폭 글꼴과 명령형 인터페이스 감각을 전면에 둔 디지털 스타일.',
    ['monospace', 'terminal', 'developer-tools', 'command'], ''),
  ref('art-nouveau', 'Art Nouveau', '아르누보', 'ISM Candidate', 'P0',
    '유기적인 곡선, 식물적 장식, 장식적 프레임을 현대 웹 레이아웃으로 번역하는 역사적 디자인 운동.',
    ['ornamental', 'organic-line', 'historic', 'decorative'], ''),
  ref('de-stijl', 'De Stijl', '데 스틸', 'ISM Candidate', 'P0',
    '수직/수평 격자, 원색 블록, 기하학적 축약으로 화면 구조를 강하게 드러내는 스타일.',
    ['grid', 'primary-color', 'geometry', 'modernism'], ''),
  ref('constructivism', 'Constructivism', '구성주의', 'ISM Candidate', 'P0',
    '대각선 구도, 강한 대비, 선언적 타이포그래피로 캠페인/에디토리얼 화면에 긴장을 주는 그래픽 언어.',
    ['diagonal', 'propaganda', 'red-black', 'poster'], ''),
  ref('mid-century-modern', 'Mid-century Modern', '미드센추리 모던', 'ISM Candidate', 'P0',
    '따뜻한 색, 단순화된 기하 형태, 낙관적인 일러스트 감각을 현대 브랜드/랜딩에 적용하는 스타일.',
    ['warm-modern', 'geometry', 'illustration', 'brand'], ''),
  ref('pop-art', 'Pop Art', '팝아트', 'ISM Candidate', 'P0',
    '상업 이미지, 만화적 색면, 하프톤과 강한 대비로 제품/프로모션 화면에 에너지를 주는 스타일.',
    ['commercial', 'halftone', 'bold-color', 'comic'], ''),
  ref('apple-hig', 'Apple Human Interface Guidelines', 'Apple HIG', 'Official Reference', 'P0',
    'Apple 플랫폼의 구조, 입력, 내비게이션, 시각 기준을 확인하는 1차 플랫폼 가이드.',
    ['platform', 'mobile', 'desktop', 'guidelines'], 'https://developer.apple.com/design/human-interface-guidelines/'),
  ref('material-design-3', 'Material Design 3', '머티리얼 디자인 3', 'Official Reference', 'P0',
    'Google의 컬러, 타입, 모션, 컴포넌트 체계를 확인하는 Android/web 제품 UI 기준.',
    ['design-system', 'components', 'motion', 'android'], 'https://m3.material.io/'),
  ref('fluent-2', 'Microsoft Fluent 2', '마이크로소프트 플루언트 2', 'Official Reference', 'P0',
    'Microsoft 생태계의 웹, iOS, Android, Windows 컴포넌트와 제품 UI 원칙을 보는 기준.',
    ['design-system', 'enterprise', 'components', 'microsoft'], 'https://fluent2.microsoft.design/'),
  ref('carbon-design-system', 'IBM Carbon Design System', 'IBM 카본 디자인 시스템', 'Official Reference', 'P0',
    '엔터프라이즈 제품, 데이터 UI, 접근성 중심 컴포넌트 기준을 확인하는 IBM 오픈소스 디자인 시스템.',
    ['enterprise', 'data-ui', 'accessibility', 'components'], 'https://carbondesignsystem.com/'),
  ref('atlassian-design-system', 'Atlassian Design System', '아틀라시안 디자인 시스템', 'Official Reference', 'P1',
    '협업 도구와 생산성 제품의 foundation, components, patterns, content 기준을 확인하는 레퍼런스.',
    ['collaboration', 'patterns', 'content-design', 'product-ui'], 'https://atlassian.design/design-system'),
  ref('shopify-polaris', 'Shopify Polaris', '쇼피파이 폴라리스', 'Official Reference', 'P1',
    '상거래 관리자 화면, merchant workflow, web components 중심의 커머스 UI 기준.',
    ['commerce', 'admin', 'web-components', 'forms'], 'https://shopify.dev/docs/api/app-home/web-components'),
  ref('wai-aria-apg', 'WAI-ARIA Authoring Practices Guide', 'WAI-ARIA APG', 'Official Reference', 'P0',
    'dialog, tabs, accordion 같은 상호작용 패턴의 키보드/ARIA 작동 기준을 검증하는 접근성 레퍼런스.',
    ['accessibility', 'aria', 'patterns', 'keyboard'], 'https://www.w3.org/WAI/ARIA/apg/'),
  ref('mdn-web-accessibility', 'MDN Web Accessibility', 'MDN 웹 접근성', 'Official Reference', 'P0',
    '웹 플랫폼 role, attribute, interaction behavior를 확인하는 구현 레퍼런스.',
    ['web-platform', 'accessibility', 'aria', 'implementation'], 'https://developer.mozilla.org/en-US/docs/Web/Accessibility')
];

const refsByGroup = {
  overlay: [
    source('WAI-ARIA APG dialog pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/'),
    source('MDN ARIA dialog role', 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role')
  ],
  navigation: [
    source('WAI-ARIA APG landmarks and patterns', 'https://www.w3.org/WAI/ARIA/apg/'),
    source('Apple Human Interface Guidelines', 'https://developer.apple.com/design/human-interface-guidelines/')
  ],
  data: [
    source('IBM Carbon Design System', 'https://carbondesignsystem.com/'),
    source('Atlassian Design System patterns', 'https://atlassian.design/design-system')
  ],
  feedback: [
    source('Material Design 3', 'https://m3.material.io/'),
    source('Shopify Polaris web components', 'https://shopify.dev/docs/api/app-home/web-components')
  ],
  form: [
    source('MDN Web Accessibility', 'https://developer.mozilla.org/en-US/docs/Web/Accessibility'),
    source('WAI-ARIA APG', 'https://www.w3.org/WAI/ARIA/apg/')
  ],
  motion: [
    source('Material Design motion', 'https://m3.material.io/styles/motion'),
    source('MDN prefers-reduced-motion', 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion')
  ]
};

const effectGroups = {
  overlay: ['bottom-sheet', 'full-screen-mobile-modal', 'modal-dialog', 'popover', 'tooltip', 'image-lightbox'],
  navigation: ['drawer-navigation', 'sticky-cta-bar', 'sticky-tab-bar', 'breadcrumb', 'pagination', 'tabs'],
  data: ['mega-menu', 'command-palette', 'split-pane', 'resizable-sidebar', 'data-table', 'master-detail', 'kanban-board', 'sticky-table-header', 'dashboard-kpi-cards', 'filter-sidebar', 'virtual-list'],
  feedback: ['skeleton-loading', 'toast', 'toast-stack', 'inline-validation', 'notification-center', 'mobile-empty-state'],
  form: ['segmented-control', 'date-picker', 'file-dropzone', 'mobile-stepper-form', 'progress-stepper', 'accordion', 'carousel', 'context-menu', 'inline-edit'],
  motion: ['scroll-reveal', 'staggered-cards', 'press-scale', 'drag-reorder', 'swipe-action', 'pull-to-refresh', 'floating-action-button', 'desktop-wizard']
};

function ref(id, name, nameKr, kind, priority, summary, tags, officialUrl) {
  return {
    id, name, nameKr, kind, priority, summary, tags, officialUrl,
    status: kind === 'ISM Candidate' ? 'candidate' : 'reference',
    researchPrompt: researchPromptFor(id, name, kind, officialUrl),
    imagePrompt: imagePromptFor(id, name, kind, summary)
  };
}

function source(label, url) { return { label, url }; }

function researchPromptFor(id, name, kind, officialUrl) {
  const sourceLine = officialUrl ? `Start from this official URL: ${officialUrl}` : 'Find primary or high-quality sources before using summaries.';
  return `Research ${name} for the design-isms catalog. Kind: ${kind}. ${sourceLine} Return JSON with: definition, short history, visual traits, web UI interpretation, 5 keywords, add_or_reference decision, risks, and 6-10 real source URLs. Avoid Dribbble, Behance, Pinterest, and wiki-only evidence.`;
}

function imagePromptFor(id, name, kind, summary) {
  const mode = kind === 'ISM Candidate' ? 'three UI mockup images for a visual style card' : 'one neutral documentation-style overview image';
  return `Use case: ui-mockup. Asset type: ${mode}. Primary request: ${name}. Context: ${summary} Style: crisp editorial UI documentation, realistic web/app interface, warm off-white canvas, charcoal text, muted amber accent, no real logos, no browser chrome, no people, no watermark.`;
}

function groupFor(effectId) {
  const found = Object.entries(effectGroups).find(([, ids]) => ids.includes(effectId));
  return found ? found[0] : 'form';
}

function docsFor(effect) {
  const group = groupFor(effect.id);
  return {
    background: `${effect.nameKr}는 ${effect.summary} 사용자가 이름을 몰라도 화면의 역할을 떠올릴 수 있도록, 이 패턴은 문제 상황과 UI 구조를 함께 설명해야 한다.`,
    history: historyFor(group, effect),
    useWhen: uniqueList([...effect.bestFor, `${effect.category} 화면에서 ${effect.nameKr}의 역할이 명확할 때`]).slice(0, 5),
    examples: effect.bestFor.slice(0, 3).map((item) => ({
      context: item,
      description: `${item} 흐름에서 ${effect.nameKr}를 사용하면 사용자는 현재 맥락을 유지한 채 다음 행동을 판단할 수 있다.`
    })),
    anatomy: anatomyFor(group, effect),
    misuse: effect.avoidWhen.slice(0, 4),
    implementationNotes: uniqueList([...effect.implementation.slice(0, 2), ...effect.accessibility.slice(0, 2), ...effect.performance.slice(0, 1)]),
    researchRefs: refsByGroup[group] ?? refsByGroup.form
  };
}

function historyFor(group, effect) {
  const map = {
    overlay: 'Overlay 계열 패턴은 데스크탑 dialog와 모바일 sheet가 분화되며 자리 잡았다. 웹에서는 ARIA dialog 관행, 모바일 OS의 하단 시트, 접근성 focus 관리가 결합되며 현재의 형태가 되었다.',
    navigation: 'Navigation 패턴은 정보 구조가 깊어지고 화면 폭이 다양해지면서 발전했다. 모바일에서는 공간 절약, 데스크탑에서는 방향 감각과 현재 위치 표시가 핵심 기준이 되었다.',
    data: 'Data/operation 패턴은 관리자 도구와 SaaS 제품이 복잡해지면서 표, 패널, 명령형 탐색으로 발전했다. 최근에는 keyboard-first 탐색과 대량 데이터 성능이 중요한 기준이 되었다.',
    feedback: 'Feedback 패턴은 사용자의 행동 결과를 즉시 알려주기 위해 발전했다. 로딩, 검증, 알림은 시각 효과보다 상태 전달과 방해 최소화가 더 중요하다.',
    form: 'Form/selection 패턴은 입력 오류를 줄이고 선택 맥락을 좁히는 방향으로 발전했다. 접근 가능한 label, keyboard control, 오류 메시지 연결이 기본 품질 기준이다.',
    motion: 'Motion 패턴은 Flash 시대의 장식적 움직임에서 벗어나 CSS transform, IntersectionObserver, reduced-motion 대응 중심의 기능적 움직임으로 정리되었다.'
  };
  return `${map[group] ?? map.form} ${effect.name}는 이 흐름 안에서 ${effect.bestFor.slice(0, 2).join(', ')} 같은 상황에 맞춰 쓰인다.`;
}

function anatomyFor(group, effect) {
  const map = {
    overlay: ['trigger', 'backdrop', 'surface', 'title', 'primary action', 'dismiss control'],
    navigation: ['current location', 'navigation item', 'active state', 'secondary action', 'responsive fallback'],
    data: ['container', 'row or item', 'selection state', 'toolbar', 'empty state', 'loading state'],
    feedback: ['triggering event', 'status message', 'visual state', 'recovery action', 'dismiss policy'],
    form: ['label', 'input or option', 'selected state', 'validation message', 'helper text'],
    motion: ['trigger', 'initial state', 'animated transform', 'final state', 'reduced-motion fallback']
  };
  return map[group] ?? ['trigger', 'state', 'content', 'fallback'];
}

function uniqueList(items) {
  return [...new Set(items.filter((item) => typeof item === 'string' && item.trim()))];
}

function buildResearchPrompts() {
  return {
    version: '2026-05-10',
    grokPrompts: {
      ismCandidate: 'For each candidate design style, return JSON: id, name, nameKr suggestion, category, definition, history, visualTraits, webUiInterpretation, keywords, paletteDirection, 10 real live website examples, risks, sourceUrls. Exclude Dribbble, Behance, Pinterest, and wiki-only sources.',
      officialReference: 'For each official design-system reference, return JSON: name, officialUrl, maintainer, scope, bestFor, componentAreas, accessibilityGuidance, designTokens, whatToUseInDesignIsms, whatNotToCopy, sourceUrls.',
      effectDocs: 'For each UI effect/pattern, return JSON keyed by effect id: background, shortHistory, useWhen, examples, anatomy, misuse, implementationNotes, accessibilitySources, sourceUrls. Prefer official docs such as WAI-ARIA APG, MDN, Apple HIG, Material, Fluent, Carbon, Atlassian, and Polaris.',
      exampleSites: 'List 10 real, currently live websites that exemplify the given visual style. No Dribbble, Behance, Pinterest, or Wikipedia. Return JSON array with name, url, whyItFits, and visualTraits.'
    },
    firstBatchTargets: referenceEntries.map(({ id, name, kind, researchPrompt, imagePrompt }) => ({ id, name, kind, researchPrompt, imagePrompt }))
  };
}

function buildImageJobs() {
  const jobs = [];
  const ismEntries = referenceEntries.filter((entry) => entry.kind === 'ISM Candidate');
  const refEntries = referenceEntries.filter((entry) => entry.kind === 'Official Reference');
  const imageSlots = [
    ['landing.png', 'landing page showing the style at full visual strength'],
    ['shop.png', 'commerce/product listing page testing cards, buttons, and pricing density'],
    ['dashboard.png', 'functional dashboard or tool surface testing controls, charts, and information hierarchy']
  ];
  for (const entry of ismEntries) {
    for (const [file, role] of imageSlots) {
      jobs.push(imageJob(entry.id, 'ism', join('assets/images', entry.id, file), `${entry.imagePrompt} Composition: ${role}.`));
    }
  }
  for (const entry of refEntries) {
    jobs.push(imageJob(entry.id, 'reference', join('assets/images/references', entry.id, 'overview.png'), entry.imagePrompt));
  }
  return jobs;
}

function imageJob(id, kind, target, prompt) {
  return {
    id: `${kind}-${id}-${target.split('/').at(-1)?.replace('.png', '')}`,
    kind,
    target,
    webp: target.replace('assets/images/', 'assets/images/thumbs/').replace(/\.png$/, '.webp'),
    model: 'gpt-image-2',
    size: '1536x1024',
    quality: 'high',
    prompt
  };
}

function writeJson(path, value) {
  const fullPath = join(root, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, JSON.stringify(value, null, 2) + '\n');
}

function writeKeyedObjectLines(path, value) {
  const fullPath = join(root, path);
  const entries = Object.entries(value);
  const lines = ['{'];
  entries.forEach(([key, item], index) => {
    const comma = index === entries.length - 1 ? '' : ',';
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(item)}${comma}`);
  });
  lines.push('}');
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, lines.join('\n') + '\n');
}

function writeText(path, value) {
  const fullPath = join(root, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, value);
}

const docsMap = Object.fromEntries(effects.map((effect) => [effect.id, docsFor(effect)]));
const imageJobs = buildImageJobs();

writeKeyedObjectLines('assets/data/effects-docs.json', docsMap);
writeJson('assets/data/references.json', referenceEntries);
writeJson('assets/data/research-prompts.json', buildResearchPrompts());
writeText('devlog/260510_nav_taxonomy_effect_docs/image_jobs.jsonl', imageJobs.map((job) => JSON.stringify(job)).join('\n') + '\n');
writeText('devlog/260510_nav_taxonomy_effect_docs/grok_research_prompts.md', renderPromptDoc(referenceEntries, imageJobs));

console.log(`prepared effects-docs=${effects.length}, references=${referenceEntries.length}, imageJobs=${imageJobs.length}`);

function renderPromptDoc(entries, jobs) {
  const promptLines = entries.map((entry) => `### ${entry.name}\n\nGrok:\n\`\`\`text\n${entry.researchPrompt}\n\`\`\`\n\nima2:\n\`\`\`text\n${entry.imagePrompt}\n\`\`\``).join('\n\n');
  return `---\ncreated: 2026-05-10\nstatus: implemented\ntags: [grok, ima2, prompts, manifest]\n---\n\n# Grok Research and ima2 Prompt Manifest\n\nThese prompts are the confirmed input text for the next design-isms research and image-generation pass.\n\n## Global Grok Prompt Rules\n\n- Return strict JSON, not prose.\n- Prefer official or primary sources.\n- Exclude Dribbble, Behance, Pinterest, and wiki-only evidence.\n- Include source URLs with every historical or usage claim.\n- Separate visual-style candidates from official design-system references.\n\n## Per-Target Prompts\n\n${promptLines}\n\n## ima2 Job Count\n\n- Total jobs: ${jobs.length}\n- ISM candidate jobs: ${jobs.filter((job) => job.kind === 'ism').length}\n- Reference overview jobs: ${jobs.filter((job) => job.kind === 'reference').length}\n\nSee \`image_jobs.jsonl\` for target paths and WebP output paths.\n`;
}
