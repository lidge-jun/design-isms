# 010 — wp2: PR #1 검증·머지 + 문서 동기화

선행: wp1. 산출물: 머지된 main + 동기화된 SoT 문서.

## 스코프 경계

IN: PR #1 검증/머지, 매니페스트 사후 수정, AGENTS/README/structure 문서 동기화.
OUT: 스킬 내용 재작성, 마켓플레이스 이름 변경(사용자 결정), 저장소 분리.

## 검증 절차 (코드 변경 전)

1. `gh pr diff 1` 전문 확인 — 완료(001 문서 §2).
2. `git fetch origin pull/1/head:pr-1` — **wp1에서 이미 수행함**. 시험 병합도 이미
   실행해 "Automatic merge went well"을 확인했고, 검증 후 `git merge --abort`로 되돌려
   워킹트리를 clean으로 복원했다(wp1은 docs-only이므로 코드 변경을 남기지 않는다).
   wp2의 B는 `git status`로 clean과 `MERGE_HEAD` 부재를 먼저 확인한 뒤 병합을 재실행한다.
3. 병합 트리에서 실측 — **wp1에서 선행 확인 완료, wp2에서 재실행해 증거를 갱신**:
   - `npm run pages:stage` → 성공 + `.pages` 안에 `skills/`, `.claude/`, `plugin.json`,
     `docs/`, `commands/`가 **0개**임을 `find .pages -maxdepth 1`로 증명.
   - `npm run verify` exit 0.
   - `npm run sot:check` exit 0 (README 수정이 마커를 건드리지 않았는지).
   - 심링크: `git ls-files -s .claude/skills` mode가 `120000`인지, `readlink`가
     `../../skills/{style,effect}`로 해석되는지.
   - 매니페스트 JSON 4종 파싱: 통과 확인됨.
   - SKILL.md 데이터 계약: isms 49 / dev-guides 49(1:1) / effects 94 /
     snippets 94(1:1) / docs 존재, priority·category 분포가 PR 본문과 일치 — 확인됨.
   - **발견된 경미한 오류**: `skills/effect/SKILL.md`의 예시 id `sticky-cta`가 실제
     `sticky-cta-bar`와 다르다. 머지 후 후속 커밋으로 정정한다.
4. 문제 없으면 머지. 문제가 있으면 머지 후 후속 커밋으로 수정(외부 기여자 브랜치를
   직접 수정하지 않는다).

## 파일 변경 맵

### MODIFY `AGENTS.md`

"## 디렉토리 구조" 코드블록에 플러그인 항목 추가. before:

```
701_design-isms/
├── index.html                    # 메인 페이지
```

after:

```
701_design-isms/
├── plugin.json                   # agy 플러그인 매니페스트
├── .claude-plugin/               # Claude Code 매니페스트 + 마켓플레이스
├── .codex-plugin/plugin.json     # Codex 매니페스트
├── skills/                       # 에이전트 스킬 SoT (style / effect)
├── .claude/skills/               # 발견용 심링크 → ../../skills/
├── index.html                    # 메인 페이지
```

또한 "현재 구현 불변 조건" 절 끝에 한 줄 추가:

`+ - 이 저장소는 정적 사이트인 동시에 멀티호스트 에이전트 플러그인이다. `skills/`가 SoT이고`
`+   `.claude/skills/`는 심링크다. 플러그인 파일은 `npm run pages:stage` 허용목록 밖이라`
`+   배포 트리에 들어가지 않는다 — 허용목록을 넓힐 때 이 불변 조건을 함께 확인한다.`

### MODIFY `structure/README.md`

source-of-truth 요약에 `skills/` 항목과 배포 격리 사실을 추가한다. 실제 파일을 읽고
기존 표/절 형식에 맞춰 삽입한다(형식은 wp2의 P에서 재확인).

### README.md

PR이 이미 "## AI Agent Plugin" 절을 추가한다. 추가 수정은 사실 오류가 발견될 때만.

## 수용 기준

- `gh pr view 1 --json state` → `MERGED`.
- 머지 후 main에서 `npm run verify` exit 0, `npm run pages:stage` 후
  `.pages` 최상위에 7개 HTML + favicon.svg + assets/ 만 존재.
- `npm run sot:check` exit 0.
- AGENTS.md 디렉터리 구조와 실제 트리가 일치.

## 활성화 시나리오 (C-ACTIVATION-GROUNDING-01)

`stage-pages.mjs`의 심링크 거부 분기는 `assets/` 하위 순회에서만 도달 가능하고, 이
유닛은 심링크를 `.claude/` 아래에만 추가하므로 **발화하지 않는다**. 발화하지 않음이 곧
통과이며 증거는 `pages:stage` exit 0 + `.pages`에 플러그인 파일 0건이다(wp1에서 실측
완료). 허용목록이 `publicFiles`(7 HTML + favicon)와 `assetDirs`(`assets/` 5개)로
한정되고 `copyTree`가 저장소 루트를 순회하지 않으므로 새 최상위 디렉터리는 구조적으로
도달 불가다. 루트 워크를 발명해 재증명하지 않는다(A라운드 blocker 9).
