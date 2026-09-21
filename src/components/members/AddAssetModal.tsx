import React, { useState } from 'react';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: string;
    themeColor: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
}

const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#475569'];
const CATEGORIES = ['เครื่องใช้ไฟฟ้า', 'ยานพาหนะ', 'สุขภัณฑ์/ประปา', 'เฟอร์นิเจอร์', 'ตัวบ้าน/สวน', 'อื่นๆ'];

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('เครื่องใช้ไฟฟ้า');
  const [location, setLocation] = useState('');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [themeColor, setThemeColor] = useState('#2563EB');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        themeColor,
        metadata: {
          location: location.trim() || undefined,
          warrantyExpiryDate: warrantyExpiryDate || undefined,
        },
      });
      setName('');
      setLocation('');
      setWarrantyExpiryDate('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-text-main">เพิ่มทรัพย์สิน (Asset)</h2>
          <button onClick={onClose} className="text-xs text-text-muted">✕</button>
        </div>
        <p className="text-xs text-text-muted">
          สร้างทรัพย์สินเพื่อผูกกับงานบำรุงรักษา เช่น ล้างแอร์ ซ่อมปั๊มน้ำ เช็กระยะรถ
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">ชื่อทรัพย์สิน *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น แอร์ห้องนอนใหญ่, รถ Honda City"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">หมวดหมู่</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-left transition truncate ${
                    category === c
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'border-surface-muted text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">ตำแหน่งในบ้าน</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น ห้องนอน 1, โรงรถ, ห้องครัว"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">วันหมดประกัน</label>
            <input
              type="date"
              value={warrantyExpiryDate}
              onChange={(e) => setWarrantyExpiryDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface outline-none"
            />
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
                    themeColor === c ? 'scale-125 ring-2 ring-blue-600' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition"
          >
            {isLoading ? 'กำลังบันทึก...' : 'เพิ่มทรัพย์สิน'}
          </button>
        </form>
      </div>
    </div>
  );
};
