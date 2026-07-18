# 040 — Typography Pairings DIFFLEVEL 로드맵

> **[001 로드맵 잠금 각서 — 010 Canonical Registry가 이 문서의 개별 가정을 우선한다]**
> 1) 이미지 root/scope는 전 도메인 **단수**(`color`/`typography`/`layout`/`motion`) — 이 문서에 `layouts` 등 복수형이 있으면 단수로 읽는다.
> 2) `generate-thumbnails.mjs` scope enum 확장은 015에서 1회(`effects|isms|color|typography|layout|motion|all`) 수행 — 각 사이클이 다시 설계하지 않는다.
> 3) manifest 쌍 카운트는 절대값이 아니라 **누적**: 211 → +30(020) → +25(030) → +20(040) → +25(050) → +20(060) = 최종 331. 이 문서 안의 236/286 등 절대값은 "이 사이클 완료 시점의 예시값"으로만 읽는다.
> 4) `verify-catalog.mjs`는 registry 배열 순회 단일 스크립트(도메인별 인자 없음).
> 5) sot 마커 네이밍은 `data-sot:{domain}-count`.
> 6) 페이지 스크립트 로드 순서는 `app-runtime.js` → `nav-dropdown.js` → `catalog-shell.js` → 도메인 렌더러 — 이 문서의 script 순서 표기에 `nav-dropdown.js`가 빠져 있으면 이 계약을 따른다.
> 7) 이 문서 안의 `generate-thumbnails.mjs`/타 도메인 count 관련 '변경 없음' 행은 변경 맵이 아니라 UNCHANGED 참고로 읽는다. manifest allowlist는 '이 도메인 행만 추가'가 아니라 '기존 additive registry(선행 사이클의 신규 행 포함)를 보존하며 이 도메인 행을 추가'로 읽는다.


- 상태: 구현 전 계약 잠금
- 의존: `010_infra_unlock.md`의 `assets/data/schema/typography.schema.json` 확정, `015_nav_and_shell.md`의 `src/catalog-shell.ts` 및 `typography.html` placeholder 완료
- 구현 단위: 폰트 페어링 20개를 카드·모달·검색·필터·가이드 이미지로 제공하는 정적 GitHub Pages 카탈로그
- 이 문서의 변경 맵은 **040 구현 시의 예정 diff**다. 현재 문서 승격 작업에서는 이 파일만 수정한다.

## 1. 목표와 현재 근거

Typography 페이지의 카드 한 장은 `heading + body + optional mono` 한 조합을 설명한다. 카드에서는 실제 웹폰트로 짧은 specimen을 보여 주고, 모달에서는 타입 스케일·혼합 한영 문장·fallback·관련 ISM·guide 이미지를 제공한다.

현재 저장소 계약과 연결점은 다음과 같다.

- `index.html`, `effects.html`, `faq.html`은 `<head>`에서 Pretendard Variable dynamic subset CSS를 jsDelivr로, Outfit 400–800을 Google Fonts CSS2로 로드한다. `assets/css/style.css` 자체는 폰트 파일을 로드하지 않고 `--font-sans`, `--font-display`, `--font-mono` stack만 선언한다.
- 현재 `--font-mono`의 `SF Mono`는 웹폰트가 아니라 macOS system fallback이다. 비 Apple 환경에서는 Fira Code/Consolas/monospace로 내려간다.
- `assets/data/effects.json`은 array item마다 `id/name/nameKr/family/category/summary/guide`를 소유한다. Typography도 이 공통 표면을 유지하되 domain 필드를 추가한다.
- `src/effects.ts`는 unknown JSON을 strict parser로 읽고, escaped HTML로 card/modal을 렌더하며, `AppRuntime` 오류 복구, hash hydration, WebP preview→PNG lightbox를 구현한다. Typography renderer도 같은 흐름을 `CatalogShell` adapter 위에서 재사용한다.
- TypeScript source는 `src/*.ts`, browser 산출물은 `assets/js/*.js`이며 non-module `<script>`로 로드한다. 공유 기능은 namespace 전역을 사용하고 page entry는 IIFE로 닫는다.
- 신규 파일은 각각 500줄 이하로 유지한다. `npm run build`가 browser JS를 생성한 뒤 `npm run verify`를 실행한다.

