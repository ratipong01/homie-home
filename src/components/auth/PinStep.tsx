import React, { useState, useEffect } from 'react';

interface PinStepProps {
  phone: string;
  isNewUser: boolean;
  isLocked: boolean;
  pinLength?: number;
  onSubmitPin: (pin: string, displayName?: string) => Promise<void>;
  onChangePhone: () => void;
  onOpenRecovery: () => void;
  isLoading: boolean;
  error: string | null;
}

export const PinStep: React.FC<PinStepProps> = ({
  phone,
  isNewUser,
  isLocked,
  pinLength = 6,
  onSubmitPin,
  onChangePhone,
  onOpenRecovery,
  isLoading,
  error,
}) => {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [stepError, setStepError] = useState<string | null>(null);

  // Auto-submit for existing user when PIN reaches target pinLength (e.g. 4 or 6 digits)
  useEffect(() => {
    if (!isNewUser && !isLocked && pin.length === pinLength) {
      onSubmitPin(pin);
    }
  }, [pin, isNewUser, isLocked, pinLength, onSubmitPin]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setStepError('กรุณากรอกชื่อของคุณ');
      return;
    }
    if (pin.length < 4 || pin.length > 6) {
      setStepError('PIN ต้องมี 4-6 หลัก');
      return;
    }
    if (pin !== confirmPin) {
      setStepError('PIN ทั้งสองช่องไม่ตรงกัน');
      return;
    }
    setStepError(null);
    onSubmitPin(pin, displayName.trim());
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < pinLength) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  if (isLocked) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold">
          🔒
        </div>
        <h2 className="text-base font-bold text-text-main">บัญชีถูกล็อก</h2>
        <p className="text-xs text-text-muted max-w-xs mx-auto">
          กรอก PIN ผิดเกินกำหนด กรุณาขอ Recovery Key จากหัวหน้าบ้านหรือแอดมินเพื่อปลดล็อก
        </p>

        <div className="space-y-2 pt-2">
          <button
            onClick={onOpenRecovery}
            className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold active:scale-98 transition"
          >
            ใส่ Recovery Key
          </button>
          <button
            onClick={onChangePhone}
            className="w-full py-2 text-xs text-text-secondary hover:text-brand-primary"
          >
            เปลี่ยนเบอร์
          </button>
        </div>
      </div>
    );
  }

  // First time register
  if (isNewUser) {
    return (
      <form onSubmit={handleRegisterSubmit} className="space-y-4">
        <div className="flex justify-between items-center pb-1">
          <span className="text-xs text-text-muted">เบอร์: {phone}</span>
          <button
            type="button"
            onClick={onChangePhone}
            className="text-xs text-brand-primary font-medium hover:underline"
          >
            เปลี่ยนเบอร์
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            ชื่อที่แสดงในบ้าน
          </label>
          <input
            type="text"
            required
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="เช่น พี่แมน, น้องฟ้า"
            className="w-full px-3 py-2 text-sm rounded-xl border border-surface-muted bg-surface focus:ring-2 focus:ring-brand-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            ตั้ง PIN (4-6 หลัก)
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            required
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full px-3 py-2 text-center tracking-widest font-mono text-base rounded-xl border border-surface-muted bg-surface focus:ring-2 focus:ring-brand-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            ยืนยัน PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            required
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full px-3 py-2 text-center tracking-widest font-mono text-base rounded-xl border border-surface-muted bg-surface focus:ring-2 focus:ring-brand-primary outline-none"
          />
        </div>

        {(stepError || error) && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
            {stepError || error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !displayName.trim() || pin.length < 4}
          className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-semibold disabled:opacity-50 active:scale-98 transition"
        >
          {isLoading ? 'กำลังสร้างบัญชี...' : 'เริ่มใช้งานทันที'}
        </button>
      </form>
    );
  }

  // Returning user: 4-6 masked dots PIN pad
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-muted">{phone}</span>
        <button
          type="button"
          onClick={onChangePhone}
          className="text-xs text-brand-primary font-medium hover:underline"
        >
          เปลี่ยนเบอร์
        </button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-4">กรอกรหัส PIN</h2>
        <div className="flex justify-center items-center gap-3">
          {Array.from({ length: pinLength }).map((_, index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                index < pin.length ? 'bg-brand-primary scale-110' : 'bg-surface-muted border border-surface-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleKeyPress(n)}
            disabled={isLoading}
            className="w-14 h-14 mx-auto rounded-full bg-surface border border-surface-muted text-lg font-semibold text-text-main flex items-center justify-center active:bg-surface-subtle transition"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenRecovery}
          className="text-[11px] text-text-muted hover:text-brand-primary flex items-center justify-center"
        >
          ลืม PIN
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          disabled={isLoading}
          className="w-14 h-14 mx-auto rounded-full bg-surface border border-surface-muted text-lg font-semibold text-text-main flex items-center justify-center active:bg-surface-subtle transition"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="w-14 h-14 mx-auto rounded-full text-base font-semibold text-text-muted flex items-center justify-center active:bg-surface-subtle transition"
        >
          ⌫
        </button>
      </div>
    </div>
  );
};
