import React, { useState } from 'react';
import { PhoneStep } from '../components/auth/PhoneStep';
import { PinStep } from '../components/auth/PinStep';
import { RecoveryModal } from '../components/auth/RecoveryModal';
import { authApi } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const savedPhone = localStorage.getItem('homie_remembered_phone') || '';
  const [step, setStep] = useState<'PHONE' | 'PIN'>(() => (savedPhone ? 'PIN' : 'PHONE'));
  const [phone, setPhone] = useState<string>(() => savedPhone);
  const [pinLength, setPinLength] = useState<number>(() => (savedPhone === '0855979291' ? 4 : 6));
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneCheck = async (targetPhone: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.checkPhone(targetPhone);
      if (res.pinLength) {
        setPinLength(res.pinLength);
      }
      return res;
    } catch (err: any) {
      setError(err.message || 'ตรวจสอบเบอร์โทรไม่สำเร็จ');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneContinue = (cleanPhone: string, exists: boolean, locked: boolean, pLen?: number) => {
    setPhone(cleanPhone);
    setIsNewUser(!exists);
    setIsLocked(locked);
    if (pLen) {
      setPinLength(pLen);
    } else if (cleanPhone === '0855979291') {
      setPinLength(4);
    }
    setStep('PIN');
  };

  const handlePinSubmit = async (pin: string, displayName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isNewUser) {
        const res = await authApi.register({
          phone,
          pin,
          displayName: displayName || 'สมาชิกใหม่',
        });
        localStorage.setItem('homie_remembered_phone', phone);
        login(res.token, res.user);
      } else {
        const res = await authApi.loginPin(phone, pin);
        localStorage.setItem('homie_remembered_phone', phone);
        login(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'รหัส PIN ไม่ถูกต้อง');
      if (err.code === 'ACCOUNT_LOCKED') {
        setIsLocked(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center px-6 py-12 max-w-sm mx-auto">
      <div className="text-center mb-8">
        <img
          src="/logo.svg"
          alt="Homie Home Logo"
          className="w-16 h-16 rounded-2xl shadow-md mx-auto mb-3 object-cover"
        />
        <h1 className="text-xl font-bold text-text-main">เข้าสู่ระบบ Homie Home</h1>
        <p className="text-xs text-text-muted mt-1">จัดการเรื่องบ้านและภาระงานอย่างอุ่นใจ</p>
      </div>


      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface-muted">
        {step === 'PHONE' ? (
          <PhoneStep
            onContinue={handlePhoneContinue}
            isLoading={isLoading}
            error={error}
            onCheckPhone={handlePhoneCheck}
          />
        ) : (
          <PinStep
            phone={phone}
            isNewUser={isNewUser}
            isLocked={isLocked}
            pinLength={pinLength}
            onSubmitPin={handlePinSubmit}
            onChangePhone={() => {
              setStep('PHONE');
              setError(null);
            }}
            onOpenRecovery={() => setIsRecoveryOpen(true)}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      <RecoveryModal
        phone={phone}
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onSuccess={(token, user) => login(token, user)}
        onVerifyKey={(p, key, newPin) => authApi.verifyRecoveryKey({ phone: p, recoveryKey: key, newPin })}
      />
    </div>
  );
};
