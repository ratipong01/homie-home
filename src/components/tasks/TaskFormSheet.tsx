import React, { useState } from 'react';
import type { EnrichedMember } from '../../services/houseApi';
import type { BeneficiaryType } from '../../types';
import {
  bahtInputToSatang,
  formatSatangToBaht,
  distributeFairSatangFrontend,
} from '../../lib/currency';
import { AIAssistModal } from './AIAssistModal';
import { ReceiptScannerModal } from './ReceiptScannerModal';
import type { ParsedTaskResult, ReceiptOcrResult } from '../../services/aiApi';

interface TaskFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  members: EnrichedMember[];
  initialTitle?: string;
  onSubmit: (data: {
    title: string;
    description?: string;
    holderId: string;
    beneficiaryId?: string | null;
    beneficiaryType?: BeneficiaryType | null;
    dueDate: string;
    hasExpense: boolean;
    amountSatang: number;
    splitType: 'EQUAL' | 'CUSTOM';
    splitMembers: { memberId: string; amountSatang?: number }[];
  }) => Promise<void>;
}

export const TaskFormSheet: React.FC<TaskFormSheetProps> = ({
  isOpen,
  onClose,
  members,
  initialTitle = '',
  onSubmit,
}) => {
  const personMembers = members.filter((m) => m.memberType === 'PERSON');
  const petMembers = members.filter((m) => m.memberType === 'PET');
  const assetMembers = members.filter((m) => m.memberType === 'ASSET');

  const [slide, setSlide] = useState<1 | 2>(1);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');

  const [holderId, setHolderId] = useState(personMembers[0]?.id || members[0]?.id || '');
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null);
  const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>('HOUSE_COMMON');
  const [dueDateStr, setDueDateStr] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [hasExpense, setHasExpense] = useState(false);

  const [bahtInput, setBahtInput] = useState('');
  const [splitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() =>
    personMembers.map((m) => m.id)
  );
  const [isLoading, setIsLoading] = useState(false);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  React.useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  if (!isOpen) return null;

  const totalSatang = bahtInputToSatang(bahtInput);
  const fairSplits = distributeFairSatangFrontend(totalSatang, selectedMemberIds);

  const handleApplyParsedAi = (result: ParsedTaskResult) => {
    setTitle(result.title);
    if (result.hasExpense) {
      setHasExpense(true);
      setBahtInput((result.amountSatang / 100).toString());
    }
    if (result.splitNames && result.splitNames.length > 0) {
      const matchedIds = personMembers
        .filter((m) =>
          result.splitNames.some(
            (name) => m.displayName.includes(name) || m.name.includes(name)
          )
        )
        .map((m) => m.id);
      if (matchedIds.length > 0) {
        setSelectedMemberIds(matchedIds);
      }
    }
  };

  const handleApplyOcr = (result: ReceiptOcrResult) => {
    if (result.merchantName) {
      setTitle(`ซื้อของที่ ${result.merchantName}`);
    }
    setHasExpense(true);
    setBahtInput((result.totalSatang / 100).toString());
  };

  const handleQuickSaveSlide1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !holderId) return;

    if (hasExpense) {
      setSlide(2);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        holderId,
        beneficiaryId: beneficiaryId || undefined,
        beneficiaryType,
        dueDate: new Date(dueDateStr).toISOString(),
        hasExpense: false,
        amountSatang: 0,
        splitType: 'EQUAL',
        splitMembers: [],
      });
      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSlide2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || totalSatang <= 0 || selectedMemberIds.length === 0) return;

    setIsLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        holderId,
        beneficiaryId: beneficiaryId || undefined,
        beneficiaryType,
        dueDate: new Date(dueDateStr).toISOString(),
        hasExpense: true,
        amountSatang: totalSatang,
        splitType,
        splitMembers: fairSplits.map((s) => ({
          memberId: s.memberId,
          amountSatang: s.amountSatang,
        })),
      });
      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setBeneficiaryId(null);
    setBeneficiaryType('HOUSE_COMMON');
    setHasExpense(false);
    setBahtInput('');
    setSlide(1);
  };

  const toggleMemberSelection = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((mId) => mId !== id));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center border-b border-surface-muted pb-3">
          <div className="flex items-center gap-2">
            {slide === 2 && (
              <button
                type="button"
                onClick={() => setSlide(1)}
                className="text-xs text-text-muted hover:text-brand-primary"
              >
                ◀ กลับ
              </button>
            )}
            <h2 className="text-sm font-bold text-text-main">
              {slide === 1 ? 'เพิ่มงานใหม่' : 'ตั้งค่าหารค่าใช้จ่าย'}
            </h2>
          </div>
          <button onClick={onClose} className="text-xs text-text-muted">
            ✕
          </button>
        </div>

        {slide === 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAiOpen(true)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200 flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <span>✨</span>
              <span>พิมพ์สั่งด้วย AI</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOcrOpen(true)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <span>🧾</span>
              <span>สแกนใบเสร็จ</span>
            </button>
          </div>
        )}

        {slide === 1 ? (
          <form onSubmit={handleQuickSaveSlide1} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                ชื่องาน *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ล้างแอร์, ซื้อของเข้าบ้าน"
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                เจ้าของงาน / ผู้รับประโยชน์ (ทำเพื่อใคร)
              </label>
              <div className="flex gap-1.5 overflow-x-auto py-1">
                <button
                  type="button"
                  onClick={() => {
                    setBeneficiaryId(null);
                    setBeneficiaryType('HOUSE_COMMON');
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    beneficiaryId === null
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-surface-subtle text-text-secondary border border-surface-muted'
                  }`}
                >
                  🏠 ส่วนกลางบ้าน
                </button>
                {petMembers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setBeneficiaryId(p.id);
                      setBeneficiaryType('PET');
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                      beneficiaryId === p.id
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-surface-subtle text-text-secondary border border-surface-muted'
                    }`}
                  >
                    🐾 {p.displayName}
                  </button>
                ))}
                {assetMembers.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setBeneficiaryId(a.id);
                      setBeneficiaryType('ASSET');
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                      beneficiaryId === a.id
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-surface-subtle text-text-secondary border border-surface-muted'
                    }`}
                  >
                    ❄️ {a.displayName}
                  </button>
                ))}
                {personMembers.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setBeneficiaryId(pm.id);
                      setBeneficiaryType('PERSON');
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                      beneficiaryId === pm.id
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-surface-subtle text-text-secondary border border-surface-muted'
                    }`}
                  >
                    👤 {pm.displayName}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                ผู้รับผิดชอบงาน (คนลงมือทำ)
              </label>
              <div className="flex gap-2 overflow-x-auto py-1">
                {personMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setHolderId(m.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                      holderId === m.id
                        ? 'bg-brand-primary text-white font-bold'
                        : 'bg-surface-subtle text-text-secondary border border-surface-muted'
                    }`}
                  >
                    {m.displayName}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                วันและเวลาครบกำหนด
              </label>
              <input
                type="datetime-local"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-surface-muted bg-surface outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-surface-muted">
              <span className="text-xs font-semibold text-text-main">มีค่าใช้จ่าย / หารเงิน</span>
              <input
                type="checkbox"
                checked={hasExpense}
                onChange={(e) => setHasExpense(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition"
            >
              {hasExpense ? 'ถัดไป: ตั้งค่าหารเงิน ➔' : 'บันทึกงานทันที'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSaveSlide2} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                ยอดเงินรวม (บาท)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                autoFocus
                value={bahtInput}
                onChange={(e) => setBahtInput(e.target.value)}
                placeholder="เช่น 1000"
                className="w-full px-3 py-2 text-base font-bold text-center rounded-xl border border-surface-muted bg-surface focus:ring-1 focus:ring-brand-primary outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                เลือกสมาชิกที่หารด้วยกัน (เฉพาะคนในบ้าน)
              </label>
              <div className="flex flex-wrap gap-2 py-1">
                {personMembers.map((m) => {
                  const isSelected = selectedMemberIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMemberSelection(m.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        isSelected
                          ? 'bg-amber-500 text-white font-bold'
                          : 'bg-surface-subtle text-text-muted border border-surface-muted'
                      }`}
                    >
                      {m.displayName} {isSelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {totalSatang > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-800 uppercase">
                  ตัวอย่างการหารแบบ Fair Satang
                </span>
                {fairSplits.map((fs) => {
                  const mem = members.find((m) => m.id === fs.memberId);
                  return (
                    <div key={fs.memberId} className="flex justify-between text-xs text-amber-950">
                      <span>{mem?.displayName || 'สมาชิก'}</span>
                      <span className="font-bold">{formatSatangToBaht(fs.amountSatang)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || totalSatang <= 0 || selectedMemberIds.length === 0}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-50 active:scale-98 transition"
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกงานพร้อมยอดหาร'}
            </button>
          </form>
        )}

        {/* Modals */}
        <AIAssistModal
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          onApplyParsed={handleApplyParsedAi}
        />
        <ReceiptScannerModal
          isOpen={isOcrOpen}
          onClose={() => setIsOcrOpen(false)}
          onApplyOcr={handleApplyOcr}
        />
      </div>
    </div>
  );
};
