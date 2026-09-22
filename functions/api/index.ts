/**
 * functions/api/index.ts
 * Cloudflare Pages Function – handles ALL /api/* requests
 *
 * Runtime: Cloudflare Workers (V8 isolate)
 * Framework: Hono  /  DB: Supabase (service_role – bypasses RLS)
 * Auth: HS256 JWT via jose (Web Crypto API)
 * PIN hash: PBKDF2-SHA256 via Web Crypto API (bcrypt-free)
 *
 * Required environment variables (Cloudflare Pages → Settings → Variables):
 *   SUPABASE_URL               – e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  – service_role secret key from Supabase dashboard
 *   JWT_SECRET                 – any long random string
 */

import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SignJWT, jwtVerify } from 'jose'

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  JWT_SECRET: string
}

type HonoCtx = { Bindings: Env }

// ─────────────────────────────────────────────
//  Supabase helper  (fresh per request, stateless)
// ─────────────────────────────────────────────

function supabase(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

// ─────────────────────────────────────────────
//  PIN hashing – PBKDF2-SHA256 (Workers native)
// ─────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMat = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, keyMat, 256)
  const b64 = (buf: Uint8Array) => btoa(String.fromCharCode(...buf))
  return `pbkdf2:100000:${b64(salt)}:${b64(new Uint8Array(bits))}`
}

async function verifyPin(pin: string, stored: string): Promise<boolean> {
  if (!stored) return false
  if (!stored.startsWith('pbkdf2:')) return pin === stored  // legacy plain-text
  const [, iterStr, saltB64, hashB64] = stored.split(':')
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0))
  const keyMat = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: parseInt(iterStr), hash: 'SHA-256' }, keyMat, 256)
  return btoa(String.fromCharCode(...new Uint8Array(bits))) === hashB64
}

// ─────────────────────────────────────────────
//  JWT helpers  (jose – Web Crypto)
// ─────────────────────────────────────────────

async function signToken(userId: string, secret: string): Promise<string> {
  return new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(secret))
}

async function verifyToken(token: string, secret: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return (payload as { id: string }).id ?? null
  } catch { return null }
}

// ─────────────────────────────────────────────
//  PromptPay QR (EMV co-scheme)
// ─────────────────────────────────────────────

function crc16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff
    x ^= x >> 4
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}
function emv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}
function promptPayQR(phone: string, amountBaht?: number): string {
  const clean = phone.replace(/\D/g, '')
  const mobile = clean.startsWith('0') ? '0066' + clean.slice(1) : clean
  const mInfo = emv('29', emv('00', 'A000000677010111') + emv('01', mobile))
  let p = emv('00', '01') + emv('01', amountBaht ? '12' : '11') + mInfo + emv('53', '764')
  if (amountBaht && amountBaht > 0) p += emv('54', amountBaht.toFixed(2))
  p += emv('58', 'TH') + emv('63', '04')
  return p.slice(0, -4) + emv('63', crc16(p.slice(0, -4) + '6304'))
}

// ─────────────────────────────────────────────
//  Fair Satang distribution
// ─────────────────────────────────────────────

function fairSplit(totalSatang: number, ids: string[]) {
  if (!ids.length) return []
  const base = Math.floor(totalSatang / ids.length)
  const rem  = totalSatang % ids.length
  return ids.map((id, i) => ({ memberId: id, amountSatang: base + (i < rem ? 1 : 0) }))
}

// ─────────────────────────────────────────────
//  NLP task parser (regex-based, no external API)
// ─────────────────────────────────────────────

function parseNlpTask(text: string) {
  const clean = text.trim()
  let amountSatang = 0, hasExpense = false
  const amtMatch = clean.match(/(\d+(?:\.\d{1,2})?)\s*(?:บาท|บ\.?|THB)?/i)
  if (amtMatch) { amountSatang = Math.round(parseFloat(amtMatch[1]) * 100); hasExpense = true }
  const splitNames: string[] = []
  const splitMatch = clean.match(/(?:หาร|แชร์)\s+([^\n]+)/)
  if (splitMatch) {
    splitMatch[1].split(/\s+กับ\s+|\s*,\s*|\s+และ\s+|\s+/)
      .map(n => n.trim()).filter(n => n && !['คน','บาท'].includes(n))
      .forEach(n => splitNames.push(n))
  }
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  let title = clean.replace(/(?:หาร|แชร์).*/,'').replace(amtMatch?.[0] ?? '','').trim() || clean.slice(0, 50)
  return { title, dueDate, amountSatang, hasExpense, splitNames }
}

// ─────────────────────────────────────────────
//  DB → API mappers
// ─────────────────────────────────────────────

