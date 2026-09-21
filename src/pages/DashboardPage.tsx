import React, { useState, useEffect, useCallback } from 'react';
import type { House, Task } from '../types';
import { taskApi } from '../services/taskApi';
import { MetricsRow } from '../components/dashboard/MetricsRow';
import { CalendarMini } from '../components/dashboard/CalendarMini';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { houseApi, type EnrichedMember } from '../services/houseApi';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';

interface DashboardPageProps {
  activeHouse: House | null;
  onNavigateToCreateWithDate?: (date: Date) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  activeHouse,
  onNavigateToCreateWithDate,
}) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!activeHouse) return;
    setIsLoading(true);
    try {
      const [tRes, mRes] = await Promise.all([
        taskApi.listTasks(activeHouse.id),
        houseApi.listMembers(activeHouse.id),
      ]);
      setTasks(tRes.tasks);
      setMembers(mRes.members);
    } catch (_e) {
    } finally {
      setIsLoading(false);
    }
  }, [activeHouse]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (!activeHouse) {
    return (
      <div className="p-6 text-center text-xs text-text-muted">
        กรุณาสร้างหรือเลือกบ้านก่อน
      </div>
    );
  }

  // Metrics
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pending = total - completed;
  const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(
    (t) => t.status !== 'COMPLETED' && t.dueDate.slice(0, 10) === todayIso
  );

  const taskDates = tasks
    .filter((t) => t.status !== 'COMPLETED')
    .map((t) => t.dueDate.slice(0, 10));

  const selectedDateIso = selectedDate.toISOString().slice(0, 10);
  const selectedDateTasks = tasks.filter((t) => t.dueDate.slice(0, 10) === selectedDateIso);

  const handleOpenDetail = async (taskId: string) => {
    if (!activeHouse) return;
    try {
      const res = await taskApi.getTaskDetail(activeHouse.id, taskId);
      setSelectedTask(res.task);
      setIsDetailOpen(true);
    } catch (_e) {}
  };

  const currentUserMember = members.find((m) => m.userId === user?.id);

  return (
    <div className="p-4 space-y-4 pb-20">
      <PageHeader
        title="แดชบอร์ดภาพรวม"
        subtitle="สถานะงานและปฏิทินครอบครัว"
      />

      {/* Metrics Row */}
      <MetricsRow
        completedPercent={completedPercent}
        todayCount={todayTasks.length}
        pendingCount={pending}
      />

      {/* Mini Calendar */}
      <CalendarMini
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(d)}
        taskDates={taskDates}
      />

      {/* Tasks on Selected Date */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-text-secondary uppercase">
            งานวันที่ {selectedDate.getDate()} (
            {new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(selectedDate)})
          </h2>
          {onNavigateToCreateWithDate && (
            <button
              onClick={() => onNavigateToCreateWithDate(selectedDate)}
              className="text-[11px] font-bold text-brand-primary hover:underline"
            >
              + เพิ่มงานวันนี้
            </button>
          )}
        </div>

        {isLoading && tasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-muted">กำลังโหลด...</div>
        ) : selectedDateTasks.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface border border-surface-muted text-center text-xs text-text-muted">
            ไม่มีงานที่ต้องทำในวันนี้
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateTasks.map((t) => {
              const isMine = currentUserMember && t.currentHolderId === currentUserMember.id;
              const holderMember = members.find((m) => m.id === t.currentHolderId);
              return (
                <TaskCard
                  key={t.id}
                  task={t}
                  isMyTask={Boolean(isMine)}
                  holderName={holderMember?.displayName}
                  onClick={() => handleOpenDetail(t.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        currentUserId={user?.id || ''}
        members={members}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateTitle={async (newTitle) => {
          if (!activeHouse || !selectedTask) return;
          await taskApi.updateTitle(activeHouse.id, selectedTask.id, newTitle);
          await fetchDashboardData();
          setIsDetailOpen(false);
        }}
        onHandover={async (action, toMemberId, note) => {
          if (!activeHouse || !selectedTask) return;
          await taskApi.handoverTask(activeHouse.id, selectedTask.id, {
            action,
            toMemberId,
            note,
          });
          await fetchDashboardData();
          setIsDetailOpen(false);
        }}
        onDelete={async () => {
          if (!activeHouse || !selectedTask) return;
          await taskApi.deleteTask(activeHouse.id, selectedTask.id);
          await fetchDashboardData();
          setIsDetailOpen(false);
        }}
      />
    </div>
  );
};
