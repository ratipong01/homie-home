import React, { useState } from 'react';
import type { House } from '../../types';
import { NotificationDrawer } from './NotificationDrawer';
import { CartoonIcon } from '../common/CartoonIcon';
import { useAuth } from '../../context/AuthContext';
import { DeviceNotification } from '../../lib/deviceNotification';

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
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

          {/* House Avatar & Settings Trigger */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-full bg-brand-soft text-brand-primary flex items-center justify-center font-bold text-xs shadow-sm active:scale-90 hover:ring-2 hover:ring-brand-primary/40 transition cursor-pointer"
            title="โปรไฟล์และการตั้งค่า"
          >
            {user?.displayName ? user.displayName.slice(0, 1) : activeHouse?.name?.slice(0, 1) || 'H'}
          </button>
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

      {/* Settings Modal (การตั้งค่าในระบบ) */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-3xl p-5 shadow-2xl border border-surface-muted space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-muted">
              <div className="flex items-center gap-2">
                <CartoonIcon name="settings" size={22} />
                <h2 className="text-sm font-bold text-text-main">การตั้งค่าระบบ</h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-subtle text-text-muted hover:text-text-main flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-muted flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white font-bold text-lg flex items-center justify-center shadow-xs">
                {user?.displayName?.slice(0, 1) || 'H'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-text-main truncate">
                  {user?.displayName || 'สมาชิก Homie'}
                </h3>
                <p className="text-[11px] text-text-muted">{user?.phone || 'ไม่ระบุเบอร์'}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800">
                  กำลังใช้งาน
                </span>
              </div>
            </div>

            {/* Settings Options */}
            <div className="space-y-2 text-xs">
              <div className="text-[10px] font-semibold text-text-muted uppercase px-1">
                การแจ้งเตือนและการเข้าถึง
              </div>

              {/* Notification toggle */}
              <div className="p-3 rounded-2xl bg-surface border border-surface-muted flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-main">แจ้งเตือนบนอุปกรณ์</p>
                  <p className="text-[10px] text-text-muted">เฉพาะงานเกินกำหนดและยอดเงินค้าง</p>
                </div>
                {DeviceNotification.isSupported() ? (
                  DeviceNotification.getPermission() === 'granted' ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      เปิดแล้ว ✓
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        const res = await DeviceNotification.requestPermission();
                        if (res === 'granted') {
                          DeviceNotification.send('Homie Home', {
                            body: 'เปิดการแจ้งเตือนงานและการเงินในบ้านสำเร็จแล้ว!',
                          });
                          setIsSettingsOpen(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-brand-primary text-white font-bold text-[10px] active:scale-95 transition"
                    >
                      เปิดแจ้งเตือน
                    </button>
                  )
                ) : (
                  <span className="text-[10px] text-text-muted">ไม่รองรับบนเบราว์เซอร์นี้</span>
                )}
              </div>

              {/* Current House Info */}
              <div className="p-3 rounded-2xl bg-surface border border-surface-muted flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-main">บ้านปัจจุบัน</p>
                  <p className="text-[10px] text-text-muted">{activeHouse?.name || 'ไม่มีบ้าน'}</p>
                </div>
                <span className="text-[10px] text-text-muted bg-surface-subtle px-2 py-1 rounded-lg">
                  ID: {activeHouse?.id?.slice(0, 6)}...
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-surface-muted">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs active:scale-98 transition flex items-center justify-center gap-2"
              >
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
