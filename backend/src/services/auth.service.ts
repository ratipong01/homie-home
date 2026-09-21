import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { UserRecord, RecoveryKeyRecord } from '../types/database.js';
import type { RegisterInput } from '../schemas/auth.schema.js';
import { MemoryStore } from '../types/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'homie-home-super-secret-key-change-in-prod';
const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;

export class AuthService {
  static async checkPhone(phone: string): Promise<{ exists: boolean; isLocked: boolean; pinLength?: number }> {
    const userId = MemoryStore.phoneIndex.get(phone);
    if (!userId) {
      // If user 0855979291 is checked even before first registration
      const defaultLen = phone === '0855979291' ? 4 : 6;
      return { exists: false, isLocked: false, pinLength: defaultLen };
    }
    const user = MemoryStore.users.get(userId);
    if (!user) {
      const defaultLen = phone === '0855979291' ? 4 : 6;
      return { exists: false, isLocked: false, pinLength: defaultLen };
    }
    const pinLength = user.pin_length || (user.phone === '0855979291' ? 4 : 6);
    return {
      exists: true,
      isLocked: user.status === 'LOCKED' || user.failed_attempts >= MAX_FAILED_ATTEMPTS,
      pinLength,
    };
  }

  static async register(input: RegisterInput): Promise<{ token: string; user: Omit<UserRecord, 'pin_hash'> }> {
    if (MemoryStore.phoneIndex.has(input.phone)) {
      const err = new Error('เบอร์โทรนี้ลงทะเบียนแล้ว');
      (err as any).statusCode = 409;
      (err as any).code = 'PHONE_ALREADY_EXISTS';
      throw err;
    }

    const pinHash = await bcrypt.hash(input.pin, SALT_ROUNDS);
    const userId = randomUUID();
    const now = new Date().toISOString();

    const user: UserRecord = {
      id: userId,
      phone: input.phone,
      pin_hash: pinHash,
      pin_length: input.phone === '0855979291' ? 4 : input.pin.length,
      display_name: input.displayName,
      gender: input.gender,
      avatar_url: null,
      theme_color: input.themeColor,
      is_virtual: false,
      status: 'ACTIVE',
      failed_attempts: 0,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };

    MemoryStore.users.set(userId, user);
    MemoryStore.phoneIndex.set(input.phone, userId);

    const token = this.generateToken(user.id);
    const { pin_hash, ...safeUser } = user;
    return { token, user: safeUser };
  }

  static async loginPin(phone: string, pin: string): Promise<{ token: string; user: Omit<UserRecord, 'pin_hash'> }> {
    const userId = MemoryStore.phoneIndex.get(phone);
    if (!userId) {
      const err = new Error('ไม่พบบัญชีผู้ใช้');
      (err as any).statusCode = 404;
      (err as any).code = 'USER_NOT_FOUND';
      throw err;
    }

    const user = MemoryStore.users.get(userId)!;
    if (user.status === 'LOCKED' || user.failed_attempts >= MAX_FAILED_ATTEMPTS) {
      const err = new Error('บัญชีถูกล็อก กรุณาใช้ Recovery Key');
      (err as any).statusCode = 403;
      (err as any).code = 'ACCOUNT_LOCKED';
      throw err;
    }

    const isMatch = await bcrypt.compare(pin, user.pin_hash || '');
    if (!isMatch) {
      user.failed_attempts += 1;
      if (user.failed_attempts >= MAX_FAILED_ATTEMPTS) {
        user.status = 'LOCKED';
      }
      user.updated_at = new Date().toISOString();

      const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - user.failed_attempts);
      const err = new Error(
        remaining === 0
          ? 'กรอก PIN ผิดครบ 5 ครั้ง บัญชีถูกล็อก'
          : `PIN ไม่ถูกต้อง (เหลือโอกาส ${remaining} ครั้ง)`
      );
      (err as any).statusCode = 401;
      (err as any).code = remaining === 0 ? 'ACCOUNT_LOCKED' : 'INVALID_PIN';
      throw err;
    }

    user.failed_attempts = 0;
    user.status = 'ACTIVE';
    user.updated_at = new Date().toISOString();

    const token = this.generateToken(user.id);
    const { pin_hash, ...safeUser } = user;
    return { token, user: safeUser };
  }

  static async createRecoveryKey(targetUserId: string, houseId: string): Promise<{ recoveryKey: string; expiresAt: string }> {
    const user = MemoryStore.users.get(targetUserId);
    if (!user) {
      const err = new Error('ไม่พบบัญชีผู้ใช้เป้าหมาย');
      (err as any).statusCode = 404;
      (err as any).code = 'USER_NOT_FOUND';
      throw err;
    }

    const rawKey = Math.floor(100000 + Math.random() * 900000).toString();
    const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const recId = randomUUID();
    MemoryStore.recoveryKeys.set(recId, {
      id: recId,
      user_id: targetUserId,
      house_id: houseId,
      key_hash: keyHash,
      expires_at: expiresAt,
      is_used: false,
      created_at: new Date().toISOString(),
    });

    return { recoveryKey: rawKey, expiresAt };
  }

  static async verifyRecoveryKey(
    phone: string,
    recoveryKey: string,
    newPin: string
  ): Promise<{ token: string; user: Omit<UserRecord, 'pin_hash'> }> {
    const userId = MemoryStore.phoneIndex.get(phone);
    if (!userId) {
      const err = new Error('ไม่พบบัญชีผู้ใช้');
      (err as any).statusCode = 404;
      (err as any).code = 'USER_NOT_FOUND';
      throw err;
    }

    const user = MemoryStore.users.get(userId)!;
    
    const validKeyRecord = Array.from(MemoryStore.recoveryKeys.values()).find(
      (k) => k.user_id === userId && !k.is_used && new Date(k.expires_at) > new Date()
    );

    if (!validKeyRecord) {
      const err = new Error('Recovery Key ไม่ถูกต้องหรือหมดอายุแล้ว');
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_RECOVERY_KEY';
      throw err;
    }

    const isMatch = await bcrypt.compare(recoveryKey, validKeyRecord.key_hash);
    if (!isMatch) {
      const err = new Error('Recovery Key ไม่ถูกต้อง');
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_RECOVERY_KEY';
      throw err;
    }

    validKeyRecord.is_used = true;

    user.pin_hash = await bcrypt.hash(newPin, SALT_ROUNDS);
    user.status = 'ACTIVE';
    user.failed_attempts = 0;
    user.updated_at = new Date().toISOString();

    const token = this.generateToken(user.id);
    const { pin_hash, ...safeUser } = user;
    return { token, user: safeUser };
  }

  static generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
  }

  static verifyToken(token: string): { sub: string } {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  }

  static getUserById(userId: string): Omit<UserRecord, 'pin_hash'> | null {
    const user = MemoryStore.users.get(userId);
    if (!user) return null;
    const { pin_hash, ...safeUser } = user;
    return safeUser;
  }
}
