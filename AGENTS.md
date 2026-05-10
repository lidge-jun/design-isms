# AGENTS.md — Design -isms 프로젝트 가이드

## 프로젝트 개요
35개 디자인 ism의 시각적 레퍼런스 보드와 46개 모바일/데스크탑 프런트엔드 UI 후보군 카탈로그. GitHub Pages 배포.
- **라이브**: https://lidge-jun.github.io/design-isms/
- **스택**: 정적 HTML/CSS + TypeScript source → browser JS build
- **이미지**: GPT Image 2 (gpt-image-2, 1536x1024, high quality)

## 디렉토리 구조
```
701_design-isms/
├── index.html                    # 메인 페이지
├── effects.html                  # 모바일/데스크탑 UI 후보군 페이지
├── AGENTS.md                     # 이 파일
├── README.md
├── assets/
│   ├── css/style.css             # 전체 스타일
│   ├── css/effects.css           # UX 효과 페이지 전용 스타일
│   ├── css/effects-demos.css     # 초기 공통 UX demo/animation
│   ├── css/effects-demos-candidates.css # 46개 후보군 전용 demo/animation
│   ├── js/app.js                 # 메인 로직 (src/app.ts build 산출물)
│   ├── js/effects-demos.js       # 효과 demo renderer (src/effects-demos.ts build 산출물)
│   ├── js/effects.js             # 효과 페이지 로직 (src/effects.ts build 산출물)
│   ├── data/isms.json            # 핵심 데이터 (35개 ism)
│   ├── data/effects.json         # 프런트엔드 UI 후보군 데이터
│   └── images/
│       ├── minimalism/           # ism별 폴더
│       │   ├── landing.png
│       │   ├── shop.png
│       │   └── portfolio.png
│       ├── thumbs/               # WebP thumbnail/preview 산출물
│       │   ├── minimalism/
│       │   └── effects/
│       ├── brutalism/
│       └── ...                   # 35개 폴더
├── src/
│   ├── app.ts
│   ├── effects-demos.ts
│   └── effects.ts
├── structure/
│   └── README.md                 # 현재 구조와 source-of-truth 요약
├── devlog/
│   └── 260510_mobile_ux_effects/ # UI 후보군 phase docs
├── scripts/
│   └── update-isms.mjs           # JSON 업데이트 스크립트
└── .github/workflows/
    └── deploy.yml                # GitHub Pages 배포
```

---

## 현재 구현 불변 조건

- README, `AGENTS.md`, `structure/README.md`, `devlog/`의 설명은 실제 구현과 어긋나면 안 된다.
- 소스는 `src/*.ts`, 브라우저 산출물은 `assets/js/*.js`다. GitHub Pages가 static file을 직접 배포하므로 JS 산출물도 커밋 대상이다.
- HTML은 non-module script를 사용한다. `effects.html`은 `assets/js/effects-demos.js`를 먼저, `assets/js/effects.js`를 나중에 로드해야 한다.
- 신규 파일은 500줄 이하를 유지한다. 초과하면 역할별 파일로 분리한다.
- 커밋/푸시는 사용자가 같은 턴에서 명시적으로 요청한 경우에만 실행한다.

## 메인 ISM 모달 원칙

- 카드 클릭 모달은 구현된 기능이다. `docs/PLAN-popup-detail.md`는 계획/설계 기록이며 현재 상태의 source of truth는 `src/app.ts`, `assets/js/app.js`, README, structure 문서다.
- 모달 제목 바로 아래에 `history`를 표시한다.
- 프롬프트는 메인 이미지 1개를 항상 노출하고, 나머지 이미지는 접이식 섹션에 둔다.
- 예시 사이트는 링크만 사용한다. 썸네일을 추가하지 않는다.
- 예시 사이트 10개는 처음 3개만 보이고 나머지는 더 보기로 펼친다.
- 관련 ISM은 JSON에 저장하지 않고 keyword overlap으로 런타임 계산한다.
- 이미지 preview는 WebP thumbnail을 우선 쓰고, lightbox 확대는 원본 PNG를 사용한다.

## Effects 후보군 원칙

