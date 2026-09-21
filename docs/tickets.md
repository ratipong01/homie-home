# Homie Home — Task Tickets (/to-tickets)
> DevCode Mode · Frontend / Backend Separation · 2026-09-21

---

## 🟢 Track A: Backend API (Node.js + TypeScript + Supabase)

### [BE-001] Backend Scaffold & TypeScript Environment
- **Priority:** P0 (Critical)
- **Files Impacted:**
  - `backend/package.json` [NEW]
  - `backend/tsconfig.json` [NEW]
  - `backend/src/server.ts` [NEW]
  - `backend/src/app.ts` [NEW]
- **Scope:**
  - Setup Node.js + TypeScript project with Fastify / Hono server.
  - Configure strict typing (`strict: true`, `strictNullChecks: true`).
  - Implement standard JSON error handler (`{ success: false, error: { code, message } }`).
  - Add CORS, compression, and request logging.
- **Acceptance Criteria:**
  - `pnpm --filter backend run build` passes with 0 errors.
  - `GET /health` returns `{ "status": "ok", "timestamp": "..." }`.

---

### [BE-002] Database Migrations & Supabase Client Layer
- **Priority:** P0 (Critical)
- **Source:** SPEC Section 2, 3, 5, RULES Section 4
- **Files Impacted:**
  - `supabase/migrations/00001_initial_schema.sql` [NEW]
  - `backend/src/config/supabase.ts` [NEW]
  - `backend/src/types/database.ts` [NEW]
- **Scope:**
  - Write SQL migrations for tables: `users`, `houses`, `house_members`, `perspective_aliases`, `tasks`, `task_sub_items`, `task_split_items`, `handover_logs`, `recovery_keys`.
  - Enforce RLS policies (House isolation, perspective privacy, creator-only title edit).
  - Add database trigger `enforce_task_immutability` to lock financial fields on `COMPLETED` tasks.
  - Setup type-safe Supabase admin client with connection pooling.
- **Acceptance Criteria:**
  - Migrations run idempotently on PostgreSQL 16.
  - Attempt to update `amount_satang` on a completed task throws `COMPLETED_TASK_IMMUTABLE`.

---

### [BE-003] Auth & PIN Cryptography API
- **Priority:** P0 (Critical)
- **Source:** SPEC Section 1.2, 1.3, 7.3.1
- **Files Impacted:**
  - `backend/src/routes/auth.routes.ts` [NEW]
  - `backend/src/services/auth.service.ts` [NEW]
  - `backend/src/middlewares/auth.middleware.ts` [NEW]
  - `backend/src/schemas/auth.schema.ts` [NEW]
- **Scope:**
  - `POST /api/v1/auth/phone-check`: validate 10-digit Thai phone and return existence/lock status.
  - `POST /api/v1/auth/login-pin`: verify PIN hash (Argon2id/bcrypt) and issue JWT.
  - `POST /api/v1/auth/register`: create new user and issue JWT.
  - `POST /api/v1/auth/recovery-key/create`: Owner/Admin generates 24h single-use key.
  - `POST /api/v1/auth/recovery-key/verify`: verify key, force set new PIN, unlock user.
  - Lock account after 5 consecutive failed PIN attempts.
- **Acceptance Criteria:**
  - JWT Bearer authentication middleware verifies valid tokens and injects `user_id`.
  - 5 failed attempts locks user; valid Recovery Key resets PIN and unlocks account.

---

### [BE-004] Houses & Polymorphic Members API
- **Priority:** P1 (High)
- **Source:** SPEC Section 2.1, 2.2, 2.3, 2.6, 7.3.2
- **Files Impacted:**
  - `backend/src/routes/house.routes.ts` [NEW]
  - `backend/src/services/house.service.ts` [NEW]
  - `backend/src/schemas/house.schema.ts` [NEW]
