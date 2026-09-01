# 010 — wp2: 모달 inert 버그 수정 (2판, A라운드 반영)

선행: wp1. 대상: 001 §1. 소유 파일: `src/app-dialog.ts`(→`assets/js/app-dialog.js`),
`color/typography/layout/motion.html`, `scripts/verify-nav.mjs`.

## 결정: HTML 구조 정정(실제 수리) + TS 가드(재발 방지) + 정적 계약(가드 도달성 보증)

- HTML 이동이 실제 수리다. 이동 후 4페이지에서 TS 가드 분기는 절대 실행되지 않는다(리뷰 blocker 5).
  그래서 가드는 "미래에 overlay가 다시 main 안에 들어갔을 때"를 위한 안전망이고, 그 도달성은
  C단계에서 **nested-overlay fixture**로 직접 실행해 증명한다(아래 §검증 3).
- 정적 계약: `verify-nav.mjs` §8에 "공개 모달/라이트박스는 `<main>` 바깥"을 추가해 재발을 빌드 시점에 잡는다.
  가드와 계약 둘 다 두는 이유: 계약은 이 저장소의 7페이지만 지키고, 가드는 `app-dialog.js`를 가져다 쓰는
  어떤 페이지에서도 지킨다.

## MODIFY `src/app-dialog.ts:82-96`

```
   function setBackgroundInert(inert: boolean): void {
     if (stack.length !== (inert ? 1 : 0)) {
       return;
     }
+    const top = stack[stack.length - 1];
     for (const selector of ['header.site-header', 'main', 'footer.site-footer']) {
       const landmark = document.querySelector(selector);
       if (!landmark) {
         continue;
       }
+      // A landmark that wraps the open overlay must stay live, otherwise the
+      // dialog itself becomes inert and its close paths stop working.
+      if (inert && top && landmark.contains(top.overlay)) {
+        continue;
+      }
       if (inert) {
         landmark.setAttribute('inert', '');
       } else {
         landmark.removeAttribute('inert');
       }
     }
   }
```

호출 순서 실측: `open()`에서 `stack.push(layer)`(:186) → `setBackgroundInert(true)`(:189).
`inert=true`일 때 `stack.length === 1`이므로 `top`은 방금 push된 layer다.
close 경로(`inert=false`)는 `stack.length === 0`이라 `top`이 undefined이고 removeAttribute만 돈다 — 대칭 유지.

## MOVE 카탈로그 4 HTML — overlay + lightbox를 `</main>` 뒤, `<footer>` 앞으로

id/class/aria 속성 불변. 들여쓰기는 index/effects의 최상위 overlay와 같은 0단.
`catalog-shell.ts`는 id로만 조회하므로 JS 변경 없음.

### color.html (overlay :77, `</main>` :88)

```
-
-  <div class="modal-overlay" id="color-modal-overlay" aria-hidden="true">
-    <div class="modal-container" id="color-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="color-modal-title" tabindex="-1">
-      <button class="modal-close" id="color-modal-close" type="button" aria-label="닫기">✕</button>
-      <div class="modal-scroll" id="color-modal-content"></div>
-    </div>
-  </div>
-
-  <div class="lightbox" id="color-lightbox" role="dialog" aria-modal="true" aria-label="Guide image preview" aria-hidden="true">
-    <button class="lightbox-close" id="color-lightbox-close" type="button" aria-label="닫기">✕</button>
-    <img class="lightbox-image" id="color-lightbox-image" alt="">
-  </div>
 </main>

+<div class="modal-overlay" id="color-modal-overlay" aria-hidden="true">
+  <div class="modal-container" id="color-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="color-modal-title" tabindex="-1">
+    <button class="modal-close" id="color-modal-close" type="button" aria-label="닫기">✕</button>
+    <div class="modal-scroll" id="color-modal-content"></div>
+  </div>
+</div>
+
+<div class="lightbox" id="color-lightbox" role="dialog" aria-modal="true" aria-label="Guide image preview" aria-hidden="true">
+  <button class="lightbox-close" id="color-lightbox-close" type="button" aria-label="닫기">✕</button>
+  <img class="lightbox-image" id="color-lightbox-image" alt="">
+</div>
+
 <footer class="site-footer">
   <span>Design -isms Reference Board</span>
   <span>Color Systems catalog</span>
```

### typography.html (overlay :79, `</main>` :90)