function toUser(u: Record<string, unknown>) {
  return {
    id: u.id, phone: u.phone, displayName: u.display_name,
    gender: u.gender ?? 'OTHER', avatarUrl: u.avatar_url ?? null,
    themeColor: u.theme_color ?? '#F97316', isVirtual: u.is_virtual ?? false,
    status: u.status, deletedAt: u.deleted_at, createdAt: u.created_at, updatedAt: u.updated_at,
  }
}

function toHouse(h: Record<string, unknown>) {
  return { id: h.id, name: h.name, createdBy: h.created_by, createdAt: h.created_at, updatedAt: h.updated_at }
}

function toMember(m: Record<string, unknown>, user?: Record<string, unknown> | null, alias?: Record<string, unknown> | null) {
  const baseName = (user?.display_name as string) ?? (m.name as string) ?? ''
  const displayName = alias ? `${alias.alias_name} (${baseName})` : baseName
  return {
    id: m.id, houseId: m.house_id, memberType: m.member_type, isVirtual: m.is_virtual,
    gender: m.gender, themeColor: m.theme_color, userId: m.user_id,
    name: baseName, displayName,
    category: m.category ?? '', avatarUrl: m.avatar_url ?? null, role: m.role,
    isPlaceholder: m.is_placeholder, invitedPhone: m.invited_phone,
    isDeleted: m.is_deleted, deletedAt: m.deleted_at,
    perspectiveAlias: (alias?.alias_name as string) ?? null,
    relationshipTag: (alias?.relationship_tag as string) ?? null,
    createdBy: m.created_by, updatedBy: m.updated_by, createdAt: m.created_at, updatedAt: m.updated_at,
  }
}

function toTask(
  t: Record<string, unknown>,
  splits: Record<string, unknown>[] = [],
  subItems: Record<string, unknown>[] = [],
  timeline: Record<string, unknown>[] = [],
  holderName?: string | null,
  createdByName?: string | null,
) {
  return {
    id: t.id, houseId: t.house_id, title: t.title, description: t.description,
    createdBy: t.created_by, createdByName: createdByName ?? null,
    currentHolderId: t.current_holder_id, holderName: holderName ?? null,
    beneficiaryId: t.beneficiary_id ?? null, beneficiaryType: t.beneficiary_type ?? null,
    status: t.status, dueDate: t.due_date, reminderAt: t.reminder_at,
    recurrenceIntervalDays: t.recurrence_interval_days, hasExpense: t.has_expense,
    amountSatang: t.amount_satang, splitType: t.split_type,
    relatedMemberId: t.related_member_id, isDeleted: t.is_deleted, deletedAt: t.deleted_at,
    splits: splits.map(s => ({ id: s.id, taskId: s.task_id, memberId: s.member_id, amountSatang: s.amount_satang, isPaid: s.is_paid, paidAt: s.paid_at })),
    subItems: subItems.map(s => ({ id: s.id, taskId: s.task_id, title: s.title, amountSatang: s.amount_satang })),
    timeline: timeline.map(l => ({ id: l.id, taskId: l.task_id, fromMemberId: l.from_member_id, toMemberId: l.to_member_id, action: l.action, note: l.note, createdAt: l.created_at })),
    createdAt: t.created_at, updatedAt: t.updated_at,
  }
}

// ─────────────────────────────────────────────
//  Auth middleware
// ─────────────────────────────────────────────

