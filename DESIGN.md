# Homie Home - Design System & Visual Assets

## 1. Color Palette Tokens

### Primary Palette (Warm Orange - No Black Backgrounds)
- `bg-canvas`: `#FFFBF5` (Warm Cream)
- `bg-surface`: `#FFFFFF` (Pure White Card)
- `bg-surface-subtle`: `#FFF7ED` (Orange 50)
- `bg-surface-muted`: `#FFEDD5` (Orange 100)
- `brand-primary`: `#F97316` (Warm Orange 500)
- `brand-primary-hover`: `#EA580C` (Orange 600)
- `brand-primary-active`: `#C2410C` (Orange 700)
- `brand-accent`: `#FB923C` (Orange 400)
- `brand-soft`: `#FED7AA` (Orange 200)

### Text & Contrast (Warm Earth Tones - Zero Pure Black)
- `text-main`: `#431407` (Deep Warm Earth / Orange 950)
- `text-secondary`: `#7C2D12` (Medium Warm Brown / Orange 900)
- `text-muted`: `#9A3412` (Soft Rust / Orange 800)
- `text-inverted`: `#FFFFFF`

### Status & Semantic
- `success`: `#15803D` / `bg-success`: `#F0FDF4`
- `warning`: `#D97706` / `bg-warning`: `#FFFBEB`
- `danger`: `#B91C1C` / `bg-danger`: `#FEF2F2`
- `handover-accent`: `#D946EF` (Warm Magenta Accent for Handover Chain)

---

## 2. Warm Orange Brand Emblem Logo (ดัดแปลงจาก my-homie-plus/dist/logo.svg)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Background Rich Warm Espresso & Deep Amber Base (Zero Pure Black) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#431407" />
      <stop offset="35%" stop-color="#7c2d12" />
      <stop offset="70%" stop-color="#9a3412" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>

    <!-- Sweeping Netflix-style Ribbon 1 (Amber Tangerine to Golden Sunrise) -->
    <linearGradient id="ribbon1Grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c" stop-opacity="0" />
      <stop offset="25%" stop-color="#f97316" stop-opacity="0.85" />
      <stop offset="55%" stop-color="#fb923c" stop-opacity="0.95" />
      <stop offset="80%" stop-color="#fde047" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
    </linearGradient>

    <!-- Sweeping Ribbon 2 (Warm Crimson to Sunset Orange to Amber) -->
    <linearGradient id="ribbon2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b91c1c" stop-opacity="0" />
      <stop offset="30%" stop-color="#ea580c" stop-opacity="0.8" />
      <stop offset="65%" stop-color="#f97316" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#fed7aa" stop-opacity="0" />
    </linearGradient>

    <!-- Ambient Glowing Orb (Radiant Warm Amber Core) -->
    <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fb923c" stop-opacity="0.75" />
      <stop offset="40%" stop-color="#f97316" stop-opacity="0.55" />
      <stop offset="75%" stop-color="#c2410c" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#7c2d12" stop-opacity="0" />
    </radialGradient>

    <!-- House Silhouette Warm Glowing Cream/Gold Gradient -->
    <linearGradient id="houseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed" />
      <stop offset="35%" stop-color="#ffedd5" />
      <stop offset="100%" stop-color="#fed7aa" />
    </linearGradient>

    <!-- Plus Symbol Radiant Sun Gradient -->
    <linearGradient id="plusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>

    <!-- Blur Filters for Ribbons and Glow -->
    <filter id="blurRibbon" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="30" />
    </filter>
    <filter id="blurOrb" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="45" />
    </filter>
  </defs>

  <!-- Base Warm Earth/Amber Background - Zero Black -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Ambient Glowing Orb behind logo -->
  <circle cx="256" cy="256" r="230" fill="url(#orbGlow)" filter="url(#blurOrb)" />

  <!-- Dynamic Sweeping Light Ribbon 1 -->
  <path d="M-80 440 L300 -80 L460 -80 L80 440 Z" fill="url(#ribbon1Grad)" filter="url(#blurRibbon)" transform="rotate(-18 256 256)" />

  <!-- Dynamic Sweeping Light Ribbon 2 -->
  <path d="M80 -80 L480 380 L380 480 L-20 20 Z" fill="url(#ribbon2Grad)" filter="url(#blurRibbon)" opacity="0.8" />

  <!-- Radiant Golden Sun Streak -->
  <ellipse cx="256" cy="256" rx="230" ry="58" fill="#fde047" opacity="0.32" filter="url(#blurRibbon)" transform="rotate(-35 256 256)" />

  <!-- Soft subtle ambient warm orange rim border -->
  <rect width="510" height="510" x="1" y="1" fill="none" stroke="#fb923c" stroke-width="1.5" stroke-opacity="0.35" />

  <!-- Centered Homie Home Brand Emblem -->
  <g transform="translate(66, 66) scale(9.5)" style="filter: drop-shadow(0px 6px 14px rgba(67, 20, 7, 0.7)) drop-shadow(0px 2px 5px rgba(67, 20, 7, 0.35));">
    <!-- House Silhouette -->
    <path d="M20 4L4 16.8V32C4 34.2 5.8 36 8 36H32C34.2 36 36 34.2 36 32V16.8L20 4Z" fill="url(#houseGrad)" />
    <!-- Inner Portal / Hearth -->
    <path d="M15 36V23C15 21.34 16.34 20 18 20H22C23.66 20 25 21.34 25 23V36H15Z" fill="#F97316" fill-opacity="0.85" />
    <!-- Plus Accent -->
    <path d="M26 10H30V14H34V18H30V22H26V18H22V14H26V10Z" fill="url(#plusGrad)" />
    <!-- Spark Core -->
    <circle cx="20" cy="14" r="2.6" fill="#FFFFFF" />
  </g>
</svg>
```

---

## 3. UI Layout & Navigation Architecture

### 3.1 Persistent Bottom Navigation Bar (Single Page)
```
┌───────────────────────────────────────────────────────────────┐
│ [📋 รายการ]   [💰 การเงิน]   ( ➕ ปุ่มกลาง )   [📊 แดชบอร์ด]   [👥 สมาชิก] │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Context-Aware Center Action Button Matrix
ปุ่มกลางเปลี่ยนบทบาทและสัญลักษณ์อย่างชาญฉลาดตามหน้าที่กำลังแสดงอยู่:
1. **หน้ารายการ (📋):** `[ ➕ เพิ่มรายการ ]` -> เปิด Bottom Sheet สไลด์สร้างงานใหม่
2. **หน้าการเงิน (💰):** `[ 💸 เคลียร์หนี้ ]` -> เปิดหน้าต่างด่วนเลือกคนที่ต้องการเคลียร์หนี้ พร้อมแสดง PromptPay QR
3. **หน้าแดชบอร์ด (📊):** `[ 📅 เพิ่มนัดหมาย ]` -> เปิดฟอร์มสร้างงานโดยล็อกวันครบกำหนดให้ตรงกับวันที่เลือกในปฏิทินทันที
4. **หน้าสมาชิก (👥):** `[ ➕ เพิ่ม / เชิญ ]` -> เปิด Action Sheet:
   - `👤 เชิญคนเข้าบ้าน`
   - `🐾 เพิ่มสัตว์เลี้ยง`
   - `🏠 เพิ่มทรัพย์สิน`
   - `👤 เพิ่มคนจำลอง`


