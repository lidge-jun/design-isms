const DATA_VERSION = '2026-05-10-ism43-effects46';
const DATA_URL = `./assets/data/isms.json?v=${DATA_VERSION}`;
const IMAGE_BASE_URL = './assets/images';
const THUMB_BASE_URL = './assets/images/thumbs';

type Lang = 'ko' | 'en';
type UIStringKey =
  | 'search'
  | 'moreSites'
  | 'showLess'
  | 'colorPalette'
  | 'keywords'
  | 'exampleSites'
  | 'relatedIsms'
  | 'devGuide'
  | 'devGuideComponents'
  | 'devGuideBuild'
  | 'devGuideChecks'
  | 'designMockup'
  | 'footerTitle'
  | 'footerGen';

interface IsmExample {
  name: string;
  url: string;
}

interface IsmImage {
  file: string;
  label: string;
}

interface IsmPrompt {
  file: string;
  prompt: string;
  model?: string;
  quality?: string;
  size?: string;
}

interface DesignIsm {
  id: string;
  name: string;
  nameKr: string;
  tagline: string;
  description: string;
  descriptionEn?: string;
  history?: string;
  keywords: string[];
  palette: string[];
  examples: IsmExample[];
  images: IsmImage[];
  prompts?: IsmPrompt[];
}

interface RelatedScore {
  ism: DesignIsm;
  score: number;
}

interface DevelopmentGuide {
  summary: string;
  components: string[];
  build: string[];
  checks: string[];
}

const UI_STRINGS: Record<Lang, Record<UIStringKey, string>> = {
  ko: {
    search: 'ISM 검색...',
    moreSites: '+ {n}개 더 보기',
    showLess: '− 접기',
    colorPalette: '컬러 팔레트',
    keywords: '키워드',
    exampleSites: '예시 사이트',
    relatedIsms: '관련 ISM',
    devGuide: '개발 가이드',
    devGuideComponents: '어울리는 컴포넌트',
    devGuideBuild: '구현 방법',
    devGuideChecks: '검증 포인트',
    designMockup: '{name} 디자인 시안',
    footerTitle: 'Design -isms 레퍼런스 보드',
    footerGen: 'GPT Image 2로 생성'
  },
  en: {
    search: 'Search isms...',
    moreSites: '+ {n} more sites',
    showLess: '− show less',
    colorPalette: 'Color Palette',
    keywords: 'Keywords',
    exampleSites: 'Example Sites',
    relatedIsms: 'Related ISMs',
    devGuide: 'Development Guide',
    devGuideComponents: 'Fitting Components',
    devGuideBuild: 'Build Method',
    devGuideChecks: 'Verification Points',
    designMockup: '{name} Design Mockup',
    footerTitle: 'Design -isms Reference Board',
    footerGen: 'Images generated with GPT Image 2'
  }
};