- **Scope:**
  - `GET /api/v1/houses`: list houses where caller is an active member.
  - `POST /api/v1/houses`: create house (caller becomes `OWNER`).
  - `GET /api/v1/houses/:houseId/members`: list members (`PERSON`, `PET`, `ASSET`, virtual) enriched with caller's 1-way perspective aliases.
  - `POST /api/v1/houses/:houseId/members/virtual`: create virtual member without phone number.
  - `POST /api/v1/houses/:houseId/members/invite`: invite member by phone.
  - `PATCH /api/v1/houses/:houseId/members/:memberId/alias`: set 1-way perspective alias (viewer-isolated).
- **Acceptance Criteria:**
  - Perspective aliases are strictly filtered by caller ID (`viewer_user_id = auth.uid()`).
  - Virtual members are created with default gender/theme avatar fallbacks.

---

### [BE-005] Vessel Lifecycle & Claim Protocol API
- **Priority:** P1 (High)
- **Source:** SPEC Section 2.5, 6.1, 6.3, 7.3.2
- **Files Impacted:**
  - `backend/src/routes/vessel.routes.ts` [NEW]
  - `backend/src/services/vessel.service.ts` [NEW]
- **Scope:**
  - `POST /api/v1/houses/:houseId/members/:memberId/kick`: kick member -> convert to vessel (`is_placeholder = true`, `user_id = null`, wipe phone/avatar, retain name).
  - `POST /api/v1/houses/:houseId/members/:memberId/claim-vessel`: invite new phone to vessel with `debtChoice` (`ACCEPT` or `WAIVE`).
  - `POST /api/v1/houses/:houseId/transfer-ownership`: instant ownership transfer (no accept needed).
  - `POST /api/v1/auth/account-deletion`: 30-day grace period soft delete.
- **Acceptance Criteria:**
  - Owner cannot leave or delete account without transferring ownership first.
  - Kicked user becomes vessel with 0 PII leak while keeping financial/task records intact.

---

### [BE-006] Tasks & Handover Chain API (Fair Satang Enforced)
- **Priority:** P0 (Critical)
- **Source:** SPEC Section 3.1, 3.2, 3.4, 7.3.3, RULES Section 5
- **Files Impacted:**
  - `backend/src/routes/task.routes.ts` [NEW]
  - `backend/src/services/task.service.ts` [NEW]
  - `backend/src/utils/fairSatang.ts` [NEW]
  - `backend/src/schemas/task.schema.ts` [NEW]
- **Scope:**
  - `GET /api/v1/houses/:houseId/tasks`: filter by status, holder, or due date.
  - `POST /api/v1/houses/:houseId/tasks`: create task with optional sub-items and split list.
    - Validate monetary amounts strictly as integer Satang (`Int`).
    - Apply Fair Satang Round-Robin remainder distribution for equal splits.
  - `GET /api/v1/houses/:houseId/tasks/:taskId`: task detail, splits, sub-items, and handover timeline.
  - `PATCH /api/v1/houses/:houseId/tasks/:taskId/title`: update title (strictly caller `created_by`).
  - `POST /api/v1/houses/:houseId/tasks/:taskId/handover`: pass ball (`RETURN`, `FORWARD`, `COMPLETE`) with note.
  - `DELETE /api/v1/houses/:houseId/tasks/:taskId`: soft delete (strictly caller `created_by`).
- **Acceptance Criteria:**
  - 10,000 Satang split 3 ways yields 3334, 3333, 3333 Satang. Total equals 10,000 Satang exactly.
  - Non-creator cannot update title or delete task.

---

### [BE-007] Financial Settlements & PromptPay QR API
- **Priority:** P1 (High)
- **Source:** SPEC Section 4.2, 4.4, 6.4, 7.3.4
- **Files Impacted:**
  - `backend/src/routes/finance.routes.ts` [NEW]
  - `backend/src/services/finance.service.ts` [NEW]
  - `backend/src/utils/promptpay.ts` [NEW]
- **Scope:**
  - `GET /api/v1/houses/:houseId/finance/balances`: calculate net balance per member across all unpaid splits.
  - `POST /api/v1/houses/:houseId/finance/settle-virtual`: mark virtual member's debt as settled (cash collected).
  - `POST /api/v1/houses/:houseId/finance/promptpay-qr`: generate PromptPay QR payload with Satang-to-Baht conversion.