async function requireAuth(c: { req: { header: (k: string) => string | undefined }; env: Env }): Promise<string | null> {
  const header = c.req.header('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return null
  return verifyToken(header.slice(7), c.env.JWT_SECRET)
}

function errJson(code: string, message: string) {
  return { success: false as const, error: { code, message } }
}

// ─────────────────────────────────────────────
//  Hono app
// ─────────────────────────────────────────────

const app = new Hono<HonoCtx>()

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health
app.get('/api/v1/health', c =>
  c.json({ status: 'ok', service: 'homie-home-api', ts: new Date().toISOString() })
)

// ═══════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════

app.post('/api/v1/auth/phone-check', async c => {
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const phone = body.phone
  if (!/^0[0-9]{9}$/.test(phone)) return c.json(errJson('VALIDATION_ERROR', 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก'), 400)

  const db = supabase(c.env)
  const { data: user } = await db.from('users').select('id,status,pin_length,failed_attempts').eq('phone', phone).maybeSingle()
  if (!user) return c.json({ success: true, data: { exists: false, isLocked: false, pinLength: 4 } })

  const isLocked = user.status === 'LOCKED' || (user.failed_attempts ?? 0) >= 5
  return c.json({ success: true, data: { exists: true, isLocked, pinLength: user.pin_length ?? 4 } })
})

app.post('/api/v1/auth/login-pin', async c => {
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { phone, pin } = body
  if (!phone || !pin) return c.json(errJson('VALIDATION_ERROR', 'ต้องระบุ phone และ pin'), 400)

  const db = supabase(c.env)
  const { data: user } = await db.from('users').select('*').eq('phone', phone).maybeSingle()
  if (!user) return c.json(errJson('USER_NOT_FOUND', 'ไม่พบบัญชีผู้ใช้'), 404)
  if (user.status === 'LOCKED' || (user.failed_attempts ?? 0) >= 5)
    return c.json(errJson('ACCOUNT_LOCKED', 'บัญชีถูกล็อก กรุณาใช้ Recovery Key'), 403)

  const ok = await verifyPin(pin, user.pin_hash)
  if (!ok) {
    const attempts = (user.failed_attempts ?? 0) + 1
    const updates: Record<string, unknown> = { failed_attempts: attempts, updated_at: new Date().toISOString() }
    if (attempts >= 5) updates.status = 'LOCKED'
    await db.from('users').update(updates).eq('id', user.id)
    const rem = Math.max(0, 5 - attempts)
    return c.json(
      errJson(rem === 0 ? 'ACCOUNT_LOCKED' : 'INVALID_PIN',
        rem === 0 ? 'กรอก PIN ผิดครบ 5 ครั้ง บัญชีถูกล็อก' : `PIN ไม่ถูกต้อง (เหลือโอกาส ${rem} ครั้ง)`),
      401
    )
  }

  await db.from('users').update({ failed_attempts: 0, status: 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', user.id)
  const token = await signToken(user.id, c.env.JWT_SECRET)
  const { pin_hash, failed_attempts, ...safe } = user
  return c.json({ success: true, data: { token, user: toUser(safe) } })
})

app.post('/api/v1/auth/register', async c => {
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { phone, pin, displayName = 'สมาชิกใหม่', gender = 'OTHER', themeColor = '#F97316' } = body
  if (!/^0[0-9]{9}$/.test(phone)) return c.json(errJson('VALIDATION_ERROR', 'เบอร์โทรไม่ถูกต้อง'), 400)
  if (!/^[0-9]{4,6}$/.test(pin)) return c.json(errJson('VALIDATION_ERROR', 'PIN ต้องเป็นตัวเลข 4-6 หลัก'), 400)

  const db = supabase(c.env)
  const { data: existing } = await db.from('users').select('id').eq('phone', phone).maybeSingle()
  if (existing) return c.json(errJson('PHONE_ALREADY_EXISTS', 'เบอร์โทรนี้ลงทะเบียนแล้ว'), 409)

  const pinHash = await hashPin(pin)
  const { data: user, error: insertErr } = await db.from('users').insert({
    phone, pin_hash: pinHash, pin_length: pin.length,
    display_name: displayName, gender, theme_color: themeColor,
    is_virtual: false, failed_attempts: 0, status: 'ACTIVE',
  }).select().maybeSingle()

  if (insertErr || !user) return c.json(errJson('DB_ERROR', insertErr?.message ?? 'เกิดข้อผิดพลาดในการสร้างบัญชี'), 500)

  const token = await signToken(user.id, c.env.JWT_SECRET)
  const { pin_hash, failed_attempts, ...safe } = user
  return c.json({ success: true, data: { token, user: toUser(safe) } }, 201)
})

app.get('/api/v1/auth/me', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)

  const { data: user } = await supabase(c.env).from('users').select('*').eq('id', userId).maybeSingle()
  if (!user) return c.json(errJson('USER_NOT_FOUND', 'ไม่พบผู้ใช้'), 404)
  const { pin_hash, failed_attempts, ...safe } = user
  return c.json({ success: true, data: { user: toUser(safe) } })
})

app.post('/api/v1/auth/recovery-key/create', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { targetUserId, houseId } = body

  const db = supabase(c.env)
  const { data: callerMember } = await db.from('house_members')
    .select('role').eq('house_id', houseId).eq('user_id', userId).eq('is_deleted', false).maybeSingle()
  if (!callerMember || !['OWNER', 'ADMIN'].includes(callerMember.role))
    return c.json(errJson('FORBIDDEN', 'เฉพาะ Owner หรือ Admin เท่านั้น'), 403)

  const rawKey = Math.floor(100_000 + Math.random() * 900_000).toString()
  const keyHash = await hashPin(rawKey)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString()

  await db.from('recovery_keys').insert({ user_id: targetUserId, house_id: houseId, key_hash: keyHash, expires_at: expiresAt, is_used: false })
  return c.json({ success: true, data: { recoveryKey: rawKey, expiresAt } }, 201)
})

app.post('/api/v1/auth/recovery-key/verify', async c => {
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { phone, recoveryKey, newPin } = body
  if (!phone || !recoveryKey || !newPin) return c.json(errJson('VALIDATION_ERROR', 'ต้องระบุข้อมูลครบถ้วน'), 400)

  const db = supabase(c.env)
  const { data: user } = await db.from('users').select('id,status').eq('phone', phone).maybeSingle()
  if (!user) return c.json(errJson('USER_NOT_FOUND', 'ไม่พบบัญชีผู้ใช้'), 404)

  const { data: keys } = await db.from('recovery_keys')
    .select('*').eq('user_id', user.id).eq('is_used', false).gt('expires_at', new Date().toISOString())

  let validKey: Record<string, unknown> | null = null
  for (const k of keys ?? []) {
    if (await verifyPin(recoveryKey, k.key_hash as string)) { validKey = k; break }
  }
  if (!validKey) return c.json(errJson('INVALID_RECOVERY_KEY', 'Recovery Key ไม่ถูกต้องหรือหมดอายุ'), 400)

  const newHash = await hashPin(newPin)
  await Promise.all([
    db.from('recovery_keys').update({ is_used: true }).eq('id', validKey.id),
    db.from('users').update({ pin_hash: newHash, pin_length: newPin.length, status: 'ACTIVE', failed_attempts: 0, updated_at: new Date().toISOString() }).eq('id', user.id),
  ])

  const { data: updated } = await db.from('users').select('*').eq('id', user.id).maybeSingle()
  const token = await signToken(user.id, c.env.JWT_SECRET)
  const { pin_hash, failed_attempts, ...safe } = updated!
  return c.json({ success: true, data: { token, user: toUser(safe) } })
})

app.post('/api/v1/auth/account-deletion', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const deletedAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000).toISOString()
  await supabase(c.env).from('users').update({ status: 'PENDING_DELETION', deleted_at: deletedAt, updated_at: new Date().toISOString() }).eq('id', userId)
  return c.json({ success: true, data: { message: 'ส่งคำขอลบบัญชีสำเร็จ บัญชีจะถูกลบใน 30 วัน', deletedAt } })
})