```
-
-  <div class="modal-overlay" id="typography-modal-overlay" aria-hidden="true">
-    <div class="modal-container" id="typography-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="typography-modal-title" tabindex="-1">
-      <button class="modal-close" id="typography-modal-close" type="button" aria-label="닫기">✕</button>
-      <div class="modal-scroll" id="typography-modal-content"></div>
-    </div>
-  </div>
-
-  <div class="lightbox" id="typography-lightbox" role="dialog" aria-modal="true" aria-label="Guide image preview" aria-hidden="true">
-    <button class="lightbox-close" id="typography-lightbox-close" type="button" aria-label="닫기">✕</button>
-    <img class="lightbox-image" id="typography-lightbox-image" alt="">
-  </div>
 </main>

+<div class="modal-overlay" id="typography-modal-overlay" aria-hidden="true">
+  <div class="modal-container" id="typography-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="typography-modal-title" tabindex="-1">
+    <button class="modal-close" id="typography-modal-close" type="button" aria-label="닫기">✕</button>
+    <div class="modal-scroll" id="typography-modal-content"></div>
+  </div>
+</div>
+
+<div class="lightbox" id="typography-lightbox" role="dialog" aria-modal="true" aria-label="Guide image preview" aria-hidden="true">
+  <button class="lightbox-close" id="typography-lightbox-close" type="button" aria-label="닫기">✕</button>
+  <img class="lightbox-image" id="typography-lightbox-image" alt="">
+</div>
+
 <footer class="site-footer">
   <span>Design -isms Reference Board</span>
   <span>Typography Pairings catalog</span>
```

### layout.html (overlay :79, `</main>` :90)

```
-
-  <div class="modal-overlay" id="layout-modal-overlay" aria-hidden="true">
-    <div class="modal-container" id="layout-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="layout-modal-title" tabindex="-1">
-      <button class="modal-close" id="layout-modal-close" type="button" aria-label="닫기">✕</button>
-      <div class="modal-scroll" id="layout-modal-content"></div>
-    </div>
-  </div>
-
-  <div class="lightbox" id="layout-lightbox" role="dialog" aria-modal="true" aria-label="Guide image preview" aria-hidden="true">
-    <button class="lightbox-close" id="layout-lightbox-close" type="button" aria-label="닫기">✕</button>
-    <img class="lightbox-image" id="layout-lightbox-image" alt="">
-  </div>
 </main>

+<div class="modal-overlay" id="layout-modal-overlay" aria-hidden="true">
+  <div class="modal-container" id="layout-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="layout-modal-title" tabindex="-1">
+    <button class="modal-close" id="layout-modal-close" type="button" aria-label="닫기">✕</button>
+    <div class="modal-scroll" id="layout-modal-content"></div>
+  </div>
+</div>
+
+<div class="lightbox" id="layout-lightbox" role="dialog" aria-modal="true" aria-label="Guide image preview" aria-hidden="true">
+  <button class="lightbox-close" id="layout-lightbox-close" type="button" aria-label="닫기">✕</button>
+  <img class="lightbox-image" id="layout-lightbox-image" alt="">
+</div>
+
 <footer class="site-footer">
   <span>Design -isms Reference Board</span>
   <span>Layout Patterns catalog</span>
```

### motion.html (overlay :79, `</main>` :90)

```
-
-  <div class="modal-overlay" id="motion-modal-overlay" aria-hidden="true">
-    <div class="modal-container" id="motion-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="motion-modal-title" tabindex="-1">
-      <button class="modal-close" id="motion-modal-close" type="button" aria-label="닫기">✕</button>
-      <div class="modal-scroll" id="motion-modal-content"></div>
-    </div>
-  </div>
-
-  <div class="lightbox" id="motion-lightbox" role="dialog" aria-modal="true" aria-label="Guide image preview" aria-hidden="true">
-    <button class="lightbox-close" id="motion-lightbox-close" type="button" aria-label="닫기">✕</button>
-    <img class="lightbox-image" id="motion-lightbox-image" alt="">
-  </div>
 </main>

+<div class="modal-overlay" id="motion-modal-overlay" aria-hidden="true">
+  <div class="modal-container" id="motion-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="motion-modal-title" tabindex="-1">
+    <button class="modal-close" id="motion-modal-close" type="button" aria-label="닫기">✕</button>
+    <div class="modal-scroll" id="motion-modal-content"></div>
+  </div>
+</div>
+
+<div class="lightbox" id="motion-lightbox" role="dialog" aria-modal="true" aria-label="Guide image preview" aria-hidden="true">
+  <button class="lightbox-close" id="motion-lightbox-close" type="button" aria-label="닫기">✕</button>
+  <img class="lightbox-image" id="motion-lightbox-image" alt="">
+</div>
+
 <footer class="site-footer">
   <span>Design -isms Reference Board</span>
   <span>Motion Presets catalog</span>
```

