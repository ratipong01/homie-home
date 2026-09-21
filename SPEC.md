# Homie Home - Functional & Technical Specification

## 1. Authentication, Sessions & Platform Access

### 1.1 PWA Gatekeeper & Platform Boundary with Family Quick View
- **Platform Detection:**
  - Standalone Mode: `(window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone === true)`
  - Touch/Mobile User Agent: `/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)`
- **Gatekeeper Routing:**
  - **Standalone PWA:** เข้าสู่ระบบเต็มรูปแบบ (Full App Experience)
  - **Family Quick View (LINE / In-App Browser):**
    - เมื่อเปิดลิงก์รายการงานบ้าน/ลิสต์ซื้อของผ่าน LINE หรือเบราว์เซอร์ปกติ: แสดงหน้า **"Family Quick View"** ทันที
    - สมาชิกในบ้านสามารถดูรายการ, ติ๊กถูกว่าทำแล้ว (`[✔️ เสร็จ]`), หรือเพิ่มของที่ต้องซื้อแบบด่วนได้ทันทีโดยไม่ต้องติดตั้ง PWA ก่อน
    - มีแถบ Banner เล็กๆ ด้านบน: `[📲 ติดตั้ง Homie Home บนหน้าจอโฮมเพื่อรับการแจ้งเตือน]`
  - **Non-Standalone Mobile (iOS Safari):** แสดงคำแนะนำการติดตั้งสั้นๆ `[แชร์ -> เพิ่มไปยังหน้าจอโฮม]` พร้อมปุ่ม `[เปิดโหมด Quick View]`
  - **Non-Standalone Mobile (iOS Other Browsers เช่น LINE, Chrome):** แสดงปุ่ม `[คัดลอกลิงก์]` พร้อมคำสั้นๆ `[เปิดใน Safari เพื่อติดตั้ง]` หรือเลือก `[ดูรายการด่วน]`
  - **Desktop Device:** แสดง QR Code ย่อลิงก์ปัจจุบันพร้อมคำสั้นๆ `[สแกนเพื่อเปิดบนมือถือ]`
- **PWA Service Worker Update Strategy:**
  - ใช้ `registerType: 'prompt'` ใน `vite.config.ts` ป้องกันการ reload หน้าจออัตโนมัติขณะผู้ใช้กำลังกรอกฟอร์ม
  - แยก Icon entries ใน Manifest: Entry 1 สำหรับ `purpose: 'any'` และ Entry 2 สำหรับ `purpose: 'maskable'` (Safe zone 40%)

### 1.2 Phone & PIN Login with 30-Day Remembered Session
- **Step 1: Phone Check**
  - ช่องกรอกเบอร์โทรศัพท์ 10 หลัก (`08x-xxx-xxxx` หรือตัวเลข 10 หลัก)
  - มีตัวเลือก Checkbox: **"จดจำเบอร์โทรนี้" (Remember Phone)** บันทึกใน LocalStorage
  - มีตัวเลือก Checkbox: **"จดจำอุปกรณ์นี้ 30 วัน" (Remember Device / Trusted Device)**:
    - บน Standalone PWA เมื่อเปิดใช้งานตัวเลือกนี้: แอพจะรักษา Session นาน 30 วัน
    - การสลับแอพหรือรีเฟรชหน้าจอไม่ต้องกรอก PIN ซ้ำ
    - บังคับยืนยัน PIN เฉพาะเมื่อกดยืนยันการเงินสำคัญ (โอนเงิน, เคลียร์หนี้, แก้ไขสิทธิ์สมาชิก) หรือเมื่อผู้ใช้กดล็อกเครื่องเอง
- **Step 2: PIN Check & Biometric Quick Unlock**
  - ช่องกรอก PIN 4–6 หลัก (Masked Dots)
  - ตรวจสอบอัตโนมัติเมื่อกรอกครบตามความยาว ไม่ต้องกดปุ่มส่ง
  - รองรับ **WebAuthn / Biometric (FaceID / Fingerprint)**: เมื่อเปิดใช้งานแล้ว สามารถแตะสแกนนิ้ว/ใบหน้าเพื่อปลดล็อกได้ภายใน 0.3 วินาที
  - หากเบอร์ยังไม่อยู่ในระบบ: นำทางไปยังหน้าสร้างโปรไฟล์ (Display Name + ตั้ง PIN 2 ครั้ง) และเข้าใช้งานทันที
  - หน้ากรอก PIN มีปุ่มด่วน: `[เปลี่ยนเบอร์]` เพื่อสลับบัญชีได้ตลอดเวลา


