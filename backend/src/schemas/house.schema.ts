import { z } from 'zod';

export const CreateHouseSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อบ้าน').max(100, 'ชื่อบ้านยาวเกินไป'),
});

export const CreateVirtualMemberSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อสมาชิก').max(100, 'ชื่อยาวเกินไป'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('OTHER'),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#F97316'),
  category: z.string().optional(),
});

export const CreatePetOrAssetSchema = z.object({
  memberType: z.enum(['PET', 'ASSET']),
  name: z.string().min(1, 'ต้องระบุชื่อ').max(100),
  category: z.string().optional(),
  avatarUrl: z.string().optional().nullable(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FB923C'),
});

export const InviteMemberSchema = z.object({
  phone: z.string().regex(/^0[0-9]{9}$/, 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export const SetPerspectiveAliasSchema = z.object({
  aliasName: z.string().min(1, 'ต้องระบุชื่อเรียก').max(100),
  relationshipTag: z.string().max(50).default(''),
});

export const ClaimVesselSchema = z.object({
  phone: z.string().regex(/^0[0-9]{9}$/, 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก'),
  debtChoice: z.enum(['ACCEPT', 'WAIVE']).default('ACCEPT'),
});

export const TransferOwnershipSchema = z.object({
  targetUserId: z.string().uuid(),
});

export type CreateHouseInput = z.infer<typeof CreateHouseSchema>;
export type CreateVirtualMemberInput = z.infer<typeof CreateVirtualMemberSchema>;
export type CreatePetOrAssetInput = z.infer<typeof CreatePetOrAssetSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type SetPerspectiveAliasInput = z.infer<typeof SetPerspectiveAliasSchema>;
export type ClaimVesselInput = z.infer<typeof ClaimVesselSchema>;
export type TransferOwnershipInput = z.infer<typeof TransferOwnershipSchema>;