const DEVELOPMENT_GUIDES: Record<string, DevelopmentGuide> = {
  minimalism: {
    summary: '정보 위계를 여백, 타이포그래피, 단일 행동으로 만드는 스타일이다. 컴포넌트 수를 줄이고 상태 표현을 아주 절제한다.',
    components: ['단일 CTA hero', 'Editorial article', 'Pricing table', 'Product detail', 'Minimal nav'],
    build: ['section 간격을 먼저 정하고 border는 마지막에 쓴다.', '컬러는 본문, 보조 텍스트, CTA의 3단계로 제한한다.', '이미지 없이도 headline과 CTA만으로 흐름이 읽히게 만든다.'],
    checks: ['모바일에서 첫 화면의 주요 행동이 하나만 보인다.', '카드나 섹션이 장식 없이 간격만으로 구분된다.', '회색 텍스트 대비가 접근성 기준을 해치지 않는다.']
  },
  bauhaus: {
    summary: '기하학, 원색, 기능주의를 컴포넌트 구조에 그대로 드러내는 방식이다. 버튼과 패널은 장식보다 형태 대비로 구분한다.',
    components: ['Geometric hero', 'Poster grid', 'Course card', 'Gallery index', 'Primary-color controls'],
    build: ['원, 사각형, 선을 실제 레이아웃 축으로 사용한다.', '빨강, 파랑, 노랑은 상태가 아니라 구조적 강조에 배치한다.', '비대칭 그리드라도 baseline과 column 규칙은 유지한다.'],
    checks: ['장식 도형이 콘텐츠를 가리지 않는다.', '원색 면적이 CTA와 충돌하지 않는다.', '텍스트 정렬 기준선이 화면 전체에서 유지된다.']
  },
  'flat-design': {
    summary: '평면 색면과 단순 아이콘으로 빠르게 읽히는 인터페이스를 만든다. 복잡한 질감 대신 명확한 상태와 큰 터치 영역이 중요하다.',
    components: ['Icon dashboard', 'Feature grid', 'Mobile onboarding', 'Settings list', 'Status banner'],
    build: ['그림자 대신 색상 대비와 공간으로 계층을 만든다.', '아이콘은 한 stroke/fill 체계로 통일한다.', 'hover, active, disabled 상태를 색면 변화로 명확히 둔다.'],
    checks: ['아이콘만으로 의미가 전달되지 않는 곳에는 label이 있다.', '버튼과 카드의 radius가 일관된다.', '색상 대비가 너무 낮은 pastel 조합을 피한다.']
  },
  'material-design': {
    summary: '표면, elevation, motion을 명확한 시스템으로 다루는 스타일이다. 컴포넌트는 카드와 FAB처럼 역할이 분명해야 한다.',
    components: ['App shell', 'FAB action', 'Card feed', 'Dialog', 'Form field stack'],
    build: ['surface와 background 색을 분리한다.', 'elevation 단계는 2-3개만 사용한다.', 'motion은 entrance보다 상태 전환 설명에 쓴다.'],
    checks: ['FAB가 화면의 최우선 행동과 연결된다.', '카드 안 interactive 요소의 touch target이 충분하다.', 'focus, hover, pressed 상태가 모두 구분된다.']
  },
  'art-deco': {
    summary: '대칭, 금속성 대비, 장식 테두리로 고급스러운 인상을 만든다. 정보 UI보다는 예약, 초대, 브랜드 페이지에 강하다.',
    components: ['Luxury landing', 'Invitation card', 'Hotel booking panel', 'Membership tier', 'Event schedule'],
    build: ['중앙 정렬과 좌우 대칭을 기본 뼈대로 잡는다.', '금색은 border, divider, icon에 얇게 사용한다.', '장식 패턴은 content frame 바깥에 둔다.'],
    checks: ['장식이 본문 가독성을 낮추지 않는다.', 'gold 계열 색이 과포화되지 않는다.', '모바일에서 대칭 구조가 좁은 폭에 맞게 단순화된다.']
  },
  'swiss-style': {
    summary: '그리드, 산세리프, 사진과 타이포의 질서로 설득력을 만든다. 모든 컴포넌트는 column과 baseline에 묶인다.',
    components: ['Editorial index', 'Case-study page', 'Poster hero', 'Data table', 'Corporate nav'],
    build: ['12-column 또는 6-column grid를 먼저 고정한다.', '이미지는 crop보다 정보 역할을 기준으로 배치한다.', '굵기와 크기 대비로만 hierarchy를 만든다.'],
    checks: ['임의의 중앙 정렬이 섞이지 않는다.', '텍스트 블록의 line length가 과하지 않다.', 'grid를 벗어난 요소에는 의도된 이유가 있다.']
  },
  brutalism: {
    summary: '원시적인 구조, 강한 대비, 노출된 UI 뼈대로 에너지를 만든다. 단, 사용성까지 무너뜨리면 anti-pattern이 된다.',
    components: ['Raw landing', 'Directory list', 'Manifesto page', 'Command button', 'High-contrast form'],
    build: ['border, monospace, hard contrast를 명확히 사용한다.', '불규칙 배치는 hero나 feature 일부로 제한한다.', '링크와 버튼은 과장되더라도 역할을 분명히 한다.'],
    checks: ['클릭 가능한 요소가 시각적으로 즉시 보인다.', 'broken grid가 reading order를 깨지 않는다.', '고대비 조합이 눈부심을 만들지 않는다.']
  },
  skeuomorphism: {
    summary: '실제 물체의 질감과 은유로 조작 방법을 직관적으로 보여준다. 생산성 앱에서는 affordance가 강점이다.',
    components: ['Calculator keypad', 'Bookshelf library', 'Notebook editor', 'Audio knob', 'Ticket card'],
    build: ['질감은 interactive affordance가 있는 부위에 집중한다.', '그림자 방향과 광원을 전체 화면에서 통일한다.', '물리 은유가 실제 기능과 맞는지 먼저 확인한다.'],
    checks: ['장식 질감이 텍스트 대비를 방해하지 않는다.', '버튼의 pressed 상태가 물리적으로 납득된다.', '레티나 화면에서 texture가 흐릿하지 않다.']
  },
  'dark-mode': {
    summary: '어두운 배경 위에서 대비와 accent를 정교하게 조절하는 스타일이다. 검정 하나가 아니라 surface 층위가 필요하다.',
    components: ['Analytics dashboard', 'Streaming card', 'Code panel', 'Settings surface', 'Command palette'],
    build: ['background, surface, elevated surface를 분리한다.', 'accent는 CTA와 status에만 제한한다.', 'border는 밝은 선보다 투명도 낮은 light stroke를 쓴다.'],
    checks: ['회색 본문이 너무 어둡지 않다.', 'danger, success 상태가 accent와 혼동되지 않는다.', 'OLED black과 카드 surface가 구분된다.']
  },
  'retro-vintage': {
    summary: '종이, grain, serif, 따뜻한 색감으로 오래된 브랜드 감각을 만든다. 메뉴판, 카페, 포스터형 페이지에 잘 맞는다.',
    components: ['Cafe menu', 'Poster hero', 'Editorial card', 'Stamp badge', 'Product label'],
    build: ['serif heading과 readable sans body를 조합한다.', 'grain은 배경에 약하게만 적용한다.', 'badge와 divider로 시대감을 만든다.'],
    checks: ['빈티지 질감이 저화질처럼 보이지 않는다.', '본문 크기가 장식 폰트에 끌려 작아지지 않는다.', '색감이 sepia 한 톤으로만 갇히지 않는다.']
  },
  futurism: {
    summary: '사선, 속도감, 기술적 대비로 미래적 인상을 만든다. 랜딩과 캠페인에서는 강하지만 폼 UI는 절제해야 한다.',
    components: ['Tech hero', 'Feature rail', 'Spec panel', 'Launch countdown', 'Diagonal CTA'],
    build: ['사선 shape를 section separator로 사용한다.', '속도감 있는 type scale을 hero에 집중한다.', '기능 설명 영역은 grid로 다시 안정화한다.'],
    checks: ['사선 레이아웃이 모바일에서 잘리지 않는다.', '동적 효과 없이도 정보가 읽힌다.', 'CTA가 배경 그래픽에 묻히지 않는다.']
  },
  'memphis-design': {
    summary: '패턴, 충돌하는 색, 장난스러운 도형으로 친근한 에너지를 만든다. 과하면 CTA 집중도가 떨어진다.',
    components: ['Playful hero', 'Product tile', 'Promo banner', 'Sticker button', 'Category grid'],
    build: ['패턴은 corner나 background layer에 제한한다.', '컴포넌트 내부 텍스트 영역은 단색으로 보호한다.', '도형의 z-index 규칙을 명확히 둔다.'],
    checks: ['패턴이 링크와 버튼을 가리지 않는다.', '색 조합이 브랜드 메시지와 충돌하지 않는다.', '모바일에서 장식 도형이 제거되어도 화면이 성립한다.']
  },
  cyberpunk: {
    summary: '어두운 표면, neon accent, glitch 감각으로 긴장감을 만든다. 게임, 이벤트, 음악 페이지에서 효과가 크다.',
    components: ['Game landing', 'Neon nav', 'Terminal card', 'Event ticket', 'Status HUD'],
    build: ['neon은 외곽선과 active 상태에 집중한다.', 'glitch는 제목이나 transition 일부로 제한한다.', '정보 패널은 dark surface 위에 얇은 border로 쌓는다.'],
    checks: ['neon glow가 텍스트를 흐리게 만들지 않는다.', '애니메이션을 끈 상태에서도 사용 가능하다.', '빨강/초록 상태가 배경과 충분히 분리된다.']
  },
  psychedelic: {
    summary: '소용돌이, 강한 색, 실험적 형태로 몰입감을 만든다. 콘텐츠 UI보다 음악, 페스티벌, 포스터성 화면에 맞다.',
    components: ['Festival hero', 'Album page', 'Poster stack', 'Animated marquee', 'Ticket CTA'],
    build: ['복잡한 배경 위에는 solid text plate를 둔다.', '색 대비는 의도적으로 강하게 쓰되 CTA 색은 고정한다.', '패턴 motion은 prefers-reduced-motion을 고려한다.'],
    checks: ['본문 영역과 그래픽 영역이 분리된다.', '움직임이 과도한 현기증을 만들지 않는다.', 'CTA가 패턴 속에서 사라지지 않는다.']
  },
  vaporwave: {
    summary: 'retro digital, gradient, neon, nostalgia를 섞어 인터넷 문화 감각을 만든다. 음악 플레이어와 컬렉션 UI에 잘 맞는다.',
    components: ['Music player', 'Collection grid', 'Retro hero', 'Media card', 'Neon tab'],
    build: ['gradient 배경 위에 카드 surface를 분리한다.', 'chrome 또는 grid motif는 wrapper에만 둔다.', '본문은 nostalgia 폰트보다 readable font를 우선한다.'],
    checks: ['gradient가 한 톤으로 뭉개지지 않는다.', '카드와 배경의 대비가 충분하다.', 'retro 효과가 실제 조작을 방해하지 않는다.']
  },
  y2k: {
    summary: 'chrome, bubble, translucent surface로 2000년대 디지털 감각을 만든다. 패션, 커뮤니티, 모바일 UI에 어울린다.',
    components: ['Fashion landing', 'Bubble nav', 'Profile card', 'Sticker modal', 'Mobile launcher'],
    build: ['translucent surface에는 반드시 readable backdrop을 둔다.', 'bubble radius와 glossy highlight를 컴포넌트 단위로 반복한다.', '아이콘은 chunky하고 명확하게 만든다.'],
    checks: ['투명 카드 뒤 텍스트가 겹치지 않는다.', 'gloss highlight가 버튼 label을 방해하지 않는다.', '모바일에서 장식이 터치 영역을 침범하지 않는다.']
  },
  maximalism: {
    summary: '많은 레이어, 강한 색, 풍부한 패턴으로 브랜드 세계관을 만든다. 구조를 잡지 않으면 화면이 쉽게 무너진다.',
    components: ['Editorial cover', 'Fashion grid', 'Campaign hero', 'Layered product card', 'Lookbook carousel'],
    build: ['콘텐츠 우선순위를 1, 2, 3단계로 고정한다.', '패턴과 이미지는 section 단위로 나누어 충돌을 줄인다.', 'CTA 주변만큼은 충분한 빈 공간을 남긴다.'],
    checks: ['첫 화면에서 가장 중요한 문장이 즉시 보인다.', '레이어가 많아도 tab 순서가 자연스럽다.', '이미지 lazy loading이 적용된다.']
  },
  steampunk: {
    summary: 'brass, gear, victorian ornament로 기계적 판타지를 만든다. 게임, 수집품, 스토리형 제품 페이지에 잘 맞는다.',
    components: ['Inventory panel', 'Map interface', 'Product artifact card', 'Mechanical toggle', 'Lore timeline'],
    build: ['금속 질감은 frame과 control에 집중한다.', 'gear 장식은 실제 상태 변화와 연결하면 설득력이 커진다.', '본문은 장식 serif보다 읽기 쉬운 조합을 쓴다.'],
    checks: ['갈색/금색이 한 덩어리로 뭉치지 않는다.', '장식 frame이 좁은 화면에서 사라져도 기능이 남는다.', '버튼의 enabled 상태가 분명하다.']
  },
  glassmorphism: {
    summary: 'blur, transparency, light border로 떠 있는 표면을 만든다. 배경과 카드 대비를 안전하게 설계해야 한다.',
    components: ['Glass login', 'Floating card', 'Mobile control panel', 'Weather widget', 'Pricing overlay'],
    build: ['backdrop blur 뒤에는 충분히 단순한 배경을 둔다.', 'glass surface마다 border와 subtle shadow를 함께 둔다.', '투명도는 텍스트 영역보다 wrapper에 적용한다.'],
    checks: ['blur 미지원 브라우저에서도 텍스트가 읽힌다.', '카드 뒤 이미지가 본문과 충돌하지 않는다.', 'contrast fallback 색이 있다.']
  },
  neumorphism: {
    summary: '부드러운 inset/outset shadow로 표면을 눌러 만든다. 낮은 대비 때문에 접근성 검증이 특히 중요하다.',
    components: ['Music control', 'Login panel', 'Toggle group', 'Slider', 'Soft dashboard widget'],
    build: ['배경색과 카드색을 거의 같게 두고 shadow로만 계층을 만든다.', 'pressed 상태는 inset shadow로 표현한다.', '텍스트와 icon contrast는 별도 기준으로 확보한다.'],
    checks: ['버튼 경계가 색각/저시력 환경에서도 보인다.', 'disabled와 pressed 상태가 혼동되지 않는다.', 'shadow만으로 필수 정보를 전달하지 않는다.']
  },
  'corporate-memphis': {
    summary: '친근한 일러스트와 SaaS 구조를 결합해 부담 없는 제품 설명을 만든다. 운영 도구에서는 장식을 절제해야 한다.',
    components: ['SaaS hero', 'Onboarding stepper', 'Pricing card', 'Feature illustration row', 'Empty state'],
    build: ['일러스트는 feature 설명 옆 보조 역할로 둔다.', '카드는 정보 비교가 가능한 동일 높이로 맞춘다.', '캐릭터는 empty/error state에 제한하면 좋다.'],
    checks: ['일러스트가 제품 화면보다 더 중요해 보이지 않는다.', '가격/기능 비교가 스캔 가능하다.', 'B2B tone이 너무 유치해지지 않는다.']
  },
  'neo-brutalism': {
    summary: '두꺼운 border, hard shadow, vivid color로 즉각적인 힘을 만든다. 카드와 버튼이 명확한 제품 UI에 잘 맞는다.',
    components: ['Hard-shadow card', 'Signup hero', 'Shop tile', 'Quiz block', 'Bold form'],
    build: ['border 두께와 shadow offset을 토큰으로 고정한다.', 'hover는 translate보다 shadow 방향 변화로 준다.', '색은 loud하게 쓰되 텍스트 plate는 단순하게 둔다.'],
    checks: ['hard shadow가 layout overflow를 만들지 않는다.', 'border 두께가 모바일에서 과하지 않다.', 'CTA와 일반 카드가 명확히 구분된다.']
  },
  'gradient-aurora': {
    summary: 'mesh gradient와 유동적인 색 흐름으로 부드러운 미래감을 만든다. SaaS hero와 모바일 앱 소개에 강하다.',
    components: ['Aurora hero', 'SaaS feature card', 'Mobile preview', 'Signup panel', 'Metric strip'],
    build: ['gradient는 배경 레이어로 두고 텍스트 surface를 분리한다.', '색 흐름은 2-4개 핵심 색으로 제한한다.', 'blurred shape 대신 실제 gradient bitmap이나 CSS mesh를 선택한다.'],
    checks: ['텍스트가 gradient 밝은 영역과 겹치지 않는다.', '저사양 모바일에서 animation이 과하지 않다.', '브랜드 컬러가 gradient 안에서 유지된다.']
  },
  'bento-grid': {
    summary: '모듈형 카드 배치로 여러 기능을 한 화면에서 빠르게 비교하게 만든다. 각 tile의 역할과 크기 규칙이 핵심이다.',
    components: ['Feature bento', 'Dashboard overview', 'Product showcase grid', 'Metric card', 'Media tile'],
    build: ['tile size를 content priority에 맞춰 정한다.', '각 카드의 header, media, action 위치를 통일한다.', '모바일에서는 bento를 단일 column 순서로 풀어낸다.'],
    checks: ['카드 크기가 hover나 이미지 로딩으로 흔들리지 않는다.', '중요 tile이 첫 viewport 안에 들어온다.', '모바일 순서가 의미 순서와 일치한다.']
  },
  kawaii: {
    summary: 'pastel, rounded shape, 작은 캐릭터 요소로 귀여운 친밀감을 만든다. 입력/구매 흐름에서는 명확성을 잃지 않아야 한다.',
    components: ['Mascot onboarding', 'Pastel shop card', 'Sticker badge', 'Rounded tab bar', 'Friendly empty state'],
    build: ['radius와 padding을 넉넉하게 둔다.', '캐릭터는 안내나 보상 상태에 배치한다.', 'pastel 위 텍스트 대비를 별도로 확인한다.'],
    checks: ['귀여운 장식이 오류 메시지를 약하게 만들지 않는다.', '버튼 label이 작은 화면에서 줄바꿈된다.', '캐릭터가 form field를 가리지 않는다.']
  },
  japandi: {
    summary: '차분한 자연 소재, 넓은 여백, 낮은 대비로 안정감을 만든다. 라이프스타일, 인테리어, 웰니스 UI에 맞다.',
    components: ['Interior landing', 'Journal card', 'Product story', 'Calm booking form', 'Gallery detail'],
    build: ['neutral palette에 한 가지 warm accent만 둔다.', '이미지 비율과 여백을 일정하게 유지한다.', 'border보다 배경 톤 차이로 grouping한다.'],
    checks: ['저대비 텍스트가 너무 흐리지 않다.', '이미지 crop이 제품/공간 정보를 잃지 않는다.', '모바일에서 여백이 과해 정보가 밀리지 않는다.']
  },
  'organic-design': {
    summary: '곡선, blob, 자연 색감으로 부드러운 흐름을 만든다. 건강, 웰니스, 친환경 제품에 잘 맞는다.',
    components: ['Wellness hero', 'Blob card', 'Ingredient section', 'Curved CTA band', 'Flowing testimonial'],
    build: ['곡선 shape를 section boundary에 사용한다.', '카드는 rounded하되 내부 alignment는 안정적으로 둔다.', 'earth tone 안에 CTA 대비색을 하나 둔다.'],
    checks: ['blob이 텍스트 영역을 침범하지 않는다.', '곡선 때문에 layout 기준선이 사라지지 않는다.', '자연색 팔레트가 한 톤으로 뭉치지 않는다.']
  },
  'kinetic-typography': {
    summary: '큰 글자와 움직임으로 메시지를 전면에 세운다. portfolio, agency, campaign hero에서 강하게 작동한다.',
    components: ['Type hero', 'Marquee section', 'Scroll-driven headline', 'Agency case card', 'Word-based nav'],
    build: ['motion이 없는 상태의 static layout을 먼저 만든다.', '큰 글자 주변에 충분한 collision-safe 영역을 둔다.', 'scroll effect는 headline 단위로 제한한다.'],
    checks: ['prefers-reduced-motion에서 정보가 사라지지 않는다.', '긴 단어가 모바일 너비를 넘지 않는다.', '움직이는 텍스트가 CTA를 가리지 않는다.']
  },
  'frutiger-aero': {
    summary: 'glossy surface, 자연 이미지, 낙관적 gradient로 2000년대 친환경 디지털 감각을 만든다.',
    components: ['Glossy dashboard', 'Nature hero', 'Weather widget', 'Aqua button', 'Translucent panel'],
    build: ['gloss highlight와 translucent panel을 함께 쓴다.', '자연 이미지는 실제 정보 배경으로 과하게 어둡히지 않는다.', 'rounded glossy button의 상태를 명확히 둔다.'],
    checks: ['광택이 텍스트를 가리지 않는다.', '배경 이미지 위 panel 대비가 충분하다.', 'nostalgia가 오래된 UI처럼 보이는 수준에 머물지 않는다.']
  },
  claymorphism: {
    summary: '말랑한 3D clay 형태로 친근한 제품 UI를 만든다. 아이콘, onboarding, shop card에서 효과가 좋다.',
    components: ['3D icon grid', 'Onboarding card', 'Soft shop tile', 'Achievement badge', 'Playful CTA'],
    build: ['clay object와 실제 UI control을 구분한다.', 'shadow와 highlight 방향을 통일한다.', 'rounded geometry를 icon과 card에 반복한다.'],
    checks: ['3D 장식이 클릭 가능한 요소처럼 오해되지 않는다.', '이미지 로딩 전에도 레이아웃 크기가 고정된다.', 'pastel 배경에서 텍스트 대비가 충분하다.']
  },
  'dopamine-design': {
    summary: '강한 색, 둥근 형태, 빠른 보상감을 통해 활기찬 제품 경험을 만든다. 쇼핑, Gen-Z 앱, 캠페인에 잘 맞다.',
    components: ['Colorful hero', 'Reward badge', 'Product tile', 'Swipe card', 'Celebration state'],
    build: ['색상은 많아도 action color는 하나로 고정한다.', 'rounded card와 큰 icon으로 스캔 속도를 높인다.', 'micro interaction은 보상 상태에 집중한다.'],
    checks: ['색이 많아도 구매/가입 버튼이 가장 먼저 보인다.', '애니메이션 없이도 보상 상태가 이해된다.', '모바일에서 컬러 블록이 세로로 과밀하지 않다.']
  },
  'anti-design': {
    summary: '규칙을 일부러 깨며 긴장감과 실험성을 만든다. 그래도 사용자가 길을 잃지 않도록 최소한의 anchor가 필요하다.',
    components: ['Experimental portfolio', 'Broken poster', 'Asymmetric nav', 'Manifesto block', 'Raw link list'],
    build: ['읽기 순서와 클릭 target은 유지한 채 visual rule만 깬다.', 'clash color는 section 단위로 제한한다.', '핵심 CTA는 의외로 단순한 위치에 둔다.'],
    checks: ['키보드 탐색 순서가 시각 배치와 충돌하지 않는다.', '의도적 깨짐과 실제 버그가 구분된다.', '사용자가 다음 행동을 찾을 수 있다.']
  },
  cottagecore: {
    summary: '꽃, 수공예, 따뜻한 종이 감성으로 아늑한 경험을 만든다. 블로그, 상점, 레시피 UI에 잘 맞는다.',
    components: ['Recipe card', 'Handmade shop tile', 'Floral blog', 'Journal entry', 'Warm newsletter form'],
    build: ['floral 장식은 corner와 divider에 배치한다.', '본문은 readable serif/sans 조합으로 유지한다.', 'warm background 위 CTA 대비를 충분히 둔다.'],
    checks: ['장식 패턴이 입력 필드와 겹치지 않는다.', 'nostalgic tone이 흐릿한 UI가 되지 않는다.', '상품 정보가 감성 이미지에 묻히지 않는다.']
  },
  solarpunk: {
    summary: '친환경 미래, 자연과 기술의 조화, 밝은 낙관성을 표현한다. sustainability 제품과 도시/에너지 서비스에 어울린다.',
    components: ['Eco hero', 'Impact metric card', 'Green product tile', 'Community map', 'Solar dashboard'],
    build: ['green palette에 technology accent를 더한다.', '자연 이미지와 데이터 카드를 같은 grid에 배치한다.', 'impact metric을 시각적 중심으로 만든다.'],
    checks: ['친환경 이미지가 실제 제품 설명을 대체하지 않는다.', 'green 색만으로 상태를 구분하지 않는다.', '미래적 장식과 정보 카드의 대비가 균형 잡힌다.']
  },
  'indie-web': {
    summary: '개인적이고 손맛 있는 구조로 독립 웹의 진정성을 만든다. 블로그, 링크 페이지, 개인 프로젝트에 잘 맞다.',
    components: ['Personal homepage', 'Link garden', 'Blog index', 'Now page', 'Tiny guestbook'],
    build: ['완벽한 grid보다 직접 만든 듯한 rhythm을 살린다.', '작은 link와 note component를 명확히 구분한다.', '과한 framework 느낌을 줄이고 HTML 구조를 드러낸다.'],
    checks: ['quirky함이 링크 식별성을 해치지 않는다.', '모바일에서 작은 텍스트가 너무 작지 않다.', '개인적 톤과 접근성이 함께 유지된다.']
  }
};

