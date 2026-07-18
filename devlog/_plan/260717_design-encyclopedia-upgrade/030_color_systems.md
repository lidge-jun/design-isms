# 030 — Color Systems DIFFLEVEL 로드맵

> **[001 로드맵 잠금 각서 — 010 Canonical Registry가 이 문서의 개별 가정을 우선한다]**
> 1) 이미지 root/scope는 전 도메인 **단수**(`color`/`typography`/`layout`/`motion`) — 이 문서에 `layouts` 등 복수형이 있으면 단수로 읽는다.
> 2) `generate-thumbnails.mjs` scope enum 확장은 015에서 1회(`effects|isms|color|typography|layout|motion|all`) 수행 — 각 사이클이 다시 설계하지 않는다.
> 3) manifest 쌍 카운트는 절대값이 아니라 **누적**: 211 → +30(020) → +25(030) → +20(040) → +25(050) → +20(060) = 최종 331. 이 문서 안의 236/231 등 절대값은 "이 사이클 완료 시점의 예시값"으로만 읽는다.
> 4) `verify-catalog.mjs`는 registry 배열 순회 단일 스크립트(도메인별 인자 없음).
> 5) sot 마커 네이밍은 `data-sot:{domain}-count`.
> 6) 페이지 스크립트 로드 순서는 `app-runtime.js` → `nav-dropdown.js` → `catalog-shell.js` → 도메인 렌더러 — 이 문서의 script 순서 표기에 `nav-dropdown.js`가 빠져 있으면 이 계약을 따른다.
> 7) 이 문서 안의 `generate-thumbnails.mjs`/타 도메인 count 관련 '변경 없음' 행은 변경 맵이 아니라 UNCHANGED 참고로 읽는다. manifest allowlist는 '이 도메인 행만 추가'가 아니라 '기존 additive registry(선행 사이클의 신규 행 포함)를 보존하며 이 도메인 행을 추가'로 읽는다.

> **[WP5 A-감사 fold-back — 이 3개 계약이 본문을 override한다]**
> 1) **대비 판정은 normative**: `contrast.checks`는 승인된 사용 조합이며 light/dark 전 check가 raw ratio 기준 normal-text≥4.5 / large-text≥3.0 / non-text≥3.0을 **통과해야 verify PASS**. AAA는 정보 badge만. 실패 예시는 checks가 아니라 notes에. 대표 HEX 초안 중 `#EA580C`(3.56:1)/`#0D9488`(3.74:1)/`#EAB308`(1.92:1)은 흰 텍스트 normal-text로 못 쓰므로 role 확장 시 on-primary를 카드별 검수.
> 2) **전용 verifier 금지**: `verify-color-systems.mjs`/`verify:colors`는 만들지 않는다(010 Canonical Registry 준수). Color 심층 검증(25 ID 순서, 7/8/5/5, role 집합 동일성, 대비 계약, ledger 25행 대응)은 `verify-catalog.mjs`의 registry `validateColor()` 분기가 소유.
> 3) **ledger/인벤토리 소유권**: image-quality의 additive 집합은 effects 전용(031/032 대응). Color 25쌍은 manifest 허용 집합에만 추가하는 `catalogAdditions` 클래스로 분리하고, 030_color_guide_audit.csv/manifest.jsonl 내용 검증(25 고유 id, decision=pass, promptSha 일치, PNG/WebP SHA)은 verify-catalog Color 분기가 소유. verify-assets에 Color registry 추가. run-final-static-qa 하드코딩 3/211도 manifest 유도로 전환. guide 이미지는 무드/구성 참고용 — caption "정확한 색상 값과 대비 판정은 role/HEX 표 기준" 명시, 이미지 픽셀을 색상 SoT로 쓰지 않음.



의존: 010 스키마 확정 + 015 Catalog nav/shared shell 완료 후  
목표: `color.html` placeholder를 25개 팔레트 카드, 검색/필터, 역할별 스와치, WCAG 대비 검사,
dark variant, guide 이미지/라이트박스를 갖춘 정식 카탈로그로 승격한다.

## 0. 실행 전제와 기준선

- 이 문서는 **015 완료 후 트리**를 기준으로 한 diff다. 즉 `color.html`, `src/catalog-shell.ts`,
  `scripts/verify-catalog.mjs`, Catalog 드롭다운과 7페이지 nav 계약이 이미 존재한다고 가정한다.
- 010이 확정한 `assets/data/schema/color.schema.json`이 단일 스키마 SoT다. 030은 그 파일을
  수정하지 않는다. 아래 필수 필드와 010 결과가 다르면 030에서 임의 보정하지 말고 010 계약을
  먼저 재확정한다.