## MODIFY `scripts/verify-nav.mjs:141-143` — §8 정적 계약 추가

```
   // 8. skip link + main landmark
   if (!html.includes('class="skip-link"')) errors.push(`${page}: skip link missing`);
   if (!html.includes('id="main-content"')) errors.push(`${page}: main-content landmark missing`);
+  // 9. dialogs live outside <main>: a nested overlay goes inert with the landmark
+  const mainClose = html.indexOf('</main>');
+  for (const dialog of [...html.matchAll(/<div class="(?:modal-overlay|lightbox)[^"]*"/g)]) {
+    if (mainClose !== -1 && dialog.index < mainClose) {
+      errors.push(`${page}: dialog ${dialog[0]} is nested inside <main>`);
+    }
+  }
```

`<main>` 여는 태그 뒤·`</main>` 앞 구간에 dialog가 있으면 실패. index/effects는 이미 통과(overlay가 `</main>` 뒤).
faq는 dialog 없음. B에서 HTML 이동 전에 이 규칙만 먼저 넣고 `npm run verify:nav`가 4페이지에서 **실패하는 것**을
확인한 뒤(계약 도달성 증명) HTML을 옮긴다.

## 검증 (C)

1. `npm run build && npm run verify` exit 0 (이동 전 verify:nav 실패 → 이동 후 통과 로그를 `evidence/wp2_verify_nav.txt`).
2. aside repl, 4페이지 각각 (`color`→`typography`/`layout`/`motion`, 카드 selector `.color-card`→`.typo-card`/`.layout-card`/`.motion-card`).
   **실행 확인된 명령**(2026-09-02, 수정 전 트리에서 실행해 버그 재현 성공 — `--timeout`은 aside repl 옵션이 아니므로 호스트 `timeout`으로 감싼다):

```
timeout 90 aside repl "const p = await openTab('http://127.0.0.1:4173/color.html'); await new Promise(r=>setTimeout(r,2000));
const step = async (how) => { await p.click('.color-card'); await new Promise(r=>setTimeout(r,500));
  const opened = await p.evaluate(() => ({ active: !!document.querySelector('.modal-overlay.active'), mainInert: document.querySelector('main').hasAttribute('inert'), overlayInert: !!document.querySelector('.modal-overlay').closest('[inert]') }));
  if (how==='button') await p.click('.modal-overlay.active .modal-close').catch(e=>'clickfail:'+e.message);
  if (how==='backdrop') await p.mouse.click(4,4);
  if (how==='escape') await p.keyboard.press('Escape');
  await new Promise(r=>setTimeout(r,500));
  const after = await p.evaluate(() => ({ closed: !document.querySelector('.modal-overlay.active'), mainInert: document.querySelector('main').hasAttribute('inert') }));
  if (!after.closed) { await p.keyboard.press('Escape'); await new Promise(r=>setTimeout(r,300)); }
  return { how, opened, after }; };
const out = [await step('button'), await step('backdrop'), await step('escape')];
console.log('MODAL=' + JSON.stringify(out)); await p.close();"
```

   수정 전 실측(버그 재현): `button`/`backdrop` → `opened.overlayInert=true, after.closed=false`; `escape` → `closed=true`.
   수정 후 기대: 세 경로 모두 `opened.mainInert=true, opened.overlayInert=false, after.closed=true, after.mainInert=false`.
   stdout의 `MODAL=` 줄을 `evidence/wp2_modal_{page}.json`에 저장.
3. **가드 도달성 fixture**: 브라우저에서 index.html을 연 뒤 `document.querySelector('main').appendChild(document.getElementById('modal-overlay'))`로
   overlay를 main 안에 강제 이동 → 카드 클릭 → `main.hasAttribute('inert') === false`(가드가 main을 건너뜀) 및 닫기 버튼 동작 확인.
   페이지 새로고침으로 원복. 결과 `evidence/wp2_guard_fixture.json`.
4. index.html / effects.html 모달 열기·닫기 회귀 없음 → `evidence/wp2_regression.json`.
5. `git diff --stat > evidence/wp2_diff.txt`.

## 롤백

000 §롤백 표 wp2 행. 트리거: verify 실패, 모달 미오픈, 콘솔 에러.