### 1.3 Zero-Cost PIN Recovery Lifecycle
- กรอก PIN ผิดครบ 5 ครั้ง หรือกดปุ่ม `[ลืม PIN]` -> บัญชีผู้ใช้เข้าสู่สถานะ `LOCKED`
- Owner หรือ Admin ในบ้านมีปุ่ม `[สร้าง Recovery Key]` (ตัวเลขสุ่มความยาวเท่า PIN) มีอายุ 24 ชม. และใช้งานได้ครั้งเดียว (Single-use)
- ผู้ใช้นำ Recovery Key มากรอกแทน PIN -> บังคับตั้ง PIN ใหม่ทันที และปลดล็อกบัญชี
- หากผู้ใช้นึก PIN เดิมออกและกรอกถูกต้องก่อนใช้ Key -> ยกเลิก Key ทันที และปิดปุ่มฝั่ง Owner/Admin อัตโนมัติ

---

## 2. Houses, Members & Perspectives

### 2.1 Multi-House Model
- ผู้ใช้ 1 คนสามารถสังกัดได้หลายบ้าน ($N$ Houses)
- ผู้ใช้ 1 คนสามารถสร้างบ้านใหม่ได้หลายหลัง ($M$ Houses)
- สลับบ้านที่กำลังใช้งาน (Active House) ได้ทันทีผ่าน Dropdown บริเวณ App Bar ด้านบน

### 2.2 Normalized Data Model (Zero Redundancy — ผูก ID ไม่ซ้ำฟิลด์)

ข้อมูลโปรไฟล์ของ **บุคคล** จัดเก็บที่ `users` เพียงที่เดียว ส่วน `house_members` เป็นตารางเชื่อมโยงสิทธิ์สมาชิกเท่านั้น
สำหรับ PET / ASSET ที่ไม่มี user record จะเก็บข้อมูลโปรไฟล์บน `house_members` โดยตรง

```ts
interface User {
  id: string;
  phone: string | null;
  pinHash: string | null;
  displayName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  avatarUrl: string | null;
  themeColor: string;
  isVirtual: boolean;
  status: 'ACTIVE' | 'LOCKED' | 'PENDING_DELETION';
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface House {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface HouseMember {
  id: string;
  houseId: string;
  memberType: 'PERSON' | 'PET' | 'ASSET';
  userId: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED' | 'VESSEL' | 'REMOVED';
  invitedPhone: string | null;
  name: string | null;
  category: string | null;
  avatarUrl: string | null;
  themeColor: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface PerspectiveAlias {
  id: string;
  viewerUserId: string;
  targetMemberId: string;
  aliasName: string;
  relationshipTag: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RecoveryKey {
  id: string;
  userId: string;
  houseId: string;
  keyHash: string;
  expiresAt: string;
  isUsed: boolean;
  createdBy: string;
  createdAt: string;
}
```

**Field Ownership Rules (ป้องกันข้อมูลซ้ำซ้อน):**

| สถานะสมาชิก | `userId` | ชื่อที่แสดง | เพศ / รูป / สี |
| :--- | :--- | :--- | :--- |
| PERSON (Active) | FK → `users` | JOIN `users.displayName` | JOIN `users` |
| PERSON (Invited) | `null` | `null` (แสดง `invitedPhone`) | — |
| PERSON (Vessel) | `null` | `house_members.name` (snapshot) | — (ลบเพื่อ PDPA) |
| Virtual Person | FK → `users` (`isVirtual=true`) | JOIN `users.displayName` | JOIN `users` |
| PET / ASSET | `null` | `house_members.name` | `house_members` fields |

**UI Display Priority:**
1. `perspective_aliases.aliasName` (ถ้าผู้ดูตั้งชื่อเรียกไว้)
2. `users.displayName` (ถ้า `userId != null`)
3. `house_members.name` (Vessel / PET / ASSET fallback)

### 2.3 กฎของคนจำลอง (Virtual / Simulation Members)
- สร้างคนจำลองจะสร้าง record ใน `users` ที่มี `isVirtual = true`, `phone = null`, `pinHash = null` พร้อมตั้ง `displayName`, `gender`, `themeColor` ทันที
- จากนั้นสร้าง `house_members` ผูก `userId` → `users.id` เพื่อให้ข้อมูลโปรไฟล์อยู่ที่เดียวไม่ซ้ำ
- สามารถมอบหมายงานและใส่ชื่อในรายการหารเงินได้เหมือนสมาชิกปกติ
- สมาชิกในบ้านมีปุ่มด่วน: `[บันทึก: คนจำลองจ่ายแล้ว]` เพื่อตัดยอดหนี้เป็น 0 ทันทีเมื่อรับเงินสด
- การแสดงผล Avatar: หากไม่มีรูปถ่ายจริง จะแสดงภาพลายเส้นตาม `users.gender` บนพื้นหลัง `users.themeColor`
- หากคนจริงปฏิเสธคำเชิญเข้าบ้าน `house_members.status` เปลี่ยนเป็น `'VESSEL'` เพื่อรักษาประวัติงานและการเงิน