- 현재 구현의 실제 기준은 `assets/data/effects.json`의 flat entry, `src/effects.ts`의
  fetch → unknown 파싱 → 카드/모달 렌더 → hash hydrate 흐름, `assets/css/effects.css`의
  4열 반응형 grid/modal 구조다. Color는 이를 복제하지 않고 015의 `CatalogShell` adapter로 쓴다.
- 브라우저 스크립트는 non-module이다. `src/color.ts`는 IIFE page entry로 작성하고 전역
  `CatalogShell`, `AppRuntime`, `AppDialogA11y`를 소비한다. `npm run build`가 만든
  `assets/js/color.js`도 커밋 대상이다.
- 페이지 CSS는 `assets/css/color.css`에만 둔다. `color.html` inline `<style>`은 금지한다.
- 기존 211개 ISM/Effect 이미지 품질 baseline(091~098)은 immutable이다. Color guide 25쌍은
  기존 baseline을 다시 쓰지 않고 additive inventory로 분리 감사한다.

## 1. IN / OUT

### IN

- 서비스 7 + ISM 연계 8 + 색 조화 기법 5 + 공개 디자인 시스템 5 = 정확히 25개 카드
- 카드의 8~12색 swatch grid, category/tone/use-case 검색과 필터
- 모달의 light/dark 팔레트, semantic role 매핑, WCAG 2.2 대비율 자동 계산과 판정
- `relatedIsms[]`의 정방향 링크(`./index.html#{ism-id}`)
- 카드별 1536×1024 PNG guide와 768×512 WebP preview, prompt provenance
- `#color-system-id` 직링크, modal/lightbox focus 복귀, fatal retry, safe storage/history
- 정적 검증, build 산출물 검증, Pages stage, 데스크탑/모바일 브라우저 QA

### OUT

- `assets/data/isms.json`, `assets/data/effects.json`, 기존 211개 PNG/WebP의 내용 변경
- ISM 모달에서 Color로 찾아오는 역방향 cross-link(070에서 구현)
- 사용자 색상 편집기, palette generator, Figma/Tailwind export, 계정별 저장
- 외부 디자인 시스템 CSS/package를 runtime dependency로 로드하는 것
- 010 스키마 재설계, 015 shared shell/nav 재설계, 020 Effects 확장
- dark palette의 런타임 자동 생성. `darkVariant`는 검수된 authored data로 저장한다.

## 2. 파일 변경 맵

### NEW

| 경로 | 역할 |
| --- | --- |
| `assets/data/color.json` | 25개 Color card SoT. 아래 schema와 ID를 정확히 고정 |
| `src/color.ts` | non-module IIFE page adapter, strict parser, card/modal renderer, contrast 계산 |
| `assets/js/color.js` | `npm run build`가 생성하는 browser 산출물 |
| `assets/css/color.css` | swatch grid, role table, contrast badges, dark panel, responsive styles |
| `scripts/verify-color-systems.mjs` | 25개/분류/필드/HEX/role/contrast/ISM 참조/guide/provenance 전용 gate |
| `devlog/_plan/260717_design-encyclopedia-upgrade/030_color_guide_audit.csv` | 25개 guide의 anatomy/text/contrast/provenance 수동 판정 ledger |
| `devlog/_plan/260717_design-encyclopedia-upgrade/030_color_guide_manifest.jsonl` | card id, prompt, ima2 명령, model/quality/size, PNG/WebP SHA 기록 |
| `assets/images/color/{id}/guide.png` | 아래 25개 ID별 1536×1024 원본 |
| `assets/images/thumbs/color/{id}/guide.webp` | 아래 25개 ID별 768×512 runtime preview |

### MODIFY

