# 010 — Phase 1 (effects-modal-flicker)

## MODIFY / NEW / DELETE map

### MODIFY `src/effects.ts`

`openEffectModal()` (272행) — before:

```ts
    elements.modalContent.innerHTML = renderEffectModal(effect);
    elements.modalOverlay.classList.add('active');
    document.body.classList.add('modal-open');
```

after (스크롤 잠금은 `AppDialogA11y.lockScroll()` 단독 소유):

```ts
    elements.modalContent.innerHTML = renderEffectModal(effect);
    elements.modalOverlay.classList.add('active');
```

`closeEffectModal()` (360행) — before:

```ts
    elements.modalContent.innerHTML = '';
    document.body.classList.remove('modal-open');
```

after:

```ts
    elements.modalContent.innerHTML = '';
```

### MODIFY `assets/css/effects.css`

246행 삭제 — before:

```css
body.modal-open { overflow: hidden; }
```

after: (규칙 삭제. `modal-open` 소비처는 이 규칙 + effects.ts 토글뿐 — `rg -n "modal-open"` 전수 확인)

### MODIFY `assets/js/effects.js` (빌드 산출물)

`npm run build`로 재생성 (수동 편집 금지). GitHub Pages가 직접 배포하므로 커밋 대상.

## TESTS

런타임 계측 시나리오 (agbrowse evaluate, http://localhost:8642/effects.html):

1. open: 카드 클릭 → 900ms 대기 → `{clientWidth 델타, layout-shift 엔트리, overlay.active}` 수집
2. 활성화 증거: open 중 `getComputedStyle(document.body)` 아닌 inline `body.style.overflow/paddingRight` 확인
3. close: Escape 또는 close 버튼 → `body.style.overflow`/`paddingRight` 원복 확인
4. deep-link: `location.hash = '#<effect-id>'` 새로고침 경로(hydrateHash)에서도 잠금 동작 확인
5. (A-감사 fold) 스택 회귀: 모달 open → 가이드 이미지 클릭으로 라이트박스 open → Escape → Escape
   순서에서 최종적으로 body inline `overflow`/`padding-right`가 최초값으로 원복되는지 확인

## Verification (C)

- `npm run build` → exit 0, `rg -c "modal-open" assets/js/effects.js` → 0건
- (A-감사 fold) `git diff --stat -- assets/js` 검사: `effects.js` 외 무관한 산출물 diff 발생 시 reject
- `npm run verify` → exit 0
- agbrowse 계측: widthDelta=0, shifts=[], padding-right 보정 활성/원복
- `agbrowse console` → 에러 0
- `agbrowse screenshot` → 모달 열린 상태 육안 관측
