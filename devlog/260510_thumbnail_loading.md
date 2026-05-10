---
created: 2026-05-10
tags: [이미지최적화, WebP, GitHub-Pages, 모바일성능]
aliases: [썸네일 로딩, WebP 썸네일, 모바일 이미지 최적화]
---

# Thumbnail Loading

## Goal

GitHub Pages 첫 화면과 모바일 렌더링에서 1536x1024 원본 PNG를 직접 로드하지 않는다. 카드와 모달의 inline 이미지는 경량 WebP 썸네일을 사용하고, 원본 PNG는 사용자가 이미지를 클릭해 lightbox로 확대할 때만 로드한다.

## Current Signals

- 원본 이미지는 35개 ISM x 3장 = 105개 PNG이며 전체 용량이 약 201MB다.
- 카드 렌더링은 첫 6개를 eager로 넣고 나머지를 IntersectionObserver로 지연하지만, 실제 `src`가 원본 PNG라 모바일 네트워크에서 여전히 무겁다.
- 모달 이미지도 원본 PNG를 직접 `src`로 사용한다.
- lightbox는 이미 `data-src` 기반 원본 확대 흐름을 갖고 있어 thumbnail/source 분리가 가능하다.

## P1 — Thumbnail Assets

### Solution

- `assets/images/thumbs/{ism-id}/{image-name}.webp` 생성.
- 원본 1536px 폭 PNG를 768px 폭 WebP quality 58로 변환한다.
- `scripts/generate-thumbnails.mjs`로 재생성 가능하게 둔다.

## P2 — Runtime Source Split

### Solution

- `originalImageSrc()`는 기존 PNG 경로를 반환한다.
- `thumbImageSrc()`는 WebP 썸네일 경로를 반환한다.
- 카드/모달 inline `<img src>`는 thumbnail을 사용한다.
- lightbox로 넘기는 `data-src`는 원본 PNG를 유지한다.

## P3 — Verification

자동:

1. `npm run images:thumbs`
2. `npm run verify`
3. 썸네일 파일 수 105개 확인.

수동:

4. 첫 화면 카드가 정상 렌더링되는지 확인.
5. 카드 이미지 클릭 시 lightbox가 원본 PNG를 여는지 확인.
6. 모달 inline 이미지는 thumbnail이고, 모달 이미지 클릭 시 원본 PNG가 열리는지 확인.

## Out Of Scope

- 원본 PNG 삭제.
- responsive `srcset` 다단계 생성.
- CSS 레이아웃/디자인 변경.