| 경로 | 변경 |
| --- | --- |
| `color.html` | placeholder 제거, toolbar/grid/modal/lightbox mount 추가, Color nav 활성화, `app-dialog.js → app-runtime.js → catalog-shell.js → color.js` 순서 보장 |
| `package.json` | `verify:colors` 추가 후 `verify` 체인에 포함 |
| `scripts/verify-catalog.mjs` | common schema와 Color 25건을 발견하면 generic card/guide/cross-link 검사 실행 |
| `scripts/verify-nav.mjs` | Color를 coming-soon에서 활성으로 전환하고 `25 colors` count/단일 `aria-current` 확인 |
| `scripts/verify-content.mjs` | `color.html`의 CSS/JS 순서, thin entry, runtime dependency 검사 |
| `scripts/generate-thumbnails.mjs` | 변경 없음 — 015에서 확장된 scope enum(`color` 포함)을 그대로 사용 |
| `scripts/verify-assets.mjs` | Color 25쌍을 expected inventory/orphan/hash/1536×1024↔768×512 MAE 검사에 추가 |
| `scripts/verify-image-quality.mjs` | immutable 211 baseline은 정확히 subset으로 유지하고 Color 25 additive rows는 전용 verifier 소유로 허용 |
| `assets/data/image-pairs-manifest.json` | `images:thumbs -- --scope color`로 Color 25쌍 SHA row를 추가, 총 266쌍(누적: 211+30(020)+25) |
| `scripts/stage-pages.mjs` | 015의 7 HTML 계약을 유지하고 raster count를 manifest 기반 266쌍으로 검증 |
| `scripts/run-final-static-qa.mjs` | stage count를 7 HTML/266 PNG/266 WebP로 갱신하되 가능하면 manifest에서 유도 |
| `scripts/run-final-server-qa.mjs` | `/color.html`, data, PNG, WebP의 200/content-type/cache 경로 검사 |
| `scripts/run-final-browser-qa.mjs` | Color 25 cards/filter/modal/contrast/dark/hash/lightbox/overflow flow 추가 |
| `scripts/verify-final-qa.mjs` | Color page receipt와 25 count, 6개 viewport 결과를 final gate에 포함 |
| `scripts/sync-sot.mjs` | Color count를 JSON 길이에서 유도하는 marker renderer 추가 |
| `README.md` | Color 카탈로그/데이터/이미지/검증 명령 설명 추가 |
| `AGENTS.md` | Color 25 count, renderer/asset/contrast 계약과 266 global pair count 동기화 |
| `structure/README.md` | `color.html → color.js → color.json` SoT와 additive image audit 구조 기록 |

`scripts/verify-line-limits.mjs`, `tsconfig.json`, `.github/workflows/deploy.yml`은 수정하지 않는다.
새 TS/MJS/CSS가 500줄 이하인지 기존 자동 수집 gate가 그대로 검사하고, Pages workflow는
`pages:stage` 결과만 배포하는 현 계약을 유지한다.

## 3. 이미지 exact-path 규칙

아래 25개 source/preview pair 외 경로는 만들지 않는다.

```text
assets/images/color/saas-trust-blue/guide.png                  → assets/images/thumbs/color/saas-trust-blue/guide.webp
assets/images/color/ecommerce-conversion/guide.png             → assets/images/thumbs/color/ecommerce-conversion/guide.webp
assets/images/color/media-editorial/guide.png                   → assets/images/thumbs/color/media-editorial/guide.webp
assets/images/color/fintech-assurance/guide.png                 → assets/images/thumbs/color/fintech-assurance/guide.webp
assets/images/color/healthcare-calm/guide.png                   → assets/images/thumbs/color/healthcare-calm/guide.webp
assets/images/color/education-curiosity/guide.png               → assets/images/thumbs/color/education-curiosity/guide.webp
assets/images/color/food-appetite/guide.png                     → assets/images/thumbs/color/food-appetite/guide.webp
assets/images/color/minimalism-neutral/guide.png                → assets/images/thumbs/color/minimalism-neutral/guide.webp
assets/images/color/brutalism-primary/guide.png                 → assets/images/thumbs/color/brutalism-primary/guide.webp
assets/images/color/cyberpunk-neon/guide.png                    → assets/images/thumbs/color/cyberpunk-neon/guide.webp
assets/images/color/vaporwave-pastel/guide.png                  → assets/images/thumbs/color/vaporwave-pastel/guide.webp
assets/images/color/japandi-earth/guide.png                     → assets/images/thumbs/color/japandi-earth/guide.webp
assets/images/color/bauhaus-primary/guide.png                   → assets/images/thumbs/color/bauhaus-primary/guide.webp
assets/images/color/art-deco-luxe/guide.png                     → assets/images/thumbs/color/art-deco-luxe/guide.webp
assets/images/color/solarpunk-regenerative/guide.png            → assets/images/thumbs/color/solarpunk-regenerative/guide.webp
assets/images/color/monochromatic-blue/guide.png                → assets/images/thumbs/color/monochromatic-blue/guide.webp
assets/images/color/complementary-blue-orange/guide.png         → assets/images/thumbs/color/complementary-blue-orange/guide.webp
assets/images/color/analogous-teal-green/guide.png              → assets/images/thumbs/color/analogous-teal-green/guide.webp
assets/images/color/triadic-primary/guide.png                   → assets/images/thumbs/color/triadic-primary/guide.webp
assets/images/color/split-complementary-violet/guide.png        → assets/images/thumbs/color/split-complementary-violet/guide.webp
assets/images/color/material-3-baseline/guide.png               → assets/images/thumbs/color/material-3-baseline/guide.webp
assets/images/color/tailwind-slate-blue/guide.png               → assets/images/thumbs/color/tailwind-slate-blue/guide.webp
assets/images/color/radix-violet/guide.png                      → assets/images/thumbs/color/radix-violet/guide.webp
assets/images/color/ibm-carbon-blue/guide.png                   → assets/images/thumbs/color/ibm-carbon-blue/guide.webp
assets/images/color/github-primer-light/guide.png               → assets/images/thumbs/color/github-primer-light/guide.webp
```

