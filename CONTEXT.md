# Homie Home - Context & Architecture Map

## System Overview
Homie Home is a mobile-first PWA designed strictly for portable devices (Add-to-Home enforcement). It manages household tasks, responsibility handovers, shared expenses, and handyman services with perspective-based member relationships and phone/PIN authentication.

## Module Map
- **Single Page UI (`src/pages/SinglePageHome.tsx` | `SPEC.md#single-page`):** หน้าหลักหน้าเดียวแบบ Glanceable 0.5s รวมงานบ้าน, การส่งต่อ, ค่าใช้จ่าย, และ Quick AI Input Bar
- **Auth & Onboarding (`docs/specs/auth.md` | `SPEC.md#auth`):** Phone + PIN auto-login, 30-day remembered session บน PWA Standalone, Family Quick View ผ่าน LINE โดยไม่ต้องลงแอพ
- **Houses & Roles (`docs/specs/house.md` | `SPEC.md#house`):** Multi-house management, roles (Owner, Admin, Member), House Fund (กระเป๋ากองกลาง)
- **Perspective Relationships (`docs/specs/relationship.md` | `SPEC.md#relationship`):** 1-way custom aliases and relationship tags per user pair across all shared houses.
- **Tasks, Chores & Handover Chain (`docs/specs/task.md` | `SPEC.md#task`):** Unified task item, Chore Rotation Ring (หมุนเวียนเวรงานบ้านอัตโนมัติ), Nudge Protocol (สะกิดเตือน), infinite handover chain, creator-only delete protection.
- **Finance & Settlements (`docs/specs/finance.md` | `SPEC.md#finance`):** Satang math, Net Debt Simplification, PromptPay QR, Slip Upload & OCR verification.
- **Notifications & Reminders (`docs/specs/notification.md` | `SPEC.md#notification`):** Web Push notifications on due date/time, Nudge alerts, and custom offset reminders.
- **Design & Branding (`DESIGN.md`):** Warm Orange palette, zero-black-background policy, Warm Orange Brand Emblem Logo SVG (derived from `my-homie-plus/dist/logo.svg`).
- **AI Intelligence (`docs/specs/ai.md` | `SPEC.md#ai`):** Gemini 3.8 Flash for fast single-line/voice task creation and receipt OCR.
- **Task Tickets (`docs/tickets.md` | `docs/ai/tickets.md`):** Complete ticket breakdown for Backend API (BE), Frontend Client (FE), and Integration (INT) tracks.
- **Architecture Analysis & Gaps (`docs/ai/architecture_analysis.md`):** Entity Quadruple, Pets/Assets, PIN lock lifecycle, House Fund, and Single Page integration.

