import React from 'react';
import type { HandoverLog } from '../../types';

interface HandoverTimelineProps {
  timeline: HandoverLog[];
}

export const HandoverTimeline: React.FC<HandoverTimelineProps> = ({ timeline }) => {
  if (timeline.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-text-secondary uppercase">ไทม์ไลน์การส่งมอบบอล</h4>
      <div className="relative border-l-2 border-surface-muted ml-2 space-y-4 py-1">
        {timeline.map((log) => {
          const actionText =
            log.action === 'COMPLETE'
              ? 'ปิดงานสำเร็จ'
              : log.action === 'RETURN'
              ? 'ส่งกลับ'
              : 'ส่งต่อลูกบอล';

          const actionColor =
            log.action === 'COMPLETE'
              ? 'bg-emerald-500'
              : log.action === 'RETURN'
              ? 'bg-amber-500'
              : 'bg-brand-primary';

          const timeStr = new Intl.DateTimeFormat('th-TH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(log.createdAt));

          return (
            <div key={log.id} className="relative pl-5">
              <span
                className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${actionColor}`}
              />
              <div className="text-xs">
                <div className="flex items-center gap-1.5 font-bold text-text-main">
                  <span>{actionText}</span>
                  <span className="text-[10px] text-text-muted font-normal">({timeStr})</span>
                </div>
                {log.note && (
                  <p className="text-[11px] text-text-muted mt-0.5 bg-surface-subtle p-2 rounded-lg inline-block">
                    "{log.note}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