이름이 비슷해도 ISM 이미지 root인 `assets/images/{ism-id}/`에 넣지 않는다. Color root를
명시적으로 분리해야 `--scope isms`, orphan 검사, immutable 211 baseline이 오염되지 않는다.

## 4. 데이터 계약

`assets/data/color.json`은 `effects.json`처럼 top-level array다. entry는 다음 계약을
충족한다. 010 schema가 이 계약을 더 엄격하게 만들 수는 있지만 완화할 수는 없다.

| 필드 | 타입 / 제약 | 의미 |
| --- | --- | --- |
| `id` | string, `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, unique | hash와 image directory에 공용인 kebab-case ID |
| `name` | non-empty string | 영문 표시명 |
| `nameKr` | non-empty string | 한국어 표시명 |
| `family` | `Service` \| `ISM` \| `Technique` \| `System` | 7/8/5/5 상위 분류 |
| `category` | kebab-case string | `saas`, `minimalism`, `complementary`, `material-3` 같은 세부 필터 |
| `tone` | `warm` \| `cool` \| `neutral` \| `mixed` | 색조 필터 |
| `summary` | 한국어 2~3문장 | 용도, 시각 특성, 주의점을 압축한 카드/모달 설명 |
| `useCases` | string[2..5] | 검색 chip과 guide prompt의 실제 사용 맥락 |
| `palette` | `ColorToken[8..12]` | light palette. 각 원소는 unique `role`과 uppercase `#RRGGBB` |
| `contrast` | `ContrastInfo` | 검사할 역할 쌍과 usage. ratio/pass는 저장하지 않고 계산 |
| `darkVariant` | `{ palette: ColorToken[8..12], contrast: ContrastInfo }` | 검수된 dark 역할 세트. light와 role key 집합 동일 |
| `relatedIsms` | existing ism id[] | `assets/data/isms.json` 실존 ID만 허용, 중복/`ai-slop` 금지 |
| `guide` | `{file, alt, prompt}` | `file`은 항상 `guide.png`, alt/prompt non-empty |
| `sources` | `{label,url}[]` | System은 공식 HTTPS 1개 이상 필수, 나머지는 provenance 권장 |
| `reviewedOn` | `YYYY-MM-DD` | 팔레트/공식 토큰 확인일 |

```ts
interface ColorToken {
  role: 'background' | 'surface' | 'surface-muted' | 'text' | 'text-muted'
    | 'primary' | 'on-primary' | 'secondary' | 'on-secondary' | 'accent'
    | 'border' | 'info' | 'success' | 'warning' | 'danger';
  hex: `#${string}`;
  labelKr: string;
}

interface ContrastInfo {
  checks: Array<{
    foregroundRole: string;
    backgroundRole: string;
    usage: 'normal-text' | 'large-text' | 'non-text';
  }>;
  notes: string[];
}
```

필수 role은 `background`, `surface`, `text`, `text-muted`, `primary`, `on-primary`, `border`,
`success`다. 나머지는 카드 성격에 맞게 8~12개 범위 안에서 추가한다. `darkVariant`는 단순
색상 반전이 아니라 같은 role key를 다른 HEX에 매핑한다. `contrast.checks`의 role은 반드시
해당 palette에 존재해야 한다.

## 5. 확정 카드 25개

아래 HEX는 카드 상단에 보일 **대표 4~6색 초안**이다. 실제 JSON은 각 행을 role 기반 tint,
surface, border, semantic state로 확장해 light/dark 각각 8~12색을 채운다.

### 5.1 서비스 팔레트 — 7

| id | name / nameKr | 대표 HEX 초안 |
| --- | --- | --- |
| `saas-trust-blue` | SaaS Trust Blue / SaaS 신뢰 블루 | `#F8FAFC #0F172A #2563EB #60A5FA #14B8A6 #F59E0B` |
| `ecommerce-conversion` | Commerce Conversion / 이커머스 전환 | `#FFF7ED #431407 #EA580C #FB923C #0F766E #DC2626` |
| `media-editorial` | Media Editorial / 미디어 에디토리얼 | `#FAFAF9 #1C1917 #E11D48 #F43F5E #7C3AED #F59E0B` |
| `fintech-assurance` | Fintech Assurance / 금융 신뢰 | `#F8FAFC #0F172A #0F62FE #0043CE #24A148 #DA1E28` |
| `healthcare-calm` | Healthcare Calm / 헬스케어 안정 | `#F0FDFA #134E4A #0D9488 #5EEAD4 #0284C7 #F97316` |
| `education-curiosity` | Education Curiosity / 교육 호기심 | `#FFFBEB #1E1B4B #4F46E5 #818CF8 #EAB308 #22C55E` |
| `food-appetite` | Food Appetite / 푸드 식욕 | `#FFF7ED #7C2D12 #EA580C #FDBA74 #65A30D #B91C1C` |

