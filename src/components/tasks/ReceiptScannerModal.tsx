import React, { useState } from 'react';
import { aiApi, type ReceiptOcrResult } from '../../services/aiApi';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOcr: (result: ReceiptOcrResult) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyOcr,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setIsLoading(true);
      try {
        const res = await aiApi.receiptOcr(base64);
        onApplyOcr(res);
        onClose();
      } catch (err: any) {
        alert('สแกนใบเสร็จไม่สำเร็จ');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🧾</span>
            <h3 className="text-sm font-bold text-text-main">สแกนใบเสร็จ OCR</h3>
          </div>
          <button onClick={onClose} className="text-xs text-text-muted hover:text-text-main p-1">
            ✕
          </button>
        </div>

        <p className="text-xs text-text-muted">
          ถ่ายภาพหรืออัปโหลดใบเสร็จเพื่อดึงยอดเงินและรายการอัตโนมัติ
        </p>

        {previewUrl ? (
          <div className="p-2 border rounded-2xl bg-surface-subtle">
            <img src={previewUrl} alt="Receipt" className="max-h-48 mx-auto rounded-xl object-contain" />
          </div>
        ) : (
          <label className="border-2 border-dashed border-surface-muted rounded-2xl p-8 block cursor-pointer hover:border-brand-primary transition">
            <span className="text-3xl block mb-2">📸</span>
            <span className="text-xs font-bold text-brand-primary">เลือกรูปภาพใบเสร็จ</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {isLoading && (
          <div className="text-xs font-bold text-brand-primary animate-pulse">
            Gemini กำลังอ่านใบเสร็จ...
          </div>
        )}
      </div>
    </div>
  );
};
