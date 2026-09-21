import React from 'react';

interface MetricsRowProps {
  completedPercent: number;
  todayCount: number;
  pendingCount: number;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  completedPercent,
  todayCount,
  pendingCount,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <div className="p-3 rounded-2xl bg-surface border border-surface-muted shadow-sm text-center">
        <span className="text-[10px] font-bold text-text-muted uppercase block">สำเร็จ</span>
        <span className="text-base font-black text-emerald-600 mt-0.5 block">
          {completedPercent}%
        </span>
      </div>

      <div className="p-3 rounded-2xl bg-surface border border-surface-muted shadow-sm text-center">
        <span className="text-[10px] font-bold text-text-muted uppercase block">วันนี้</span>
        <span className="text-base font-black text-brand-primary mt-0.5 block">
          {todayCount} งาน
        </span>
      </div>

      <div className="p-3 rounded-2xl bg-surface border border-surface-muted shadow-sm text-center">
        <span className="text-[10px] font-bold text-text-muted uppercase block">ค้าง</span>
        <span className="text-base font-black text-amber-600 mt-0.5 block">
          {pendingCount} งาน
        </span>
      </div>
    </div>
  );
};