let allIsms: DesignIsm[] = [];
let activeFilter = 'all';
let searchQuery = '';
let currentLang: Lang = localStorage.getItem('design-isms-lang') === 'en' ? 'en' : 'ko';
let imgObserver: IntersectionObserver | null = null;
let pageRevealed = false;
let cardObserver: IntersectionObserver | null = null;

const toastTimers = new WeakMap<HTMLElement, number>();

function t(key: UIStringKey, vars: Record<string, string | number> = {}): string {
  let str = UI_STRINGS[currentLang][key] || UI_STRINGS.en[key] || key;
  Object.entries(vars).forEach(([varKey, value]) => {
    str = str.replace('{' + varKey + '}', String(value));
  });
  return str;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isExampleArray(value: unknown): value is IsmExample[] {
  return Array.isArray(value) && value.every(item =>
    isRecord(item) && typeof item.name === 'string' && typeof item.url === 'string'
  );
}

function isImageArray(value: unknown): value is IsmImage[] {
  return Array.isArray(value) && value.every(item =>
    isRecord(item) && typeof item.file === 'string' && typeof item.label === 'string'
  );
}

function isPromptArray(value: unknown): value is IsmPrompt[] {
  return Array.isArray(value) && value.every(item =>
    isRecord(item) && typeof item.file === 'string' && typeof item.prompt === 'string'
  );
}

function readRequiredString(
  item: Record<string, unknown>,
  key: string,
  index: number
): string {
  const value = item[key];
  if (typeof value !== 'string') {
    throw new Error('Invalid isms data: item ' + index + ' missing string field "' + key + '".');
  }
  return value;
}

function parseIsms(raw: unknown): DesignIsm[] {
  if (!Array.isArray(raw)) {
    throw new Error('Invalid isms data: expected an array.');
  }

  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error('Invalid isms data: item ' + index + ' is not an object.');
    }

    if (!isStringArray(item.keywords)) {
      throw new Error('Invalid isms data: item ' + index + ' missing keywords.');
    }
    if (!isStringArray(item.palette)) {
      throw new Error('Invalid isms data: item ' + index + ' missing palette.');
    }
    if (!isExampleArray(item.examples)) {
      throw new Error('Invalid isms data: item ' + index + ' missing examples.');
    }
    if (!isImageArray(item.images)) {
      throw new Error('Invalid isms data: item ' + index + ' missing images.');
    }

    const ism: DesignIsm = {
      id: readRequiredString(item, 'id', index),
      name: readRequiredString(item, 'name', index),
      nameKr: readRequiredString(item, 'nameKr', index),
      tagline: readRequiredString(item, 'tagline', index),
      description: readRequiredString(item, 'description', index),
      keywords: item.keywords,
      palette: item.palette,
      examples: item.examples,
      images: item.images
    };

    if (typeof item.descriptionEn === 'string') {
      ism.descriptionEn = item.descriptionEn;
    }
    if (typeof item.history === 'string') {
      ism.history = item.history;
    }
    if (isPromptArray(item.prompts)) {
      ism.prompts = item.prompts;
    }

    return ism;
  });
}

