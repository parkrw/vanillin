# task04: chat-message-bubble
**Goal:** Add shadcn chat set part 1 — `ui/bubble/` + `ui/message/` (CSS-only, like item/field) with demo pages.
**Branch:** `feat/chat-message-bubble`  **Deps:** none

## Sub-tasks
- [x] 1. `ui/bubble/bubble.jsx` + `bubble.css` — Bubble (variant: default | secondary | muted | tinted | outline | ghost | destructive; align: start | end), BubbleContent (`as` prop instead of shadcn's `render`), BubbleReactions (side: top | bottom; align: start | end), BubbleGroup. Size to content, max-inline-size 80%; ghost spans full width. Logical properties throughout. files: `ui/bubble/bubble.jsx`, `ui/bubble/bubble.css`
- [x] 2. `ui/message/message.jsx` + `message.css` — Message (align: start | end), MessageGroup, MessageAvatar (bottom-anchored, clears footer), MessageContent, MessageHeader, MessageFooter. files: `ui/message/message.jsx`, `ui/message/message.css`
- [ ] 3. Demo pages `playground/pages/bubble.jsx` + `playground/pages/message.jsx` (conversation with avatars, variants, reactions, group) + registry `page:` entries. files: `playground/pages/bubble.jsx`, `playground/pages/message.jsx`, `playground/registry.js`

## Verify / done
- CSS-only → no test files (repo convention); `node tests/run.mjs` stays green.
- `npm run build` clean.
- Playground `#bubble` + `#message` render; net diff vs main ≤ 500 lines.