// ═══════════════════════════════════════
//  HOUSES
// ═══════════════════════════════════════

app.get('/api/v1/houses', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)

  const db = supabase(c.env)
  const { data: memberships } = await db.from('house_members').select('house_id').eq('user_id', userId).eq('is_deleted', false)
  const houseIds = (memberships ?? []).map(m => m.house_id)
  if (!houseIds.length) return c.json({ success: true, data: { houses: [] } })

  const { data: houses } = await db.from('houses').select('*').in('id', houseIds)
  return c.json({ success: true, data: { houses: (houses ?? []).map(toHouse) } })
})

app.post('/api/v1/houses', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const name = body.name?.trim()
  if (!name) return c.json(errJson('VALIDATION_ERROR', 'ต้องระบุชื่อบ้าน'), 400)

  const db = supabase(c.env)
  const { data: house, error: hErr } = await db.from('houses').insert({ name, created_by: userId }).select().maybeSingle()
  if (hErr || !house) return c.json(errJson('DB_ERROR', hErr?.message ?? 'เกิดข้อผิดพลาด'), 500)

  const { data: user } = await db.from('users').select('display_name,gender,theme_color').eq('id', userId).maybeSingle()
  await db.from('house_members').insert({
    house_id: house.id, user_id: userId, name: user?.display_name ?? 'เจ้าของบ้าน',
    role: 'OWNER', member_type: 'PERSON', is_virtual: false,
    gender: user?.gender ?? 'OTHER', theme_color: user?.theme_color ?? '#F97316',
    created_by: userId, updated_by: userId,
  })

  return c.json({ success: true, data: { house: toHouse(house) } }, 201)
})

// ─── House Members ───────────────────────────

app.get('/api/v1/houses/:houseId/members', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()

  const db = supabase(c.env)
  const { data: members } = await db.from('house_members').select('*').eq('house_id', houseId).eq('is_deleted', false)
  const userIds = (members ?? []).filter(m => m.user_id).map(m => m.user_id as string)

  const [{ data: users }, { data: aliases }] = await Promise.all([
    userIds.length ? db.from('users').select('id,display_name,avatar_url,theme_color,gender').in('id', userIds) : Promise.resolve({ data: [] }),
    userIds.length ? db.from('perspective_aliases').select('*').eq('viewer_user_id', userId).in('target_user_id', userIds) : Promise.resolve({ data: [] }),
  ])

  const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]))
  const aliasMap = Object.fromEntries((aliases ?? []).map(a => [a.target_user_id, a]))

  return c.json({
    success: true,
    data: { members: (members ?? []).map(m => toMember(m, m.user_id ? userMap[m.user_id] : null, m.user_id ? aliasMap[m.user_id] : null)) }
  })
})

