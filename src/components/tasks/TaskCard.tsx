import React from 'react';
import type { Task } from '../../types';
import { formatSatangToBaht } from '../../lib/currency';

interface TaskCardProps {
  task: Task;
  isMyTask: boolean;
  holderName?: string;
  onClick: () => void;
  onQuickComplete?: (e: React.MouseEvent) => void;
  onQuickReturn?: (e: React.MouseEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isMyTask,
  holderName,
  onClick,
  onQuickComplete,
  onQuickReturn,
}) => {
  const isOverdue =
    task.status !== 'COMPLETED' && new Date(task.dueDate).getTime() < Date.now();

  const formattedDueDate = new Intl.DateTimeFormat('th-TH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(task.dueDate));

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl bg-surface border transition shadow-sm active:scale-99 cursor-pointer ${
        isOverdue ? 'border-red-200 bg-red-50/20' : 'border-surface-muted hover:border-brand-primary/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {isMyTask ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-soft text-brand-primary">
                งานคุณ
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-muted text-text-secondary">
                รอ: {holderName || 'สมาชิก'}
              </span>
            )}

            {task.status === 'COMPLETED' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                เสร็จแล้ว
              </span>
            ) : isOverdue ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                เลยกำหนด
              </span>
            ) : null}

            {task.hasExpense && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {formatSatangToBaht(task.amountSatang || 0)}
              </span>
            )}

            {task.beneficiaryName && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                {task.beneficiaryType === 'PET' ? '🐾 ' : task.beneficiaryType === 'ASSET' ? '🏠 ' : '👤 '}
                {task.beneficiaryName}
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-text-main break-words">{task.title}</h3>
          <span className="text-[11px] text-text-muted mt-1 block">ครบกำหนด: {formattedDueDate}</span>
        </div>

        {task.status !== 'COMPLETED' && isMyTask && (
          <div className="flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onQuickComplete && (
              <button
                type="button"
                onClick={onQuickComplete}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                เสร็จสิ้น
              </button>
            )}
            {onQuickReturn && (
              <button
                type="button"
                onClick={onQuickReturn}
                className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-muted text-text-secondary text-[11px] font-semibold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ส่งกลับ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