### 2.4 Profile Avatars & Image Lightbox Popup
- ทุกโปรไฟล์แสดงผลในกรอบวงกลม (`rounded-full aspect-square object-cover`)
- เมื่อแตะรูปโปรไฟล์ของคน, สัตว์เลี้ยง หรือทรัพย์สิน ระบบจะเปิด Lightbox Popup แสดงภาพความละเอียดสูงทันที

### 2.5 วงจรการลบสมาชิก, การกู้คืน 30 วัน และ "การสิงร่างแทน" (Vessel & Claim Protocol)
1. **การขอลบบัญชีตนเอง (Account Deletion with 30-Day Grace Period):**
   - `users.status` เปลี่ยนเป็น `'PENDING_DELETION'` และบันทึก `users.deletedAt`
   - หากผู้ใช้เข้าสู่ระบบภายใน 30 วัน ระบบจะยกเลิกการลบและคืนสถานะ `'ACTIVE'` ทันที
   - หากพ้น 30 วัน ข้อมูลใน `users` จะถูกลบถาวร (Hard Anonymized) หากเบอร์เดิมกลับมาสมัครใหม่จะถือเป็น User ใหม่ (New UUID)
2. **การออกจากบ้าน หรือ ถูกไล่ออก (Instant Vessel Conversion):**
   - เมื่อสมาชิกหลุดออกจากบ้าน (ไม่ว่าจะกดออกเอง, ถูกเตะ, หรือลบบัญชี)
   - `house_members.status` เปลี่ยนเป็น `'VESSEL'`
   - `house_members.userId = null` ถอดการผูก
   - `house_members.name` = snapshot ของ `users.displayName` ก่อนถอด (เพื่อรักษาประวัติงานและหนี้สิน)
   - ข้อมูลส่วนตัว (phone, avatar) ไม่ถูกกระทบเพราะอยู่บน `users` table ไม่ได้อยู่บน `house_members` (PDPA compliant)
3. **การเชิญมาสิงร่างแทน (Claim Vessel via Invite):**
   - ร่างแทน (`status = 'VESSEL'`) ทุกร่างมีปุ่ม `[👻 เชิญคนมาสิงร่างนี้]`
   - Owner/Admin กรอกเบอร์ผู้ใช้ใหม่ และเลือกเงื่อนไขหนี้เดิม:
     - `[คนใหม่รับหนี้เดิม N บาท]`
     - `[เจ้าของบ้านรับหนี้แทน / คนใหม่เริ่มที่ 0 บาท]`
   - เมื่อผู้ใช้ใหม่ตอบรับ: `house_members.userId = <new_user_id>`, `status = 'ACTIVE'`, `name = null` (กลับมาใช้ JOIN users)
4. **กฎเหล็กของผู้สร้างบ้าน (Owner Guardrails):**
   - ผู้สร้างบ้าน (Owner) ไม่สามารถออกจากบ้านหรือลบบัญชีได้จนกว่าจะกด `[โอนสิทธิ์ผู้สร้างบ้าน]` ให้สมาชิกคนอื่นก่อน (มีผลทันทีไม่ต้องรออีกฝ่ายกดยอมรับ)
   - ข้อยกเว้น: หากเหลือสมาชิกคนเดียวในบ้าน จะมีปุ่ม `[ลบบ้านทิ้งทั้งหลัง]`
   - Owner สามารถปรับเปลี่ยนบทบาทของทุกคนในบ้านได้ (`OWNER`, `ADMIN`, `MEMBER`)

### 2.6 Perspective Relationships (ความสัมพันธ์ตามมุมมองบุคคล)
- ตาราง `perspective_aliases`: จัดเก็บชื่อเรียกเฉพาะตัวและแท็กความสัมพันธ์ที่ผู้ใช้คนหนึ่งตั้งให้สมาชิกอีกคนหนึ่ง
- ป้องกันด้วย RLS / API Filtering: `viewer_user_id = auth.uid()` บุคคลอื่นมองไม่เห็นเด็ดขาด

### 2.7 House Fund (กระเป๋ากองกลางของบ้าน)
- บ้านแต่ละหลังสามารถเปิดใช้งาน **"กระเป๋ากองกลาง"** สำหรับเก็บเงินรวม เช่น ค่าส่วนกลาง, ค่าน้ำไฟ, ของใช้ส่วนรวม
- สมาชิกสามารถกด `[เติมเงินกองกลาง]` (ระบุยอด และแนบสลิป/บันทึกการโอน)
- เมื่อมีค่าใช้จ่ายส่วนกลาง: สามารถเลือกหักจากกองกลางก่อนได้ หากเงินในกองกลางไม่พอ ระบบจะคำนวณส่วนต่างที่เหลือเพื่อนำไปหารสมาชิกตามสัดส่วน