- `effects.html`은 모바일 전용 목록이 아니라 모바일/데스크탑/공통 프런트엔드 UI 후보군 46개 카탈로그다.
- `assets/data/effects.json`의 각 항목은 `demo.type`을 가져야 하며 값은 해당 effect `id`와 같아야 한다.
- `src/effects-demos.ts` registry에는 46개 effect id가 모두 있어야 한다. 새 후보군을 기존 12개 seed animation에 재사용으로 연결하지 않는다.
- 후보군마다 카드/모달에서 식별 가능한 전용 CSS demo animation을 둔다. 확장 demo 스타일은 `assets/css/effects-demos-candidates.css`에 둔다.
- guide 원본은 `assets/images/effects/{effect-id}/guide.png`, WebP preview는 `assets/images/thumbs/effects/{effect-id}/guide.webp`다.
- guide 이미지를 생성/교체하면 `npm run images:thumbs`로 WebP preview를 갱신하고 `npm run verify`를 통과시킨다.
- 데스크탑과 모바일 모두에서 카드 수 46개, demo type 46개, horizontal overflow 없음, console error 없음까지 확인해야 완료로 보고한다.

---

## 새 ISM 추가하기

### 1단계: 데이터 준비
`assets/data/isms.json`에 새 항목 추가:

```json
{
  "id": "new-ism-id",
  "name": "New Ism Name",
  "nameKr": "한국어 이름",
  "tagline": "One-line English tagline",
  "description": "2-3문장 한국어 설명. 핵심 시각 특성, 대표 기법, 느낌을 압축.",
  "history": "역사적 맥락. 탄생 시기, 창시자/대표 인물, 발전 과정, 웹 디자인에서의 채택 시점 등을 2-3문장으로.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "palette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4"],
  "examples": [
    { "name": "Site Name", "url": "https://example.com" },
    // ... 10개 (실제 사이트, Dribbble/Behance/wiki 금지)
  ],
  "images": [
    { "file": "landing.png", "label": "Landing Page" },
    { "file": "shop.png", "label": "쇼핑몰" },
    { "file": "dashboard.png", "label": "Dashboard" }
  ]
}
```

### 2단계: 이미지 생성 (3장)
```bash
# 폴더 생성
mkdir -p assets/images/new-ism-id

# GPT Image 2로 생성 (예시)
# model: gpt-image-2
# size: 1536x1024
# quality: high
# 프롬프트 패턴:
#   "A [ism-name] style [page-type] screenshot. [visual characteristics].
#    Clean mockup, no browser chrome, realistic UI elements."
```

**이미지 종류 (3장, 택1씩)**:
| 카테고리 | 선택지 |
|----------|--------|
| 메인 | landing.png, portfolio.png, agency.png |
| 상업 | shop.png, pricing.png, saas.png |
| 앱/기능 | dashboard.png, mobile-app.png, blog.png, music-player.png, login.png |

### 3단계: 예시 사이트 찾기
```bash
# agbrowse web-ai로 Grok에게 질문
agbrowse web-ai query --vendor grok --model auto --inline-only \
  --prompt "List 10 real, currently live websites that exemplify [ISM NAME] design style. No Dribbble/Behance/Pinterest/wiki. Only real product/company/portfolio sites. Format as JSON: [{\"name\": \"...\", \"url\": \"...\"}]" \
  --timeout 300 --json
```

### 4단계: 검증
```bash
# JSON 유효성 검사
node -e "JSON.parse(require('fs').readFileSync('assets/data/isms.json'))"

# 이미지 카운트 확인
ls assets/images/new-ism-id/ | wc -l  # 3이어야 함

# 전체 ism 수 확인
node -e "const d=JSON.parse(require('fs').readFileSync('assets/data/isms.json'));console.log(d.length+' isms')"
```

### 5단계: 배포
```bash
git add assets/data/isms.json assets/images/new-ism-id/
git commit -m "feat: add [ism-name] to design-isms collection"
git push
# GitHub Actions가 자동 배포
```

---

