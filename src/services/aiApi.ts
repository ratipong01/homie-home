import { apiFetch } from './apiClient';

export interface ParsedTaskResult {
  title: string;
  dueDate: string;
  amountSatang: number;
  hasExpense: boolean;
  splitNames: string[];
}

export interface ReceiptOcrResult {
  totalSatang: number;
  merchantName?: string;
  subItems: { title: string; amountSatang: number }[];
}

export const aiApi = {
  parseTask: async (text: string): Promise<ParsedTaskResult> => {
    return apiFetch<ParsedTaskResult>('/ai/parse-task', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  receiptOcr: async (imageBase64: string): Promise<ReceiptOcrResult> => {
    return apiFetch<ReceiptOcrResult>('/ai/receipt-ocr', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    });
  },
};