### 5.2 ISM 연계 팔레트 — 8

`relatedIsms`는 모두 현재 `assets/data/isms.json`에 실재한다. 대표 4색은 해당 ISM의 현재
`palette` 값을 그대로 시작점으로 사용하고, 추가 tint/semantic role만 Color data에서 만든다.

| id | name / nameKr | 대표 HEX 초안 | relatedIsms |
| --- | --- | --- | --- |
| `minimalism-neutral` | Minimalism Neutral / 미니멀 뉴트럴 | `#FFFFFF #1A1A1A #F5F5F5 #E0E0E0` | `minimalism` |
| `brutalism-primary` | Brutalism Primary / 브루탈리즘 원색 | `#FFFFFF #000000 #FF0000 #0000FF` | `brutalism` |
| `cyberpunk-neon` | Cyberpunk Neon / 사이버펑크 네온 | `#0D0D0D #FF003C #00F0FF #BC13FE` | `cyberpunk` |
| `vaporwave-pastel` | Vaporwave Pastel / 베이퍼웨이브 파스텔 | `#FF71CE #01CDFE #B967FF #1A1A2E` | `vaporwave` |
| `japandi-earth` | Japandi Earth / 재팬디 어스 | `#D4C5A9 #2C3639 #F5F0E8 #A27B5C` | `japandi` |
| `bauhaus-primary` | Bauhaus Primary / 바우하우스 원색 | `#DD1C1A #086788 #F0C808 #FFFFFF` | `bauhaus` |
| `art-deco-luxe` | Art Deco Luxe / 아르데코 럭스 | `#1A1A2E #D4AF37 #FFFFFF #16213E` | `art-deco` |
| `solarpunk-regenerative` | Solarpunk Regenerative / 솔라펑크 재생 | `#2D6A4F #95D5B2 #FFD60A #F0F4EF` | `solarpunk` |

### 5.3 기법 팔레트 — 5

| id | name / nameKr | 대표 HEX 초안 |
| --- | --- | --- |
| `monochromatic-blue` | Monochromatic Blue / 블루 모노크롬 | `#EFF6FF #DBEAFE #93C5FD #3B82F6 #1D4ED8 #172554` |
| `complementary-blue-orange` | Blue–Orange Complementary / 블루·오렌지 보색 | `#EFF6FF #2563EB #1E3A8A #FFF7ED #F97316 #9A3412` |
| `analogous-teal-green` | Teal–Green Analogous / 틸·그린 유사색 | `#ECFDF5 #10B981 #047857 #F0FDFA #14B8A6 #0F766E` |
| `triadic-primary` | Primary Triad / 원색 트라이어드 | `#FEF2F2 #DC2626 #FEFCE8 #EAB308 #EFF6FF #2563EB` |
| `split-complementary-violet` | Violet Split Complementary / 바이올렛 스플릿 보색 | `#F5F3FF #7C3AED #2E1065 #F7FEE7 #65A30D #F97316` |

### 5.4 시스템 팔레트 — 5

