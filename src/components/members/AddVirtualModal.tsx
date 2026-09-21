import React, { useState } from 'react';

interface AddVirtualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; gender: 'MALE' | 'FEMALE' | 'OTHER'; themeColor: string }) => Promise<void>;
}

const COLORS = ['#F97316', '#EA580C', '#C2410C', '#FB923C', '#E11D48', '#8B5CF6', '#059669', '#2563EB'];

export const AddVirtualModal: React.FC<AddVirtualModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('OTHER');
  const [themeColor, setThemeColor] = useState('#F97316');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit({ name: name.trim(), gender, themeColor });
      setName('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-text-main">เพิ่มคนจำลอง (Virtual)</h2>
          <button onClick={onClose} className="text-xs text-text-muted">✕</button>
        </div>
        <p className="text-xs text-text-muted">
          สร้างสมาชิกที่ไม่มีเบอร์โทร เช่น คุณยาย หรือแม่บ้าน เพื่อมอบหมายงานและหารเงินได้
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">ชื่อเรียก</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น คุณยาย, ป้าศรี"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">เพศ (สำหรับภาพจำลอง)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                    gender === g
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'border-surface-muted text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  {g === 'MALE' ? 'ชาย' : g === 'FEMALE' ? 'หญิง' : 'อื่นๆ'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">สีประจำตัว</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setThemeColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    themeColor === c ? 'scale-125 ring-2 ring-brand-primary' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold disabled:opacity-50 active:scale-98 transition"
          >
            {isLoading ? 'กำลังบันทึก...' : 'เพิ่มคนจำลอง'}
          </button>
        </form>
      </div>
    </div>
  );
};
