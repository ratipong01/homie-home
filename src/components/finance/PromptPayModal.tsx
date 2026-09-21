import React, { useState } from 'react';

interface PromptPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrPayload: string;
  amountBaht: number;
  recipientName: string;
  phone: string;
}

export const PromptPayModal: React.FC<PromptPayModalProps> = ({
  isOpen,
  onClose,
  qrPayload,
  amountBaht,
  recipientName,
  phone,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrPayload
  )}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            PromptPay
          </span>
          <button onClick={onClose} className="text-xs text-text-muted hover:text-text-main p-1">
            ✕
          </button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-text-main">สแกนจ่ายเงินให้ {recipientName}</h3>
          <span className="text-xl font-black text-brand-primary font-mono mt-1 block">
            ฿{amountBaht.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-3 bg-surface-subtle rounded-2xl border border-surface-muted inline-block">
          <img src={qrImageUrl} alt="PromptPay QR" className="w-48 h-48 mx-auto rounded-xl" />
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface border border-surface-muted text-xs">
            <span className="text-text-muted">เบอร์: {phone}</span>
            <button
              onClick={handleCopyPhone}
              className="font-bold text-brand-primary hover:underline"
            >
              {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-surface-subtle text-text-secondary text-xs font-bold active:scale-98 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
