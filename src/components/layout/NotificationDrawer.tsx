import React, { useState, useEffect } from 'react';
import type { House, Task } from '../../types';
import { taskApi } from '../../services/taskApi';
import { financeApi, type NetBalance } from '../../services/financeApi';
import { CartoonIcon } from '../common/CartoonIcon';
import { DeviceNotification } from '../../lib/deviceNotification';

interface NotificationItem {
  id: string;
  type: 'OVERDUE' | 'TODAY' | 'FINANCE' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  actionTab?: 'tasks' | 'finance' | 'dashboard' | 'members';
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeHouse: House | null;
  onNavigateTab?: (tab: 'tasks' | 'finance' | 'dashboard' | 'members') => void;
  onUpdateUnreadCount?: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  activeHouse,
  onNavigateTab,
  onUpdateUnreadCount,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeHouse) return;

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const [taskRes, financeRes] = await Promise.all([
          taskApi.listTasks(activeHouse.id).catch(() => ({ tasks: [] as Task[] })),
          financeApi.getBalances(activeHouse.id).catch(() => ({ balances: [] as NetBalance[] })),
        ]);

        const items: NotificationItem[] = [];
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        // 1. Task notifications
        taskRes.tasks.forEach((t) => {
          if (t.status === 'COMPLETED') return;

          const due = t.dueDate ? t.dueDate.slice(0, 10) : '';
          if (due && due < todayStr) {
            items.push({
              id: `overdue-${t.id}`,
              type: 'OVERDUE',
              title: '⚠️ งานเกินกำหนด',
              message: `"${t.title}" เกินกำหนดส่งแล้ว รีบจัดการหรือส่งต่อให้เพื่อนร่วมบ้านนะ`,
              time: 'เกินกำหนด',
              actionTab: 'tasks',
            });
          } else if (due === todayStr) {
            items.push({
              id: `today-${t.id}`,
              type: 'TODAY',
              title: '🔔 งานที่ต้องทำวันนี้',
              message: `อย่าลืมทำงาน "${t.title}" ให้เสร็จภายในวันนี้นะ`,
              time: 'วันนี้',
              actionTab: 'tasks',
            });
          }
        });

        // 2. Finance notifications
        financeRes.balances.forEach((b) => {
          if (b.status === 'OWES' && b.netSatang > 0) {
            items.push({
              id: `finance-${b.memberId}`,
              type: 'FINANCE',
              title: '💰 ยอดค้างชำระในบ้าน',
              message: `${b.name} มียอดค้างชำระ ${(b.netSatang / 100).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
              })} บาท`,
              time: 'รอเคลียร์',
              actionTab: 'finance',
            });
          }
        });

        // 3. Welcome / System notification
        if (items.length === 0) {
          items.push({
            id: 'system-all-clear',
            type: 'SYSTEM',
            title: '✨ ทุกอย่างเรียบร้อยดี',
            message: `บ้าน "${activeHouse.name}" ไม่มีงานค้างและเคลียร์การเงินครบถ้วนแล้ว`,
            time: 'ล่าสุด',
          });
        }

        setNotifications(items);
        // Only count necessary, actionable items (not system-all-clear placeholder)
        const unread = items.filter((item) => item.type !== 'SYSTEM' && !readIds.has(item.id)).length;
        onUpdateUnreadCount?.(unread);
      } catch (_e) {
        // Handled
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [activeHouse, isOpen]);

  if (!isOpen) return null;

  const handleItemClick = (item: NotificationItem) => {
    setReadIds((prev) => new Set(prev).add(item.id));
    if (item.actionTab && onNavigateTab) {
      onNavigateTab(item.actionTab);
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    onUpdateUnreadCount?.(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-sm h-full bg-surface shadow-2xl flex flex-col justify-between border-l border-surface-muted animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-muted flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-2">
            <CartoonIcon name="bell" size={24} />
            <div>
              <h2 className="text-sm font-bold text-text-main">การแจ้งเตือน</h2>
              <p className="text-[11px] text-text-muted">{activeHouse?.name || 'บ้านของคุณ'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-brand-primary font-medium hover:underline"
              >
                อ่านทั้งหมด
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-subtle flex items-center justify-center text-text-muted hover:text-text-main transition text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* On-device notification permission banner */}
          {DeviceNotification.isSupported() && DeviceNotification.getPermission() !== 'granted' && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div>
                <p className="font-bold">🔔 เปิดแจ้งเตือนบนอุปกรณ์</p>
                <p className="text-[10px] text-amber-700">รับแจ้งเตือนเมื่อมีงานด่วนหรือยอดเงินในบ้าน</p>
              </div>
              <button
                onClick={async () => {
                  const p = await DeviceNotification.requestPermission();
                  if (p === 'granted') {
                    DeviceNotification.send('Homie Home', {
                      body: 'เปิดการแจ้งเตือนบนอุปกรณ์เรียบร้อยแล้ว!',
                    });
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-[11px] whitespace-nowrap active:scale-95 transition"
              >
                เปิดใช้งาน
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">กำลังโหลดการแจ้งเตือน...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted space-y-2">
              <span className="text-3xl block">🎉</span>
              <p className="font-semibold text-text-main">ไม่มีการแจ้งเตือน</p>
              <p className="text-[11px]">ทุกอย่างในบ้านเรียบร้อยดีแล้วครับ</p>
            </div>
          ) : (
            notifications.map((item) => {
              const isRead = readIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer active:scale-[0.98] ${
                    isRead
                      ? 'bg-surface border-surface-muted/70 opacity-75'
                      : 'bg-surface-subtle/70 border-brand-soft shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      {!isRead && <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />}
                      {item.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-surface-muted text-text-muted shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed pl-3.5">{item.message}</p>
                  {item.actionTab && (
                    <div className="mt-2 pl-3.5 flex justify-end">
                      <span className="text-[11px] font-semibold text-brand-primary flex items-center gap-1">
                        ดูรายละเอียด <span>→</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-muted bg-surface-subtle/30 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-surface-subtle border border-surface-muted text-xs font-semibold text-text-main active:scale-95 transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
