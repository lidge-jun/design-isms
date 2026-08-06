# design-isms 플러그인 사용설명서

이 저장소는 정적 사이트인 동시에 **멀티호스트 AI 에이전트 플러그인**입니다. 사이트를 렌더링하는 것과 똑같은 `assets/data/*.json` 데이터셋을 에이전트가 직접 질의해, 팔레트 헥스값·폰트 페어링·그리드 수치·실행 가능한 HTML/CSS/JS 스니펫을 반환합니다.

지원 호스트: **Claude Code · Codex · agy**

---

## 1. 설치

### Claude Code

```bash
claude plugin marketplace add lidge-jun/design-isms
claude plugin install design-isms@lidge-jun
```

설치 확인:

```bash
claude plugin details design-isms
```

```
Component inventory
  Skills (2)  effect, style
```

### Codex

```bash
codex plugin marketplace add lidge-jun/design-isms
codex plugin add design-isms@lidge-jun
```

### agy

```bash
agy plugin install https://github.com/lidge-jun/design-isms
agy plugin enable design-isms
```

### 설치 없이 한 세션만 (개발·테스트용)

```bash
claude --plugin-dir=/절대/경로/design-isms
```

> **주의**: `~/`(틸드)는 전개되지 않습니다. 반드시 절대경로나 `"$HOME/..."`를 쓰세요.
> `--plugin-dir=~/fork/design-isms`는 조용히 실패합니다.

### 제거

```bash
claude plugin uninstall design-isms
claude plugin marketplace remove lidge-jun
```

---

## 2. 스킬 두 개

| 스킬 | 호출명 | 다루는 것 |
|------|--------|-----------|
| style | `design-isms:style` | 디자인 사조(ism) 49종 — 팔레트, 폰트, 그리드, 모션 |
| effect | `design-isms:effect` | 프런트엔드 UI 패턴 94종 — 실행 가능한 코드, 접근성 |

명시적으로 부를 필요는 없습니다. 아래 예시처럼 물으면 자동으로 트리거됩니다. 한국어·영어 모두 인식합니다.

---

## 3. style — 디자인 사조 49종

### 무엇을 물으면 되나

```
미니멀리즘 컬러 팔레트 추천해
브루탈리즘 폰트 페어링 알려줘
아르데코가 뭐야?
내 포트폴리오 사이트에 맞는 디자인 스타일 추천해줘
바우하우스랑 스위스 스타일 비교해줘
플랫 디자인 그리드 수치 알려줘
```

### 실제 응답 예시

`미니멀리즘 컬러 팔레트 추천해` →

```
#FFFFFF  배경
#1A1A1A  본문 텍스트
#F5F5F5  보조 배경
#E0E0E0  구분선

폰트: sans-serif (Inter + system-ui)
그리드: 단순 그리드 시스템 (1-2 컬럼 중심), gutter 24px
```

### 반환 항목

- **팔레트** — hex 값 + 역할 배정(배경/본문/강조) + 대비 가이드
- **타이포그래피** — `fontPairing`, `sizeHierarchy`, `lineHeight`, `letterSpacing`, `weightStrategy`
- **레이아웃** — `grid`, `columns`, `gutter`, `margins`, `spacing`, `symmetry`, `geometry`
- **모션** — `easing`, `duration`, `hover`, `scroll`, `transition`
- **맥락** — tagline, 설명, 히스토리, 실제 사이트 예시 10개, `dos`/`donts`

### 주요 ism id

`minimalism`, `bauhaus`, `flat-design`, `material-design`, `art-deco`, `swiss-style`, `brutalism`, `skeuomorphism` … 총 49종

---

## 4. effect — UI 패턴 94종

### 무엇을 물으면 되나

```
바텀시트 만들어줘
스크롤 리빌 효과 코드 줘
모바일에서 쓸 만한 P0 패턴 목록
드로어 메뉴 접근성 지키면서 만들려면?
sticky CTA bar 언제 쓰는 게 좋아?
이 효과 reduced-motion 대응은?
```

### 반환 항목

- **실행 가능한 코드** — `html`, `css`, `js`(필요 시)
- **접근성** — `a11yNotes[]`, `prefers-reduced-motion` 대응 포함
- **판단 근거** — `bestFor[]`(언제 쓰나), `avoidWhen[]`(언제 피하나), `misuse`(흔한 오용)
- **맥락** — 배경, 히스토리, 실제 사례, 구조 분석

### 범위 좁히기

| 축 | 값 | 분포 |
|----|-----|------|
| priority | P0 / P1 / P2 / P3 | 19 / 49 / 23 / 3 |
| category | Mobile / Desktop / Shared | 11 / 32 / 51 |
| family | 7종 | Interface Pattern 등 |