app.post('/api/v1/houses/:houseId/members/virtual', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { name, gender = 'OTHER', themeColor = '#10B981', category } = body
  if (!name?.trim()) return c.json(errJson('VALIDATION_ERROR', 'ต้องระบุชื่อสมาชิก'), 400)

  const { data: member, error } = await supabase(c.env).from('house_members').insert({
    house_id: houseId, name: name.trim(), member_type: 'PERSON', is_virtual: true,
    gender, theme_color: themeColor, category: category ?? null,
    role: 'MEMBER', created_by: userId, updated_by: userId,
  }).select().maybeSingle()
  if (error || !member) return c.json(errJson('DB_ERROR', error?.message ?? 'เกิดข้อผิดพลาด'), 500)
  return c.json({ success: true, data: { member: toMember(member) } }, 201)
})

app.post('/api/v1/houses/:houseId/members/entity', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const { memberType, name, category, avatarUrl, themeColor } = body as Record<string, string>
  if (!name?.trim() || !['PET', 'ASSET'].includes(memberType))
    return c.json(errJson('VALIDATION_ERROR', 'memberType ต้องเป็น PET หรือ ASSET และต้องระบุชื่อ'), 400)

  const defaultColor = memberType === 'PET' ? '#F59E0B' : '#6366F1'
  const { data: member, error } = await supabase(c.env).from('house_members').insert({
    house_id: houseId, name: name.trim(), member_type: memberType, is_virtual: true,
    gender: 'OTHER', theme_color: themeColor ?? defaultColor,
    category: category ?? null, avatar_url: avatarUrl ?? null,
    role: 'MEMBER', created_by: userId, updated_by: userId,
  }).select().maybeSingle()
  if (error || !member) return c.json(errJson('DB_ERROR', error?.message ?? 'เกิดข้อผิดพลาด'), 500)
  return c.json({ success: true, data: { member: toMember(member) } }, 201)
})

app.post('/api/v1/houses/:houseId/members/invite', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { phone, role = 'MEMBER' } = body
  if (!/^0[0-9]{9}$/.test(phone)) return c.json(errJson('VALIDATION_ERROR', 'เบอร์โทรไม่ถูกต้อง'), 400)

  const db = supabase(c.env)
  const { data: invitee } = await db.from('users').select('id,display_name').eq('phone', phone).maybeSingle()
  const safeRole = ['OWNER', 'ADMIN', 'MEMBER'].includes(role) ? role : 'MEMBER'

  const { data: member, error } = await db.from('house_members').insert({
    house_id: houseId, name: invitee?.display_name ?? phone,
    user_id: invitee?.id ?? null, invited_phone: phone,
    member_type: 'PERSON', is_virtual: false, gender: 'OTHER', theme_color: '#6366F1',
    role: safeRole, created_by: userId, updated_by: userId,
  }).select().maybeSingle()
  if (error || !member) return c.json(errJson('DB_ERROR', error?.message ?? 'เกิดข้อผิดพลาด'), 500)
  return c.json({ success: true, data: { member: toMember(member, invitee) } }, 201)
})

app.patch('/api/v1/houses/:houseId/members/:memberId/alias', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { memberId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { aliasName, relationshipTag = '' } = body

  const { data: member } = await supabase(c.env).from('house_members').select('user_id').eq('id', memberId).maybeSingle()
  if (!member?.user_id) return c.json(errJson('NOT_FOUND', 'ไม่พบสมาชิกหรือสมาชิกไม่มีบัญชีผู้ใช้'), 404)

  await supabase(c.env).from('perspective_aliases').upsert({
    viewer_user_id: userId, target_user_id: member.user_id,
    alias_name: aliasName, relationship_tag: relationshipTag, updated_at: new Date().toISOString(),
  }, { onConflict: 'viewer_user_id,target_user_id' })

  return c.json({ success: true, data: { message: 'บันทึก Alias เรียบร้อย' } })
})

// ═══════════════════════════════════════
//  TASKS
// ═══════════════════════════════════════

app.get('/api/v1/houses/:houseId/tasks', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()
  const { status, holderId } = c.req.query()

  const db = supabase(c.env)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = db.from('tasks').select('*').eq('house_id', houseId).eq('is_deleted', false) as any
  if (status) q = q.eq('status', status)
  if (holderId) q = q.eq('current_holder_id', holderId)
  const { data: tasks } = await q.order('due_date', { ascending: true })
  return c.json({ success: true, data: { tasks: (tasks ?? []).map((t: Record<string, unknown>) => toTask(t)) } })
})