## 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | string | ✅ | URL-safe kebab-case. 이미지 폴더명과 동일 |
| `name` | string | ✅ | 영문 표시명 |
| `nameKr` | string | ✅ | 한국어 표시명 |
| `tagline` | string | ✅ | 영문 한 줄 요약 |
| `description` | string | ✅ | 한국어 2-3문장 설명 |
| `history` | string | ✅ | 한국어 역사/맥락 (탄생시기, 핵심 인물, 발전과정) |
| `keywords` | string[] | ✅ | 5개, 영문 kebab-case |
| `palette` | string[] | ✅ | 4개 HEX 컬러 |
| `examples` | object[] | ✅ | 10개 실제 사이트 `{name, url}` |
| `images` | object[] | ✅ | 3개 이미지 `{file, label}` |
| `prompts` | object[] | 선택 | 각 이미지 생성 프롬프트 `{file, prompt, model, quality, size}` |

---

## 기존 ISM 수정하기

### 예시 사이트 업데이트
사이트가 죽었거나 리디자인된 경우:
1. `assets/data/isms.json`에서 해당 ism의 `examples` 배열 수정
2. agbrowse로 대체 사이트 검색 (위 3단계 참고)

### 이미지 교체
1. 새 이미지를 `assets/images/{ism-id}/` 에 덮어쓰기
2. 파일명은 `isms.json`의 `images[].file`과 일치해야 함
3. 크기: 1536x1024, 형식: PNG
4. `npm run images:thumbs`로 WebP thumbnail을 갱신해야 함

### 프런트엔드 UI 후보군 guide 이미지
1. 원본은 `assets/images/effects/{effect-id}/guide.png`
2. WebP preview는 `assets/images/thumbs/effects/{effect-id}/guide.webp`
3. `effects.html` modal은 WebP를 우선 로드하고 lightbox는 원본 PNG를 사용함
4. guide 이미지를 바꾸면 `npm run images:thumbs`와 `npm run verify`를 함께 실행해야 함

### 설명/키워드 수정
`isms.json`에서 직접 편집. 키워드 변경 시 필터 바의 popular 키워드 목록도 확인:
```js
// app.js line 22-25
const popular = [
  'whitespace', 'bold-color', 'dark-bg', 'gradient', 'neon',
  '3D', 'retro', 'geometric', 'rounded', 'playful'
].filter(k => keywords.has(k));
```

---

## 메인 ISM 팝업 기능

구현 기준: `src/app.ts` → `assets/js/app.js`
설계 기록: `docs/PLAN-popup-detail.md`

### 현재 동작
- **프롬프트**: 메인 1개 항상 펼침 + 나머지 접이식
- **메인 라벨**: "ㅇㅇ 디자인 시안" (hero page 같은 라벨 제거)
- **예시 사이트**: 링크만, 처음 3개 노출 + 더 보기로 나머지 표시
- **역사/맥락**: 제목 바로 밑에 표시
- **관련 ISM**: 키워드 겹침 기반 자동 계산 (런타임)
- **URL hash**: `#minimalism` 형태 직링크 지원

---

## 배포

- **호스팅**: GitHub Pages (lidge-jun/design-isms)
- **빌드**: `npm run build`로 `src/*.ts`를 `assets/js/*.js`에 생성
- **배포**: `main` 브랜치 push → `.github/workflows/deploy.yml` 자동 실행
- **URL**: https://lidge-jun.github.io/design-isms/

---

## 코딩 규칙

- GitHub Pages는 빌드 산출물 `assets/js/*.js`를 직접 로드
- TypeScript source는 `src/*.ts`, browser script는 `assets/js/*.js`
- 효과 후보군 demo type은 `assets/data/effects.json`의 `demo.type`과 `src/effects-demos.ts`의 registry가 일치해야 함
- ES Module 문법 사용하지 않음 (script type="module" 아님)
- CSS 변수는 `:root`에 정의, 일관되게 사용
- 폰트: Pretendard (한국어), Outfit (영문 제목), SF Mono (코드)
- 반응형: 1440px / 1024px / 640px 브레이크포인트
- 이미지: lazy loading (`loading="lazy"`)
- 접근성: aria-label, 키보드 네비게이션, prefers-reduced-motion