`"P0 모바일 패턴만"`처럼 물으면 해당 조건으로 필터링해 답합니다.

### 주요 effect id

`bottom-sheet`, `full-screen-mobile-modal`, `drawer-navigation`, `sticky-cta-bar`, `scroll-reveal`, `staggered-cards`, `press-scale`, `swipe-action` … 총 94종

---

## 5. 데이터 출처

스킬은 데이터를 복제하지 않고 저장소의 JSON을 그대로 읽습니다. 사이트와 스킬이 **같은 진실 원천**을 공유하므로, 데이터를 고치면 양쪽에 동시에 반영됩니다.

| 파일 | 내용 |
|------|------|
| `assets/data/isms.json` | ism 49종 — 팔레트, 키워드, 예시 사이트, 히스토리 |
| `assets/data/dev-guides.json` | ism별 개발 가이드 — 그리드/타이포/컬러/모션 수치 |
| `assets/data/effects.json` | effect 94종 — family, category, priority, 접근성, 성능 |
| `assets/data/effects-snippets.json` | 실행 가능한 HTML/CSS/JS 스니펫 |
| `assets/data/effects-docs.json` | effect별 배경·히스토리·사용시점·오용 사례 |
| `assets/data/{color,typography,layout,motion}.json` | 보조 카탈로그 (25/20/25/20종) |

---

## 6. 저장소 구조

```
design-isms/
├── plugin.json                  # agy 매니페스트
├── .claude-plugin/
│   ├── plugin.json              # Claude Code 매니페스트
│   └── marketplace.json         # 마켓플레이스 등록
├── .codex-plugin/plugin.json    # Codex 매니페스트
├── skills/                      # ← 진실 원천
│   ├── style/SKILL.md
│   └── effect/SKILL.md
├── .claude/skills/              # 발견용 심링크 → ../../skills/
│   ├── style  -> ../../skills/style
│   └── effect -> ../../skills/effect
└── assets/data/*.json           # 스킬이 읽는 데이터셋
```

`skills/`의 SKILL.md 두 개만 실제 파일입니다. `.claude/skills/`는 심링크이므로 문서가 중복되지 않습니다.

---

## 7. 개발 — 스킬 수정하기

`skills/style/SKILL.md` 또는 `skills/effect/SKILL.md`를 편집합니다. 심링크라서 복사본 동기화는 필요 없습니다.

구조 점검:

```bash
python3 ~/.claude/plugins/marketplaces/plugin-forge/scripts/forge.py doctor .
```

`FAIL 0`이면 정상입니다. 마켓플레이스 미등록 `WARN`은 배포 전 정상 상태입니다.

설치 가능성 확인:

```bash
python3 ~/.claude/plugins/marketplaces/plugin-forge/scripts/forge.py install . --host all
```

사이트 회귀 확인 (플러그인 변경이 빌드를 깨지 않는지):

```bash
npm run verify
```

---

## 8. 문제 해결

### 플러그인 목록에 안 뜬다

**틸드 경로**를 썼는지 확인하세요. `--plugin-dir=~/...`는 전개되지 않습니다.

```bash
# 안 됨
claude --plugin-dir=~/fork/design-isms

# 됨
claude --plugin-dir=/Users/이름/fork/design-isms
claude --plugin-dir="$HOME/fork/design-isms"
```

### `Marketplace file not found`

매니페스트가 기본 브랜치(`main`)에 있어야 합니다. `marketplace add`는 기본 브랜치만 클론하므로, 작업 브랜치에만 있으면 실패합니다.

### `This plugin uses a source type your Claude Code version does not support`

`.claude-plugin/marketplace.json`의 `source`가 맨 URL 문자열이면 거부됩니다. 객체 형태를 쓰세요.

```json
"source": { "source": "url", "url": "https://github.com/lidge-jun/design-isms.git" }
```

같은 저장소 안에서 자기 자신을 가리킬 때는 `"./"`도 유효합니다.

### 스킬이 로드됐는데 트리거가 안 된다

`SKILL.md` frontmatter의 `description`에 있는 트리거 표현으로 물어보세요. 한국어 키워드도 포함되어 있습니다. 또는 `/style`, `/effect`처럼 직접 호출할 수 있습니다.

---

## 9. 토큰 비용

| 항목 | 비용 |
|------|------|
| always-on (매 세션) | ~653 tok |
| style 호출 시 | ~1.7k tok |
| effect 호출 시 | ~1.5k tok |

always-on은 두 스킬의 `description`만 계산된 값이며, 본문은 실제 호출될 때만 로드됩니다.
