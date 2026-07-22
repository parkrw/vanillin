# task05: attachment
**Goal:** Add shadcn chat set part 2 — `ui/attachment/` (CSS-only, like bubble/message) with demo page.
**Branch:** `feat/attachment`  **Deps:** 04 (done)

Anatomy verified against live shadcn docs 2026-07-22. Message-scroller split
out to task 06 (stateful, needs test) — both together would blow the 500-line cap.

## Sub-tasks
- [x] 1. `ui/attachment/attachment.jsx` + `attachment.css` — Attachment (state: idle | uploading | processing | error | done via `data-state`; size: default | sm | xs; orientation: horizontal | vertical), AttachmentMedia (variant: icon | image), AttachmentContent, AttachmentTitle (shimmer while parent `data-state` is uploading/processing; fixed-duration loop like skeleton, reduced-motion guard), AttachmentDescription, AttachmentActions, AttachmentAction (Button `variant="ghost" size="icon"` + `.attachment-action` shrink — no new button size), AttachmentTrigger (`as` prop instead of shadcn's `render`; default `<button>`, inset overlay making the card clickable), AttachmentGroup (horizontal scroll-snap row, edge fade via mask). Logical properties throughout. files: `ui/attachment/attachment.jsx`, `ui/attachment/attachment.css`
- [x] 2. Demo page `playground/pages/attachment.jsx` (states incl. shimmer + error, sizes, vertical/image variants, actions, scrollable group) + registry `page:` entry. files: `playground/pages/attachment.jsx`, `playground/registry.js`

## Verify / done
- CSS-only → no test file (repo convention); `node tests/run.mjs` stays green.
- `npm run build` clean.
- Playground `#attachment` renders; net diff vs main ≤ 500 lines.
