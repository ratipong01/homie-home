import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'ต้องระบุชื่องาน').max(200, 'ชื่องานยาวเกินไป'),
  description: z.string().optional().nullable(),
  holderId: z.string().uuid('ต้องระบุผู้ถือครองงาน'),
  dueDate: z.string().datetime(),
  reminderAt: z.string().datetime().optional().nullable(),
  recurrenceIntervalDays: z.number().int().positive().optional().nullable(),
  hasExpense: z.boolean().default(false),
  amountSatang: z.number().int().nonnegative().default(0),
  splitType: z.enum(['EQUAL', 'CUSTOM']).default('EQUAL'),
  splitMembers: z.array(
    z.object({
      memberId: z.string().uuid(),
      amountSatang: z.number().int().nonnegative().optional(),
    })
  ).default([]),
  subItems: z.array(
    z.object({
      title: z.string().min(1),
      amountSatang: z.number().int().nonnegative().default(0),
    })
  ).default([]),
  relatedMemberId: z.string().uuid().optional().nullable(),
  beneficiaryId: z.string().uuid().optional().nullable(),
  beneficiaryType: z.enum(['PERSON', 'PET', 'ASSET', 'HOUSE_COMMON']).optional().nullable(),
});

export const UpdateTaskTitleSchema = z.object({
  title: z.string().min(1, 'ต้องระบุชื่องาน').max(200),
});

export const HandoverTaskSchema = z.object({
  action: z.enum(['RETURN', 'FORWARD', 'COMPLETE']),
  toMemberId: z.string().uuid(),
  note: z.string().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskTitleInput = z.infer<typeof UpdateTaskTitleSchema>;
export type HandoverTaskInput = z.infer<typeof HandoverTaskSchema>;