- **Acceptance Criteria:**
  - Net balances correctly calculate who owes whom.
  - PromptPay payload string is valid EMVCo QR format matching exact Baht amount.

---

### [BE-008] Gemini 3.8 Flash AI Integration Service
- **Priority:** P2 (Medium)
- **Source:** SPEC Section 8, 7.3.5
- **Files Impacted:**
  - `backend/src/routes/ai.routes.ts` [NEW]
  - `backend/src/services/gemini.service.ts` [NEW]
- **Scope:**
  - `POST /api/v1/ai/parse-task`: send natural language text to Gemini 3.8 Flash, extract title, due date, amount in Satang, and split names.
  - `POST /api/v1/ai/receipt-ocr`: parse uploaded receipt image, extract total Satang and itemized lines.
- **Acceptance Criteria:**
  - Output adheres strictly to JSON schema with integer Satang.

---

## 🎨 Track B: Frontend Client (React 19 + PWA + Tailwind)

### [FE-001] Frontend Scaffold, Theme & PWA Config
- **Priority:** P0 (Critical)
- **Source:** Audit H-1, H-2, H-3, M-1, M-2, H-4, M-6
- **Files Impacted:**
  - `frontend/tailwind.config.ts` [NEW]
  - `frontend/src/index.css`
  - `frontend/src/lib/utils.ts` [NEW]
  - `frontend/vite.config.ts`
  - `frontend/src/components/common/PWAUpdatePrompt.tsx` [NEW]
- **Scope:**
  - Setup Tailwind CSS with Warm Orange palette (`#FFF7ED`, `#F97316`, `#EA580C`, `#C2410C`).
  - Eliminate all purple variables and ultra-dark background `#16171d`.
  - Create `cn()` utility (`clsx` + `tailwind-merge`).
  - Configure `vite-plugin-pwa` with `registerType: 'prompt'` and separate `any`/`maskable` icons.
- **Acceptance Criteria:**
  - Zero black backgrounds (`#000000` or ultra-dark shades).
  - PWA prompts user to update without automatic page refresh.

---

### [FE-002] API Client & State Management
- **Priority:** P0 (Critical)
- **Source:** SPEC Section 7.2
- **Files Impacted:**
  - `frontend/src/services/apiClient.ts` [NEW]
  - `frontend/src/services/authApi.ts` [NEW]
  - `frontend/src/services/houseApi.ts` [NEW]
  - `frontend/src/services/taskApi.ts` [NEW]
  - `frontend/src/services/financeApi.ts` [NEW]
  - `frontend/src/context/AuthContext.tsx` [NEW]
- **Scope:**
  - Create centralized Fetch/Axios client with base URL `/api/v1`.
  - Automatic `Authorization: Bearer <token>` injection from LocalStorage.
  - Error interceptor handling 401 (redirect to login) and formatted error toasts.
  - React Query (TanStack Query) hooks for caching and optimistic updates.
- **Acceptance Criteria:**
  - API client seamlessly handles network errors and 401 unauthorized redirects.

---

### [FE-003] PWA Standalone Gatekeeper & Device Routing
- **Priority:** P0 (Critical)
- **Source:** SPEC Section 1.1, RULES Section 2
- **Files Impacted:**
  - `frontend/src/components/auth/PWAGatekeeper.tsx` [NEW]
  - `frontend/src/components/auth/DesktopQRCode.tsx` [NEW]
  - `frontend/src/components/auth/SafariInstallGuide.tsx` [NEW]
- **Scope:**
  - Detect `display-mode: standalone` and mobile user agent.
  - If desktop: render QR code linking to app with `[สแกนเพื่อเปิดบนมือถือ]`.
  - If iOS non-Safari: show `[คัดลอกลิงก์]` with `[เปิดใน Safari เพื่อติดตั้ง]`.
  - If standalone: render app routes.