app.post('/api/v1/houses/:houseId/tasks', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const {
    title, description, holderId, dueDate, reminderAt, recurrenceIntervalDays,
    hasExpense = false, amountSatang = 0, splitType = 'EQUAL',
    splitMembers = [], subItems = [], relatedMemberId, beneficiaryId, beneficiaryType
  } = body as Record<string, unknown>

  if (!title || !holderId || !dueDate) return c.json(errJson('VALIDATION_ERROR', 'ต้องระบุ title, holderId, dueDate'), 400)

  const db = supabase(c.env)
  const { data: task, error: tErr } = await db.from('tasks').insert({
    house_id: houseId, title: (title as string).trim(), description: description ?? null,
    created_by: userId, current_holder_id: holderId, due_date: dueDate,
    reminder_at: reminderAt ?? null, recurrence_interval_days: recurrenceIntervalDays ?? null,
    has_expense: hasExpense, amount_satang: amountSatang, split_type: splitType,
    related_member_id: relatedMemberId ?? null,
    beneficiary_id: beneficiaryId ?? null, beneficiary_type: beneficiaryType ?? null,
    status: 'PENDING',
  }).select().maybeSingle()
  if (tErr || !task) return c.json(errJson('DB_ERROR', tErr?.message ?? 'เกิดข้อผิดพลาด'), 500)

  // Splits
  let createdSplits: Record<string, unknown>[] = []
  const members = splitMembers as Array<{ memberId: string; amountSatang?: number }>
  if (hasExpense && members.length) {
    const items = splitType === 'EQUAL'
      ? fairSplit(amountSatang as number, members.map(m => m.memberId))
      : members.map(m => ({ memberId: m.memberId, amountSatang: m.amountSatang ?? 0 }))
    const { data } = await db.from('task_split_items').insert(items.map(i => ({ task_id: task.id, member_id: i.memberId, amount_satang: i.amountSatang }))).select()
    createdSplits = data ?? []
  }

  // Sub-items
  let createdSubs: Record<string, unknown>[] = []
  const subs = subItems as Array<{ title: string; amountSatang?: number }>
  if (subs.length) {
    const { data } = await db.from('task_sub_items').insert(subs.map(s => ({ task_id: task.id, title: s.title, amount_satang: s.amountSatang ?? 0 }))).select()
    createdSubs = data ?? []
  }

  const [{ data: holder }, { data: creator }] = await Promise.all([
    db.from('house_members').select('name').eq('id', holderId as string).maybeSingle(),
    db.from('users').select('display_name').eq('id', userId).maybeSingle(),
  ])

  return c.json({ success: true, data: { task: toTask(task, createdSplits, createdSubs, [], holder?.name, creator?.display_name) } }, 201)
})

app.get('/api/v1/houses/:houseId/tasks/:taskId', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { taskId } = c.req.param()

  const db = supabase(c.env)
  const [{ data: task }, { data: splits }, { data: subs }, { data: timeline }] = await Promise.all([
    db.from('tasks').select('*').eq('id', taskId).maybeSingle(),
    db.from('task_split_items').select('*').eq('task_id', taskId),
    db.from('task_sub_items').select('*').eq('task_id', taskId),
    db.from('handover_logs').select('*').eq('task_id', taskId).order('created_at'),
  ])
  if (!task) return c.json(errJson('NOT_FOUND', 'ไม่พบงาน'), 404)

  const [{ data: holder }, { data: creator }] = await Promise.all([
    db.from('house_members').select('name').eq('id', task.current_holder_id).maybeSingle(),
    db.from('users').select('display_name').eq('id', task.created_by).maybeSingle(),
  ])

  return c.json({ success: true, data: { task: toTask(task, splits ?? [], subs ?? [], timeline ?? [], holder?.name, creator?.display_name) } })
})

app.patch('/api/v1/houses/:houseId/tasks/:taskId/title', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { taskId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const title = body.title?.trim()
  if (!title) return c.json(errJson('VALIDATION_ERROR', 'ต้องระบุหัวข้อใหม่'), 400)

  const db = supabase(c.env)
  const { data: existing } = await db.from('tasks').select('created_by').eq('id', taskId).maybeSingle()
  if (!existing) return c.json(errJson('NOT_FOUND', 'ไม่พบงาน'), 404)
  if (existing.created_by !== userId) return c.json(errJson('FORBIDDEN', 'เฉพาะผู้สร้างเท่านั้นที่แก้หัวข้อได้'), 403)

  const { data: updated } = await db.from('tasks').update({ title, updated_at: new Date().toISOString() }).eq('id', taskId).select().maybeSingle()
  return c.json({ success: true, data: { task: toTask(updated!) } })
})

