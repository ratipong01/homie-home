# Module: Tickets & Architecture (Frontend / Backend Split)

## 🎯 Current Focus
- Completed Phase 1 & Foundation Setup:
  1. Resolved `vite-plugin-pwa` build failure and dependency drift.
  2. Upgraded to React 19, installed `react-router-dom`, `@tanstack/react-query`, `@supabase/supabase-js`.
  3. Created `tailwind.config.ts`, `src/lib/utils.ts` (`cn()`), `src/types/index.ts`, `src/services/apiClient.ts`, `src/components/common/ErrorBoundary.tsx`.
  4. Created `backend/` Fastify REST API with `/health` and `/api/v1/health` endpoints.
  5. Created `supabase/migrations/00001_initial_schema.sql` with full RLS and immutability triggers.
  6. Configured Vite proxy and created run scripts (`scripts/dev-all.mjs`, `run-dev.ps1`).
  7. Verified `npm run build` passes 100% on both frontend and backend.

## 📁 File Changes
- **Added:**
  - `backend/package.json`, `backend/tsconfig.json`, `backend/src/app.ts`, `backend/src/server.ts`
  - `supabase/migrations/00001_initial_schema.sql`
  - `tailwind.config.ts`, `src/lib/utils.ts`, `src/types/index.ts`, `src/services/apiClient.ts`, `src/components/common/ErrorBoundary.tsx`
  - `scripts/dev-all.mjs`, `run-dev.ps1`
- **Modified:**
  - `package.json`, `vite.config.ts`, `src/App.tsx`
- **Deleted:** None

## 🔗 Cross-Dependencies (Blast Radius)
- **Frontend:** App shell with Router and Bottom Navigation running on `http://localhost:5173`.
- **Backend API:** Fastify server running on `http://localhost:4000` with `/api` proxy.

## ⚠️ Pending Impacts to Fix (To-Do Checklist)
- [ ] Implement Auth routes & PIN verification in Backend (`BE-003`)
- [ ] Implement Phone & PIN login UI in Frontend (`FE-004`)
- [ ] Implement PWA Gatekeeper & device routing (`FE-003`)

## 📝 Next Tasks
1. Implement `BE-003` (Auth API) & `FE-004` (Login UI).
2. Implement `BE-004` (Houses & Members API) & `FE-005` (Members UI).

## 🛡️ Active Anti-Regression
- All financial numbers passed across the API boundary MUST remain integer Satang (`Int`).
- Multi-tenancy must be enforced on both Backend API middleware and Supabase RLS.
- Zero comments in production code.
- Zero black backgrounds (`#000000` or ultra-dark shades).
