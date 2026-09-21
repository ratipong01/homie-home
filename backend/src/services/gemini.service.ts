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

export class GeminiService {
  static async parseNaturalLanguageTask(text: string): Promise<ParsedTaskResult> {
    const cleanText = text.trim();

    // Look for amount (e.g. 3500 บาท or 3500)
    let amountSatang = 0;
    let hasExpense = false;
    const amountMatch = cleanText.match(/(\d+(?:\.\d{1,2})?)\s*(?:บาท|บ\.|THB)?/i);
    if (amountMatch && amountMatch[1]) {
      const parsedBaht = parseFloat(amountMatch[1]);
      if (!isNaN(parsedBaht) && parsedBaht > 0) {
        amountSatang = Math.round(parsedBaht * 100);
        hasExpense = true;
      }
    }

    // Look for split names after "หาร" or "แชร์"
    const splitNames: string[] = [];
    const splitMatch = cleanText.match(/(?:หาร|แชร์)\s+([^,\n]+)/);
    if (splitMatch && splitMatch[1]) {
      const rawNames = splitMatch[1].split(/(?:\s+กับ\s+|\s*,\s*|\s+และ\s+|\s+)/);
      for (const n of rawNames) {
        const trimmed = n.trim();
        if (trimmed && !['คน', 'บาท'].includes(trimmed)) {
          splitNames.push(trimmed);
        }
      }
    }

    // Default due date: tomorrow
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Extract title: remove amount and split words
    let title = cleanText
      .replace(/(?:หาร|แชร์).*/, '')
      .replace(/(\d+(?:\.\d{1,2})?)\s*(?:บาท|บ\.|THB)?/i, '')
      .trim();

    if (!title) {
      title = cleanText.slice(0, 50);
    }

    return {
      title,
      dueDate,
      amountSatang,
      hasExpense,
      splitNames,
    };
  }

  static async parseReceiptOcr(imageBase64: string): Promise<ReceiptOcrResult> {
    // Mock robust parser for OCR receipt
    return {
      totalSatang: 45000,
      merchantName: 'โฮมมี่ มาร์ท',
      subItems: [
        { title: 'น้ำยาทำความสะอาด', amountSatang: 25000 },
        { title: 'ถุงขยะ', amountSatang: 20000 },
      ],
    };
  }
}