### 2.8 Chore Rotation Ring (ระบบหมุนเวียนเวรงานบ้านอัตโนมัติ)
- งานบ้านประจำ (เช่น ล้างจาน, ทิ้งขยะ, กวาดบ้าน) สามารถตั้งเป็น **Chore Rotation**
- ระบุลำดับสมาชิกที่รับผิดชอบเป็นวงกลม: `[Member A -> Member B -> Member C]`
- เมื่อ Member A ทำงานเสร็จ (`[✔️ เสร็จสิ้น]`):
  - ระบบจะสร้างรอบถัดไปตาม `recurrenceIntervalDays`
  - สลับผู้รับผิดชอบไปยัง Member B อัตโนมัติ โดยไม่ต้องให้ใครกดส่งต่อด้วยมือ
  - แสดงป้าย `[เวร: โบว์]` บนหน้า Feed ของทุกคนในบ้าน

---

## 3. Tasks, Chores & Handover Protocol

### 3.1 Task & Financial Data Model
ทุกฟิลด์การเงินจัดเก็บเป็นจำนวนเต็ม **สตางค์ (`Int`)** เสมอ (100 บาท = 10,000 สตางค์):

```ts
interface Task {
  id: string;
  houseId: string;
  title: string;
  description: string | null;
  createdBy: string;
  currentHolderId: string;
  beneficiaryId: string | null;
  beneficiaryType: 'PERSON' | 'PET' | 'ASSET' | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  reminderAt: string | null;
  recurrenceIntervalDays: number | null;
  rotationMemberIds: string[] | null;
  currentRotationIndex: number | null;
  hasExpense: boolean;
  amountSatang: number;
  useHouseFund: boolean;
  splitType: 'EQUAL' | 'CUSTOM';
  slipUrl: string | null;
  slipVerified: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskSubItem {
  id: string;
  taskId: string;
  title: string;
  amountSatang: number;
}

interface TaskSplitItem {
  id: string;
  taskId: string;
  memberId: string;
  amountSatang: number;
  paidAt: string | null;
}

interface HandoverLog {
  id: string;
  taskId: string;
  fromMemberId: string;
  toMemberId: string;
  note: string | null;
  createdAt: string;
}
```

### 3.2 Handover Chain & Permissions
- **สิทธิ์แก้ไขหัวข้องาน:** เฉพาะผู้สร้างงาน (`createdBy = auth.uid()`) เท่านั้นที่สามารถแก้ไขหัวข้องานได้
- **สิทธิ์ลบงาน:** เฉพาะผู้สร้างงานเท่านั้นที่สามารถลบงานได้ (Soft Delete: `deletedAt = now()`)
- **การส่งมอบลูกบอลความรับผิดชอบ (Handover Chain):**
  - ผู้ถือบอลปัจจุบัน (Current Holder) มีปุ่มสั่งการ:
    - `[↩️ ส่งกลับ]`: ส่งลูกบอลคืนให้ผู้สร้างงานหรือผู้ส่งก่อนหน้า
    - `[➡️ ส่งต่อ]`: เลือกสมาชิกคนถัดไปพร้อมระบุโน้ตสั้นๆ
    - `[✔️ เสร็จสิ้น]`: ทำเครื่องหมายงานเสร็จสมบูรณ์
- **ความไม่เปลี่ยนแปลงเมื่องานเสร็จ (Completed Immutability):** เมื่องานมีสถานะ `COMPLETED` ข้อมูลการเงิน (`amountSatang`, `splitType`, รายการย่อย และยอดหาร) จะถูกล็อก ห้ามแก้ไขเด็ดขาด

### 3.3 Fast 1-Tap & Gemini Voice/Text Capture Bar
- ด้านบนสุดของหน้า Single Page มีช่องด่วน **Fast Capture Bar**:
  - รองรับทั้งการพิมพ์สั้นๆ หรือแตะไอคอน 🎙️ สั่งด้วยเสียง เช่น:
    - *"ซื้อน้ำปลา 28 บาท"* -> สร้างงานทันที รับผิดชอบโดยตนเอง มีค่าใช้จ่าย 28 บาท
    - *"ทิ้งขยะหน้าบ้าน พรุ่งนี้ 8 โมง"* -> สร้างงาน กำหนดเวลาพรุ่งนี้ 08:00
    - *"ค่าไฟ 1,200 บาท หักกองกลาง"* -> สร้างรายการค่าใช้จ่ายหักจาก House Fund
  - ใช้ **Gemini 3.8 Flash** แยกวิเคราะห์ Entities (Title, DueDate, AmountSatang, Assignee, SplitChoice) ส่งกลับมาเป็น Structured JSON ภายใน < 1 วินาที

