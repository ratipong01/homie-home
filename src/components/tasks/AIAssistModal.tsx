import React, { useState } from 'react';
import { aiApi, type ParsedTaskResult } from '../../services/aiApi';

interface AIAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsed: (result: ParsedTaskResult) => void;
}

export const AIAssistModal: React.FC<AIAssistModalProps> = ({
  isOpen,
  onClose,
  onApplyParsed,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await aiApi.parseTask(promptText.trim());
      onApplyParsed(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถแกะข้อความได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">✨</span>
            <h3 className="text-sm font-bold text-text-main">สร้างงานด้วย AI</h3>
          </div>
          <button onClick={onClose} className="text-xs text-text-muted hover:text-text-main p-1">
            ✕
          </button>
        </div>

        <p className="text-xs text-text-muted">
          พิมพ์ข้อความภาษาพูด เช่น: "พรุ่งนี้ช่างแอร์ 3500 บาท หาร แมน กับ พ่อ"
        </p>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <textarea
            rows={3}
            required
            autoFocus
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="พิมพ์รายละเอียดงานและยอดเงิน..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none resize-none"
          />

          <button
            type="submit"
            disabled={isLoading || !promptText.trim()}
            className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-50 active:scale-98 transition flex items-center justify-center gap-1.5"
          >
            {isLoading ? 'กำลังวิเคราะห์ด้วย Gemini...' : 'แกะข้อความอัตโนมัติ ✨'}
          </button>
        </form>
      </div>
    </div>
  );
};
