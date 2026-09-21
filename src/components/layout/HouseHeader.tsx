import React, { useState } from 'react';
import type { House } from '../../types';
import { NotificationDrawer } from './NotificationDrawer';
import { CartoonIcon } from '../common/CartoonIcon';

interface HouseHeaderProps {
  houses: House[];
  activeHouse: House | null;
  onSelectHouse: (house: House) => void;
  onCreateHouse: (name: string) => Promise<void>;
  onNavigateTab?: (tab: 'tasks' | 'finance' | 'dashboard' | 'members') => void;
}

export const HouseHeader: React.FC<HouseHeaderProps> = ({
  houses,
  activeHouse,
  onSelectHouse,
  onCreateHouse,
  onNavigateTab,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseName.trim()) return;
    await onCreateHouse(newHouseName.trim());
    setNewHouseName('');
    setIsCreating(false);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-surface-muted px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle border border-surface-muted text-xs font-bold text-text-main active:scale-95 transition"
            >
              <span className="w-2 h-2 rounded-full bg-brand-primary" />
              <span>{activeHouse ? activeHouse.name : 'เลือกบ้าน'}</span>
              <span className="text-[10px] text-text-muted">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-surface rounded-2xl shadow-xl border border-surface-muted p-2 z-50 animate-fade-in">
                <div className="text-[10px] font-semibold text-text-muted px-2 py-1 uppercase">
                  บ้านของคุณ
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {houses.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        onSelectHouse(h);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        activeHouse?.id === h.id
                          ? 'bg-brand-primary text-white font-bold'
                          : 'text-text-main hover:bg-surface-subtle'
                      }`}
                    >
                      <span className="break-words">{h.name}</span>
                      {activeHouse?.id === h.id && <span>✓</span>}
                    </button>
                  ))}
                </div>

                <div className="border-t border-surface-muted mt-2 pt-2">
                  {!isCreating ? (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-primary hover:bg-surface-subtle transition flex items-center gap-1.5"
                    >
                      <CartoonIcon name="plus" size={16} />
                      <span>สร้างบ้านใหม่</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreate} className="p-1 space-y-2">
                      <input
                        type="text"
                        autoFocus
                        value={newHouseName}
                        onChange={(e) => setNewHouseName(e.target.value)}
                        placeholder="ชื่อบ้าน"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-muted outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="submit"
                          disabled={!newHouseName.trim()}
                          className="flex-1 py-1 rounded-lg bg-brand-primary text-white text-[11px] font-bold disabled:opacity-50"
                        >
                          สร้าง
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreating(false)}
                          className="px-2 py-1 rounded-lg text-text-muted text-[11px]"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative w-8 h-8 rounded-full bg-surface-subtle border border-surface-muted flex items-center justify-center text-text-main hover:bg-surface-muted active:scale-95 transition"
            title="การแจ้งเตือน"
          >
            <CartoonIcon name="bell" size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* House Avatar */}
          <span className="w-8 h-8 rounded-full bg-brand-soft text-brand-primary flex items-center justify-center font-bold text-xs shadow-sm">
            {activeHouse?.name?.slice(0, 1) || 'H'}
          </span>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        activeHouse={activeHouse}
        onNavigateTab={onNavigateTab}
        onUpdateUnreadCount={setUnreadCount}
      />
    </>
  );
};
