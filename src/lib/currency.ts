export function formatSatangToBaht(satang: number): string {
  const baht = satang / 100;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: satang % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(baht);
}

export function bahtInputToSatang(bahtStr: string): number {
  const clean = bahtStr.replace(/[^0-9.]/g, '');
  if (!clean) return 0;
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function satangToBahtNumber(satang: number): number {
  return satang / 100;
}

export function distributeFairSatangFrontend(
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
