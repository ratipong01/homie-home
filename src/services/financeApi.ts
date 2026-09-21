import { apiFetch } from './apiClient';

export interface NetBalance {
  memberId: string;
  name: string;
  isVirtual: boolean;
  netSatang: number;
  status: 'OWED' | 'OWES' | 'SETTLED';
}

export interface PromptPayQrResponse {
  qrPayload: string;
  amountBaht: number;
  phone: string;
}

export const financeApi = {
  getBalances: async (houseId: string): Promise<{ balances: NetBalance[] }> => {
    return apiFetch<{ balances: NetBalance[] }>(`/houses/${houseId}/finance/balances`);
  },

  settleVirtual: async (
    houseId: string,
    virtualMemberId: string
  ): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>(`/houses/${houseId}/finance/settle-virtual`, {
      method: 'POST',
      body: JSON.stringify({ virtualMemberId }),
    });
  },

  getPromptPayQr: async (
    houseId: string,
    toMemberId: string,
    amountSatang?: number
  ): Promise<PromptPayQrResponse> => {
    return apiFetch<PromptPayQrResponse>(`/houses/${houseId}/finance/promptpay-qr`, {
      method: 'POST',
      body: JSON.stringify({ toMemberId, amountSatang }),
    });
  },
};