### 3.4 Nudge Protocol (ระบบสะกิดเตือนงาน)
- เมื่องานใกล้ครบกำหนดหรือเลยกำหนด (`now >= dueDate`) และงานยังไม่เสร็จ:
  - ผู้สร้างงานหรือสมาชิกในบ้านสามารถแตะปุ่ม `[🔔 สะกิด]`
  - ระบบจะส่ง Web Push Notification สั้นๆ ไปยังผู้ถือบอลปัจจุบัน:
    - Microcopy: `[🔔 แม่สะกิด: อย่าลืมทิ้งขยะนะ]`
  - หากไม่ได้เปิด Push Notification: มีปุ่มด่วน `[แชร์เข้า LINE]` เพื่อส่ง Card แจ้งเตือนสั้นๆ ไปยังกลุ่มบ้านในคลิกเดียว

### 3.5 Slip Upload & Verification
- เมื่องานมีค่าใช้จ่าย และผู้รับผิดชอบหรือผู้มีหน้าที่จ่ายเงินได้ทำการโอนเงิน:
  - สามารถแนบรูปสลิปผ่านปุ่ม `[📤 แนบสลิป]`
  - ระบบส่งรูปไปยัง AI Service (Gemini OCR) เพื่อดึง:
    - วันที่และเวลาโอน
    - ยอดเงินที่โอน
    - ธนาคารต้นทาง/ปลายทาง
  - หากยอดตรงกับ `amountSatang`: ปรับสถานะเป็น `[✔️ สลิปถูกต้อง]` และตัดยอดค้างจ่ายอัตโนมัติ

### 3.6 Fair Satang Round-Robin Algorithm
เมื่อหารยอดสตางค์แล้วมีเศษเหลือ กระจายเศษทีละ 1 สตางค์ตามลำดับสมาชิก:
- ตัวอย่าง: ยอด 10,000 สตางค์ หาร 3 คน
  - ฐานคนละ: `floor(10000 / 3) = 3333` สตางค์
  - เศษคงเหลือ: `10000 % 3 = 1` สตางค์
  - สมาชิกคนที่ 1 ได้รับ 3,334 สตางค์, สมาชิกคนที่ 2 ได้รับ 3,333 สตางค์, สมาชิกคนที่ 3 ได้รับ 3,333 สตางค์


---

## 4. UI Layout & Microcopy Dictionary

### 4.1 Bottom Navigation Bar (Single Page Persistent Bar)
แอพทำงานในรูปแบบ **Single Page Application (SPA)** โดยแถบเมนูด้านล่างจะคงอยู่ตลอดเวลา ไม่มีการรีโหลดหน้าจอ:

```
┌───────────────────────────────────────────────────────────────┐
│ [📋 รายการ]   [💰 การเงิน]   ( ➕ ปุ่มกลาง )   [📊 แดชบอร์ด]   [👥 สมาชิก] │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 บทบาทของปุ่ม (+) กลางจอตามแต่ละหน้า (Context-Aware Action Button)
ปุ่มกลางเปลี่ยนบทบาทและสัญลักษณ์อย่างชาญฉลาดตามหน้าที่กำลังแสดงอยู่:
1. **หน้ารายการ (📋):** `[ ➕ เพิ่มรายการ ]` -> เปิด Bottom Sheet สไลด์สร้างงานใหม่
2. **หน้าการเงิน (💰):** `[ 💸 เคลียร์หนี้ ]` -> เปิดหน้าต่างด่วนเลือกคนที่ต้องการเคลียร์หนี้ พร้อมแสดง PromptPay QR
3. **หน้าแดชบอร์ด (📊):** `[ 📅 เพิ่มนัดหมาย ]` -> เปิดฟอร์มสร้างงานโดยล็อกวันครบกำหนดให้ตรงกับวันที่เลือกในปฏิทินทันที
4. **หน้าสมาชิก (👥):** `[ ➕ เพิ่ม / เชิญ ]` -> เปิด Action Sheet:
   - `👤 เชิญคนเข้าบ้าน`
   - `🐾 เพิ่มสัตว์เลี้ยง`
   - `🏠 เพิ่มทรัพย์สิน`
   - `👤 เพิ่มคนจำลอง`

### 4.3 Views & Modals (Single Page Views)
- **Items List View (`TasksPage`):** การ์ดแสดงป้ายสถานะ (`[งานคุณ]`, `[รอ: แมน]`, `[เสร็จแล้ว]`), แท็กสิ่งที่เกี่ยวข้อง, อวาตาร์คนถือบอล, วันเวลานัดหมาย, ยอดเงิน, ปุ่มด่วน `[ส่งกลับ]`, `[เสร็จสิ้น]`, และ `[🔔 สะกิด]`
- **Finance View (`FinancePage`):** การ์ดหนี้สุทธิ Fair Satang, ยอดเงินกองกลาง, เคลียร์ PromptPay, สรุปรายคน
- **Dashboard View (`DashboardPage`):** สรุปอัตราสำเร็จ, ปฏิทินกำหนดส่ง, สถิติงานประจำบ้าน
- **Members View (`MembersPage`):** รายชื่อสมาชิก, สัตว์เลี้ยง, ทรัพย์สิน, คนจำลอง, จัดการชื่อเรียก (Perspective Alias)
- **Task Detail Modal:** แสดงข้อมูลเต็มจอ, หัวข้องาน (มีปุ่มดินสอเฉพาะผู้สร้าง), ไทม์ไลน์การส่งมอบ (Handover Timeline), ตารางรายการย่อยและรายชื่อคนหาร, Action Bar ด้านล่าง

### 4.4 Microcopy-Only UI Dictionary (พจนานุกรมคำสั้น - ห้ามมีน้ำ)
ทุกจุดในหน้าจอใช้คำสั้นกระชับ ($\le 3-4$ คำ) ไม่มีประโยคบรรยายยาว:

| หมวดหมู่ | ข้อความที่อนุญาตให้แสดงใน UI (Glanceable Words) |
| :--- | :--- |
| **สถานะงาน (Task Badges)** | `[งานคุณ]`, `[รอ: แมน]`, `[เสร็จแล้ว]`, `[เลยกำหนด]`, `[ซ้ำทุก 7 วัน]`, `[เวร: โบว์]` |
| **ปุ่มสั่งการ (Action Buttons)** | `[ส่งกลับ]`, `[ส่งต่อ]`, `[เสร็จสิ้น]`, `[🔔 สะกิด]`, `[💸 เคลียร์หนี้]`, `[จ่าย PromptPay]`, `[📤 แนบสลิป]` |
| **การเงิน (Finance Badges)** | `[ค้างจ่าย 150฿]`, `[รอรับ 300฿]`, `[จ่ายแล้ว]`, `[หนี้สุทธิ 0฿]`, `[ออกก่อน]`, `[กองกลาง: 2,500฿]` |
| **แดชบอร์ด (Dashboard)** | `[สำเร็จ 88%]`, `[วันนี้ N งาน]`, `[ค้าง N งาน]`, `[รายคน]` |
| **การแจ้งเตือน (Alert Chips)** | `[⚠️ มียอดค้าง]`, `[🔒 บัญชีถูกล็อก]`, `[📱 เปิดใน Safari]`, `[โอนสิทธิ์ก่อน]`, `[✔️ สลิปถูกต้อง]` |



---

## 5. Security & Row Level Security (RLS)

```sql
CREATE POLICY "house_isolation_policy" ON tasks
FOR ALL USING (
  house_id IN (
    SELECT house_id FROM house_members 
    WHERE user_id = auth.uid() AND status != 'REMOVED'
  )
);