- **Acceptance Criteria:**
  - Blocks desktop users and presents QR code.
  - Passes through immediately in standalone PWA mode.

---

### [FE-004] Phone & PIN Login UI Flow
- **Priority:** P0 (Critical)
- **Source:** SPEC Section 1.2, 1.3
- **Files Impacted:**
  - `frontend/src/pages/LoginPage.tsx` [NEW]
  - `frontend/src/components/auth/PhoneStep.tsx` [NEW]
  - `frontend/src/components/auth/PinStep.tsx` [NEW]
  - `frontend/src/components/auth/RecoveryModal.tsx` [NEW]
- **Scope:**
  - Step 1: 10-digit phone with "จดจำเบอร์โทรนี้" checkbox.
  - Step 2: 4-6 masked dots PIN pad; auto-submits on complete length.
  - Fast switch: `[เปลี่ยนเบอร์]` button.
  - Recovery Modal: enter single-use Recovery Key to reset PIN.
- **Acceptance Criteria:**
  - Remembered phone skips Step 1 directly to PIN pad on return visits.

---

### [FE-005] House Switcher & Polymorphic Members UI + Lightbox
- **Priority:** P1 (High)
- **Source:** SPEC Section 2.1, 2.2, 2.3, 2.4, 2.6
- **Files Impacted:**
  - `frontend/src/components/layout/HouseHeader.tsx` [NEW]
  - `frontend/src/pages/MembersPage.tsx` [NEW]
  - `frontend/src/components/members/MemberCard.tsx` [NEW]
  - `frontend/src/components/members/AvatarLightbox.tsx` [NEW]
  - `frontend/src/components/members/AddVirtualModal.tsx` [NEW]
  - `frontend/src/components/members/EditAliasModal.tsx` [NEW]
- **Scope:**
  - Active house switcher in top app bar.
  - Members grouped by Person, Pet, Asset, and Virtual.
  - Circular avatars (`rounded-full aspect-square`); tap to open high-res Lightbox popup.
  - Quick virtual member creation modal (name, gender, theme color).
  - 1-way custom alias editor.
- **Acceptance Criteria:**
  - Tapping any member avatar opens full-screen high-res Lightbox.

---

### [FE-006] Tasks List & Detail Modal (Microcopy Enforced)
- **Priority:** P0 (Critical)
- **Source:** SPEC Section 3.1, 4.3, 4.4, RULES Section 1
- **Files Impacted:**
  - `frontend/src/pages/TasksPage.tsx` [NEW]
  - `frontend/src/components/tasks/TaskCard.tsx` [NEW]
  - `frontend/src/components/tasks/TaskDetailModal.tsx` [NEW]
  - `frontend/src/components/tasks/HandoverTimeline.tsx` [NEW]
- **Scope:**
  - Card view with glanceable badges: `[งานคุณ]`, `[รอ: แมน]`, `[เสร็จแล้ว]`, `[เลยกำหนด]`.
  - Quick card actions: `[ส่งกลับ]`, `[เสร็จสิ้น]`.
  - Detail modal: Handover timeline, sub-items list, expense split table.
  - Creator-only pencil icon to edit title.
- **Acceptance Criteria:**
  - All UI text adheres to Microcopy Dictionary ($\le 3\text{--}4$ words).

---

### [FE-007] Smart 2-Slide Task Form (Satang Validation)
- **Priority:** P0 (Critical)
- **Source:** SPEC Section 3.3, 3.4, RULES Section 5
- **Files Impacted:**
  - `frontend/src/components/tasks/TaskFormSheet.tsx` [NEW]
  - `frontend/src/components/tasks/SlideBasicInfo.tsx` [NEW]
  - `frontend/src/components/tasks/SlideExpenseSplit.tsx` [NEW]
  - `frontend/src/lib/currency.ts` [NEW]
- **Scope:**
  - Slide 1: Title, assignee chips, related entity chips, due date/time quick presets, recurrence, expense toggle. If no expense -> Save immediately.
  - Slide 2: Expense total or itemized lines (locked total). Split selection: Equal split (shows Fair Satang preview) or Custom amounts.
  - Conversion utility: Baht input <-> integer Satang storage.
