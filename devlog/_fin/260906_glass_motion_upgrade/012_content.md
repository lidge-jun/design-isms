# wp1 — Content diff

## isms.json / refractive-glass-ui
Keep ID, kind, palette, keywords, images and original prompts byte-equivalent. Change only name, nameKr, tagline, description, descriptionEn, history, sources, examples and reviewedOn.

name: Liquid Glass
nameKr: 리퀴드 글래스
tagline: Light, depth, and controls in motion
reviewedOn: 2026-09-06

description: Liquid Glass는 Apple이 2025년 소개한 동적 재질이다. 배경을 굴절시키는 가장자리와 반사광으로 내비게이션·제어부를 콘텐츠 위에 띄운다. 2026년 공개한 27 세대 프리뷰는 굴절의 균일함과 대비를 다듬었다. 웹에서는 이 원칙을 응용하되 본문은 안정된 면에 두고, 투명도와 움직임을 줄여도 같은 기능을 쓸 수 있게 만든다.

descriptionEn: Liquid Glass is Apple's dynamic material, introduced in 2025. Refraction and highlights separate navigation and controls from the content below. The 27-generation preview in 2026 refines refraction and contrast. Web interpretations keep content on stable surfaces and preserve functionality when transparency or motion is reduced.

history: Apple은 2025년 6월 WWDC25에서 Liquid Glass를 발표했다. 기존 반투명 패널과 달리 빛·굴절·움직임을 제어부의 깊이와 상태를 드러내는 재료로 묶었다. WWDC26에서는 복잡한 배경의 확산, 가장자리 음영과 반사광, 스크롤 중 툴바의 가독성을 다듬었다. 2026년 9월 6일 공식 iOS 페이지는 27을 프리뷰로 안내한다. 이 카탈로그의 웹 예제는 해당 원칙을 응용한 것으로, Apple 네이티브 렌더링과 동일하지 않다.

sources replaces weak secondary explanations with official HIG Materials, WWDC26 session102, iOS27 preview and 2025 developer-tools announcement URLs from 002. Existing ten examples stay same order except documentation URL becomes Apple iOS product page; further externally verified quality fixes require a recorded P amendment.

## dev-guides.json
Glassmorphism: retain frosted-surface distinction but remove blanket prohibition on opaque backgrounds, transition:all, blur animation and default parallax. A solid fallback is required. Set spacing to 24px (remove invalid 'transparent 24px'). Use short local transform/opacity feedback only.
Liquid Glass: stable content plane and at most a small number of functional material layers; one toolbar, opaque spawned menus, no stacked blur. Backdrop blur does not reproduce native optics or prove contrast. Build steps distinguish base solid fill, @supports-enhanced fixed-geometry material, independent edge highlight, worst-case background contrast and reduced transparency/contrast/motion. Replace data-card components with floating navigation, playback controls, toolbar and solid menu. Describe duration as local recipe, not Apple's token.

## Verification
Exact changed field allowlist in 011; human main review pins after hashes only when final diff matches. No changes to generation prompts until actual wp3 generation. Material sources rendered as technical references rather than extra public reference cards.

## B verification adjustment
verify:isms requires history 350–650 characters. Initial 246-character draft failed; expanded to include source-backed HIG separation of standard content materials versus floating controls and distinct rich-media/text chrome contexts. No scope/field expansion.