-- 2. Perspective Privacy Policy: ห้ามใครเห็นชื่อเรียกส่วนบุคคลของคนอื่น
CREATE POLICY "perspective_privacy_policy" ON perspective_aliases
FOR ALL USING (viewer_user_id = auth.uid());

-- 3. Title Edit Restriction: แก้ไขหัวข้องานได้เฉพาะผู้สร้าง
CREATE POLICY "task_title_creator_only" ON tasks
FOR UPDATE USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- 4. Completed Task Immutability: ห้ามแก้ข้อมูลการเงินเมื่องานจบแล้ว
CREATE OR REPLACE FUNCTION check_task_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'COMPLETED' AND (
    OLD.amount_satang != NEW.amount_satang OR 
    OLD.split_type != NEW.split_type
  ) THEN
    RAISE EXCEPTION 'COMPLETED_TASK_IMMUTABLE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_task_immutability
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION check_task_immutability();
```

---

## 6. Friction-Point Protections

1. **การสิงร่างแทนที่มีหนี้เดิม (Vessel Debt Protection):**
   - เจ้าของบ้านต้องเลือกระหว่าง: `[คนใหม่รับหนี้เดิม N บาท]` หรือ `[เจ้าของบ้านรับหนี้แทน / คนใหม่เริ่มที่ 0 บาท]`
2. **งานเลยกำหนด (Overdue Notification):**
   - หาก `now > due_date` และงานยังไม่เสร็จ: ป้ายสถานะเปลี่ยนเป็น `[เลยกำหนด]` แจ้งเตือนไปยังทั้งคนถือบอลปัจจุบันและผู้สร้างงาน
3. **การโอนสิทธิ์ผู้สร้างบ้าน (Instant Ownership Transfer):**
   - Owner สามารถโอนสิทธิ์ให้สมาชิกคนอื่นได้ทันทีโดยไม่ต้องรอให้อีกฝ่ายกดยอมรับ
4. **การชำระเงินแทนคนจำลอง (Virtual Member Offline Settlement):**
   - สมาชิกที่รับเงินสดกด `[บันทึก: คนจำลองจ่ายแล้ว]` เพื่อตัดยอดหนี้เป็น 0 ได้ทันที
5. **iOS Gatekeeper Routing:**
   - หากเป็น iOS แต่เปิดบนเบราว์เซอร์อื่น (LINE, Chrome): แสดงปุ่ม `[คัดลอกลิงก์]` พร้อมคำสั้นๆ `[เปิดใน Safari เพื่อติดตั้ง]`

---

## 7. Frontend / Backend System Topology & REST API Contracts

### 7.1 Architecture Topology
```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (SPA/PWA)                    │
│   React 19 + TypeScript + Vite + Tailwind + TanStack Query  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON (Bearer JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Server                     │
│    Node.js / TypeScript REST API (Fastify or Hono/Express)  │
│   - Input Validation (Zod)                                  │
│   - Auth & PIN Cryptography (Argon2/bcrypt)                 │
│   - Fair Satang Financial Math                              │
│   - Multi-tenant Guardrails & RLS Enforcement               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Pool Connection / Service Role
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Database & Cloud Services                   │
│   Supabase (PostgreSQL 16) + Cloudflare Storage + pg_cron   │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Common API Conventions
- **Base URL:** `/api/v1`
- **Authentication:** `Authorization: Bearer <JWT_TOKEN>` (ยกเว้น Public Auth endpoints)
- **Content-Type:** `application/json`
- **Error Response Standard:**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "amountSatang must be an integer"
    }
  }
  ```
- **Success Response Standard:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### 7.3 REST API Endpoints Specification

#### 1. Authentication (`/api/v1/auth`)
| Method | Path | Payload / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/phone-check` | `{ "phone": "0812345678" }` | `{ "exists": true, "isLocked": false }` | ตรวจสอบเบอร์โทรและสถานะล็อก |
| `POST` | `/login-pin` | `{ "phone": "0812345678", "pin": "1234" }` | `{ "token": "jwt...", "user": { ... } }` | เข้าสู่ระบบด้วย PIN |
| `POST` | `/register` | `{ "phone": "0812345678", "pin": "1234", "displayName": "แมน" }` | `{ "token": "jwt...", "user": { ... } }` | สมัครใช้งานครั้งแรก |
| `POST` | `/recovery-key/verify` | `{ "phone": "0812345678", "recoveryKey": "9876", "newPin": "5678" }` | `{ "token": "jwt...", "user": { ... } }` | กู้คืน PIN ด้วย Recovery Key |
| `POST` | `/recovery-key/create` | `{ "targetUserId": "uuid...", "houseId": "uuid..." }` | `{ "recoveryKey": "9876", "expiresAt": "..." }` | Owner/Admin สร้าง Key 24 ชม. |

