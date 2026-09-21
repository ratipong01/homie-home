import React, { useState } from 'react';

interface RecoveryModalProps {
  phone: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
  onVerifyKey: (phone: string, key: string, newPin: string) => Promise<{ token: string; user: any }>;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  phone,
  isOpen,
  onClose,
  onSuccess,
  onVerifyKey,
}) => {
  const [recoveryKey, setRecoveryKey] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6) {
      setError('PIN ใหม่ต้องมี 4-6 หลัก');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PIN ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await onVerifyKey(phone, recoveryKey.trim(), newPin);
      onSuccess(res.token, res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'กู้คืน PIN ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-text-main">กู้คืน PIN</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-text-muted hover:text-text-main"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-text-muted">
          กรอก Recovery Key ที่ได้รับจากหัวหน้าบ้าน/แอดมิน เพื่อตั้ง PIN ใหม่
        </p>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Recovery Key
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value.replace(/\D/g, ''))}
              placeholder="ตัวเลข 6 หลัก"
              className="w-full px-3 py-2 text-center tracking-widest font-mono text-base rounded-xl border border-surface-muted bg-surface focus:ring-2 focus:ring-brand-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              PIN ใหม่ (4-6 หลัก)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2 text-center tracking-widest font-mono text-base rounded-xl border border-surface-muted bg-surface focus:ring-2 focus:ring-brand-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              ยืนยัน PIN ใหม่
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2 text-center tracking-widest font-mono text-base rounded-xl border border-surface-muted bg-surface focus:ring-2 focus:ring-brand-primary outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !recoveryKey || !newPin || !confirmPin}
            className="w-full mt-2 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold disabled:opacity-50 active:scale-98 transition"
          >
            {isLoading ? 'กำลังปลดล็อก...' : 'ตั้ง PIN ใหม่และเข้าใช้งาน'}
          </button>
        </form>
      </div>
    </div>
  );
};
