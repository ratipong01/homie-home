export function distributeFairSatang(
  totalSatang: number,
  memberIds: string[]
): { memberId: string; amountSatang: number }[] {
  if (memberIds.length === 0) return [];
  if (totalSatang <= 0) {
    return memberIds.map((id) => ({ memberId: id, amountSatang: 0 }));
  }

  const count = memberIds.length;
  const base = Math.floor(totalSatang / count);
  const remainder = totalSatang % count;

  return memberIds.map((id, index) => ({
    memberId: id,
    amountSatang: base + (index < remainder ? 1 : 0),
  }));
}