#### 2. Houses & Members (`/api/v1/houses`)
| Method | Path | Payload / Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/` | - | `{ "houses": [ ... ] }` | รายชื่อบ้านที่สังกัด |
| `POST` | `/` | `{ "name": "บ้านอบอุ่น" }` | `{ "house": { ... } }` | สร้างบ้านใหม่ (ผู้สร้างเป็น OWNER) |
| `GET` | `/:houseId/members` | - | `{ "members": [ ... ] }` | สมาชิกในบ้านทั้งหมด (รวมร่างจำลอง/ทรัพย์สิน/แท็กมุมมอง) |
| `POST` | `/:houseId/members/virtual` | `{ "name": "คุณยาย", "gender": "FEMALE", "themeColor": "#F97316" }` | `{ "member": { ... } }` | สร้างคนจำลอง |
| `POST` | `/:houseId/members/invite` | `{ "phone": "0898765432", "role": "MEMBER" }` | `{ "member": { ... } }` | เชิญสมาชิกเข้าบ้านด้วยเบอร์โทร |
| `POST` | `/:houseId/members/:memberId/claim-vessel` | `{ "phone": "0891112233", "debtChoice": "ACCEPT" \| "WAIVE" }` | `{ "member": { ... } }` | เชิญคนมาสิงร่างแทนพร้อมจัดการหนี้ |
| `POST` | `/:houseId/transfer-ownership` | `{ "targetUserId": "uuid..." }` | `{ "success": true }` | โอนสิทธิ์ Owner ทันที |
| `PATCH` | `/:houseId/members/:memberId/alias` | `{ "aliasName": "คุณแม่", "relationshipTag": "แม่" }` | `{ "alias": { ... } }` | ตั้งชื่อเรียกเฉพาะตัว 1-Way |

#### 3. Tasks & Handover Chain (`/api/v1/houses/:houseId/tasks`)
| Method | Path | Payload / Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/` | `?status=PENDING&holderId=...` | `{ "tasks": [ ... ] }` | รายการงานทั้งหมดในบ้าน |
| `POST` | `/` | `{ "title": "ล้างแอร์", "holderId": "...", "dueDate": "...", "amountSatang": 50000, "splitType": "EQUAL", "splitMemberIds": [ ... ] }` | `{ "task": { ... } }` | สร้างงานใหม่ (ตรวจสอบเศษ Satang) |
| `GET` | `/:taskId` | - | `{ "task": { ... }, "splits": [ ... ], "subItems": [ ... ], "timeline": [ ... ] }` | รายละเอียดงานและประวัติไทม์ไลน์ |
| `PATCH` | `/:taskId/title` | `{ "title": "ชื่อใหม่" }` | `{ "task": { ... } }` | แก้ไขหัวข้องาน (เฉพาะผู้สร้างงาน) |
| `POST` | `/:taskId/handover` | `{ "action": "RETURN" \| "FORWARD" \| "COMPLETE", "toMemberId": "...", "note": "..." }` | `{ "task": { ... } }` | ส่งมอบลูกบอลความรับผิดชอบ |
| `DELETE` | `/:taskId` | - | `{ "success": true }` | ลบงาน (Soft delete, เฉพาะผู้สร้างงาน) |

