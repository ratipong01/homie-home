# Non-Negotiable Engineering & Domain Rules

## 1. Zero Fluff, Zero Comments & Microcopy-Only
- No comments in production code. Use strictly typed, self-documenting code.
- **Microcopy-Only UI:** ห้ามมีข้อความบรรยายยาวหรือข้อความที่เป็นน้ำในหน้าจอเด็ดขาด ใช้เฉพาะคำสั้นๆ ป้าย Badge, Chip และ Icon เท่านั้น ดูปุ๊บต้องเข้าใจสถานะได้ทันทีภายใน 0.5 วินาที.
- No conversational filler in technical reports.

## 2. PWA Gatekeeper & Platform Boundary
- Strict enforcement: Only mobile/tablet devices running in standalone PWA mode (`display-mode: standalone` or `navigator.standalone`) may access the application.
- Desktop: แสดง QR Code สั้นๆ `[สแกนเพื่อเปิดบนมือถือ]`.
- Mobile Non-Safari on iOS: แสดงปุ่มด่วน `[คัดลอกลิงก์]` พร้อมคำสั้นๆ `[เปิดใน Safari เพื่อติดตั้ง]`.

## 3. Visual & Aesthetic Guardrails
- **Tone:** Warm Orange (`#FFF7ED`, `#FFEDD5`, `#F97316`, `#EA580C`, `#C2410C`).
- **NO BLACK BACKGROUNDS:** `#000000` or ultra-dark shades (`#0F172A`, `#18181B`) are strictly forbidden as background colors anywhere in the app. Use warm stone/sand darks (`#431407`, `#7C2D12`) for high-contrast typography only.
- **Mist Gradient:** Atmospheric multi-color blurred gradient background for the logo and hero elements.

## 4. Security & Data Access Best Practices (Row Level Security - RLS)
- **Multi-Tenant House Boundary:** ทุกการ Query และ Mutation ต้องผ่านเงื่อนไข `house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid() AND status != 'REMOVED')`.
- **Perspective Privacy:** ตาราง `perspective_aliases` ต้องถูกป้องกันด้วย RLS: `viewer_user_id = auth.uid()` เท่านั้น คนอื่นมองไม่เห็นเด็ดขาด.
- **Task Title Immutability:** แก้ไขหัวข้อได้เฉพาะ `created_by = auth.uid()` เท่านั้น.
- **Completed Task Lock:** งานที่ `status = 'COMPLETED'` ห้าม UPDATE คอลัมน์การเงินเด็ดขาด (Enforced by Database Trigger/RLS).
- **PIN Cryptography:** Hashing ด้วย Argon2id / bcrypt พร้อม Salt. Recovery Key มีอายุ 24 ชม. และเป็น Single-use.
- **Strict ID-Only Linking:** ห้ามบันทึกชื่อบุคคล, สัตว์เลี้ยง หรือทรัพย์สินลงในตาราง Transaction เด็ดขาด ต้องอ้างอิงผ่าน Foreign Key (UUID) เสมอ.

## 5. Currency & Financial Integrity
- All currency values stored as integer **Satang** (`Int`). Never floating point.
- 100 THB = 10,000 Satang.
- Fair Remainder Satang Distribution Algorithm (Round-Robin).
- Presentation formatting via `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`.

## 6. Date, Time & Localization
- Storage in UTC ISO-8601 strings.
- Presentation in `Asia/Bangkok`.
- Thai Buddhist Era (พ.ศ.) formatted via `Intl.DateTimeFormat("th-TH")`. Manual `+543` arithmetic is strictly forbidden.
