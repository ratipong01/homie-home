import { randomUUID } from 'crypto';
import type {
  TaskRecord,
  TaskSubItemRecord,
  TaskSplitItemRecord,
  HandoverLogRecord,
} from '../types/database.js';
import { MemoryStore } from '../types/store.js';
import { distributeFairSatang } from '../utils/fairSatang.js';
import type {
  CreateTaskInput,
  UpdateTaskTitleInput,
  HandoverTaskInput,
} from '../schemas/task.schema.js';

export interface EnrichedTaskDto {
  id: string;
  houseId: string;
  title: string;
  description: string | null;
  createdBy: string;
  createdByName?: string;
  currentHolderId: string;
  holderName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  reminderAt: string | null;
  recurrenceIntervalDays: number | null;
  hasExpense: boolean;
  amountSatang: number;
  splitType: 'EQUAL' | 'CUSTOM';
  relatedMemberId: string | null;
  beneficiaryId?: string | null;
  beneficiaryType?: 'PERSON' | 'PET' | 'ASSET' | 'HOUSE_COMMON' | null;
  beneficiaryName?: string;
  isDeleted: boolean;
  splits: {
    id: string;
    taskId: string;
    memberId: string;
    amountSatang: number;
    isPaid: boolean;
    paidAt: string | null;
  }[];
  subItems: {
    id: string;
    taskId: string;
    title: string;
    amountSatang: number;
  }[];
  timeline: {
    id: string;
    taskId: string;
    fromMemberId: string;
    toMemberId: string;
    action: 'RETURN' | 'FORWARD' | 'COMPLETE';
    note: string | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export class TaskService {
  static async listHouseTasks(
    houseId: string,
    filters?: { status?: string; holderId?: string }
  ): Promise<any[]> {
    let tasks = Array.from(MemoryStore.tasks.values()).filter(
      (t) => t.house_id === houseId && !t.is_deleted
    );

    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters?.holderId) {
      tasks = tasks.filter((t) => t.current_holder_id === filters.holderId);
    }

    const sorted = tasks.sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

    return sorted.map((t) => ({
      id: t.id,
      houseId: t.house_id,
      title: t.title,
      description: t.description,
      createdBy: t.created_by,
      currentHolderId: t.current_holder_id,
      status: t.status,
      dueDate: t.due_date,
      reminderAt: t.reminder_at,
      recurrenceIntervalDays: t.recurrence_interval_days,
      hasExpense: t.has_expense,
      amountSatang: t.amount_satang,
      splitType: t.split_type,
      relatedMemberId: t.related_member_id,
      beneficiaryId: t.beneficiary_id,
      beneficiaryType: t.beneficiary_type,
      isDeleted: t.is_deleted,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  }

  static async getTaskDetail(taskId: string): Promise<EnrichedTaskDto> {
    const task = MemoryStore.tasks.get(taskId);
    if (!task || task.is_deleted) {
      const err = new Error('ไม่พบงานที่ระบุ');
      (err as any).statusCode = 404;
      (err as any).code = 'TASK_NOT_FOUND';
      throw err;
    }

    const splits = Array.from(MemoryStore.taskSplitItems.values())
      .filter((s) => s.task_id === taskId)
      .map((s) => ({
        id: s.id,
        taskId: s.task_id,
        memberId: s.member_id,
        amountSatang: s.amount_satang,
        isPaid: s.is_paid,
        paidAt: s.paid_at,
      }));

    const subItems = Array.from(MemoryStore.taskSubItems.values())
      .filter((s) => s.task_id === taskId)
      .map((s) => ({
        id: s.id,
        taskId: s.task_id,
        title: s.title,
        amountSatang: s.amount_satang,
      }));

    const timeline = Array.from(MemoryStore.handoverLogs.values())
      .filter((l) => l.task_id === taskId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((l) => ({
        id: l.id,
        taskId: l.task_id,
        fromMemberId: l.from_member_id,
        toMemberId: l.to_member_id,
        action: l.action,
        note: l.note,
        createdAt: l.created_at,
      }));

    const holder = MemoryStore.houseMembers.get(task.current_holder_id);
    const creator = MemoryStore.users.get(task.created_by);

    return {
      id: task.id,
      houseId: task.house_id,
      title: task.title,
      description: task.description,
      createdBy: task.created_by,
      createdByName: creator?.display_name || 'ผู้สร้าง',
      currentHolderId: task.current_holder_id,
      holderName: holder?.name || 'สมาชิก',
      status: task.status,
      dueDate: task.due_date,
      reminderAt: task.reminder_at,
      recurrenceIntervalDays: task.recurrence_interval_days,
      hasExpense: task.has_expense,
      amountSatang: task.amount_satang,
      splitType: task.split_type,
      relatedMemberId: task.related_member_id,
      beneficiaryId: task.beneficiary_id,
      beneficiaryType: task.beneficiary_type,
      isDeleted: task.is_deleted,
      splits,
      subItems,
      timeline,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  }

  static async createTask(
    houseId: string,
    userId: string,
    input: CreateTaskInput
  ): Promise<EnrichedTaskDto> {
    const taskId = randomUUID();
    const now = new Date().toISOString();

    const task: TaskRecord = {
      id: taskId,
      house_id: houseId,
      title: input.title,
      description: input.description || null,
      created_by: userId,
      current_holder_id: input.holderId,
      beneficiary_id: input.beneficiaryId || null,
      beneficiary_type: input.beneficiaryType || null,
      status: 'PENDING',
      due_date: input.dueDate,
      reminder_at: input.reminderAt || null,
      recurrence_interval_days: input.recurrenceIntervalDays || null,
      has_expense: input.hasExpense,
      amount_satang: input.hasExpense ? input.amountSatang : 0,
      split_type: input.splitType,
      related_member_id: input.relatedMemberId || null,
      is_deleted: false,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };
    MemoryStore.tasks.set(taskId, task);

    // Initial handover log
    const creatorMember = Array.from(MemoryStore.houseMembers.values()).find(
      (m) => m.house_id === houseId && m.user_id === userId
    );
    const fromMemberId = creatorMember?.id || input.holderId;
    const initialLogId = randomUUID();
    const initialLog: HandoverLogRecord = {
      id: initialLogId,
      task_id: taskId,
      from_member_id: fromMemberId,
      to_member_id: input.holderId,
      action: 'FORWARD',
      note: 'สร้างงานและมอบหมาย',
      created_at: now,
    };
    MemoryStore.handoverLogs.set(initialLogId, initialLog);

    // Sub-items
    const subItemsDto = [];
    if (input.subItems && input.subItems.length > 0) {
      for (const item of input.subItems) {
        const subId = randomUUID();
        const subItemRecord: TaskSubItemRecord = {
          id: subId,
          task_id: taskId,
          title: item.title,
          amount_satang: item.amountSatang,
          created_at: now,
          updated_at: now,
        };
        MemoryStore.taskSubItems.set(subId, subItemRecord);
        subItemsDto.push({
          id: subId,
          taskId,
          title: item.title,
          amountSatang: item.amountSatang,
        });
      }
    }

    // Expense splits
    const splitsDto = [];
    if (input.hasExpense && input.splitMembers.length > 0) {
      if (input.splitType === 'EQUAL') {
        const memberIds = input.splitMembers.map((m) => m.memberId);
        const fairSplits = distributeFairSatang(input.amountSatang, memberIds);
        for (const fs of fairSplits) {
          const splitId = randomUUID();
          const splitRecord: TaskSplitItemRecord = {
            id: splitId,
            task_id: taskId,
            member_id: fs.memberId,
            amount_satang: fs.amountSatang,
            is_paid: false,
            paid_at: null,
            created_at: now,
            updated_at: now,
          };
          MemoryStore.taskSplitItems.set(splitId, splitRecord);
          splitsDto.push({
            id: splitId,
            taskId,
            memberId: fs.memberId,
            amountSatang: fs.amountSatang,
            isPaid: false,
            paidAt: null,
          });
        }
      } else {
        for (const item of input.splitMembers) {
          const splitId = randomUUID();
          const splitRecord: TaskSplitItemRecord = {
            id: splitId,
            task_id: taskId,
            member_id: item.memberId,
            amount_satang: item.amountSatang || 0,
            is_paid: false,
            paid_at: null,
            created_at: now,
            updated_at: now,
          };
          MemoryStore.taskSplitItems.set(splitId, splitRecord);
          splitsDto.push({
            id: splitId,
            taskId,
            memberId: item.memberId,
            amountSatang: item.amountSatang || 0,
            isPaid: false,
            paidAt: null,
          });
        }
      }
    }

    return {
      id: task.id,
      houseId: task.house_id,
      title: task.title,
      description: task.description,
      createdBy: task.created_by,
      currentHolderId: task.current_holder_id,
      status: task.status,
      dueDate: task.due_date,
      reminderAt: task.reminder_at,
      recurrenceIntervalDays: task.recurrence_interval_days,
      hasExpense: task.has_expense,
      amountSatang: task.amount_satang,
      splitType: task.split_type,
      relatedMemberId: task.related_member_id,
      isDeleted: task.is_deleted,
      splits: splitsDto,
      subItems: subItemsDto,
      timeline: [
        {
          id: initialLog.id,
          taskId: initialLog.task_id,
          fromMemberId: initialLog.from_member_id,
          toMemberId: initialLog.to_member_id,
          action: initialLog.action,
          note: initialLog.note,
          createdAt: initialLog.created_at,
        },
      ],
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  }

  static async updateTitle(
    taskId: string,
    userId: string,
    input: UpdateTaskTitleInput
  ): Promise<any> {
    const task = MemoryStore.tasks.get(taskId);
    if (!task || task.is_deleted) {
      const err = new Error('ไม่พบงานที่ระบุ');
      (err as any).statusCode = 404;
      throw err;
    }

    if (task.created_by !== userId) {
      const err = new Error('แก้ไขหัวข้องานได้เฉพาะผู้สร้างงานเท่านั้น');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN_NOT_CREATOR';
      throw err;
    }

    task.title = input.title;
    task.updated_at = new Date().toISOString();
    return this.getTaskDetail(taskId);
  }

  static async handoverTask(
    taskId: string,
    callerUserId: string,
    input: HandoverTaskInput
  ): Promise<{ task: any; log: any }> {
    const task = MemoryStore.tasks.get(taskId);
    if (!task || task.is_deleted) {
      const err = new Error('ไม่พบงานที่ระบุ');
      (err as any).statusCode = 404;
      throw err;
    }

    const now = new Date().toISOString();
    const fromMemberId = task.current_holder_id;
    const toMemberId = input.toMemberId;

    if (input.action === 'COMPLETE') {
      task.status = 'COMPLETED';
    } else {
      task.current_holder_id = toMemberId;
      task.status = 'IN_PROGRESS';
    }
    task.updated_at = now;

    const logId = randomUUID();
    const log: HandoverLogRecord = {
      id: logId,
      task_id: taskId,
      from_member_id: fromMemberId,
      to_member_id: toMemberId,
      action: input.action,
      note: input.note || null,
      created_at: now,
    };
    MemoryStore.handoverLogs.set(logId, log);

    return {
      task: await this.getTaskDetail(taskId),
      log: {
        id: log.id,
        taskId: log.task_id,
        fromMemberId: log.from_member_id,
        toMemberId: log.to_member_id,
        action: log.action,
        note: log.note,
        createdAt: log.created_at,
      },
    };
  }

  static async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = MemoryStore.tasks.get(taskId);
    if (!task || task.is_deleted) {
      const err = new Error('ไม่พบงานที่ระบุ');
      (err as any).statusCode = 404;
      throw err;
    }

    if (task.created_by !== userId) {
      const err = new Error('ลบงานได้เฉพาะผู้สร้างงานเท่านั้น');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN_NOT_CREATOR';
      throw err;
    }

    task.is_deleted = true;
    task.deleted_at = new Date().toISOString();
    task.updated_at = new Date().toISOString();
  }
}
