import React, { useState, useEffect } from 'react';

interface PhoneStepProps {
  onContinue: (phone: string, exists: boolean, isLocked: boolean, pinLength?: number) => void;
  isLoading: boolean;
  error: string | null;
  onCheckPhone: (phone: string) => Promise<{ exists: boolean; isLocked: boolean; pinLength?: number }>;
}

export const PhoneStep: React.FC<PhoneStepProps> = ({
  onContinue,
  isLoading,
  error,
  onCheckPhone,
}) => {
  const [phone, setPhone] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('homie_remembered_phone');
    if (saved) {
      setPhone(saved);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      return;
    }

    if (remember) {
      localStorage.setItem('homie_remembered_phone', cleanPhone);
    } else {
      localStorage.removeItem('homie_remembered_phone');
    }

    try {
      const res = await onCheckPhone(cleanPhone);
      onContinue(cleanPhone, res.exists, res.isLocked, res.pinLength);
    } catch (_e) {
      // Handled by parent error state
    }
  };

  const isValid = /^0\d{9}$/.test(phone.trim().replace(/\D/g, ''));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
          เบอร์โทรศัพท์
        </label>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="0812345678"
          className="w-full px-4 py-3 text-lg font-medium tracking-wider rounded-xl border border-surface-muted bg-surface focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="remember-phone"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-surface-muted"
        />
        <label htmlFor="remember-phone" className="text-xs text-text-secondary select-none">
          จดจำเบอร์โทรนี้
        </label>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-3 px-4 rounded-xl bg-brand-primary text-white font-semibold text-sm disabled:opacity-50 active:scale-98 transition"
      >
        {isLoading ? 'กำลังตรวจสอบ...' : 'ถัดไป'}
      </button>
    </form>
  );
};