- **Acceptance Criteria:**
  - Saving without expense finishes on Slide 1 in <= 2 taps.
  - Split calculation matches backend Fair Satang preview exactly.

---

### [FE-008] Finance View, Net Balance Badges & PromptPay Modal
- **Priority:** P1 (High)
- **Source:** SPEC Section 4.2, 4.4, 6.4
- **Files Impacted:**
  - `frontend/src/pages/FinancePage.tsx` [NEW]
  - `frontend/src/components/finance/BalanceCard.tsx` [NEW]
  - `frontend/src/components/finance/PromptPayModal.tsx` [NEW]
  - `frontend/src/components/finance/SettleVirtualModal.tsx` [NEW]
- **Scope:**
  - Net balance cards with glanceable chips: `[ค้างจ่าย 150฿]`, `[รอรับ 300฿]`, `[หนี้สุทธิ 0฿]`.
  - PromptPay QR modal displaying generated QR code and copyable PromptPay number.
  - Virtual member cash settlement button: `[บันทึก: คนจำลองจ่ายแล้ว]`.
- **Acceptance Criteria:**
  - Shows QR code accurately with formatted Baht amount.

---

### [FE-009] Dashboard & Context-Aware Center (+) Button
- **Priority:** P1 (High)
- **Source:** SPEC Section 4.1, 4.2
- **Files Impacted:**
  - `frontend/src/components/layout/BottomNav.tsx` [NEW]
  - `frontend/src/pages/DashboardPage.tsx` [NEW]
  - `frontend/src/components/dashboard/MetricsRow.tsx` [NEW]
  - `frontend/src/components/dashboard/CalendarMini.tsx` [NEW]
- **Scope:**
  - Bottom navigation bar with context-aware Center (+) button:
    - On List: Opens new task bottom sheet.
    - On Finance: Opens quick settle / PromptPay modal.
    - On Dashboard: Opens new task with selected calendar date locked.
    - On Members: Opens action sheet (Invite member, Add pet, Add asset).
  - Dashboard view: Glanceable metrics (`[สำเร็จ 88%]`, `[วันนี้ N งาน]`, `[ค้าง N งาน]`) and mini calendar.
- **Acceptance Criteria:**
  - Center (+) button opens the correct contextual action sheet per active tab.

---

### [FE-010] Gemini AI Task Creation & Receipt Scanner UI
- **Priority:** P2 (Medium)
- **Source:** SPEC Section 8
- **Files Impacted:**
  - `frontend/src/components/tasks/AIAssistModal.tsx` [NEW]
  - `frontend/src/components/tasks/ReceiptScannerModal.tsx` [NEW]
- **Scope:**
  - Text input for natural language parsing (e.g. "พรุ่งนี้ช่างแอร์ 3500 บาท หาร แมน กับ พ่อ").
  - Camera/File upload for receipt image OCR.
  - Populates TaskFormSheet with parsed fields for user confirmation before saving.
- **Acceptance Criteria:**
  - Parsed data auto-fills Slide 1 and Slide 2 fields without manual re-typing.

---

## 🔗 Track C: Integration & Verification

### [INT-001] End-to-End API Integration & CORS
- **Priority:** P0 (Critical)
- **Scope:**
  - Connect Frontend API client to Backend API.
  - Configure Vite dev proxy (`/api -> http://localhost:4000`).
  - Verify complete Auth -> House -> Task -> Settle flow against running backend.
- **Acceptance Criteria:**
  - Full user journey completes without CORS errors or unhandled promise rejections.

---

### [INT-002] Offline & PWA Sync Verification
- **Priority:** P1 (High)
- **Scope:**
  - Test PWA installation on iOS Safari and Android Chrome.
  - Verify Service Worker caching and `prompt` update notification flow.
  - Verify Lighthouse PWA criteria.
- **Acceptance Criteria:**
  - Lighthouse PWA score >= 90.
