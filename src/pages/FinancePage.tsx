import React, { useState, useEffect, useCallback } from 'react';
import type { House } from '../types';
import { financeApi, type NetBalance, type PromptPayQrResponse } from '../services/financeApi';
import { BalanceCard } from '../components/finance/BalanceCard';
import { PromptPayModal } from '../components/finance/PromptPayModal';
import { PageHeader } from '../components/common/PageHeader';

interface FinancePageProps {
  activeHouse: House | null;
  isSettleOpen?: boolean;
  onCloseSettle?: () => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({
  activeHouse,
  isSettleOpen,
  onCloseSettle,
}) => {
  const [balances, setBalances] = useState<NetBalance[]>([]);
  const [qrModalData, setQrModalData] = useState<{
    open: boolean;
    recipientName: string;
    data?: PromptPayQrResponse;
  }>({ open: false, recipientName: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!activeHouse) return;
    setIsLoading(true);
    try {
      const res = await financeApi.getBalances(activeHouse.id);
      setBalances(res.balances);
    } catch (_err) {
    } finally {
      setIsLoading(false);
    }
  }, [activeHouse]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Handle center (+) button on finance page: [ 💸 เคลียร์หนี้ ] (SPEC 4.2)
  useEffect(() => {
    if (isSettleOpen && balances.length > 0) {
      const targetBalance = balances.find((b) => b.netSatang > 0) || balances[0];
      if (targetBalance) {
        handleOpenPromptPay(targetBalance);
      }
      onCloseSettle?.();
    } else if (isSettleOpen && balances.length === 0) {
      alert('ยังไม่มีหนี้ค้างชำระในบ้านนี้');
      onCloseSettle?.();
    }
  }, [isSettleOpen, balances, onCloseSettle]);


  const handleOpenPromptPay = async (b: NetBalance) => {
    if (!activeHouse) return;
    try {
      const res = await financeApi.getPromptPayQr(activeHouse.id, b.memberId, b.netSatang);
      setQrModalData({
        open: true,
        recipientName: b.name,
        data: res,
      });
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถสร้าง QR Code ได้');
    }
  };

  const handleSettleVirtual = async (virtualMemberId: string) => {
    if (!activeHouse) return;
    await financeApi.settleVirtual(activeHouse.id, virtualMemberId);
    await fetchBalances();
  };

  if (!activeHouse) {
    return (
      <div className="p-6 text-center text-xs text-text-muted">
        กรุณาสร้างหรือเลือกบ้านก่อน
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <PageHeader
        title="สรุปการเงินในบ้าน"
        subtitle="คำนวณหนี้สุทธิ Fair Satang และเคลียร์ผ่าน PromptPay"
      />

      {isLoading && balances.length === 0 ? (
        <div className="text-center py-8 text-xs text-text-muted">กำลังคำนวณยอดเงิน...</div>
      ) : balances.length === 0 ? (
        <div className="text-center py-12 text-xs text-text-muted">
          ยังไม่มีรายการค่าใช้จ่ายในบ้านนี้
        </div>
      ) : (
        <div className="space-y-2.5">
          {balances.map((b) => (
            <BalanceCard
              key={b.memberId}
              balance={b}
              onPayPromptPay={() => handleOpenPromptPay(b)}
              onSettleVirtual={() => handleSettleVirtual(b.memberId)}
            />
          ))}
        </div>
      )}

      {/* PromptPay Modal */}
      {qrModalData.data && (
        <PromptPayModal
          isOpen={qrModalData.open}
          onClose={() => setQrModalData({ open: false, recipientName: '' })}
          qrPayload={qrModalData.data.qrPayload}
          amountBaht={qrModalData.data.amountBaht}
          recipientName={qrModalData.recipientName}
          phone={qrModalData.data.phone}
        />
      )}
    </div>
  );
};
