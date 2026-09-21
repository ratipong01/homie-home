import React, { useState } from 'react';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: string;
    themeColor: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
}

const COLORS = ['#F97316', '#EA580C', '#C2410C', '#FB923C', '#E11D48', '#8B5CF6', '#059669', '#2563EB'];
const SPECIES = ['สุนัข', 'แมว', 'นก', 'กระต่าย', 'ปลา', 'อื่นๆ'];

export const AddPetModal: React.FC<AddPetModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('สุนัข');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [themeColor, setThemeColor] = useState('#F97316');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        category: species,
        themeColor,
        metadata: {
          species,
          breed: breed.trim() || undefined,
          birthDate: birthDate || undefined,
          notes: notes.trim() || undefined,
        },
      });
      setName('');
      setBreed('');
      setBirthDate('');
      setNotes('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-text-main">เพิ่มสัตว์เลี้ยง (Pet)</h2>
          <button onClick={onClose} className="text-xs text-text-muted">✕</button>
        </div>
        <p className="text-xs text-text-muted">
          สร้างสัตว์เลี้ยงเพื่อเป็นเจ้าของงาน เช่น ค่าอาหาร ฉีดวัคซีน หรือนัดหมอ
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">ชื่อสัตว์เลี้ยง *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ลัคกี้, มะลิ"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">ประเภท</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SPECIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecies(s)}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                    species === s
                      ? 'bg-brand-primary text-white border-brand-primary font-bold'
                      : 'border-surface-muted text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">สายพันธุ์ (ถ้ามี)</label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="เช่น ชิบะอินุ, บริติชช็อตแฮร์"
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">วันเกิด / วันรับเลี้ยง</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">หมายเหตุ / คลินิกประจำ</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น แพ้ไก่, คลินิกทองหล่อ 02-xxx-xxxx"
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
                    themeColor === c ? 'scale-125 ring-2 ring-brand-primary' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition"
          >
            {isLoading ? 'กำลังบันทึก...' : 'เพิ่มสัตว์เลี้ยง'}
          </button>
        </form>
      </div>
    </div>
  );
};
