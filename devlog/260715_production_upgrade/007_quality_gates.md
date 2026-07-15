# 007 — 프로덕션 품질 게이트

## 뷰포트 매트릭스

- 1440×900: wide canvas, 3/4열 catalog, modal split view.
- 1180/1024/860: 기존 Effects content break와 split-view 전환.
- 640×900: mobile layout 진입 경계.
- 390×844: 최소 대표 모바일, wrapped nav/search/modal.

모든 뷰에서 index/effects/faq, open modal, Finder 결과 상태를 확인한다. 조건:
`scrollWidth <= innerWidth`, console error 0, clipped Hangul 0, primary CTA 한 줄.

## 접근성

- skip link → main, visible focus, sticky header가 focus를 가리지 않음.
- modal trigger capture/initial focus/Tab trap/Escape/restore.
- FAQ button `aria-expanded`/`aria-controls`; Finder fieldset/legend.
- tab UI는 APG roving tabindex + stable tab/panel IDs + manual activation 규칙.
- copy/status는 `role=status aria-live=polite`; 색만으로 상태 표시 금지.
- reduced motion에서 모든 demo가 의미 있는 정적 최종 상태를 보여준다.

## 성능/자산

- preview는 WebP, lightbox만 PNG. 모든 img lazy loading(첫 visible LCP 자산 예외 검토).
- animation은 transform/opacity 중심, pointer effect는 fine pointer에서만.
- 반복 애니메이션은 viewport/document hidden에서 중지.
- 새 third-party runtime/dependency는 필요한 경우만 추가하고 package-lock 고정.

## 자동 게이트

`npm run verify`가 typecheck/build/generated parity/nav/content/assets/isms/effects/
snippets/finder를 단계적으로 포함한다. UI 변경 phase의 C는 실제 브라우저 RUN→OBSERVE→FIX
증거를 devlog에 남긴다.

## 안티슬롭

- emoji UI, 무의미한 sparkle, gradient soup, 전역 pill/card, 임의의 wide card 금지.
- 한 accent + semantic link/focus 색. 실제 이미지와 정보구조가 시각적 주인공.
- 사이트 디자인을 설명하는 meta-copy 대신 사용자의 탐색/구현 질문을 쓴다.

