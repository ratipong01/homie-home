import { z } from 'zod';

export const PhoneCheckSchema = z.object({
  phone: z.string().regex(/^0[0-9]{9}$/, 'เบอร์โทรต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0'),
});

export const LoginPinSchema = z.object({
  phone: z.string().regex(/^0[0-9]{9}$/, 'เบอร์โทรต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0'),
  pin: z.string().regex(/^[0-9]{4,6}$/, 'PIN ต้องเป็นตัวเลข 4-6 หลัก'),
});

export const RegisterSchema = z.object({
  phone: z.string().regex(/^0[0-9]{9}$/, 'เบอร์โทรต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0'),
  pin: z.string().regex(/^[0-9]{4,6}$/, 'PIN ต้องเป็นตัวเลข 4-6 หลัก'),
  displayName: z.string().min(1, 'ต้องระบุชื่อที่แสดง').max(50, 'ชื่อยาวเกินไป'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('OTHER'),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#F97316'),
});

export const CreateRecoveryKeySchema = z.object({
  targetUserId: z.string().uuid(),
  houseId: z.string().uuid(),
});

export const VerifyRecoveryKeySchema = z.object({
  phone: z.string().regex(/^0[0-9]{9}$/),
  recoveryKey: z.string().min(4).max(6),
  newPin: z.string().regex(/^[0-9]{4,6}$/, 'PIN ต้องเป็นตัวเลข 4-6 หลัก'),
});

export type PhoneCheckInput = z.infer<typeof PhoneCheckSchema>;
export type LoginPinInput = z.infer<typeof LoginPinSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateRecoveryKeyInput = z.infer<typeof CreateRecoveryKeySchema>;
export type VerifyRecoveryKeyInput = z.infer<typeof VerifyRecoveryKeySchema>;
