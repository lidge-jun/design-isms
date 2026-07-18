---
created: 2026-05-10
status: implemented
tags: [effects, docs, schema, history, ux-writing]
---

# Phase 4 — Effects Documentation Schema

## Goal

현재 `effects.json`은 빠른 후보군 탐색에 적합한 compact data다. 다음 단계에서는 각 효과의 배경, 사용 시점, 예시, 간단한 히스토리를 구조화해서 modal 또는 guide section에 붙인다.

## Current Compact Schema

Current fields:

```json
{
  "id": "bottom-sheet",
  "name": "Bottom Sheet",
  "nameKr": "바텀 시트",
  "category": "Mobile",
  "priority": "P0",
  "summary": "...",
  "alsoCalled": [],
  "bestFor": [],
  "avoidWhen": [],
  "implementation": [],
  "accessibility": [],
  "performance": [],
  "demo": {},
  "guide": {}
}
```

Keep this file compact. Do not overload it with long prose.

## Implemented New File

```text
assets/data/effects-docs.json
```

Reason:

- Keeps `effects.json` readable and fast to audit.
- Allows longer Korean prose without cluttering card data.
- Lets runtime fail clearly if docs are missing for an effect.
- Supports future guide page without changing compact card schema.

## Schema

```json
{
  "bottom-sheet": {
    "background": "왜 이 효과/패턴이 필요한지 설명한다.",
    "history": "짧은 역사와 웹/모바일에서 자리 잡은 맥락을 설명한다.",
    "useWhen": [
      "사용 시점 1",
      "사용 시점 2",
      "사용 시점 3"
    ],
    "examples": [
      {
        "context": "커머스 필터",
        "description": "상품 목록을 떠나지 않고 조건을 좁힐 때 쓴다."
      }
    ],
    "anatomy": [
      "trigger",
      "overlay",
      "panel",
      "primary action"
    ],
    "misuse": [
      "쓰면 안 되는 상황 1",
      "쓰면 안 되는 상황 2"
    ],
    "implementationNotes": [
      "구현 주의점 1",
      "구현 주의점 2"
    ],
    "researchRefs": [
      {
        "label": "WAI-ARIA APG Dialog Pattern",
        "url": "https://www.w3.org/WAI/ARIA/apg/"
      }
    ]
  }
}
```

## Required Fields

| Field | Required | Length Target |
| --- | --- | --- |
| `background` | yes | 2-3 Korean sentences |
| `history` | yes | 1-3 Korean sentences |
| `useWhen` | yes | 3-5 bullets |
| `examples` | yes | 2-4 context examples |
| `anatomy` | yes | 3-7 terms |
| `misuse` | yes | 2-4 bullets |
| `implementationNotes` | yes | 2-5 bullets |
| `researchRefs` | recommended | 1-4 official/reference links |

## Writing Template

```markdown
### {Effect Name}

Background:
{사용자가 왜 이 효과를 찾는지, 어떤 문제를 푸는지}

When to use:
- {상황}
- {상황}

Examples:
- {맥락}: {구체 화면 예}

Short history:
{모바일 OS, 웹 앱, 디자인 시스템, 접근성 패턴의 관점에서 짧게}

Misuse:
- {피해야 할 상황}

Implementation notes:
- {DOM/ARIA/state/motion note}
```

## Documentation Grouping

Write docs in grouped batches to keep voice consistent:

| Group | Effects |
| --- | --- |
| Overlays | bottom-sheet, full-screen-mobile-modal, modal-dialog, popover, tooltip, image-lightbox |
| Mobile navigation and touch | drawer-navigation, sticky-cta-bar, sticky-tab-bar, pull-to-refresh, swipe-action, floating-action-button |
| Motion and reveal | scroll-reveal, staggered-cards, press-scale, drag-reorder |
| Loading and feedback | skeleton-loading, toast, toast-stack, inline-validation, notification-center |
| Selection and forms | segmented-control, date-picker, file-dropzone, mobile-stepper-form, progress-stepper |
| Desktop operations | mega-menu, command-palette, split-pane, resizable-sidebar, data-table, master-detail, kanban-board, sticky-table-header, dashboard-kpi-cards, filter-sidebar, pagination, desktop-wizard |
| General structure | tabs, accordion, carousel, breadcrumb, context-menu, inline-edit, virtual-list, mobile-empty-state |

## Runtime Rendering Plan

Modal order:

1. Current hero summary and demo
2. Current compact sections: best for, avoid, implementation, accessibility, performance
3. New `Background`
4. New `When to use`
5. New `Examples`
6. New `Short history`
7. New `Anatomy`
8. New `Misuse`
9. New `Research references`
10. Guide image with WebP preview and PNG lightbox

## Validation Rules

Build a check script or inline Node command:

```text
For every effects.json item:
- effectsDocs[effect.id] exists
- required string fields are non-empty
- arrays have minimum lengths
- researchRefs URLs are valid strings
```

Runtime rule:

- Missing docs should not break the page.
- Missing docs should log a clear console error in development or be caught by verify script before deployment.

## Research Reference Priorities

Use official or primary docs first:

- WAI-ARIA APG for tabs, accordion, dialog-like patterns.
- MDN for web platform roles and attributes.
- Apple HIG for mobile sheets/navigation concepts.
- Material/Fluent/Carbon/Atlassian/Polaris for design-system usage framing.

Avoid using random blog posts as the first source unless the pattern has no official documentation.
