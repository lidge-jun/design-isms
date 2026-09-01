# 050 — wp6: 최종 브라우저 QA + 배포

선행: wp5. 산출물: QA 증거 + 라이브 배포 확인.

## 스코프 경계

IN: aside 브라우저 실측 QA, main 푸시, Actions 배포 확인, 라이브 URL 검증.
OUT: 새 기능, 데이터 변경, 워크플로 수정.

## QA 하네스

로컬 정적 서버: `npm run serve`(백그라운드 세션, `scripts/serve-static.mjs`).
포트는 실행 후 실측한다.

브라우저는 `aside repl`을 쓴다. 이 저장소는 로그인 세션이 필요 없는 공개 정적 사이트라
`exec` 위임이 필요 없고, repl 한 번의 호출 안에 전체 흐름이 들어가야 한다
(호출 간 상태 비유지). 각 호출은 `console.log` 없이는 출력이 없다.

파일 쓰기는 `~/.aside/u/0/` 밖으로 나가면 안 된다 — repl `fs`는 세션 루트 밖에서
즉시 throw하므로 스크린샷은 세션 디렉터리에 남기고 Codex가 복사해 온다.

## 측정 매트릭스

| 페이지 | 뷰포트 | 측정 |
|--------|--------|------|
| index | 1440, 390 | 카드 49, scrollWidth<=innerWidth, console error 0, 모달 개폐 |
| effects | 1440, 390 | 카드 94, demo type 94, scrollWidth, console error 0 |
| faq | 1440, 390 | FAQ 18, scrollWidth |
| color / typography / layout / motion | 1440, 390 | 카드 25/20/25/20, scrollWidth, console error 0 |

추가 측정(wp3~wp5 수용 증거):
- `getComputedStyle`로 `transitionProperty`(filter-btn), `textWrap`(ism-desc),
  `animationName`(skeleton, reduced-motion 강제 시).
- 키보드 Tab 경로: skip link → nav → dropdown → 카드. `document.activeElement` 추적.
- 스크린샷: 페이지×뷰포트, `view_image`로 실제 관찰(생성만 하고 안 읽으면 관찰이 아님).

## 배포 절차

1. `npm run build` → `npm run verify` → `npm run pages:stage` 로컬 전부 통과.
2. `git push origin main` (사용자 승인 범위 내).
3. `gh run list --workflow=deploy.yml --limit 1` → `gh run watch`로 성공 확인.
4. 라이브 실측: `curl -sI https://lidge-jun.github.io/design-isms/` → 200,
   그리고 aside로 라이브 URL을 열어 카드가 실제로 렌더되는지 관찰.
   배포 반영에 지연이 있으므로 실패 시 간격을 두고 재확인한다.

## 수용 기준

- QA 매트릭스 전 행 통과, console error 0.
- Actions run conclusion=success.
- 라이브 URL 200 + 렌더 관찰.

## 알려진 실패 모드

- aside exec은 질문/외부 경로 접근 시 조용히 행이 걸린다. repl만 쓰고, 호스트 타임아웃을
  건다.
- Pages 배포는 CDN 전파 지연이 있다. 즉시 404/구버전이 나와도 즉시 실패로 판단하지 않는다.