function queryRequired<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error('Missing required element: ' + selector);
  }
  return element;
}

function getRequired<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error('Missing required element: #' + id);
  }
  return element as T;
}

function eventElement(event: Event): Element | null {
  return event.target instanceof Element ? event.target : null;
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function originalImageSrc(ismId: string, file: string): string {
  return `${IMAGE_BASE_URL}/${ismId}/${file}`;
}

function thumbnailFile(file: string): string {
  return file.replace(/\.[^.]+$/, '.webp');
}

function thumbImageSrc(ismId: string, file: string): string {
  return `${THUMB_BASE_URL}/${ismId}/${thumbnailFile(file)}`;
}

function getDesc(ism: DesignIsm): string {
  return currentLang === 'en' && ism.descriptionEn ? ism.descriptionEn : ism.description;
}

function getHistory(ism: DesignIsm): string {
  return ism.history || '';
}

function getDevelopmentGuide(ism: DesignIsm): DevelopmentGuide {
  const guide = DEVELOPMENT_GUIDES[ism.id];
  if (guide) {
    return guide;
  }

  return {
    summary: ism.name + ' 스타일은 키워드와 팔레트를 실제 UI 토큰으로 번역해 일관된 화면을 만드는 방식이 중요하다.',
    components: ['Landing hero', 'Feature card', 'Example gallery', 'CTA block', 'Reference footer'],
    build: [
      '대표 키워드 ' + ism.keywords.slice(0, 3).join(', ') + '를 spacing, color, type token으로 먼저 바꾼다.',
      '카드와 버튼의 radius, border, shadow 규칙을 한 번 정하고 반복한다.',
      '이미지는 thumbnail로 보여주고 확대 시 원본을 쓰는 현재 로딩 구조를 유지한다.'
    ],
    checks: [
      '모바일 첫 화면에서 텍스트와 이미지가 겹치지 않는다.',
      'CTA, 링크, 접기 버튼의 역할이 구분된다.',
      '스타일 표현이 접근성과 성능을 해치지 않는다.'
    ]
  };
}

function listHTML(items: string[], className: string): string {
  return '<ul class="' + className + '">' + items.map(item => '<li>' + escapeHTML(item) + '</li>').join('') + '</ul>';
}

function renderDevelopmentGuide(ism: DesignIsm): string {
  const guide = getDevelopmentGuide(ism);
  const componentsHTML = guide.components
    .map(component => '<span class="modal-dev-chip">' + escapeHTML(component) + '</span>')
    .join('');

  return '<div class="modal-section-title modal-section-title-dev">' + t('devGuide') + '</div>' +
    '<section class="modal-dev-guide">' +
    '<p class="modal-dev-summary">' + escapeHTML(guide.summary) + '</p>' +
    '<div class="modal-dev-block">' +
    '<div class="modal-dev-label">' + t('devGuideComponents') + '</div>' +
    '<div class="modal-dev-components">' + componentsHTML + '</div>' +
    '</div>' +
    '<div class="modal-dev-columns">' +
    '<div class="modal-dev-block">' +
    '<div class="modal-dev-label">' + t('devGuideBuild') + '</div>' +
    listHTML(guide.build, 'modal-dev-list') +
    '</div>' +
    '<div class="modal-dev-block">' +
    '<div class="modal-dev-label">' + t('devGuideChecks') + '</div>' +
    listHTML(guide.checks, 'modal-dev-list modal-dev-list-checks') +
    '</div>' +
    '</div>' +
    '</section>';
}

async function init(): Promise<void> {
  const res = await fetch(DATA_URL);
  allIsms = parseIsms(await res.json() as unknown);

  queryRequired<HTMLElement>('.header-count').textContent = `${allIsms.length} isms`;
  buildFilters();
  render();
  setupLightbox();
  setupScrollTop();
  setupModal();
  setupCardExamplesToggle();
  setupLangToggle();
  setupImageLazy();
  dismissLoading();
}

function setupImageLazy(): void {
  if (imgObserver) {
    imgObserver.disconnect();
  }

  imgObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLImageElement)) {
        return;
      }

      const img = entry.target;
      const lazySrc = img.getAttribute('data-lazy');
      if (lazySrc) {
        img.src = lazySrc;
        img.removeAttribute('data-lazy');
      }
      imgObserver?.unobserve(img);
    });
  }, { rootMargin: '300px 0px' });

  document.querySelectorAll<HTMLImageElement>('img[data-lazy]').forEach(img => {
    imgObserver?.observe(img);
  });
}

