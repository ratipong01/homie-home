import { MemoryStore } from '../types/store.js';
import { generatePromptPayPayload } from '../utils/promptpay.js';

export interface NetBalanceDto {
  memberId: string;
  name: string;
  isVirtual: boolean;
  netSatang: number;
  status: 'OWED' | 'OWES' | 'SETTLED';
}

export class FinanceService {
  static async getHouseBalances(houseId: string, callerUserId: string): Promise<NetBalanceDto[]> {
    const members = Array.from(MemoryStore.houseMembers.values()).filter(
      (m) => m.house_id === houseId && !m.is_deleted
    );

    // Map memberId -> netSatang
    // Positive (+): owes the house / others
    // Negative (-): is owed money by others
    const balanceMap = new Map<string, number>();
    for (const m of members) {
      balanceMap.set(m.id, 0);
    }

    // Unpaid splits
    const unpaidSplits = Array.from(MemoryStore.taskSplitItems.values()).filter(
      (s) => !s.is_paid
    );

    for (const split of unpaidSplits) {
      const task = MemoryStore.tasks.get(split.task_id);
      if (!task || task.house_id !== houseId || task.is_deleted) continue;

      // The creator paid for the task initially
      const creatorMember = members.find((m) => m.user_id === task.created_by);
      const debtorMemberId = split.member_id;

      if (creatorMember && creatorMember.id !== debtorMemberId) {
        // Debtor owes
        balanceMap.set(
          debtorMemberId,
          (balanceMap.get(debtorMemberId) || 0) + split.amount_satang
        );
        // Creator is owed
        balanceMap.set(
          creatorMember.id,
          (balanceMap.get(creatorMember.id) || 0) - split.amount_satang
        );
      }
    }

    return members.map((m) => {
      const net = balanceMap.get(m.id) || 0;
      let status: 'OWED' | 'OWES' | 'SETTLED' = 'SETTLED';
      if (net > 0) status = 'OWES';
      else if (net < 0) status = 'OWED';

      return {
        memberId: m.id,
        name: m.name,
        isVirtual: m.is_virtual,
        netSatang: Math.abs(net),
        status,
      };
    });
  }

  static async settleVirtualMember(houseId: string, virtualMemberId: string): Promise<void> {
    const member = MemoryStore.houseMembers.get(virtualMemberId);
    if (!member || member.house_id !== houseId || !member.is_virtual) {
      const err = new Error('ไม่พบคนจำลองที่ระบุ');
      (err as any).statusCode = 404;
      throw err;
    }

    // Mark all unpaid splits for this virtual member as paid
    const splits = Array.from(MemoryStore.taskSplitItems.values()).filter(
      (s) => s.member_id === virtualMemberId && !s.is_paid
    );

    const now = new Date().toISOString();
    for (const s of splits) {
      s.is_paid = true;
      s.paid_at = now;
      s.updated_at = now;
    }
  }

  static async generatePromptPayQr(
    houseId: string,
    toMemberId: string,
    amountSatang?: number
  ): Promise<{ qrPayload: string; amountBaht: number; phone: string }> {
    const member = MemoryStore.houseMembers.get(toMemberId);
    if (!member || member.house_id !== houseId) {
      const err = new Error('ไม่พบสมาชิกผู้รับเงิน');
      (err as any).statusCode = 404;
      throw err;
    }

    let phone = member.invited_phone;
    if (member.user_id) {
      const user = MemoryStore.users.get(member.user_id);
      if (user?.phone) phone = user.phone;
    }

    if (!phone) {
      const err = new Error('สมาชิกไม่มีเบอร์โทรศัพท์สำหรับ PromptPay');
      (err as any).statusCode = 400;
      throw err;
    }

    const amountBaht = amountSatang ? amountSatang / 100 : 0;
    const qrPayload = generatePromptPayPayload(phone, amountBaht);

    return {
      qrPayload,
      amountBaht,
      phone,
    };
  }
}
