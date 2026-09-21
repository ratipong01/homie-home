import React, { useState } from 'react';

interface EditAliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  initialAlias?: string;
  initialTag?: string;
  onSubmit: (aliasName: string, relationshipTag: string) => Promise<void>;
}

export const EditAliasModal: React.FC<EditAliasModalProps> = ({
  isOpen,
  onClose,
  targetName,
  initialAlias = '',
  initialTag = '',
  onSubmit,
}) => {
  const [alias, setAlias] = useState(initialAlias);
  const [tag, setTag] = useState(initialTag);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit(alias.trim(), tag.trim());
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-text-main">ตั้งชื่อเรียกเฉพาะตัว (1-Way)</h2>
          <button onClick={onClose} className="text-xs text-text-muted">✕</button>
        </div>
        <p className="text-xs text-text-muted">
          ชื่อนี้จะเห็นเฉพาะคุณคนเดียวเท่านั้น (สำหรับ {targetName})
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">ชื่อที่คุณเรียก</label>
            <input
              type="text"
              required
              autoFocus
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="เช่น คุณแม่, แฟน, พี่ชาย"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">แท็กความสัมพันธ์ (ย่อ)</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="เช่น แม่, เพื่อนสนิท"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !alias.trim()}
            className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold disabled:opacity-50 active:scale-98 transition"
          >
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกชื่อเรียก'}
          </button>
        </form>
      </div>
    </div>
  );
};
