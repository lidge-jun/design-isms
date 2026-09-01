# 030 — wp4: Design Read 기반 상태/위계 정합 (2판, A라운드 반영)

선행: wp3. 대상: 001 §3. 기준: cxc-dev-uiux-design §2 Design Read.
소유 파일: `assets/css/catalog.css`, `assets/css/{color,typography,layout,motion}.css` `*-empty` 블록,
`src/{color,typography,layout,motion}.ts` 빈 상태 한 줄 → 산출물 `assets/js/{color,typography,layout,motion}.js`(build로 생성, diff 포함),
`assets/css/style.css:23`.

## Design Read (자기 평가, 새 방향 도입 없음)

- 페이지 종류: 레퍼런스 카탈로그(에디토리얼 도구). 사용자는 훑어보고 → 열어보고 → 값을 복사한다.
- 현재 dials: VARIANCE 5(종이 질감·specimen 카드 유지), MOTION 3(페이드/펄스 정도), DENSITY D3.
  이 값을 유지한다. 조정 대상은 dials가 아니라 "같은 역할의 표면이 다른 규칙을 쓰는" 지점뿐이다.
- 타이포 위계: 제목 = display(Outfit), 본문 = sans(Pretendard), 값/코드 = mono. wp3로 소비처가 토큰화됐으니
  이제 역할별 배정이 어긋난 곳만 남는다.

## 어긋남 목록

| # | 표면 | 어긋남 | 판정 |
|---|------|--------|------|
| S1 | `catalog.css:31 .catalog-empty-state` | CSS에만 있고 소비처 0건(`rg` src/html/scripts). 실제 로드 실패 경로는 `src/app-runtime.ts:28 renderFatal` → `.page-error-state`(S5) | **NOOP** (죽은 셀렉터, 손대지 않음 — A라운드 blocker 1) |
| S2 | `color/typography/layout/motion.css *-empty` | 규칙 4벌 복제(padding 48px, center, ink-muted). 카탈로그 셸 공용 파일이 있는데 각자 소유 | 고침 |
| S3 | `style.css:23 .loading-text color: #2C2C2C` | 잉크 색 리터럴. `--ink: #2C2C2C`이 `style.css:52`에 이미 정의 | 고침 |
| S4 | `.color-empty` 등 검색 빈 상태 vs `.page-error-state` | 전자는 필터 결과 없음(가벼운 인라인 문구), 후자는 데이터 로드 실패(role=alert + 재시도 버튼). 역할이 다르므로 시각 무게 차이는 의도 | 유지 |
| S5 | `runtime-states.css .page-error-state` | 이미 토큰·display 사용 | NOOP |

확정 사실(리뷰 blocker 6으로 조건 분기 제거): `rg -n 'color-empty|typo-empty|layout-empty|motion-empty' scripts src`
→ `scripts/` 0건, `src/` 4건(TS 한 줄씩)뿐. 클래스 교체 경로로 확정한다.

## ADD `assets/css/catalog.css` — `.catalog-empty-link` 블록(:52) 뒤에 검색 빈 상태 공용 규칙

```
+
+/* search-empty: the filter matched nothing (light, sits inline in the grid) */
+.catalog-search-empty {
+  grid-column: 1 / -1;
+  padding: 48px 24px;
+  text-align: center;
+  color: var(--ink-muted);
+}
```

## DELETE 카탈로그 4 CSS의 복제 블록

```
color.css:122-127
-.color-empty {
-  grid-column: 1 / -1;
-  padding: 48px 24px;
-  text-align: center;
-  color: var(--ink-muted, #777);
-}
```

`typography.css:121-126`(`.typo-empty`), `layout.css:106-111`(`.layout-empty`), `motion.css:98-103`(`.motion-empty`)도 같은 6줄 블록 삭제.
(wp3에서 같은 파일의 :49/:45를 고치지만 줄 번호는 1:1 치환이라 밀리지 않는다.)

## MODIFY 4 TS — 클래스명만 교체, 문구 불변

```
src/color.ts:117
-      grid.innerHTML = '<div class="color-empty">검색 결과가 없습니다. "SaaS", "모노크롬", "Material"처럼 기억나는 단어로 다시 찾아보세요.</div>';
+      grid.innerHTML = '<div class="catalog-search-empty">검색 결과가 없습니다. "SaaS", "모노크롬", "Material"처럼 기억나는 단어로 다시 찾아보세요.</div>';
src/typography.ts:132   "typo-empty"   → "catalog-search-empty"
src/layout.ts:121       "layout-empty" → "catalog-search-empty"
src/motion.ts:134       "motion-empty" → "catalog-search-empty"
```

`npm run build` → `assets/js/{color,typography,layout,motion}.js` 4개가 같이 바뀐다(diff에 포함, 커밋 대상).

## MODIFY `assets/css/style.css:23`

```
-  letter-spacing: -0.5px; color: #2C2C2C;
+  letter-spacing: -0.5px; color: var(--ink);
```

## 검증 (C)

1. `npm run build && npm run verify` exit 0. `git status --short`에 4 TS + 4 JS + 6 CSS(catalog, color, typography, layout, motion, style)가 보이는지 확인.
2. `rg -n 'color-empty|typo-empty|layout-empty|motion-empty' assets src scripts` → 0건.
3. `rg -n '#2C2C2C' assets/css/style.css` → `:root --ink` 정의 1건만.
4. aside repl (실행 확인 형태, 입력은 `#{domain}-search`, 색은 probe 요소의 computed로 비교):

```
timeout 150 aside repl "const ids = { color: 'color-search', typography: 'typography-search', layout: 'layout-search', motion: 'motion-search' }; const out=[]; for (const pg of Object.keys(ids)) { const p = await openTab('http://127.0.0.1:4173/'+pg+'.html?v='+Date.now()); await new Promise(r=>setTimeout(r,2200)); await p.fill('#'+ids[pg], 'zzzzqq'); await new Promise(r=>setTimeout(r,600));
  out.push(await p.evaluate((pg) => { const el = document.querySelector('.catalog-search-empty'); const probe = document.createElement('span'); probe.style.color = 'var(--ink-muted)'; document.body.appendChild(probe); const want = getComputedStyle(probe).color; probe.remove(); const root = getComputedStyle(document.documentElement); const n = s => (s||'').replace(/[\'"\s]/g,''); return { page: pg, present: !!el, oldClassLeft: !!document.querySelector('.color-empty,.typo-empty,.layout-empty,.motion-empty'), fontOk: el ? n(getComputedStyle(el).fontFamily) === n(root.getPropertyValue('--font-sans')) : null, colorOk: el ? getComputedStyle(el).color === want : null, color: el ? getComputedStyle(el).color : null }; }, pg)); await p.close(); }
console.log('STATES=' + JSON.stringify(out));"
```

   기대: 4페이지 `present=true, oldClassLeft=false, fontOk=true, colorOk=true`. `.loading-text`는 index/effects 로딩 오버레이 안에 항상 있으므로
   같은 방식으로 `getComputedStyle(document.querySelector('.loading-text')).color`가 `var(--ink)` probe와 같은지 확인. 결과 `evidence/wp4_states.json`.
5. `git diff --stat > evidence/wp4_diff.txt`.

## 롤백

000 §롤백 표 wp4 행(hunk 단위). 트리거: verify 실패, 빈 상태 미렌더, 콘솔 에러.

