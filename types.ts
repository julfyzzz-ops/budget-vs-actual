
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
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

export interface UserSettings {
  numberFormat: 'integer' | 'decimal';
  theme: 'light' | 'dark';
}

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  initialBalance: number;
  color: string;
  icon: string;
  type: AccountType;
  currentRate: number;
  isHidden?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  monthlyBudget: number;
  budgetHistory?: Record<string, number>;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  exchangeRate: number;
  accountId: string;
  toAccountId?: string;
  toAmount?: number;
  categoryId: string;
  note?: string;
  type: TransactionType;
}

export interface AppData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  rates: Record<string, number>;
  settings: UserSettings;
}

export const BASE_CURRENCY = Currency.UAH;
