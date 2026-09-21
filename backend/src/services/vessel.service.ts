import { MemoryStore } from '../types/store.js';

export class VesselService {
  static async kickMember(houseId: string, memberId: string, callerUserId: string): Promise<void> {
    const callerMember = Array.from(MemoryStore.houseMembers.values()).find(
      (m) => m.house_id === houseId && m.user_id === callerUserId
    );

    if (!callerMember || (callerMember.role !== 'OWNER' && callerMember.role !== 'ADMIN')) {
      const err = new Error('เฉพาะ Owner หรือ Admin เท่านั้นที่สามารถนำสมาชิกออกได้');
      (err as any).statusCode = 403;
      throw err;
    }

    const member = MemoryStore.houseMembers.get(memberId);
    if (!member || member.house_id !== houseId) {
      const err = new Error('ไม่พบสมาชิก');
      (err as any).statusCode = 404;
      throw err;
    }

    if (member.role === 'OWNER') {
      const err = new Error('ไม่สามารถนำหัวหน้าบ้านออกจากบ้านได้ ต้องโอนสิทธิ์ก่อน');
      (err as any).statusCode = 400;
      throw err;
    }

    // Convert to Vessel: wipe PII, unlink user_id, keep name & financial records
    let snapshotName = member.name;
    if (member.user_id) {
      const user = MemoryStore.users.get(member.user_id);
      if (user) snapshotName = user.display_name;
    }

    member.is_placeholder = true;
    member.user_id = null;
    member.avatar_url = null;
    member.invited_phone = null;
    member.name = snapshotName;
    member.updated_at = new Date().toISOString();
  }

  static async claimVessel(
    houseId: string,
    memberId: string,
    phone: string,
    debtChoice: 'ACCEPT' | 'WAIVE'
  ): Promise<void> {
    const member = MemoryStore.houseMembers.get(memberId);
    if (!member || member.house_id !== houseId || !member.is_placeholder) {
      const err = new Error('ไม่พบร่างภาชนะ (Vessel) ที่สามารถสิงร่างได้');
      (err as any).statusCode = 404;
      throw err;
    }

    const targetUserId = MemoryStore.phoneIndex.get(phone);
    if (targetUserId) {
      member.user_id = targetUserId;
      member.is_placeholder = false;
    } else {
      member.invited_phone = phone;
    }

    // If WAIVE, zero out unpaid debt
    if (debtChoice === 'WAIVE') {
      const splits = Array.from(MemoryStore.taskSplitItems.values()).filter(
        (s) => s.member_id === memberId && !s.is_paid
      );
      const now = new Date().toISOString();
      for (const s of splits) {
        s.is_paid = true;
        s.paid_at = now;
      }
    }

    member.updated_at = new Date().toISOString();
  }

  static async transferOwnership(
    houseId: string,
    callerUserId: string,
    targetUserId: string
  ): Promise<void> {
    const house = MemoryStore.houses.get(houseId);
    if (!house || house.created_by !== callerUserId) {
      const err = new Error('เฉพาะเจ้าของบ้านเท่านั้นที่สามารถโอนสิทธิ์ความเป็นเจ้าของได้');
      (err as any).statusCode = 403;
      throw err;
    }

    const currentOwnerMember = Array.from(MemoryStore.houseMembers.values()).find(
      (m) => m.house_id === houseId && m.user_id === callerUserId
    );
    const targetMember = Array.from(MemoryStore.houseMembers.values()).find(
      (m) => m.house_id === houseId && m.user_id === targetUserId
    );

    if (!targetMember) {
      const err = new Error('สมาชิกเป้าหมายไม่ได้อยู่ในบ้านนี้');
      (err as any).statusCode = 404;
      throw err;
    }

    if (currentOwnerMember) {
      currentOwnerMember.role = 'ADMIN';
    }
    targetMember.role = 'OWNER';
    house.created_by = targetUserId;
    house.updated_at = new Date().toISOString();
  }

  static async requestAccountDeletion(userId: string): Promise<{ gracePeriodDays: number }> {
    const user = MemoryStore.users.get(userId);
    if (!user) {
      const err = new Error('ไม่พบผู้ใช้');
      (err as any).statusCode = 404;
      throw err;
    }

    // Check if user is owner of any house
    const ownedHouses = Array.from(MemoryStore.houses.values()).filter(
      (h) => h.created_by === userId
    );
    if (ownedHouses.length > 0) {
      const err = new Error('คุณเป็นเจ้าของบ้าน กรุณาโอนสิทธิ์ความเป็นเจ้าของบ้านก่อนขอลบบัญชี');
      (err as any).statusCode = 400;
      throw err;
    }

    user.status = 'PENDING_DELETION';
    user.deleted_at = new Date().toISOString();
    user.updated_at = new Date().toISOString();

    return { gracePeriodDays: 30 };
  }
}