function dismissLoading(): void {
  const firstImages = document.querySelectorAll<HTMLImageElement>('.ism-card:nth-child(-n+6) .ism-img-wrap img');
  let loaded = 0;
  const total = Math.min(firstImages.length, 6);
  if (total === 0) {
    revealPage();
    return;
  }

  function check(): void {
    loaded += 1;
    if (loaded >= total) {
      revealPage();
    }
  }

  firstImages.forEach(img => {
    if (img.complete) {
      check();
      return;
    }
    img.addEventListener('load', check);
    img.addEventListener('error', check);
  });

  window.setTimeout(revealPage, 3000);
}

function revealPage(): void {
  if (pageRevealed) {
    return;
  }

  pageRevealed = true;
  document.body.classList.remove('is-loading');

  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    overlay.addEventListener('transitionend', () => overlay.remove());
  }
}

function buildFilters(): void {
  const keywords = new Set<string>();
  allIsms.forEach(ism => ism.keywords.forEach(keyword => keywords.add(keyword)));

  const popular = [
    'whitespace', 'bold-color', 'dark-bg', 'gradient', 'neon',
    '3D', 'retro', 'geometric', 'rounded', 'playful'
  ].filter(keyword => keywords.has(keyword));

  const row = queryRequired<HTMLElement>('.filter-row');
  popular.forEach(keyword => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = keyword;
    btn.dataset.keyword = keyword;
    btn.addEventListener('click', () => {
      if (activeFilter === keyword) {
        activeFilter = 'all';
        document.querySelectorAll<HTMLElement>('.filter-btn').forEach(button => button.classList.remove('active'));
        queryRequired<HTMLElement>('.filter-btn[data-keyword="all"]').classList.add('active');
      } else {
        activeFilter = keyword;
        document.querySelectorAll<HTMLElement>('.filter-btn').forEach(button => button.classList.remove('active'));
        btn.classList.add('active');
      }
      render();
    });
    row.appendChild(btn);
  });
}

