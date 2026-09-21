import React, { useState } from 'react';
import type { EnrichedTask } from '../../services/taskApi';
import type { EnrichedMember } from '../../services/houseApi';
import { formatSatangToBaht } from '../../lib/currency';
import { HandoverTimeline } from './HandoverTimeline';

interface TaskDetailModalProps {
  task: EnrichedTask | null;
  currentUserId: string;
  members: EnrichedMember[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTitle: (newTitle: string) => Promise<void>;
  onHandover: (action: 'RETURN' | 'FORWARD' | 'COMPLETE', toMemberId: string, note?: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  currentUserId,
  members,
  isOpen,
  onClose,
  onUpdateTitle,
  onHandover,
  onDelete,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [handoverTarget, setHandoverTarget] = useState('');
  const [handoverNote, setHandoverNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !task) return null;

  const isCreator = task.createdBy === currentUserId;

  const handleSaveTitle = async () => {
    if (!titleInput.trim()) return;
    setIsLoading(true);
    try {
      await onUpdateTitle(titleInput.trim());
      setIsEditingTitle(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForward = async () => {
    if (!handoverTarget) return;
    setIsLoading(true);
    try {
      await onHandover('FORWARD', handoverTarget, handoverNote);
      setIsHandoverOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const currentHolderMember = members.find(
    (m) => m.id === task.currentHolderId
  );
  const isMyTurn = currentHolderMember?.userId === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-start">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-muted text-text-secondary">
            {task.status === 'COMPLETED' ? 'เสร็จแล้ว' : 'กำลังดำเนินการ'}
          </span>
          <button onClick={onClose} className="text-xs text-text-muted hover:text-text-main p-1">
            ✕
          </button>
        </div>

        {/* Title & Creator Edit */}
        <div>
          {!isEditingTitle ? (
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-text-main leading-snug">{task.title}</h2>
              {isCreator && task.status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => {
                    setTitleInput(task.title);
                    setIsEditingTitle(true);
                  }}
                  className="text-xs text-text-muted hover:text-brand-primary p-1"
                >
                  ✏️
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <button
                onClick={handleSaveTitle}
                disabled={isLoading}
                className="px-2.5 py-1 bg-brand-primary text-white text-xs rounded-lg font-bold"
              >
                บันทึก
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] text-text-muted">
              ผู้สร้าง: {task.createdByName || 'สมาชิก'}
            </span>
            {(() => {
              const bId = (task as any).beneficiary_id || task.beneficiaryId;
              const bMember = members.find((m) => m.id === bId);
              const bName = bMember?.displayName || bMember?.name || task.beneficiaryName;
              const bType = bMember?.memberType || task.beneficiaryType;
              if (!bName) return null;
              return (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                  เจ้าของงาน: {bType === 'PET' ? '🐾 ' : bType === 'ASSET' ? '🏠 ' : '👤 '}
                  {bName}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Expense Info */}
        {task.hasExpense ? (
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-amber-900">ยอดเงินรวม</span>
              <span className="font-bold text-amber-900 text-sm">
                {formatSatangToBaht(task.amountSatang || 0)}
              </span>
            </div>

            {task.splits && task.splits.length > 0 && (
              <div className="pt-2 border-t border-amber-200/40 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase">สัดส่วนการหาร</span>
                {task.splits.map((s) => {
                  const m = members.find((mem) => mem.id === s.memberId);
                  return (
                    <div key={s.id} className="flex justify-between text-xs text-amber-950">
                      <span>{m?.displayName || 'สมาชิก'}</span>
                      <span className="font-medium">
                        {formatSatangToBaht(s.amountSatang || 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {/* Handover Actions for Current Holder */}
        {task.status !== 'COMPLETED' && isMyTurn && (() => {
          // Resolve previous holder from timeline for RETURN action
          const timeline = task.timeline || [];
          const lastInbound = [...timeline]
            .reverse()
            .find((log) => log.toMemberId === task.currentHolderId);
          const returnTargetId = lastInbound
            ? lastInbound.fromMemberId
            : members.find((m) => m.userId === task.createdBy)?.id || '';

          const handleReturn = async () => {
            if (!returnTargetId) return;
            setIsLoading(true);
            try {
              await onHandover('RETURN', returnTargetId, 'ส่งกลับ');
            } finally {
              setIsLoading(false);
            }
          };

          return (
            <div className="space-y-2 pt-2 border-t border-surface-muted">
              <h4 className="text-xs font-bold text-text-secondary uppercase">จัดการงานนี้</h4>
              {!isHandoverOpen ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleReturn}
                    disabled={isLoading || !returnTargetId}
                    className="py-2 px-2 rounded-xl bg-surface border border-surface-muted text-text-secondary text-xs font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ↩️ ส่งกลับ
                  </button>
                  <button
                    onClick={() => setIsHandoverOpen(true)}
                    disabled={isLoading}
                    className="py-2 px-2 rounded-xl bg-surface border border-surface-muted text-text-secondary text-xs font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ➡️ ส่งต่อ
                  </button>
                  <button
                    onClick={() => onHandover('COMPLETE', currentHolderMember?.id || '')}
                    disabled={isLoading}
                    className="py-2 px-2 rounded-xl bg-emerald-600 text-white text-xs font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ✔️ เสร็จสิ้น
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-subtle space-y-2">
                  <label className="block text-[11px] font-semibold text-text-secondary">
                    เลือกผู้รับไม้ต่อ
                  </label>
                  <select
                    value={handoverTarget}
                    onChange={(e) => setHandoverTarget(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-surface-muted outline-none"
                  >
                    <option value="">เลือกสมาชิก</option>
                    {members
                      .filter((m) => m.id !== currentHolderMember?.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName}
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    placeholder="โน้ตเพิ่มเติม (ถ้ามี)"
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-surface-muted outline-none"
                  />

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleForward}
                      disabled={isLoading || !handoverTarget}
                      className="flex-1 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      ส่งต่อ
                    </button>
                    <button
                      onClick={() => setIsHandoverOpen(false)}
                      className="px-3 py-1.5 text-xs text-text-muted"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Timeline */}
        <HandoverTimeline timeline={task.timeline || []} />

        {isCreator && (
          <div className="pt-2 border-t border-surface-muted text-center">
            <button
              type="button"
              onClick={onDelete}
              disabled={isLoading}
              className="text-xs text-red-600 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ลบงานนี้
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
