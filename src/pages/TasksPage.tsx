import React, { useState, useEffect, useCallback } from 'react';
import type { House, Task } from '../types';
import { taskApi, type EnrichedTask } from '../services/taskApi';
import { houseApi, type EnrichedMember } from '../services/houseApi';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { TaskFormSheet } from '../components/tasks/TaskFormSheet';
import { PageHeader } from '../components/common/PageHeader';

interface TasksPageProps {
  activeHouse: House | null;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  activeHouse,
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'MINE' | 'DONE'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!activeHouse) return;
    setIsLoading(true);
    try {
      const [tasksRes, membersRes] = await Promise.all([
        taskApi.listTasks(activeHouse.id),
        houseApi.listMembers(activeHouse.id),
      ]);
      setTasks(tasksRes.tasks);
      setMembers(membersRes.members);
    } catch (_err) {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, [activeHouse]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleOpenDetail = async (taskId: string) => {
    if (!activeHouse) return;
    try {
      const res = await taskApi.getTaskDetail(activeHouse.id, taskId);
      setSelectedTask(res.task);
      setIsDetailOpen(true);
    } catch (_e) {}
  };

  const handleQuickComplete = async (task: Task) => {
    if (!activeHouse) return;
    const currentHolderId = (task as any).current_holder_id || task.currentHolderId;
    await taskApi.handoverTask(activeHouse.id, task.id, {
      action: 'COMPLETE',
      toMemberId: currentHolderId,
    });
    await fetchTasks();
  };

  const handleQuickReturn = async (task: Task) => {
    if (!activeHouse) return;
    const creatorMember = members.find(
      (m) => m.userId === ((task as any).created_by || task.createdBy)
    );
    if (!creatorMember) return;
    await taskApi.handoverTask(activeHouse.id, task.id, {
      action: 'RETURN',
      toMemberId: creatorMember.id,
      note: 'ส่งกลับให้ผู้สร้าง',
    });
    await fetchTasks();
  };

  const handleUpdateTitle = async (newTitle: string) => {
    if (!activeHouse || !selectedTask) return;
    await taskApi.updateTitle(activeHouse.id, selectedTask.id, newTitle);
    await fetchTasks();
    const refreshed = await taskApi.getTaskDetail(activeHouse.id, selectedTask.id);
    setSelectedTask(refreshed.task);
  };

  const handleHandover = async (
    action: 'RETURN' | 'FORWARD' | 'COMPLETE',
    toMemberId: string,
    note?: string
  ) => {
    if (!activeHouse || !selectedTask) return;
    await taskApi.handoverTask(activeHouse.id, selectedTask.id, {
      action,
      toMemberId,
      note,
    });
    await fetchTasks();
    setIsDetailOpen(false);
  };

  const handleDelete = async () => {
    if (!activeHouse || !selectedTask) return;
    await taskApi.deleteTask(activeHouse.id, selectedTask.id);
    await fetchTasks();
    setIsDetailOpen(false);
  };

  const handleCreateTask = async (data: any) => {
    if (!activeHouse) return;
    await taskApi.createTask(activeHouse.id, data);
    await fetchTasks();
  };

  if (!activeHouse) {
    return (
      <div className="p-6 text-center text-xs text-text-muted">
        กรุณาสร้างหรือเลือกบ้านก่อน
      </div>
    );
  }

  const currentUserMember = members.find((m) => m.userId === user?.id);

  const filteredTasks = tasks.filter((t) => {
    const holderId = (t as any).current_holder_id || t.currentHolderId;
    const isMine = currentUserMember && holderId === currentUserMember.id;
    if (filter === 'MINE') return isMine && t.status !== 'COMPLETED';
    if (filter === 'DONE') return t.status === 'COMPLETED';
    return t.status !== 'COMPLETED';
  });

  return (
    <div className="p-4 space-y-4 pb-20">
      <PageHeader
        title="รายการงานบ้าน"
        subtitle="ส่งมอบความรับผิดชอบและหมุนเวียนเวร"
      />

      {/* Filter Tabs */}
      <div className="flex bg-surface-subtle p-1 rounded-2xl border border-surface-muted">
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'ALL'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          งานค้าง ({tasks.filter((t) => t.status !== 'COMPLETED').length})
        </button>
        <button
          onClick={() => setFilter('MINE')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'MINE'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          งานคุณ
        </button>
        <button
          onClick={() => setFilter('DONE')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'DONE'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          เสร็จแล้ว ({tasks.filter((t) => t.status === 'COMPLETED').length})
        </button>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="text-center py-8 text-xs text-text-muted">กำลังโหลดงาน...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-xs text-text-muted">
          ไม่มีรายการงานในหมวดนี้
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => {
            const holderId = (t as any).current_holder_id || t.currentHolderId;
            const isMine = currentUserMember && holderId === currentUserMember.id;
            const holderMember = members.find((m) => m.id === holderId);
            const beneficiaryId = (t as any).beneficiary_id || t.beneficiaryId;
            const beneficiaryMember = members.find((m) => m.id === beneficiaryId);
            const enrichedTask: Task = {
              ...t,
              beneficiaryName:
                beneficiaryMember?.displayName ||
                beneficiaryMember?.name ||
                t.beneficiaryName,
              beneficiaryType:
                beneficiaryMember?.memberType || t.beneficiaryType,
            };

            return (
              <TaskCard
                key={t.id}
                task={enrichedTask}
                isMyTask={Boolean(isMine)}
                holderName={holderMember?.displayName}
                onClick={() => handleOpenDetail(t.id)}
                onQuickComplete={() => handleQuickComplete(t)}
                onQuickReturn={() => handleQuickReturn(t)}
              />
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        currentUserId={user?.id || ''}
        members={members}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateTitle={handleUpdateTitle}
        onHandover={handleHandover}
        onDelete={handleDelete}
      />

      {/* Task Form Sheet */}
      <TaskFormSheet
        isOpen={isCreateOpen}
        onClose={() => onCloseCreate && onCloseCreate()}
        members={members}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};