외부 폰트 계약은 [Google Fonts API 공식 문서](https://developers.google.com/fonts/docs/getting_started)의 multi-family, weight, `display=swap`, `text=` 요청 방식을 따른다. 아래 Google Fonts CSS2 URL은 2026-07-18에 실제 CSS 응답과 `@font-face` family를 확인했다.

## 2. IN / OUT 범위

### IN

- 확정된 20개 pairing data와 strict runtime parser
- category·한글 지원 필터, font family/name/summary 통합 검색
- 카드의 live specimen, 모달의 타입 스케일과 한영 혼합 specimen
- 가시 카드와 열린 모달에 한정한 webfont 지연 로딩, FOUT/failure 상태
- guide 원본 PNG 20개, WebP preview 20개, prompt/provenance/audit
- Typography nav 항목 활성화, 정적 페이지 count와 Pages staging 반영
- 기존 211개 image-quality baseline을 보존한 manifest 확장
- 데스크톱/모바일, 키보드, 네트워크 실패, horizontal overflow QA

### OUT

- 기존 49 ISM, 64 Effects, 18 FAQ의 콘텐츠 수정
- `src/catalog-shell.ts` 재설계 또는 기존 Effects 동작 변경
- 사용자 입력으로 임의 문장을 미리보기하는 font playground
- variable font axis 편집기, 폰트 다운로드/재배포, 자체 WOFF2 hosting
- Freight, Tiempos, Graphik, Atlas Grotesk, SF Pro 등 라이선스가 필요한 폰트를 primary webfont로 배포
- ISM 모달의 Typography 역링크와 전 카탈로그 통합 검색: 070 단계 소유
- 배포 자체와 최종 전체 카탈로그 QA receipt: 080 단계 소유

## 3. 구현 파일 변경 맵

### 3.1 NEW — runtime/data/style

| 경로 | 역할 |
| --- | --- |
| `assets/data/typography.json` | 20개 pairing의 유일한 runtime data SoT |
| `src/typography-fonts.ts` | `TypographyFonts` namespace. URL dedupe, `text=` subset, load timeout, `document.fonts` readiness, fallback 상태 소유 |
| `assets/js/typography-fonts.js` | `src/typography-fonts.ts`의 커밋 대상 build 산출물 |
| `src/typography.ts` | strict parse, CatalogShell adapter, specimen/modal/guide 렌더, locale/hash 연결 |
| `assets/js/typography.js` | `src/typography.ts`의 커밋 대상 build 산출물 |
| `assets/css/typography.css` | Typography page/card/specimen/modal/font-state 전용 CSS. inline style 금지 |
| `devlog/_plan/260717_design-encyclopedia-upgrade/041_typography_guide_manifest.jsonl` | 20개 target/prompt/model/명령/결과 hash provenance |
| `devlog/_plan/260717_design-encyclopedia-upgrade/042_typography_guide_audit.csv` | guide별 시각 품질·가독성·결정·source/preview hash 감사 |

### 3.2 MODIFY — shell/nav/verification/docs

| 경로 | 정확한 변경 |
| --- | --- |
| `typography.html` | 015 placeholder를 실제 intro/filter/grid/modal/lightbox mount로 교체. CSS와 script load order 고정 |
| `index.html` | Catalog dropdown의 Typography 항목을 활성 링크로 변경 |
| `effects.html` | 같은 정적 nav 변경 |
| `faq.html` | 같은 정적 nav 변경 |
| `color.html` | 015가 만든 placeholder nav의 Typography 항목 활성화 |
| `layout.html` | 015가 만든 placeholder nav의 Typography 항목 활성화 |
| `motion.html` | 015가 만든 placeholder nav의 Typography 항목 활성화 |
| `scripts/verify-nav.mjs` | Typography page 등록, dropdown 축 순서, 단일 `aria-current`, `20 pairings` count 검증 |
| `scripts/verify-catalog.mjs` | 015 범용 검증기에 typography schema, 정확히 20개, category 6/4/4/3/3, font source, related ISM 참조 검증 추가 |
| `scripts/generate-thumbnails.mjs` | 변경 없음 — 015에서 확장된 scope enum(`typography` 포함)을 그대로 사용 |
| `scripts/verify-assets.mjs` | Typography 20 PNG/WebP pair, 1536×1024/768×512, hash, MAE, orphan 검증 추가 |
| `assets/data/image-pairs-manifest.json` | 기존 211행은 값 불변, source-sort를 유지하며 typography 20행만 추가하여 286행으로 확장 |
| `scripts/verify-image-quality.mjs` | immutable 211 baseline을 정확한 부분집합으로 비교하고, 허용 extra는 검증된 `assets/images/typography/*/guide.png` 20행뿐이도록 변경 |
| `scripts/stage-pages.mjs` | `typography.html` 공개 입력 추가. HTML/PNG/WebP hardcode를 data/manifest 유도 count로 전환 |
| `scripts/run-final-static-qa.mjs` | staged count 기대값을 data/manifest에서 유도하고 Typography asset 포함 확인 |
| `scripts/run-final-browser-qa.mjs` | Typography 20-card matrix와 critical flow 추가: filter/search/modal/font ready/fallback/WebP→PNG/focus return |
| `AGENTS.md` | Typography page, 20 pairing, font loading, 286 global pair와 frozen 211 baseline의 관계 기록 |
| `scripts/sync-sot.mjs` + AGENTS/README/structure 마커 | `typography.json` 길이(20) 유도 count와 `data-sot:typography-count` 마커 추가, `npm run sot:sync` |
| `README.md` | 공개 카탈로그 축과 Typography 20개 사용법/asset 경로 반영 |
| `structure/README.md` | Typography data/source/build/style/image ownership과 script load order 반영 |

`assets/data/schema/typography.schema.json`은 010 단계 SoT이므로 040에서 임의 수정하지 않는다. 아래 필드 계약과 다르면 구현 전에 010 결정을 다시 잠그고, schema를 우회하는 ad-hoc parser를 만들지 않는다.

### 3.3 NEW — guide 원본/preview 20쌍

| id | 원본 PNG | WebP preview |
| --- | --- | --- |
| `outfit-pretendard-product` | `assets/images/typography/outfit-pretendard-product/guide.png` | `assets/images/thumbs/typography/outfit-pretendard-product/guide.webp` |
| `noto-serif-sans-kr-readable` | `assets/images/typography/noto-serif-sans-kr-readable/guide.png` | `assets/images/thumbs/typography/noto-serif-sans-kr-readable/guide.webp` |
| `gowun-batang-pretendard-calm` | `assets/images/typography/gowun-batang-pretendard-calm/guide.png` | `assets/images/thumbs/typography/gowun-batang-pretendard-calm/guide.webp` |
| `black-han-noto-sans-kr-impact` | `assets/images/typography/black-han-noto-sans-kr-impact/guide.png` | `assets/images/thumbs/typography/black-han-noto-sans-kr-impact/guide.webp` |
| `song-myung-noto-sans-kr-literary` | `assets/images/typography/song-myung-noto-sans-kr-literary/guide.png` | `assets/images/thumbs/typography/song-myung-noto-sans-kr-literary/guide.webp` |
| `nanum-myeongjo-gothic-familiar` | `assets/images/typography/nanum-myeongjo-gothic-familiar/guide.png` | `assets/images/thumbs/typography/nanum-myeongjo-gothic-familiar/guide.webp` |
| `playfair-source-sans-classic` | `assets/images/typography/playfair-source-sans-classic/guide.png` | `assets/images/thumbs/typography/playfair-source-sans-classic/guide.webp` |
| `libre-baskerville-open-sans-readable` | `assets/images/typography/libre-baskerville-open-sans-readable/guide.png` | `assets/images/thumbs/typography/libre-baskerville-open-sans-readable/guide.webp` |
| `cormorant-lato-luxury` | `assets/images/typography/cormorant-lato-luxury/guide.png` | `assets/images/thumbs/typography/cormorant-lato-luxury/guide.webp` |
| `merriweather-roboto-news` | `assets/images/typography/merriweather-roboto-news/guide.png` | `assets/images/thumbs/typography/merriweather-roboto-news/guide.webp` |
| `inter-jetbrains-product` | `assets/images/typography/inter-jetbrains-product/guide.png` | `assets/images/thumbs/typography/inter-jetbrains-product/guide.webp` |
| `manrope-inter-ibm-plex-mono` | `assets/images/typography/manrope-inter-ibm-plex-mono/guide.png` | `assets/images/thumbs/typography/manrope-inter-ibm-plex-mono/guide.webp` |
| `jakarta-source-sans-code` | `assets/images/typography/jakarta-source-sans-code/guide.png` | `assets/images/thumbs/typography/jakarta-source-sans-code/guide.webp` |
| `space-grotesk-inter-space-mono` | `assets/images/typography/space-grotesk-inter-space-mono/guide.png` | `assets/images/thumbs/typography/space-grotesk-inter-space-mono/guide.webp` |
| `lora-source-sans-editorial` | `assets/images/typography/lora-source-sans-editorial/guide.png` | `assets/images/thumbs/typography/lora-source-sans-editorial/guide.webp` |
| `dm-serif-dm-sans-magazine` | `assets/images/typography/dm-serif-dm-sans-magazine/guide.png` | `assets/images/thumbs/typography/dm-serif-dm-sans-magazine/guide.webp` |
| `fraunces-work-sans-expressive` | `assets/images/typography/fraunces-work-sans-expressive/guide.png` | `assets/images/thumbs/typography/fraunces-work-sans-expressive/guide.webp` |
| `brutalist-space-mono-inter` | `assets/images/typography/brutalist-space-mono-inter/guide.png` | `assets/images/thumbs/typography/brutalist-space-mono-inter/guide.webp` |
| `art-deco-cinzel-montserrat` | `assets/images/typography/art-deco-cinzel-montserrat/guide.png` | `assets/images/thumbs/typography/art-deco-cinzel-montserrat/guide.webp` |
| `cyberpunk-orbitron-rajdhani` | `assets/images/typography/cyberpunk-orbitron-rajdhani/guide.png` | `assets/images/thumbs/typography/cyberpunk-orbitron-rajdhani/guide.webp` |

## 4. 데이터 스키마 계약

`assets/data/typography.json`은 object wrapper가 아닌 20-item array다. 각 item은 다음 shape를 갖는다.

```ts
interface TypographyPairing {
  id: string;                    // unique kebab-case
  name: string;                  // English display name
  nameKr: string;                // Korean display name
  family: 'Typography Pairing';
  category: 'Korean' | 'English Classic' | 'Modern Sans' | 'Editorial' | 'ISM Linked';
  summary: string;               // 비어 있지 않은 한국어 2문장
  heading: FontRole;
  body: FontRole;
  mono?: FontRole;
  scale: {
    name: 'Minor Third' | 'Major Third' | 'Perfect Fourth' | 'Augmented Fourth';
    ratio: 1.2 | 1.25 | 1.333 | 1.414;
  };
  supportsKorean: boolean;
  webfonts: WebfontSource[];
  specimen: {
    headingKo: string;
    headingEn: string;
    bodyKo: string;
    bodyEn: string;
    mono?: string;
  };
  relatedIsms: string[];
  guide: { file: 'guide.png'; alt: string; prompt: string };
}

interface FontRole {
  family: string;
  weight: 400 | 500 | 600 | 700;
  fallback: string[];            // 마지막 값은 serif/sans-serif/monospace 중 하나
}

interface WebfontSource {
  family: string;
  source: 'google-fonts' | 'pretendard-cdn' | 'system';
  url: string | null;            // Google Fonts CSS2, 현재 Pretendard CSS, 또는 system이면 null
  strategy: 'base' | 'viewport-text-subset' | 'modal-text-subset' | 'system-only';
}
```

검증 규칙:

- `family`는 전 항목에서 `Typography Pairing`으로 고정하고 `category` count는 정확히 6/4/4/3/3이다.
- `summary`는 한국어 문자를 포함해야 하며 빈 generic copy를 허용하지 않는다.
- heading/body는 필수, mono는 선택이다. 선언 weight와 Google Fonts URL의 요청 weight가 일치해야 한다.
- `scale.ratio`는 허용 enum 중 하나다. modal size는 `base × ratio^step`으로 계산하며 중복 pixel 배열을 data에 저장하지 않는다.
- `supportsKorean=false`인 pairing도 Korean specimen 영역은 body의 Korean-capable system fallback으로 읽을 수 있어야 한다. Latin primary가 한글 glyph를 가진 것처럼 표시하지 않는다.
- `webfonts[].url`은 `https://fonts.googleapis.com/css2` 또는 현재 Pretendard jsDelivr URL만 허용한다. `system`은 `url:null`이다.
- `relatedIsms[]`의 모든 값은 `assets/data/isms.json` 실제 id여야 하며 anti-pattern인 `ai-slop`은 거부한다.
- `guide.file`은 정확히 `guide.png`, alt는 pairing과 화면 용도를 설명하고, prompt는 비어 있지 않아야 한다.
- unknown field는 schema에서 `additionalProperties:false`로 거부한다. runtime parser도 schema의 required/enum을 축약하지 않는다.

### 4.1 fallback stack registry

데이터에는 아래 stack을 배열로 펼쳐 저장한다. 상용/system 폰트는 primary가 아니라 fallback 위치에서만 사용한다.

| key | expanded fallback |
| --- | --- |
| `koSans` | `Pretendard`, `-apple-system`, `BlinkMacSystemFont`, `Apple SD Gothic Neo`, `Malgun Gothic`, `Noto Sans CJK KR`, `sans-serif` |
| `koSerif` | `AppleMyungjo`, `Batang`, `Noto Serif CJK KR`, `serif` |
| `latinSans` | `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Arial`, `sans-serif` |
| `latinSerif` | `Georgia`, `Times New Roman`, `serif` |
| `mono` | `SF Mono`, `Fira Code`, `Consolas`, `Liberation Mono`, `monospace` |

## 5. 확정 카드 20개

폰트 표기 순서는 `heading weight / body weight / optional mono weight`다. `K`는 한글 `text=` subset, `L`은 Latin `text=` subset, `B`는 현재 shell base load 재사용이다. 모든 `relatedIsms` 값은 현재 `assets/data/isms.json`에 존재한다.

### 5.1 한글 중심 — 6개

| id | name | nameKr | 폰트 조합 | scale | 한글 | relatedIsms | source/전략 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `outfit-pretendard-product` | Bilingual Product Default | 한영 제품 기본형 | Outfit 700 / Pretendard Variable 400 / SF Mono 400 | 1.25 | yes | `[]` | S01/B; 이미 로드된 두 CSS 재사용, mono는 system |
| `noto-serif-sans-kr-readable` | Korean Editorial Balance | 한글 명조·고딕 균형형 | Noto Serif KR 700 / Noto Sans KR 400 | 1.25 | yes | `[]` | S02/K; card viewport subset, modal text 확장 |
| `gowun-batang-pretendard-calm` | Calm Korean Narrative | 차분한 한글 서사형 | Gowun Batang 700 / Pretendard Variable 400 | 1.2 | yes | `[]` | S03/K; Gowun만 지연, Pretendard base 재사용 |
| `black-han-noto-sans-kr-impact` | Korean Impact Display | 한글 강한 제목형 | Black Han Sans 400 / Noto Sans KR 400 | 1.333 | yes | `[]` | S04/K; card viewport subset, modal text 확장 |
| `song-myung-noto-sans-kr-literary` | Literary Korean | 문학적 한글형 | Song Myung 400 / Noto Sans KR 400 | 1.25 | yes | `[]` | S05/K; card viewport subset, modal text 확장 |
| `nanum-myeongjo-gothic-familiar` | Familiar Korean Publishing | 친숙한 한글 출판형 | Nanum Myeongjo 700 / Nanum Gothic 400 | 1.2 | yes | `[]` | S06/K; card viewport subset, modal text 확장 |

### 5.2 영문 클래식 — 4개

| id | name | nameKr | 폰트 조합 | scale | 한글 | relatedIsms | source/전략 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `playfair-source-sans-classic` | Classic Editorial Contrast | 클래식 세리프 대비형 | Playfair Display 700 / Source Sans 3 400 | 1.333 | no | `[]` | S07/L; viewport subset→modal subset |
| `libre-baskerville-open-sans-readable` | Longform Classic | 장문 가독 클래식형 | Libre Baskerville 700 / Open Sans 400 | 1.25 | no | `[]` | S08/L; viewport subset→modal subset |
| `cormorant-lato-luxury` | Refined Luxury | 절제된 럭셔리형 | Cormorant Garamond 700 / Lato 400 | 1.414 | no | `[]` | S09/L; viewport subset→modal subset |
| `merriweather-roboto-news` | Digital Newsroom | 디지털 뉴스룸형 | Merriweather 700 / Roboto 400 | 1.25 | no | `[]` | S10/L; viewport subset→modal subset |

### 5.3 모던 산세리프 — 4개

| id | name | nameKr | 폰트 조합 | scale | 한글 | relatedIsms | source/전략 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `inter-jetbrains-product` | Product Interface | 제품 인터페이스형 | Inter 700 / Inter 400 / JetBrains Mono 400 | 1.2 | no | `[]` | S11/L; viewport subset→modal subset |
| `manrope-inter-ibm-plex-mono` | Technical SaaS | 기술 SaaS형 | Manrope 700 / Inter 400 / IBM Plex Mono 400 | 1.25 | no | `[]` | S12/L; viewport subset→modal subset |
| `jakarta-source-sans-code` | Friendly Platform | 친근한 플랫폼형 | Plus Jakarta Sans 700 / Source Sans 3 400 / Source Code Pro 400 | 1.25 | no | `[]` | S13/L; viewport subset→modal subset |
| `space-grotesk-inter-space-mono` | Geometric Product | 기하학 제품형 | Space Grotesk 700 / Inter 400 / Space Mono 400 | 1.333 | no | `[]` | S14/L; viewport subset→modal subset |

### 5.4 에디토리얼 — 3개

| id | name | nameKr | 폰트 조합 | scale | 한글 | relatedIsms | source/전략 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `lora-source-sans-editorial` | Quiet Journal | 차분한 저널형 | Lora 700 / Source Sans 3 400 | 1.25 | no | `[]` | S15/L; viewport subset→modal subset |
| `dm-serif-dm-sans-magazine` | Contemporary Magazine | 동시대 매거진형 | DM Serif Display 400 / DM Sans 400 | 1.333 | no | `[]` | S16/L; viewport subset→modal subset |
| `fraunces-work-sans-expressive` | Expressive Feature | 표현적 피처형 | Fraunces 700 / Work Sans 400 | 1.414 | no | `[]` | S17/L; viewport subset→modal subset |

### 5.5 ISM 연계 — 3개

| id | name | nameKr | 폰트 조합 | scale | 한글 | relatedIsms | source/전략 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `brutalist-space-mono-inter` | Brutalist Utility | 브루탈리즘 유틸리티형 | Space Mono 700 / Inter 400 / Space Mono 400 | 1.333 | no | `brutalism`, `neo-brutalism`, `monospace-terminal-ui` | S18/L; viewport subset→modal subset |
| `art-deco-cinzel-montserrat` | Art Deco Display | 아르데코 디스플레이형 | Cinzel 700 / Montserrat 400 | 1.414 | no | `art-deco` | S19/L; viewport subset→modal subset |
| `cyberpunk-orbitron-rajdhani` | Cyberpunk Console | 사이버펑크 콘솔형 | Orbitron 700 / Rajdhani 400 / Share Tech Mono 400 | 1.333 | no | `cyberpunk`, `futurism` | S20/L; viewport subset→modal subset |

## 6. Webfont source registry

JSON에는 각 pairing에 필요한 source만 넣는다. Loader는 URL 전체를 cache key로 삼고, specimen 문자 합집합을 URL-encode해 `&text=`를 덧붙인다.

| key | CSS source URL |
| --- | --- |
| S01 | Pretendard: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css`; Outfit: `https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap` |
| S02 | `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700&family=Noto+Sans+KR:wght@400;600&display=swap` |
| S03 | `https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap` + S01 Pretendard |
| S04 | `https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;600&display=swap` |
| S05 | `https://fonts.googleapis.com/css2?family=Song+Myung&family=Noto+Sans+KR:wght@400;600&display=swap` |
| S06 | `https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&family=Nanum+Gothic:wght@400;700&display=swap` |
| S07 | `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600&display=swap` |
| S08 | `https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Open+Sans:wght@400;600&display=swap` |
| S09 | `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Lato:wght@400;700&display=swap` |
| S10 | `https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Roboto:wght@400;500&display=swap` |
| S11 | `https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap` |
| S12 | `https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Inter:wght@400;600&family=IBM+Plex+Mono:wght@400;600&display=swap` |
| S13 | `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&family=Source+Sans+3:wght@400;600&family=Source+Code+Pro:wght@400;600&display=swap` |
| S14 | `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;600&family=Space+Mono:wght@400;700&display=swap` |
| S15 | `https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap` |
| S16 | `https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;700&display=swap` |
| S17 | `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Work+Sans:wght@400;600&display=swap` |
| S18 | `https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;600&display=swap` |
| S19 | `https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@400;600&display=swap` |
| S20 | `https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600&family=Share+Tech+Mono&display=swap` |

### 6.1 상용 폰트 대체 원칙

| 상용/system 후보 | 이 페이지의 공개 대체 | 처리 |
| --- | --- | --- |
| Freight Display/Text | Fraunces + Work Sans 또는 Lora + Source Sans 3 | 상용 파일/URL을 저장하지 않음 |
| Tiempos | Lora | 이름을 primary family로 넣지 않음 |
| Graphik / Atlas Grotesk | Inter 또는 Work Sans | 오픈 webfont 조합으로 치환 |
| SF Pro | Inter; Apple 기기 fallback은 `-apple-system` | system fallback 외 배포 금지 |
| SF Mono | JetBrains Mono/IBM Plex Mono/Space Mono; Apple fallback은 `SF Mono` | system fallback 외 배포 금지 |

## 7. 라이브 specimen 렌더링

### 7.1 page와 script 계약

`typography.html`의 style 순서는 `style.css → theme-atlas.css → nav.css → typography.css → runtime-states.css`다. script 순서는 `app-dialog.js → app-runtime.js → catalog-shell.js → typography-fonts.js → typography.js`다. 모두 non-module script이며 `typography.js`가 선행 namespace를 소비한다.

카드에는 다음을 실제 text node로 렌더한다.

- heading specimen: `specimen.headingKo` 또는 `headingEn`
- body specimen: 최대 2줄의 `bodyKo/bodyEn`
- optional mono specimen: 숫자·기호가 포함된 짧은 token
- family/weight/scale metadata와 font load 상태 badge

모달에는 `-1, 0, 1, 2, 3` step type scale, 한글/영문 혼합 paragraph, fallback stack, source 링크, `relatedIsms`, guide WebP를 넣는다. guide 클릭 시 원본 PNG lightbox를 연다. 이미지 모델의 글꼴 재현은 정확성 근거가 아니며 **live specimen이 font truth**다.

### 7.2 지연 로딩과 FOUT

1. 첫 HTML parse에서는 현재 shell의 Pretendard/Outfit만 기존 방식으로 로드한다. 나머지 19개 pairing CSS를 `<head>`에 일괄 추가하지 않는다.
2. `IntersectionObserver(rootMargin: 240px)`가 card를 처음 관찰하면 그 card의 고정 specimen 문자만 합친 `text=` CSS를 요청한다. 같은 URL+text 요청은 Promise cache로 dedupe한다.
3. hash direct-link 또는 card click으로 modal을 열면 observer 여부와 무관하게 해당 pairing을 우선 로드한다. modal의 모든 고정 specimen 문자를 합친 두 번째 subset을 추가하고 `document.fonts.load()`를 기다린다.
4. `font-display=swap`을 유지한다. `is-font-pending`에서도 fallback text를 즉시 보여 FOIT를 만들지 않는다. card specimen box에 고정 min-height를 주어 swap 전후 layout shift를 제한한다.
5. heading/body/mono가 모두 준비되면 `is-font-ready`, timeout/error면 `is-font-failed`를 설정한다. swap은 색·opacity 애니메이션으로 숨기지 않으며 `prefers-reduced-motion`에서 transition을 제거한다.

### 7.3 CJK 용량 통제

- Pretendard는 현재 dynamic subset CSS를 그대로 재사용한다.
- Noto/Nanum/Gowun/Black Han/Song Myung은 full Korean CSS를 초기 로드하지 않는다. card와 modal에 실제로 쓰는 UTF-8 문자 합집합만 `text=`로 요청한다.
- 동일 family/weight의 card subset은 이미 포함된 문자를 set으로 기억하고, 새 글자가 있을 때만 확장 URL을 추가한다.
- 사용자 자유 입력은 OUT이므로 고정 specimen 외 전체 Hangul glyph를 내려받을 이유가 없다.
- guide 이미지는 font payload 대체물이 아니다. 카드가 보이지 않는 동안 guide와 webfont 모두 요청하지 않는다.

### 7.4 실패 fallback

- `<link>` error, 4초 timeout, `document.fonts.check()` false를 failure로 본다.
- failure는 page fatal error가 아니다. data fetch/schema failure만 `AppRuntime.renderFatal`의 재시도 UI를 사용한다.
- font failure 시 선언한 fallback stack으로 카드와 모달을 계속 렌더하고 `대체 글꼴` badge를 노출한다. 검색·필터·modal·lightbox는 그대로 동작해야 한다.
- 외부 Google Fonts와 jsDelivr를 동시에 차단한 QA에서도 빈 text, 무한 loading overlay, unhandled rejection, horizontal overflow가 없어야 한다.

## 8. CatalogShell adapter와 렌더 패턴

`src/typography.ts`는 다음 경계만 소유한다.

1. `fetch('./assets/data/typography.json?v=...')`와 strict parse
2. category·supportsKorean filter model, name/font/summary search text
3. escaped card/modal HTML factory
4. `TypographyFonts` load 상태를 card/modal class와 badge에 반영
5. guide path를 `assets/images/typography/{id}/guide.png`에서 만들고 WebP path를 `assets/images/thumbs/typography/{id}/guide.webp`로 명시
6. `CatalogShell`에 data, render, filter, modal lifecycle adapter 전달
7. direct hash `#<pairing-id>` hydration과 locale/storage는 015 shell/AppRuntime API 재사용

`src/typography-fonts.ts`만 link 생성, URL/text normalization, request cache, timeout, `document.fonts`를 다룬다. page renderer가 전역 `:root` font token을 바꾸지 않고 card/modal element의 scoped CSS custom properties(`--pair-heading`, `--pair-body`, `--pair-mono`)만 설정한다. 따라서 shell의 Pretendard/Outfit/SF Mono 계약은 유지된다.

## 9. ima2 guide 이미지 계획

### 9.1 생성 전제

- 먼저 `ima2 ping`으로 local server와 provider 상태를 확인한다.
- 20개 id와 target path를 `041_typography_guide_manifest.jsonl`에 먼저 확정한 뒤 병렬 생성한다.
- 모델/품질: `oauth/gpt-5.6-sol`, reasoning high, quality high, 1536×1024 PNG.
- canonical command shape:

```bash
ima2 gen --stdin -q high -s 1536x1024 \
  -o assets/images/typography/{id}/guide.png \
  --json --timeout 300 --model oauth/gpt-5.6-sol --reasoning-effort high
```

### 9.2 prompt pattern

```text
Create a 1536x1024 editorial typography-pairing guide board for "{name}" ({nameKr}).
Show one realistic responsive web page composition with a clear hierarchy using the
visual character of {heading.family} {heading.weight} for display text and
{body.family} {body.weight} for body text{monoClause}. Include a compact type-scale rail
based on ratio {scale.ratio}, heading/body role labels, spacing and line-height annotations,
and one mixed Korean-English content region that demonstrates fallback behavior.
Category: {category}. Related design direction: {relatedIsmsOrNone}.
Warm off-white documentation board, charcoal ink, one restrained signal color,
crisp UI geometry, no browser chrome, no brand logos, no people, no fake font download UI,
no long paragraphs, no claims that the generated lettering is an exact font specimen.
```

`monoClause`는 mono가 있을 때만 `, with {mono.family} {mono.weight} for code/data`를 넣는다. 이미지 속 긴 문장과 작은 글자를 font 검증에 쓰지 않는다. audit에서는 hierarchy, pairing mood, obvious glyph corruption, crop, fake logo, unreadable annotations를 확인한다.

### 9.3 thumbnail/provenance

생성 승인 후 `npm run images:thumbs -- --scope typography`를 실행한다. manifest row에는 source/preview SHA와 size가 들어가야 한다. `041`은 prompt/command/result를, `042`는 시각 감사와 최종 source/preview SHA를 기록한다. 실패 candidate는 canonical `guide.png`를 덮지 않는다.

## 10. 구현 순서

1. **Preflight** — 010 schema와 015 `CatalogShell` API, placeholder HTML, generic verifier가 실제로 존재하고 이 문서 계약과 맞는지 확인한다.
2. **Data** — 20개 item과 specimen copy를 작성하고 schema/category/ID/source URL/related ISM을 검증한다.
3. **Font loader** — subset URL, cache, timeout, ready/failed 상태를 `TypographyFonts` namespace로 구현한다.
4. **Renderer** — CatalogShell adapter, strict parser, cards, filters, modal, hash, guide/lightbox를 구현한다.
5. **Page/style/nav** — placeholder와 7개 static nav를 동기 수정하고 script/style 순서를 고정한다.
6. **Guides** — deterministic manifest→ima2 generation→human audit→thumbnail→global manifest 순으로 처리한다.
7. **Verifier/staging/docs** — 20개 catalog와 286 image pairs를 파이프라인에 연결하되 frozen 211 baseline을 약화하지 않는다.
8. **Focused QA** — font success/failure, desktop/mobile, keyboard, no-overflow를 확인한 뒤 전체 verify를 실행한다.

## 11. 검증 계획

### 11.1 정적/data/build

```bash
node -e "const d=require('./assets/data/typography.json'); console.log(d.length)"
npm run build
npm run typecheck
npm run verify:generated
node scripts/verify-catalog.mjs
npm run verify:nav
npm run verify:assets
npm run verify:image-quality
npm run verify
npm run pages:stage
```

기대 결과:

- data 20개, id 중복 0, category `6/4/4/3/3`
- `src/typography*.ts`와 `assets/js/typography*.js` generated parity
- global image manifest 286행, 그중 기존 baseline 211행 값 불변
- staged Typography HTML/data/CSS/JS/40 raster 포함, source-only 파일 미포함
- 모든 NEW file 500줄 이하

### 11.2 폰트 네트워크 QA

- cold load에서 19개 추가 pairing CSS가 일괄 요청되지 않는지 기록한다.
- 첫 viewport card만 source URL을 요청하고, 화면 밖 card는 scroll 전 요청하지 않는지 확인한다.
- CJK request URL에 URL-encoded `text=`가 있고 full Korean payload를 요청하지 않는지 확인한다.
- modal open 직후 해당 pairing의 modal subset과 선언 weight가 준비되는지 `document.fonts.check()`로 확인한다.
- 동일 card 재진입/재오픈에서 중복 `<link>`와 중복 network request가 생기지 않는지 확인한다.
- Google Fonts/gstatic/jsDelivr 차단 시 fallback badge와 readable text를 확인한다.

### 11.3 브라우저/접근성 QA

`npm run qa:local:browser`의 page matrix에 Typography를 추가해 1440/1180/1024/860/640/390px를 검사한다.

- card 정확히 20개, console error/unhandled rejection 0, horizontal overflow 0
- category filter count 6/4/4/3/3, Korean support filter 6/14, 검색 empty/reset
- Enter/Space로 card modal open, Escape로 lightbox→modal 순서 close, trigger focus return
- `#art-deco-cinzel-montserrat` direct link hydration
- modal의 5-step scale, source/fallback, 관련 ISM 링크, guide WebP 768×512
- lightbox 원본 PNG 1536×1024
- image/font failure에서도 loading overlay 종료와 재시도 가능한 data fatal state
- `prefers-reduced-motion: reduce`에서 font-state/card transition 제거

## 12. 수용 기준

- [ ] `typography.html`에 확정 id 20개가 schema-valid data에서 렌더된다.
- [ ] category 분포는 Korean 6 / English Classic 4 / Modern Sans 4 / Editorial 3 / ISM Linked 3이다.
- [ ] 각 item에 id, name, nameKr, family, category, 한국어 summary, heading/body/fallback, optional mono, scale ratio, supportsKorean, webfont source, relatedIsms, guide가 있다.
- [ ] ISM Linked 3개는 현재 실제 id만 참조하고 `ai-slop`을 참조하지 않는다.
- [ ] 현재 shell font load를 중복하지 않고, 나머지 폰트는 viewport/modal 단위 `text=` subset으로만 로드한다.
- [ ] FOUT 중 fallback text가 보이며 외부 폰트 실패가 page fatal로 승격되지 않는다.
- [ ] 모든 card와 modal에 실제 DOM text live specimen이 있고 guide 이미지를 font truth로 오인하지 않는다.
- [ ] 20개 guide는 1536×1024 PNG + 768×512 WebP이며 prompt/provenance/audit/hash가 연결된다.
- [ ] global manifest는 286 pair이고 기존 211 baseline row는 누락·변경되지 않는다.
- [ ] static nav의 Typography 활성 상태, 단일 `aria-current`, page count가 모든 7개 HTML에서 일치한다.
- [ ] build/typecheck/generated/nav/catalog/assets/image-quality/full verify/pages stage가 모두 exit 0이다.
- [ ] 6개 viewport에서 20 cards, no overflow, clean console, keyboard modal/lightbox/focus return을 통과한다.

## 13. 충돌 가능성 및 중단 조건

1. **010 schema drift** — 010의 실제 schema가 이 문서 필드/enum과 다르면 040 구현을 시작하지 않는다. schema 우회가 아니라 상위 계약 재결정이 필요하다.
2. **015 shell API drift** — `CatalogShell`이 async font state, custom modal section, hash lifecycle을 수용하지 못하면 이 phase에서 shell을 몰래 수정하지 않는다. 015 범위 확장 승인을 요청한다.
3. **정적 nav 확산** — nav가 공통 컴포넌트가 아니므로 Typography 활성화는 7개 HTML 동시 수정이 필요하다. 일부 페이지만 활성화하면 `verify-nav`가 실패해야 한다.
4. **211 baseline vs 286 manifest** — 현재 `verify-image-quality.mjs`는 manifest 211행을 강제한다. 단순 count 완화는 금지하며 baseline 211행 exact subset 검증과 typography 20행 allowlist를 함께 구현해야 한다.
5. **thumbnail scope 오분류** — 현재 `--scope isms`가 사실상 `!effects`라서 typography를 ISM으로 오인한다. 명시적 3-way 분류 전에는 typography thumbnail을 생성하지 않는다.
6. **CJK payload** — `text=`가 누락되거나 자유 입력 요구가 추가되면 Korean font payload 전략이 달라진다. 이 phase의 fixed specimen 전제를 다시 검토한다.
7. **외부 font 가용성** — Google Fonts 차단/지연은 정상 degraded mode다. 다만 source URL 4xx, family/weight 불일치, 무한 pending은 data/implementation 결함으로 처리한다.
8. **상용 폰트 요청** — Freight/Tiempos/Graphik/Atlas Grotesk/SF Pro 파일을 포함하라는 요구가 생기면 라이선스와 hosting 결정 없이는 진행하지 않고 오픈 대체안을 유지한다.
