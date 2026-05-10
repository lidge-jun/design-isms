# AGENTS.md — Design -isms 프로젝트 가이드

## 프로젝트 개요
35개 디자인 ism의 시각적 레퍼런스 보드. GitHub Pages 배포.
- **라이브**: https://lidge-jun.github.io/design-isms/
- **스택**: 순수 HTML/CSS/JS (빌드 도구 없음)
- **이미지**: GPT Image 2 (gpt-image-2, 1536x1024, high quality)

## 디렉토리 구조
```
701_design-isms/
├── index.html                    # 메인 페이지
├── AGENTS.md                     # 이 파일
├── README.md
├── assets/
│   ├── css/style.css             # 전체 스타일
│   ├── js/app.js                 # 메인 로직
│   ├── data/isms.json            # 핵심 데이터 (35개 ism)
│   └── images/
│       ├── minimalism/           # ism별 폴더
│       │   ├── landing.png
│       │   ├── shop.png
│       │   └── portfolio.png
│       ├── brutalism/
│       └── ...                   # 35개 폴더
├── docs/
│   └── PLAN-popup-detail.md      # 팝업 기능 구현 계획
├── scripts/
│   └── update-isms.mjs           # JSON 업데이트 스크립트
└── .github/workflows/
    └── deploy.yml                # GitHub Pages 배포
```

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

## 팝업 기능 (미구현 — 계획 완료)

상세 계획: `docs/PLAN-popup-detail.md`

### 핵심 결정사항
- **프롬프트**: 메인 1개 항상 펼침 + 나머지 접이식
- **메인 라벨**: "ㅇㅇ 디자인 시안" (hero page 같은 라벨 제거)
- **예시 사이트**: 링크만 (썸네일 없음)
- **역사/맥락**: 제목 바로 밑에 표시
- **관련 ISM**: 키워드 겹침 기반 자동 계산 (런타임)
- **URL hash**: `#minimalism` 형태 직링크 지원

### 구현 시 필요한 작업
1. `isms.json`에 `prompts` 배열 추가 (105개 프롬프트)
2. `index.html`에 모달 HTML 추가
3. `style.css`에 모달 CSS ~180줄
4. `app.js`에 모달 JS ~150줄

---

## 배포

- **호스팅**: GitHub Pages (lidge-jun/design-isms)
- **빌드**: 없음 (static files)
- **배포**: `main` 브랜치 push → `.github/workflows/deploy.yml` 자동 실행
- **URL**: https://lidge-jun.github.io/design-isms/

---

## 코딩 규칙

- 빌드 도구 없음 — 순수 HTML/CSS/JS만
- ES Module 문법 사용하지 않음 (script type="module" 아님)
- CSS 변수는 `:root`에 정의, 일관되게 사용
- 폰트: Pretendard (한국어), Outfit (영문 제목), SF Mono (코드)
- 반응형: 1440px / 1024px / 640px 브레이크포인트
- 이미지: lazy loading (`loading="lazy"`)
- 접근성: aria-label, 키보드 네비게이션, prefers-reduced-motion
