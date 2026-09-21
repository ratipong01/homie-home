import React from 'react';
import type { NetBalance } from '../../services/financeApi';
import { formatSatangToBaht } from '../../lib/currency';

interface BalanceCardProps {
  balance: NetBalance;
  onPayPromptPay: () => void;
  onSettleVirtual?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  onPayPromptPay,
  onSettleVirtual,
}) => {
  const isSettled = balance.status === 'SETTLED' || balance.netSatang === 0;

  const getChip = () => {
    if (isSettled) {
      return { text: 'หนี้สุทธิ 0฿', bg: 'bg-stone-100 text-stone-600' };
    }
    if (balance.status === 'OWES') {
      return {
        text: `ค้างจ่าย ${formatSatangToBaht(balance.netSatang)}`,
        bg: 'bg-red-100 text-red-800',
      };
    }
    return {
      text: `รอรับ ${formatSatangToBaht(balance.netSatang)}`,
      bg: 'bg-emerald-100 text-emerald-800',
    };
  };

  const chip = getChip();

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-surface-muted shadow-sm">
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold text-text-main">{balance.name}</h3>
          {balance.isVirtual && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800">
              คนจำลอง
            </span>
          )}
        </div>
        <div className="mt-1">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${chip.bg}`}>
            {chip.text}
          </span>
        </div>
      </div>

      {!isSettled && (
        <div className="flex gap-1.5">
          {balance.isVirtual && onSettleVirtual && (
            <button
              onClick={onSettleVirtual}
              className="px-2.5 py-1.5 rounded-xl bg-purple-600 text-white text-[10px] font-bold active:scale-95 transition"
            >
              รับเงินสดแล้ว
            </button>
          )}

          {!balance.isVirtual && (
            <button
              onClick={onPayPromptPay}
              className="px-2.5 py-1.5 rounded-xl bg-brand-primary text-white text-[10px] font-bold active:scale-95 transition"
            >
              PromptPay QR
            </button>
          )}
        </div>
      )}
    </div>
  );
};
