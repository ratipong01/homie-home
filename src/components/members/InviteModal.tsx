import React, { useState } from 'react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phone: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) return;
    setIsLoading(true);
    try {
      await onSubmit(cleanPhone, role);
      setPhone('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-text-main">เชิญสมาชิกเข้าบ้าน</h2>
          <button onClick={onClose} className="text-xs text-text-muted">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">เบอร์โทรศัพท์ (10 หลัก)</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="0812345678"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">บทบาท</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('MEMBER')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  role === 'MEMBER'
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'border-surface-muted text-text-secondary hover:bg-surface-subtle'
                }`}
              >
                สมาชิก
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  role === 'ADMIN'
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'border-surface-muted text-text-secondary hover:bg-surface-subtle'
                }`}
              >
                ผู้ดูแล
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !/^0\d{9}$/.test(phone.trim())}
            className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold disabled:opacity-50 active:scale-98 transition"
          >
            {isLoading ? 'กำลังเชิญ...' : 'ส่งคำเชิญ'}
          </button>
        </form>
      </div>
    </div>
  );
};
