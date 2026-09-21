import { apiFetch } from './apiClient';
import type { Task, TaskSplitItem, TaskSubItem, HandoverLog } from '../types';

export interface EnrichedTask extends Task {
  holderName?: string;
  createdByName?: string;
  splits: TaskSplitItem[];
  subItems: TaskSubItem[];
  timeline: HandoverLog[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  holderId: string;
  dueDate: string;
  reminderAt?: string | null;
  recurrenceIntervalDays?: number | null;
  hasExpense: boolean;
  amountSatang: number;
  splitType: 'EQUAL' | 'CUSTOM';
  splitMembers: { memberId: string; amountSatang?: number }[];
  subItems?: { title: string; amountSatang: number }[];
  relatedMemberId?: string | null;
}

export interface HandoverPayload {
  action: 'RETURN' | 'FORWARD' | 'COMPLETE';
  toMemberId: string;
  note?: string | null;
}

export const taskApi = {
  listTasks: async (
    houseId: string,
    filters?: { status?: string; holderId?: string }
  ): Promise<{ tasks: Task[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.holderId) params.set('holderId', filters.holderId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<{ tasks: Task[] }>(`/houses/${houseId}/tasks${qs}`);
  },

  getTaskDetail: async (houseId: string, taskId: string): Promise<{ task: EnrichedTask }> => {
    return apiFetch<{ task: EnrichedTask }>(`/houses/${houseId}/tasks/${taskId}`);
  },

  createTask: async (
    houseId: string,
    payload: CreateTaskPayload
  ): Promise<{ task: EnrichedTask }> => {
    return apiFetch<{ task: EnrichedTask }>(`/houses/${houseId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTitle: async (
    houseId: string,
    taskId: string,
    title: string
  ): Promise<{ task: Task }> => {
    return apiFetch<{ task: Task }>(`/houses/${houseId}/tasks/${taskId}/title`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  handoverTask: async (
    houseId: string,
    taskId: string,
    payload: HandoverPayload
  ): Promise<{ task: Task; log: HandoverLog }> => {
    return apiFetch<{ task: Task; log: HandoverLog }>(
      `/houses/${houseId}/tasks/${taskId}/handover`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  deleteTask: async (houseId: string, taskId: string): Promise<void> => {
    await apiFetch(`/houses/${houseId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};
