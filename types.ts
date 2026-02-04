
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER' // Optional extension
}

export enum Currency {
  UAH = 'UAH',
  USD = 'USD',
  EUR = 'EUR'
}

export enum AccountType {
  CURRENT = 'CURRENT',
  DEBT = 'DEBT',
  SAVINGS = 'SAVINGS'
}

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  initialBalance: number;
  color: string;
  icon: string; // Icon name from CategoryIcon map
  type: AccountType;
  currentRate: number; // Legacy, but kept for compatibility. UI now prefers AppData.rates
  isHidden?: boolean; // New property for visibility toggle
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  monthlyBudget: number; // Deprecated: used as fallback, logic moved to budgetHistory
  budgetHistory?: Record<string, number>; // Key: "YYYY-MM", Value: Budget Amount
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  currency: Currency;
  exchangeRate: number; // Rate relative to base currency (UAH). 1 for UAH.
  accountId: string;
  toAccountId?: string; // Target account for transfers
  toAmount?: number; // Exact amount received in target account (for transfers)
  categoryId: string; // Optional for Transfer, strictly
  note?: string;
  type: TransactionType;
}

export interface AppData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  rates: Record<string, number>; // Global exchange rates (e.g., "USD": 41.5)
}

export const BASE_CURRENCY = Currency.UAH;
