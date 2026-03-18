import { AppData, Currency, TransactionType } from '../types';

export interface ParsedNotification {
  amount: number;
  currency: Currency;
  type: TransactionType;
  description: string;
  accountId?: string;
  categoryId?: string;
}

export const parseNotification = (
  title: string,
  text: string,
  data: AppData
): ParsedNotification | null => {
  const fullText = `${title} ${text}`.toLowerCase();
  
  // Basic regex to find amounts like "150.00 UAH", "- 50 ₴", "1,200.50 USD"
  // This is a simplified version and might need fine-tuning based on actual bank formats
  const amountMatch = fullText.match(/(\d+[.,\s]*\d*)\s*(uah|usd|eur|₴|\$|€|грн)/i);
  
  if (!amountMatch) return null;

  // Clean up the amount string (remove spaces, replace comma with dot)
  const rawAmount = amountMatch[1].replace(/\s/g, '').replace(',', '.');
  const amount = parseFloat(rawAmount);
  
  if (isNaN(amount) || amount <= 0) return null;

  let currency = Currency.UAH;
  const rawCurrency = amountMatch[2].toLowerCase();
  if (rawCurrency.includes('usd') || rawCurrency.includes('$')) currency = Currency.USD;
  if (rawCurrency.includes('eur') || rawCurrency.includes('€')) currency = Currency.EUR;

  // Determine type (Expense by default, unless it contains income keywords)
  let type = TransactionType.EXPENSE;
  if (fullText.includes('зарахування') || fullText.includes('переказ на вашу') || fullText.includes('поповнення')) {
    type = TransactionType.INCOME;
  }

  // Find matching account rule
  let accountId: string | undefined;
  if (data.accountRules) {
    for (const rule of data.accountRules) {
      if (fullText.includes(rule.keyword.toLowerCase())) {
        accountId = rule.accountId;
        break;
      }
    }
  }

  // Find matching category rule
  let categoryId: string | undefined;
  if (data.categoryRules) {
    for (const rule of data.categoryRules) {
      if (fullText.includes(rule.keyword.toLowerCase())) {
        categoryId = rule.categoryId;
        break;
      }
    }
  }

  // Extract a rough description (usually the first few words or the whole text if short)
  let description = text.substring(0, 50);

  return {
    amount,
    currency,
    type,
    description,
    accountId,
    categoryId
  };
};