app.post('/api/v1/houses/:houseId/tasks/:taskId/handover', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { taskId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { action, toMemberId, note } = body
  if (!['RETURN', 'FORWARD', 'COMPLETE'].includes(action) || !toMemberId)
    return c.json(errJson('VALIDATION_ERROR', 'action ต้องเป็น RETURN/FORWARD/COMPLETE และต้องระบุ toMemberId'), 400)

  const db = supabase(c.env)
  const { data: task } = await db.from('tasks').select('*').eq('id', taskId).maybeSingle()
  if (!task) return c.json(errJson('NOT_FOUND', 'ไม่พบงาน'), 404)

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (action === 'COMPLETE') { updates.status = 'COMPLETED' }
  else { updates.current_holder_id = toMemberId; updates.status = 'IN_PROGRESS' }

  const [{ data: updated }, { data: log }] = await Promise.all([
    db.from('tasks').update(updates).eq('id', taskId).select().maybeSingle(),
    db.from('handover_logs').insert({ task_id: taskId, from_member_id: task.current_holder_id, to_member_id: toMemberId, action, note: note ?? null }).select().maybeSingle(),
  ])

  return c.json({ success: true, data: { task: toTask(updated!), log } })
})

app.delete('/api/v1/houses/:houseId/tasks/:taskId', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { taskId } = c.req.param()
  await supabase(c.env).from('tasks').update({ is_deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', taskId)
  return c.json({ success: true, data: { message: 'ลบงานเรียบร้อย' } })
})

// ═══════════════════════════════════════
//  FINANCE
// ═══════════════════════════════════════

app.get('/api/v1/houses/:houseId/finance/balances', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()

  const db = supabase(c.env)
  const [{ data: members }, { data: tasks }] = await Promise.all([
    db.from('house_members').select('*').eq('house_id', houseId).eq('is_deleted', false),
    db.from('tasks').select('id,created_by').eq('house_id', houseId).eq('is_deleted', false),
  ])
  const taskIds = (tasks ?? []).map(t => t.id)
  const { data: splits } = taskIds.length
    ? await db.from('task_split_items').select('*').in('task_id', taskIds).eq('is_paid', false)
    : { data: [] }

  const balanceMap = new Map<string, number>()
  for (const m of members ?? []) balanceMap.set(m.id, 0)

  for (const split of splits ?? []) {
    const task = (tasks ?? []).find(t => t.id === split.task_id)
    if (!task) continue
    const creatorMember = (members ?? []).find(m => m.user_id === task.created_by)
    if (!creatorMember || creatorMember.id === split.member_id) continue
    balanceMap.set(split.member_id, (balanceMap.get(split.member_id) ?? 0) + split.amount_satang)
    balanceMap.set(creatorMember.id, (balanceMap.get(creatorMember.id) ?? 0) - split.amount_satang)
  }

  const balances = (members ?? []).map(m => {
    const net = balanceMap.get(m.id) ?? 0
    const status = net > 0 ? 'OWES' : net < 0 ? 'OWED' : 'SETTLED'
    return { memberId: m.id, name: m.name, isVirtual: m.is_virtual, netSatang: Math.abs(net), status }
  })
  return c.json({ success: true, data: { balances } })
})

app.post('/api/v1/houses/:houseId/finance/settle-virtual', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { virtualMemberId } = body

  const db = supabase(c.env)
  const { data: member } = await db.from('house_members').select('id,house_id').eq('id', virtualMemberId).maybeSingle()
  if (!member || member.house_id !== houseId) return c.json(errJson('NOT_FOUND', 'ไม่พบสมาชิก'), 404)

  await db.from('task_split_items').update({ is_paid: true, paid_at: new Date().toISOString() }).eq('member_id', virtualMemberId).eq('is_paid', false)
  return c.json({ success: true, data: { message: 'บันทึกการรับเงินสำเร็จ ยอดหนี้เป็น 0' } })
})

app.post('/api/v1/houses/:houseId/finance/promptpay-qr', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
  const { toMemberId, amountSatang } = body as { toMemberId: string; amountSatang: number }

  const db = supabase(c.env)
  const { data: member } = await db.from('house_members').select('invited_phone,user_id').eq('id', toMemberId).maybeSingle()
  let phone = member?.invited_phone as string | undefined
  if (!phone && member?.user_id) {
    const { data: user } = await db.from('users').select('phone').eq('id', member.user_id).maybeSingle()
    phone = user?.phone
  }
  if (!phone) phone = '0000000000'

  const amountBaht = amountSatang ? amountSatang / 100 : 0
  const qrPayload = promptPayQR(phone, amountBaht)
  return c.json({ success: true, data: { qrPayload, amountBaht, phone } })
})

// ═══════════════════════════════════════
//  AI
// ═══════════════════════════════════════

