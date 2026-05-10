# Feature Plan: ISM Detail Popup

## Overview
카드 클릭 시 팝업(모달)이 열려서 해당 ism의 상세 정보를 스크롤하며 볼 수 있는 기능.
현재 라이트박스(이미지 확대)와 별도로, 카드 전체를 클릭하면 상세 뷰가 열림.

## User Flow
1. 카드 클릭 → 오버레이 + 팝업 등장 (fade + slide-up)
2. 팝업 안에서 스크롤:
   - ism 이름 + 한국어명 + 태그라인
   - 설명 (확장)
   - **생성 프롬프트** (각 이미지별 ima2 프롬프트 전문)
   - 이미지 갤러리 (큰 사이즈로)
   - 컬러 팔레트 (복사 가능)
   - 키워드 태그
   - 대표 사이트 링크
   - 관련 ism 추천 (같은 keyword 공유)
3. ESC / 오버레이 클릭 / X 버튼 → 닫기
4. URL hash 연동 (`#minimalism`) → 직링크 가능

## Data Changes

### isms.json 확장
```json
{
  "id": "minimalism",
  ...
  "prompts": [
    {
      "file": "landing.png",
      "prompt": "A minimalist e-commerce website homepage screenshot...",
      "model": "gpt-image-2",
      "quality": "high",
      "size": "1536x1024"
    }
  ],
  "relatedIsms": ["japandi", "swiss-style", "flat-design"]
}
```

## UI Components

### 1. Modal Container
```
.modal-overlay     — fixed, full-screen, semi-transparent black
.modal-container   — centered, max-width 720px, max-height 85vh
.modal-scroll      — overflow-y: auto, 내부 스크롤
.modal-close       — 우상단 X 버튼 (fixed within modal)
```

### 2. Modal Content Sections
```
.modal-hero        — 첫 번째 이미지 대형 표시
.modal-header      — 번호 + 이름 + 태그라인
.modal-desc        — 확장된 설명
.modal-gallery     — 이미지 3장 + 라벨 (클릭→라이트박스)
.modal-prompts     — 접이식(collapsible) 프롬프트 섹션
  .prompt-item     — 이미지명 + 프롬프트 텍스트 + 복사 버튼
.modal-palette     — 컬러 스와치 (클릭→클립보드 복사)
.modal-keywords    — 태그 목록
.modal-examples    — 사이트 링크 목록
.modal-related     — 관련 ism 카드 (가로 스크롤)
```

### 3. Interactions
- 프롬프트 복사 버튼: 클릭 시 클립보드 복사 + "Copied!" 토스트
- 컬러 스와치: 클릭 시 hex 값 클립보드 복사
- 관련 ism 카드: 클릭 시 현재 모달 닫고 해당 ism 모달 열기
- 이미지: 클릭 시 기존 라이트박스 활용

## CSS Design (Sketch-tone 유지)

```css
.modal-overlay {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
}
.modal-container {
  background: var(--bg);  /* 따뜻한 종이 톤 */
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.15);
}
.modal-prompts {
  background: var(--bg-warm);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
}
```

## Implementation Steps

### Phase 1: Data
- [ ] `isms.json`에 `prompts` 배열 추가 (각 이미지의 생성 프롬프트)
- [ ] `relatedIsms` 필드 추가 (keyword 기반 자동 계산도 가능)

### Phase 2: UI
- [ ] `style.css`에 modal 스타일 추가
- [ ] `index.html`에 modal HTML 구조 추가
- [ ] `app.js`에 modal 로직 추가:
  - openModal(ismId)
  - closeModal()
  - renderModalContent(ism)
  - URL hash 연동

### Phase 3: Interactions
- [ ] 프롬프트 복사 기능 (navigator.clipboard)
- [ ] 컬러 복사 기능
- [ ] 관련 ism 네비게이션
- [ ] 키보드 접근성 (ESC, Tab trap)
- [ ] 모바일 반응형 (전체 높이 모달)

### Phase 4: Polish
- [ ] 진입/퇴장 애니메이션 (CSS transition)
- [ ] 스크롤 위치 복원 (모달 닫을 때)
- [ ] body scroll lock (모달 열려있을 때)
- [ ] prefers-reduced-motion 대응

## File Changes Summary
| File | Action |
|------|--------|
| `assets/data/isms.json` | MODIFY — prompts, relatedIsms 추가 |
| `assets/css/style.css` | MODIFY — modal 스타일 ~80줄 추가 |
| `assets/js/app.js` | MODIFY — modal 로직 ~120줄 추가 |
| `index.html` | MODIFY — modal HTML 구조 추가 |

## Notes
- 빌드 도구 없이 순수 JS로 구현 (GitHub Pages 호환)
- 라이트박스와 모달은 별개: 모달 안 이미지 클릭 → 라이트박스
- 프롬프트는 collapsible로 기본 접힘 (긴 텍스트이므로)