| id | name / nameKr | 대표 HEX 초안 | 공식 근거 |
| --- | --- | --- | --- |
| `material-3-baseline` | Material 3 Baseline / 머티리얼 3 베이스라인 | `#FFFBFE #1C1B1F #6750A4 #FFFFFF #EADDFF #21005D` | [Android Developers Material 3 color XML](https://developer.android.com/develop/ui/views/theming/dynamic-colors?hl=ko) |
| `tailwind-slate-blue` | Tailwind Slate & Blue / 테일윈드 슬레이트·블루 | `#F8FAFC #CBD5E1 #64748B #0F172A #3B82F6 #1D4ED8` | [Tailwind v3.4 default palette](https://v3.tailwindcss.com/docs/customizing-colors) |
| `radix-violet` | Radix Violet / 래딕스 바이올렛 | `#FDFCFE #EBE4FF #C2B5F5 #6E56CF #6550B9 #2F265F` | [Radix scales](https://www.radix-ui.com/colors/docs/palette-composition/scales), [official package CSS](https://cdn.jsdelivr.net/npm/@radix-ui/colors@latest/violet.css) |
| `ibm-carbon-blue` | IBM Carbon Blue / IBM 카본 블루 | `#FFFFFF #F4F4F4 #161616 #0F62FE #24A148 #DA1E28` | [IBM Design Language color](https://www.ibm.com/design/language/color/) |
| `github-primer-light` | GitHub Primer Light / 깃허브 프라이머 라이트 | `#FFFFFF #F6F8FA #1F2328 #0969DA #1F883D #CF222E` | [Primer color primitives](https://primer.style/product/primitives/color/) |

시스템 카드는 공식 UI를 복제하는 템플릿이 아니라 공개 token의 역할 구조를 설명하는
교육용 reference다. `reviewedOn`과 URL을 저장하고, 상표 logo/실제 제품 screenshot은 guide에서
사용하지 않는다. Tailwind 행은 HEX를 직접 공개하는 v3.4.17 문서 snapshot임을 이름/summary에
명시해 현재 v4 OKLCH palette와 혼동하지 않는다.

## 6. 렌더러 설계

### 6.1 `src/color.ts` 책임

1. `./assets/data/color.json?v=...` fetch
2. `unknown`에서 25 entries를 strict parse: array/object/string/enum/HEX/길이/role 참조 검증
3. `CatalogShell.mount(config)`에 item, filters, `renderCard`, `renderModal`, hash key를 전달
4. 카드와 모달 HTML을 만들 때 모든 text/attribute를 escape
5. 대비율을 authored number가 아니라 palette role의 HEX로 계산
6. image preview는 WebP `<source>`, fallback/원본은 PNG, lightbox는 PNG만 사용
7. 실패 시 `AppRuntime.renderFatal`로 retry하고 `finally`에서 loading overlay 종료

페이지 entry가 focus trap, Escape, hash replace, scroll lock을 재구현하지 않는다. 015의
`CatalogShell`/`AppDialogA11y`에 위임하고 Color 고유 delegated click은 prompt copy와 role row
선택 정도로 제한한다.

### 6.2 카드 swatch grid

- `.color-card-swatches`: `display:grid; grid-template-columns:repeat(4,minmax(0,1fr))`
- 8색은 4×2, 9~12색은 마지막 행을 허용한다. 색 개수에 따른 임의 inline width 계산 금지
- 각 swatch는 `background: var(--swatch)`를 쓰되 text label은 DOM에 유지한다.
- 카드에는 대표 role 4개(`background`, `text`, `primary`, `accent|success`)를 먼저 보이고,
  전체 8~12색은 같은 grid 안에 표시한다.
- 색 정보가 color alone이 되지 않도록 tooltip/accessible name에 role + HEX를 함께 제공한다.
- `@media (max-width:1024px)` 3열, `640px` 이하 1열. `min-width:0`, long name wrap으로
  horizontal overflow를 차단한다.
- `prefers-reduced-motion`에서는 card reveal/hover transition을 즉시 종료한다.

### 6.3 모달 role 매핑 표

| 열 | 값 | 동작 |
| --- | --- | --- |
| Swatch | 실제 HEX 배경 + 경계선 | 밝은 색도 경계가 보이도록 contrast-neutral border |
| Role | `primary`, `on-primary` 등 | 데이터의 stable key, 복사 가능 |
| 한국어 라벨 | `주요 행동`, `주요 행동 위 텍스트` | `labelKr` 표시 |
| HEX | uppercase `#RRGGBB` | 버튼으로 복사, toast announcement |
| Paired with | contrast check 상대 role | 해당 조합이 없으면 `—` |
| Ratio | 예: `7.12:1` | 표시는 소수 둘째 자리, 판정은 raw value 사용 |
| AA 상태 | Normal / Large / Non-text | Pass/Fail text와 icon을 함께 표시 |

모달 상단은 light/dark toggle이 아니라 두 authored panel을 나란히 비교한다. 작은 화면에서는
세로 stack한다. JS가 사용자의 OS dark mode에 따라 데이터를 바꾸지 않으며, 각 panel의 role
mapping과 contrast 결과를 독립 계산한다.

### 6.4 WCAG 대비율 계산

[WCAG 2.2 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)의
sRGB 상대휘도 정의를 그대로 구현한다.

```text
1. #RRGGBB 각 채널을 0..255 → c = channel / 255 로 정규화
2. c <= 0.04045 이면 cLinear = c / 12.92
   아니면 cLinear = ((c + 0.055) / 1.055) ^ 2.4
3. L = 0.2126*RLinear + 0.7152*GLinear + 0.0722*BLinear
4. ratio = (max(L1,L2) + 0.05) / (min(L1,L2) + 0.05)
```

- normal text AA: `ratio >= 4.5`
- large text와 non-text UI boundary: `ratio >= 3.0`
- AAA 참고 badge: normal `>= 7.0`, large `>= 4.5`
- 판정 전에 ratio를 반올림하지 않는다. `4.499`는 fail이고 표시만 `4.50:1`로 format한다.
- alpha HEX, gradient, image background는 이 단계에서 지원하지 않는다. schema는 opaque
  `#RRGGBB`만 허용하고 guide 이미지 위 text 대비는 수동 audit에서 별도 확인한다.
- verifier의 고정 sanity cases: black/white `21:1`, same color `1:1`, role pair가 없거나
  malformed HEX이면 fail closed.

## 7. ima2 guide 생성 계약

생성 전 `ima2 ping`으로 server/provider를 확인한다. deterministic manifest에서 25 target을
먼저 확정한 뒤 bounded parallel batch로 실행한다.

### 공통 프롬프트 패턴

```text
Clean instructional color-system UI guide for {name} ({nameKr}). Create an original
{useCase} interface mockup using only this authored palette: {paletteHexCsv}.
Clearly demonstrate semantic roles: {roleMap}; show a compact light composition and
a matching dark composition from {darkRoleMap}. Emphasize {visualMotif}. Include a
small swatch legend with short Korean role labels, but no paragraphs and no tiny text.
Editorial product-documentation style, crisp realistic UI, strong hierarchy,
WCAG-conscious text/background choices, no gradients unless category requires them,
no browser chrome, no people, no brand logos, no copied product UI, 3:2 composition.
```

카드별 prompt 변수:

| 변수 | source |
| --- | --- |
| `{id}`, `{name}`, `{nameKr}` | entry identity |
| `{family}`, `{category}`, `{tone}` | filter/context 방향 |
| `{useCase}` | `useCases[0]` |
| `{paletteHexCsv}` | light palette 8~12색, role 순서 |
| `{roleMap}` / `{darkRoleMap}` | `role=HEX` 문자열 |
| `{primaryPair}` | primary/on-primary 대비 조합 |
| `{visualMotif}` | service/ISM/technique/system별 고유 구도 설명 |
| `{forbiddenMarks}` | System 카드의 logo/brand screenshot 금지 보강 |

실행 명령은 카드마다 target만 바뀐다.

```bash
ima2 gen --stdin -q high -s 1536x1024 \
  -o assets/images/color/{id}/guide.png --json --timeout 300
npm run images:thumbs -- --scope color
```

각 성공 job은 `030_color_guide_manifest.jsonl`에 prompt SHA, command, model, reasoning,
원본/preview SHA를 남긴다. audit CSV에서 `pass`인 25건만 canonical path로 인정한다.

## 8. 구현 순서

### P1 — Contract lock

- 010 `color.schema.json`과 015 `CatalogShell.mount` signature를 실제 파일에서 재확인한다.
- 위 25 IDs, family 7/8/5/5, official source snapshot, light/dark role 집합을 동결한다.
- `verify-color-systems.mjs`를 먼저 작성해 empty/duplicate/invalid/dangling fixture가 실패하는지 본다.

### P2 — Data + renderer

- `color.json` 25건을 작성하고 모든 palette/darkVariant를 8~12 role로 확장한다.
- `src/color.ts`, `assets/css/color.css`, `color.html`을 구현한다.
- `npm run build` 후 `assets/js/color.js`가 `verify:generated`와 byte-identical인지 확인한다.

### P3 — Guides + additive image audit

- `ima2 ping` → deterministic targets → 25 PNG 생성 → 수동 audit → WebP 생성 순서로 진행한다.
- global pair manifest는 241→266으로 확장(020 완료 후 기준)하되 기존 211 row의 path/hash는 byte-stable이어야 한다.
- `verify:image-quality`는 기존 211 baseline을 계속 완전 검증하고 Color 25는
  `verify:colors`/`verify:assets`/Color ledgers가 완전 검증한다.

### P4 — Integration + QA

- Color nav를 활성화하고 count, docs, SoT marker, stage/QA의 hardcoded 211/3-page 가정을 제거한다.
- desktop/mobile에서 filter, empty/reset, modal, contrast, dark panel, hash, lightbox를 확인한다.
- 최종적으로 build → thumbs → verify → stage → server/browser QA 순으로 evidence를 남긴다.

## 9. 검증 계획과 확장 지점

### `scripts/verify-color-systems.mjs`

- 정확히 25개, family counts `Service=7 / ISM=8 / Technique=5 / System=5`
- 위 ID set과 정렬 순서, duplicate 0, kebab-case, 한국어 summary 2~3문장
- light/dark 각각 8~12 unique role, uppercase opaque HEX, 필수 role 완비
- light/dark role key 집합 동일, contrast check의 dangling role 0
- 모든 contrast pair 계산 가능, black/white sanity `21`, 판정 전 무반올림
- `relatedIsms[]`가 실제 49개 ID에 존재, `ai-slop` 참조 0
- System 5건은 공식 HTTPS source와 `reviewedOn`, 나머지는 guide prompt/alt 존재
- 25 PNG + 25 WebP + 25 manifest row + 25 audit pass + 25 provenance row

### 기존 gate 확장

- `verify:catalog`: common schema/guide/hash link contract
- `verify:nav`: 7페이지 동일 축 순서, Color active, page당 단일 `aria-current`, `25 colors`
- `verify:content`: Color CSS/JS non-module load order와 `app-runtime.js` 선로드
- `verify:assets`: 전역 266쌍, dimensions/SHA/MAE≤18/orphan 0
- `verify:image-quality`: legacy 211 baseline/full receipt는 계속 exact, additive 25 때문에 baseline
  파일이나 091~098을 재작성하지 않음
- `verify:generated`: `src/color.ts`와 committed `assets/js/color.js` 일치
- `verify:lines`: 새 TS/MJS/CSS 각각 ≤500줄
- `pages:stage`/`qa:static`: 7 HTML, 266 PNG, 266 WebP, forbidden 0
- `qa:server`: Color HTML/data/guide source/preview 200
- `qa:local:browser`: 1440/1180/1024/860/640/390px, console error 0,
  `document.documentElement.scrollWidth <= innerWidth`

권장 실행:

```bash
npm run build
npm run images:thumbs -- --scope color
npm run verify:colors
npm run verify
npm run pages:stage
npm run qa:static
npm run qa:server
npm run qa:local:browser
npm run verify:local-final
```

## 10. 수용 기준

- [ ] `color.html`에 정확히 25 cards가 보이고 family filter 결과가 7/8/5/5다.
- [ ] 각 card는 light palette 8~12색을 role+HEX accessible name과 함께 표시한다.
- [ ] 각 modal은 light/dark role 표, 모든 declared 대비 조합, raw-value 기반 AA 판정을 표시한다.
- [ ] normal 4.5:1, large/non-text 3:1 기준과 `4.499` fail이 browser/verifier에서 동일하다.
- [ ] 8개 ISM 카드의 `relatedIsms`가 위 실존 ID와 일치하고 링크가 해당 ISM hash를 연다.
- [ ] 검색, family/category/tone filter, empty/reset, `#id` 직링크가 새로고침 후에도 동작한다.
- [ ] modal → lightbox → modal 순 Escape와 trigger focus 복귀가 `AppDialogA11y` 계약을 지킨다.
- [ ] 25개 guide는 1536×1024 PNG, 25 previews는 768×512 WebP이고 preview 우선/PNG 확대다.
- [ ] global manifest는 266행이며 기존 211 source/preview bytes와 baseline receipt는 변하지 않는다.
- [ ] 25 audit rows와 25 provenance rows가 ID/hash/prompt/command에 일대일 대응한다.
- [ ] `src/color.ts`, `assets/css/color.css`, `scripts/verify-color-systems.mjs`가 각각 500줄 이하다.
- [ ] 6개 viewport 모두 horizontal overflow 0, uncaught error/console error 0, reduced motion 통과다.
- [ ] `npm run build`, `npm run verify`, `pages:stage`, static/server/browser/final QA가 모두 통과한다.
- [ ] README/AGENTS/structure의 page/count/image/SoT 설명이 구현과 일치한다.

## 11. 충돌 방지 결정

1. **Nav 계약**: 현재 3페이지 6축을 030이 직접 깨지 않는다. 015가 먼저 7페이지 Catalog 축을
   완성하고, 030은 Color의 `coming soon`만 활성화한다.
2. **Schema 소유권**: `color.schema.json`은 010 소유다. 030에서 별도 유사 schema를 만들지 않는다.
3. **Shell 소유권**: 검색/필터/modal/hash/focus는 015 `CatalogShell`; Color는 domain renderer만 소유한다.
4. **Image baseline**: 기존 211 baseline을 236으로 다시 캡처하면 immutable audit가 무효화된다.
   따라서 legacy 211 exact 검증 + Color 25 additive audit의 두 층으로 유지한다.
5. **Thumbnail scope**: 현 `isms = !effects` 판정은 Color를 ISM으로 오분류한다. 030에서
   `effects|color|isms|all`을 explicit root로 바꾼 뒤 `--scope color`를 사용한다.
6. **System token 시점**: 공식 token은 바뀔 수 있다. `sources`와 `reviewedOn`을 저장하고,
   특히 Tailwind는 v3 HEX snapshot이라고 명시해 v4 OKLCH와 섞지 않는다.