app.post('/api/v1/ai/parse-task', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  if (!body.text) return c.json(errJson('VALIDATION_ERROR', 'ต้องระบุ text'), 400)
  return c.json({ success: true, data: parseNlpTask(body.text) })
})

app.post('/api/v1/ai/receipt-ocr', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  return c.json({ success: true, data: { totalSatang: 0, merchantName: '', subItems: [] } })
})

// ═══════════════════════════════════════
//  VESSEL (Kick / Claim / Transfer)
// ═══════════════════════════════════════

app.post('/api/v1/houses/:houseId/members/:memberId/kick', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId, memberId } = c.req.param()

  const db = supabase(c.env)
  const { data: callerMember } = await db.from('house_members').select('role').eq('house_id', houseId).eq('user_id', userId).eq('is_deleted', false).maybeSingle()
  if (!callerMember || !['OWNER', 'ADMIN'].includes(callerMember.role))
    return c.json(errJson('FORBIDDEN', 'เฉพาะ Owner หรือ Admin เท่านั้น'), 403)

  const { data: target } = await db.from('house_members').select('*').eq('id', memberId).eq('house_id', houseId).maybeSingle()
  if (!target) return c.json(errJson('NOT_FOUND', 'ไม่พบสมาชิก'), 404)
  if (target.role === 'OWNER') return c.json(errJson('FORBIDDEN', 'ไม่สามารถนำหัวหน้าบ้านออกได้'), 400)

  let snapshotName = target.name as string
  if (target.user_id) {
    const { data: u } = await db.from('users').select('display_name').eq('id', target.user_id).maybeSingle()
    if (u) snapshotName = u.display_name
  }

  await db.from('house_members').update({ is_placeholder: true, user_id: null, avatar_url: null, invited_phone: null, name: snapshotName, updated_at: new Date().toISOString(), updated_by: userId }).eq('id', memberId)
  return c.json({ success: true, data: { message: 'นำสมาชิกออกและแปลงเป็น Vessel สำเร็จ' } })
})

app.post('/api/v1/houses/:houseId/members/:memberId/claim-vessel', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId, memberId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { phone, debtChoice } = body

  const db = supabase(c.env)
  const { data: vessel } = await db.from('house_members').select('*').eq('id', memberId).eq('house_id', houseId).eq('is_placeholder', true).maybeSingle()
  if (!vessel) return c.json(errJson('NOT_FOUND', 'ไม่พบ Vessel'), 404)

  const { data: claimant } = await db.from('users').select('id').eq('phone', phone).maybeSingle()
  const updates: Record<string, unknown> = { invited_phone: phone, updated_at: new Date().toISOString() }
  if (claimant) { updates.user_id = claimant.id; updates.is_placeholder = false }

  await db.from('house_members').update(updates).eq('id', memberId)
  if (debtChoice === 'WAIVE') {
    await db.from('task_split_items').update({ is_paid: true, paid_at: new Date().toISOString() }).eq('member_id', memberId).eq('is_paid', false)
  }
  return c.json({ success: true, data: { message: 'ส่งคำเชิญสิงร่างสำเร็จ' } })
})

app.post('/api/v1/houses/:houseId/transfer-ownership', async c => {
  const userId = await requireAuth(c as Parameters<typeof requireAuth>[0])
  if (!userId) return c.json(errJson('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ'), 401)
  const { houseId } = c.req.param()
  const body = await c.req.json().catch(() => ({} as Record<string, string>))
  const { targetUserId } = body

  const db = supabase(c.env)
  const [{ data: callerMember }, { data: targetMember }] = await Promise.all([
    db.from('house_members').select('id,role').eq('house_id', houseId).eq('user_id', userId).eq('is_deleted', false).maybeSingle(),
    db.from('house_members').select('id').eq('house_id', houseId).eq('user_id', targetUserId).eq('is_deleted', false).maybeSingle(),
  ])
  if (!callerMember || callerMember.role !== 'OWNER') return c.json(errJson('FORBIDDEN', 'เฉพาะ Owner เท่านั้น'), 403)
  if (!targetMember) return c.json(errJson('NOT_FOUND', 'ไม่พบสมาชิกเป้าหมาย'), 404)

  await Promise.all([
    db.from('house_members').update({ role: 'MEMBER', updated_at: new Date().toISOString() }).eq('id', callerMember.id),
    db.from('house_members').update({ role: 'OWNER', updated_at: new Date().toISOString() }).eq('id', targetMember.id),
  ])
  return c.json({ success: true, data: { message: 'โอนสิทธิ์ความเป็นเจ้าของบ้านสำเร็จ' } })
})

// ─────────────────────────────────────────────
//  Export for Cloudflare Pages
// ─────────────────────────────────────────────

export const onRequest = handle(app)
