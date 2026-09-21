# Module: Core & Specification

## 🎯 Current Focus
- Completed full codebase cleanup and DB normalization:
  1. Deleted all Vite scaffold code (App.css, hero.png, react.svg, vite.svg, counter, boilerplate).
  2. Rewrote App.tsx, main.tsx, index.css, vite.config.ts, tsconfig.app.json, index.html from scratch.
  3. Normalized DB schema: person profile data lives in `users` table only, `house_members` is pure membership join table.
  4. Replaced 3 booleans (`isVirtual`, `isPlaceholder`, `isDeleted`) with `status` enum on `house_members`.
  5. Removed redundant `isDeleted` from `Task`, `isPaid` from `TaskSplitItem` (use nullable timestamps instead).
  6. Added missing interfaces: `User`, `House`, `PerspectiveAlias`, `RecoveryKey`.
  7. Documented Field Ownership Rules and UI Display Priority to prevent future duplication.

## 📁 File Changes
- **Added:** None (new files pending ticket execution)
- **Modified:** `src/App.tsx`, `src/main.tsx`, `src/index.css`, `vite.config.ts`, `tsconfig.app.json`, `index.html`, `SPEC.md`, `RULES.md`, `docs/ai/core.md`
- **Deleted:** `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`

## 🔗 Cross-Dependencies (Blast Radius)
- **Frontend:** Clean shell ready for router + layout. Warm Orange CSS tokens aligned with DESIGN.md.
- **Backend API:** SPEC.md RLS policies updated to use `status != 'REMOVED'` instead of `is_deleted = false`.
- **Tickets:** `docs/tickets.md` references old schema field names — needs sync after ticket execution begins.

## ⚠️ Pending Impacts to Fix (To-Do Checklist)
- [ ] `docs/tickets.md`: Update TICK-002, TICK-005 to reference new normalized schema fields.
- [ ] `CONTEXT.md`: Update module map if new spec files are added under `docs/specs/`.

## 📝 Next Tasks
1. Execute TICK-001 through TICK-004 (Phase 1 Foundation).
2. Execute TICK-005 (Supabase migration SQL with normalized schema).

## 🛡️ Active Anti-Regression
- Zero black backgrounds (`#000000` or `#16171d`) allowed anywhere in CSS.
- Zero purple accent colors — Warm Orange only.
- All monetary fields strictly stored as integer Satang (`Int`).
- Strict ID-only linking: No entity names stored in relational tables.
- Person profile data (displayName, gender, avatarUrl, themeColor) lives in `users` table ONLY.
- `house_members` stores profile fields only for PET/ASSET and vessel snapshots.
- Completed tasks are immutable (read-only financial fields).
- Task title editable only by creator.
- No redundant boolean+timestamp pairs: use nullable timestamps (`deletedAt`, `paidAt`).