function matchFilter(ism: DesignIsm): boolean {
  if (activeFilter !== 'all' && !ism.keywords.includes(activeFilter)) {
    return false;
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const haystack = [
      ism.name, ism.nameKr, ism.tagline, ism.description,
      ...ism.keywords
    ].join(' ').toLowerCase();
    if (!haystack.includes(q)) {
      return false;
    }
  }

  return true;
}

function render(): void {
  const grid = getRequired<HTMLElement>('masonry');
  const filtered = allIsms.filter(matchFilter);

  if (cardObserver) {
    cardObserver.disconnect();
    cardObserver = null;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>No matches</h3>
        <p>Try a different keyword or clear the search.</p>
      </div>`;
    return;
  }

  const eagerCount = 6;
  let html = '';
  for (let index = 0; index < filtered.length; index += 1) {
    const ism = filtered[index];
    if (!ism) {
      continue;
    }
    html += index < eagerCount ? cardHTML(ism, index) : skeletonHTML(ism, index);
  }

  grid.innerHTML = html;
  setupCardExamplesToggle();

  if (filtered.length <= eagerCount) {
    return;
  }

  cardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
        return;
      }

      const el = entry.target;
      if (el.classList.contains('ism-card--loaded')) {
        return;
      }

      const id = el.dataset.id;
      const rawIndex = el.dataset.index;
      if (!id || !rawIndex) {
        return;
      }

      const idx = Number.parseInt(rawIndex, 10);
      const ism = allIsms.find(candidate => candidate.id === id);
      if (!ism || Number.isNaN(idx)) {
        return;
      }

      const temp = document.createElement('div');
      temp.innerHTML = cardHTML(ism, idx);
      const newCard = temp.firstElementChild;
      if (!(newCard instanceof HTMLElement)) {
        return;
      }

      newCard.classList.add('ism-card--loaded');
      el.replaceWith(newCard);
      setupCardExamplesToggle();
      newCard.querySelectorAll<HTMLImageElement>('img[data-lazy]').forEach(img => {
        imgObserver?.observe(img);
      });
      cardObserver?.unobserve(el);
    });
  }, { rootMargin: '200px 0px' });

  grid.querySelectorAll<HTMLElement>('.ism-card--skeleton').forEach(el => {
    cardObserver?.observe(el);
  });
}

function skeletonHTML(ism: DesignIsm, index: number): string {
  const num = String(index + 1).padStart(2, '0');
  return '<article class="ism-card ism-card--skeleton" data-id="' + ism.id + '" data-index="' + index + '">' +
    '<div class="ism-card-header">' +
    '<div class="ism-label-row"><span class="ism-number">' + num + '</span></div>' +
    '<div class="ism-name">' + ism.name + '</div>' +
    '<div class="ism-tagline">' + ism.tagline + '</div>' +
    '</div>' +
    '<div class="ism-skeleton-images">' +
    '<div class="ism-skeleton-block"></div>' +
    '<div class="ism-skeleton-block ism-skeleton-sm"></div>' +
    '<div class="ism-skeleton-block ism-skeleton-sm"></div>' +
    '</div>' +
    '</article>';
}

function cardHTML(ism: DesignIsm, index: number): string {
  const num = String(index + 1).padStart(2, '0');

  const paletteHTML = ism.palette.map(color =>
    `<div class="ism-swatch" style="background:${color}" title="${color}"></div>`
  ).join('');

  const imagesHTML = ism.images.map(image => {
    const src = thumbImageSrc(ism.id, image.file);
    const originalSrc = originalImageSrc(ism.id, image.file);
    const isEager = index < 6;
    const imgAttr = isEager
      ? `src="${src}"`
      : `src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-lazy="${src}"`;
    return `
      <div class="ism-img-wrap" data-src="${originalSrc}">
        <img ${imgAttr} alt="${ism.name} - ${image.label}"
             loading="lazy"
             onerror="this.parentElement.outerHTML='<div class=\\'ism-img-placeholder\\'>${image.label} — generating...</div>'">
        <span class="ism-img-label">${image.label}</span>
      </div>`;
  }).join('');

  const keywordsHTML = ism.keywords.map(keyword =>
    `<span class="ism-kw">${keyword}</span>`
  ).join('');

  const visibleCount = 3;
  const examplesHTML = ism.examples.map((example, exampleIndex) => {
    const domain = safeDomain(example.url);
    const hidden = exampleIndex >= visibleCount ? ' hidden' : '';
    return `<a href="${example.url}" target="_blank" rel="noopener" class="ism-example-link${hidden}" data-ex-idx="${exampleIndex}">
      ${example.name}<span>${domain}</span>
    </a>`;
  }).join('');

  const remaining = ism.examples.length - visibleCount;
  const toggleBtn = remaining > 0
    ? `<button class="ism-examples-toggle" data-ism="${ism.id}">${t('moreSites', { n: remaining })}</button>`
    : '';

  const subName = currentLang === 'en' ? ism.nameKr : '';
  const desc = getDesc(ism);

  return `
    <article class="ism-card" data-id="${ism.id}">
      <div class="ism-card-header">
        <div class="ism-label-row">
          <span class="ism-number">${num}</span>
        </div>
        <div class="ism-name">${ism.name}${subName ? '<span class="ism-name-kr">' + subName + '</span>' : ''}</div>
        <div class="ism-tagline">${ism.tagline}</div>
        <p class="ism-desc">${desc}</p>
      </div>
      <div class="ism-palette">${paletteHTML}</div>
      <div class="ism-images">${imagesHTML}</div>
      <div class="ism-keywords">${keywordsHTML}</div>
      <div class="ism-examples">${examplesHTML}${toggleBtn}</div>
    </article>`;
}

function setupCardExamplesToggle(): void {
  document.querySelectorAll<HTMLButtonElement>('.ism-examples-toggle').forEach(btn => {
    btn.addEventListener('click', event => {
      event.stopPropagation();
      const container = btn.closest<HTMLElement>('.ism-examples');
      if (!container) {
        return;
      }

      const hidden = container.querySelectorAll<HTMLElement>('.ism-example-link.hidden');
      if (hidden.length > 0) {
        hidden.forEach(el => el.classList.remove('hidden'));
        btn.textContent = t('showLess');
      } else {
        container.querySelectorAll<HTMLElement>('.ism-example-link').forEach((el, index) => {
          if (index >= 3) {
            el.classList.add('hidden');
          }
        });
        const count = container.querySelectorAll('.ism-example-link.hidden').length;
        btn.textContent = t('moreSites', { n: count });
      }
    });
  });
}

function setupLightbox(): void {
  const lightbox = getRequired<HTMLElement>('lightbox');
  const lightboxImage = queryRequired<HTMLImageElement>('img', lightbox);

  document.addEventListener('click', event => {
    const target = eventElement(event);
    const wrap = target?.closest<HTMLElement>('.ism-img-wrap') ?? null;
    if (wrap && !target?.closest('.modal-overlay')) {
      const src = wrap.dataset.src;
      if (src) {
        lightboxImage.src = src;
        lightbox.classList.add('active');
      }
    }
  });

  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
    lightboxImage.src = '';
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
      lightboxImage.src = '';
    }
  });
}

function setupScrollTop(): void {
  const btn = queryRequired<HTMLButtonElement>('.scroll-top');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

queryRequired<HTMLInputElement>('.search-input').addEventListener('input', event => {
  if (event.target instanceof HTMLInputElement) {
    searchQuery = event.target.value;
    render();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  void init();
});

function getRelatedIsms(target: DesignIsm, max = 5): DesignIsm[] {
  return allIsms
    .filter(ism => ism.id !== target.id)
    .map<RelatedScore>(ism => ({
      ism,
      score: ism.keywords.filter(keyword => target.keywords.includes(keyword)).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .filter(item => item.score > 0)
    .map(item => item.ism);
}

function renderModalContent(ism: DesignIsm): string {
  const idx = allIsms.indexOf(ism);
  const num = String(idx + 1).padStart(2, '0');
  const related = getRelatedIsms(ism);
  const mainImg = ism.images[0];
  if (!mainImg) {
    throw new Error('Missing main image for ism: ' + ism.id);
  }

  const subImages = ism.images.slice(1);
  const mainLabel = t('designMockup', { name: ism.name });
  const modalDesc = getDesc(ism);
  const modalHistory = getHistory(ism);
  const mainPrompt = ism.prompts?.[0]?.prompt ?? '';

  let collapsiblesHTML = '';
  for (let index = 0; index < subImages.length; index += 1) {
    const image = subImages[index];
    if (!image) {
      continue;
    }

    const subPrompt = ism.prompts?.[index + 1]?.prompt ?? '';
    const promptBlock = subPrompt
      ? '<div class="modal-prompt"><span class="modal-prompt-label">Prompt</span>' + subPrompt + '</div>'
      : '';
    collapsiblesHTML += '<div class="modal-collapsible">' +
      '<div class="modal-collapsible-header">' +
      '<span class="modal-collapsible-arrow">▶</span> ' + image.label +
      '</div>' +
      '<div class="modal-collapsible-body"><div class="modal-collapsible-inner">' +
      '<img src="' + thumbImageSrc(ism.id, image.file) + '" data-src="' + originalImageSrc(ism.id, image.file) + '" alt="' + ism.name + ' - ' + image.label + '" data-lightbox="true" loading="lazy">' +
      promptBlock +
      '</div></div></div>';
  }

  let paletteHTML = '';
  ism.palette.forEach(color => {
    paletteHTML += '<div class="modal-swatch" data-color="' + color + '">' +
      '<div class="modal-swatch-color" style="background:' + color + '"></div>' +
      '<span class="modal-swatch-hex">' + color + '</span></div>';
  });

  let keywordsHTML = '';
  ism.keywords.forEach(keyword => {
    keywordsHTML += '<span class="modal-kw">' + keyword + '</span>';
  });

  let visibleExamplesHTML = '';
  let hiddenExamplesHTML = '';
  ism.examples.forEach((example, index) => {
    const domain = safeDomain(example.url);
    const link = '<a href="' + example.url + '" target="_blank" rel="noopener" class="modal-example-link">' +
      example.name + '<span class="modal-example-domain">' + domain + '</span></a>';
    if (index < 3) {
      visibleExamplesHTML += link;
    } else {
      hiddenExamplesHTML += link;
    }
  });

  let examplesSection = '<div class="modal-examples">' +
    '<div class="modal-examples-visible">' + visibleExamplesHTML + '</div>';
  if (hiddenExamplesHTML) {
    examplesSection += '<div class="modal-examples-hidden" id="modal-ex-hidden">' + hiddenExamplesHTML + '</div>' +
      '<button class="modal-examples-toggle" id="modal-ex-toggle">' + t('moreSites', { n: ism.examples.length - 3 }) + '</button>';
  }
  examplesSection += '</div>';

  let relatedHTML = '';
  related.forEach(relatedIsm => {
    relatedHTML += '<div class="modal-related-card" data-related-id="' + relatedIsm.id + '">' +
      '<div class="modal-related-name">' + relatedIsm.name + '</div>' +
      '<div class="modal-related-tagline">' + relatedIsm.tagline + '</div></div>';
  });

  const subNameHtml = currentLang === 'en' ? '<span class="modal-title-kr">' + ism.nameKr + '</span>' : '';
  let html = '<div class="modal-number">' + num + '</div>' +
    '<div class="modal-title">' + ism.name + subNameHtml + '</div>' +
    '<div class="modal-tagline">' + ism.tagline + '</div>';

  if (modalHistory) {
    html += '<div class="modal-history">' + modalHistory + '</div>';
  }

  html += '<div class="modal-desc">' + modalDesc + '</div>' +
    '<div class="modal-main-image"><img src="' + thumbImageSrc(ism.id, mainImg.file) + '" data-src="' + originalImageSrc(ism.id, mainImg.file) + '" alt="' + mainLabel + '" data-lightbox="true"></div>' +
    '<div class="modal-main-label">' + mainLabel + '</div>' +
    (mainPrompt ? '<div class="modal-prompt modal-prompt-main"><span class="modal-prompt-label">Prompt</span>' + mainPrompt + '</div>' : '') +
    collapsiblesHTML +
    '<div class="modal-section-title">' + t('colorPalette') + '</div>' +
    '<div class="modal-palette">' + paletteHTML + '</div>' +
    '<div class="modal-section-title">' + t('keywords') + '</div>' +
    '<div class="modal-keywords">' + keywordsHTML + '</div>' +
    '<div class="modal-section-title">' + t('exampleSites') + '</div>' +
    examplesSection;

  if (related.length > 0) {
    html += '<div class="modal-section-title">' + t('relatedIsms') + '</div>' +
      '<div class="modal-related">' + relatedHTML + '</div>';
  }

  html += renderDevelopmentGuide(ism);

  return html;
}

function openModal(ismId: string): void {
  const ism = allIsms.find(candidate => candidate.id === ismId);
  if (!ism) {
    return;
  }

  const overlay = getRequired<HTMLElement>('modal-overlay');
  const content = getRequired<HTMLElement>('modal-content');
  content.innerHTML = renderModalContent(ism);
  content.scrollTop = 0;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', '#' + ismId);

  content.querySelectorAll<HTMLElement>('.modal-collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement?.classList.toggle('open');
    });
  });

  content.querySelectorAll<HTMLImageElement>('img[data-lightbox]').forEach(image => {
    image.addEventListener('click', event => {
      event.stopPropagation();
      const lightbox = getRequired<HTMLElement>('lightbox');
      queryRequired<HTMLImageElement>('img', lightbox).src = image.dataset.src || image.src;
      lightbox.classList.add('active');
    });
  });

  content.querySelectorAll<HTMLElement>('.modal-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      if (!color) {
        return;
      }
      void navigator.clipboard.writeText(color);
      showToast('Copied ' + color);
    });
  });

  content.querySelectorAll<HTMLElement>('.modal-related-card').forEach(card => {
    card.addEventListener('click', () => {
      const relatedId = card.dataset.relatedId;
      if (relatedId) {
        openModal(relatedId);
      }
    });
  });

  const exToggle = document.getElementById('modal-ex-toggle');
  const exHidden = document.getElementById('modal-ex-hidden');
  if (exToggle instanceof HTMLButtonElement && exHidden instanceof HTMLElement) {
    exToggle.addEventListener('click', () => {
      if (exHidden.classList.contains('open')) {
        exHidden.classList.remove('open');
        exToggle.textContent = t('moreSites', { n: exHidden.children.length });
      } else {
        exHidden.classList.add('open');
        exToggle.textContent = t('showLess');
      }
    });
  }
}

function closeModal(): void {
  const overlay = getRequired<HTMLElement>('modal-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + location.search);
}

function showToast(msg: string): void {
  const toast = getRequired<HTMLElement>('toast');
  toast.textContent = msg;
  toast.classList.add('show');

  const existingTimer = toastTimers.get(toast);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  const timer = window.setTimeout(() => {
    toast.classList.remove('show');
    toastTimers.delete(toast);
  }, 1500);
  toastTimers.set(toast, timer);
}

function setupModal(): void {
  const overlay = getRequired<HTMLElement>('modal-overlay');

  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  queryRequired<HTMLButtonElement>('.modal-close', overlay).addEventListener('click', closeModal);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });

  document.addEventListener('click', event => {
    const target = eventElement(event);
    if (!target) {
      return;
    }
    if (target.closest('.ism-img-wrap')) {
      return;
    }
    if (target.closest('.ism-example-link')) {
      return;
    }
    if (target.closest('.ism-examples-toggle')) {
      return;
    }
    if (target.closest('.modal-overlay')) {
      return;
    }
    if (target.closest('.lightbox')) {
      return;
    }

    const card = target.closest<HTMLElement>('.ism-card');
    const id = card?.dataset.id;
    if (id) {
      openModal(id);
    }
  });

  if (location.hash.length > 1) {
    const id = location.hash.slice(1);
    window.setTimeout(() => openModal(id), 400);
  }
}

function setupLangToggle(): void {
  const toggle = getRequired<HTMLButtonElement>('lang-toggle');
  updateLangUI();

  toggle.addEventListener('click', () => {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('design-isms-lang', currentLang);
    updateLangUI();
    render();
  });
}

function updateLangUI(): void {
  document.querySelectorAll<HTMLElement>('.lang-option').forEach(element => {
    element.classList.toggle('active', element.dataset.lang === currentLang);
  });

  queryRequired<HTMLInputElement>('.search-input').placeholder = t('search');
  document.documentElement.lang = currentLang;

  const footer = queryRequired<HTMLElement>('.site-footer');
  const title = footer.children.item(0);
  const generator = footer.children.item(1);
  if (title) {
    title.textContent = t('footerTitle');
  }
  if (generator) {
    generator.textContent = t('footerGen');
  }
}