#### 4. Financial Settlements & House Fund (`/api/v1/houses/:houseId/finance`)
| Method | Path | Payload / Query | Response | Description |
|---|---|---|---|---|
| `GET` | `/balances` | - | `{ "balances": [ { "memberId": "...", "netSatang": 15000, "status": "OWED" } ], "fundSatang": 250000 }` | สรุปยอดหนี้สุทธิรายคนและยอดเงินกองกลาง |
| `POST` | `/fund/topup` | `{ "amountSatang": 50000, "slipUrl": "..." }` | `{ "fundSatang": 300000 }` | เติมเงินเข้ากระเป๋ากองกลาง |
| `POST` | `/settle-virtual` | `{ "virtualMemberId": "..." }` | `{ "success": true }` | บันทึกรับเงินสดจากคนจำลอง (หนี้เป็น 0) |
| `POST` | `/promptpay-qr` | `{ "toMemberId": "...", "amountSatang": 15000 }` | `{ "qrPayload": "000201...", "amountBaht": 150.00 }` | สร้าง Payload PromptPay QR |

#### 5. Task Actions: Nudge & Slip Verification (`/api/v1/houses/:houseId/tasks`)
| Method | Path | Payload / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/:taskId/nudge` | - | `{ "success": true, "notifiedCount": 1 }` | สะกิดเตือนคนถือบอลปัจจุบันผ่าน Web Push / LINE Card |
| `POST` | `/:taskId/slip` | `{ "slipImageBase64": "..." }` | `{ "verified": true, "amountSatang": 50000 }` | อัปโหลดและตรวจสอบสลิปโอนเงินด้วย Gemini OCR |

#### 6. Gemini AI Services (`/api/v1/ai`)
| Method | Path | Payload / Query | Response | Description |
|---|---|---|---|---|
| `POST` | `/parse-task` | `{ "text": "พรุ่งนี้ช่างแอร์ 3500 บาท หาร แมน กับ พ่อ" }` | `{ "title": "ช่างแอร์", "dueDate": "...", "amountSatang": 350000, "splitNames": ["แมน", "พ่อ"] }` | แกะข้อความเป็นโครงสร้างงาน |
| `POST` | `/receipt-ocr` | `{ "imageBase64": "..." }` | `{ "totalSatang": 45000, "subItems": [ ... ] }` | สกัดยอดเงินและรายการจากใบเสร็จ |

---

## 8. Architecture & Infrastructure

- **Frontend Core:** React 19 + TypeScript + Vite + Tailwind CSS + Lucide React + TanStack Query
- **Single Page Core:** `src/pages/SinglePageHome.tsx` รวมทุกประสบการณ์ไว้ในหน้าเดียวแบบไม่ต้องเปลี่ยน URL
- **Backend API:** Node.js + TypeScript (Fastify / Hono) + Zod + Argon2id / bcrypt
- **Hosting & Edge:** Cloudflare Pages (Frontend) + Cloudflare Workers / Node Server (Backend)
- **Database:** Supabase (PostgreSQL 16, RLS, pg_cron, Realtime)
- **PWA Manifest & Service Worker:** `registerType: 'prompt'` พร้อมแยก icon `any` และ `maskable`

---

## 9. Warm Orange Brand Identity & Visual Assets (Homie Home)

- **Application Name:** `Homie Home`
- **Short Name:** `Homie`
- **Primary Color:** `#F97316` (Warm Orange 500)
- **Canvas Background:** `#FFFBF5` (Warm Cream, Zero Pure Black Background)
- **Brand Emblem (`public/logo.svg`):** ดัดแปลงจาก `D:\workspace\my-homie-plus\dist\logo.svg` โดยคงลายเส้น, สเกล (9.5x), ปล่องไฟ, หน้าต่างหัวใจ, สัญลักษณ์บวก และริบบิ้นแสงแบบ Netflix ไดนามิก แต่ปรับโครงสีทั้งหมดเป็น Warm Orange, Radiant Amber, และ Rich Espresso Earth tones (`#431407` ถึง `#F97316`)
- **Favicon (`public/favicon.svg`):** ไอคอนบ้านสีส้มอบอุ่นบนพื้นมน Cream `#FFF7ED`

