
import { Account, AppData, Category, Currency, TransactionType, AccountType } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Продукти', type: TransactionType.EXPENSE, icon: 'shopping-cart', color: '#ef4444', monthlyBudget: 8000 },
  { id: 'c2', name: 'Транспорт', type: TransactionType.EXPENSE, icon: 'bus', color: '#f97316', monthlyBudget: 2000 },
  { id: 'c3', name: 'Житло', type: TransactionType.EXPENSE, icon: 'home', color: '#8b5cf6', monthlyBudget: 3000 },
  { id: 'c4', name: 'Розваги', type: TransactionType.EXPENSE, icon: 'film', color: '#ec4899', monthlyBudget: 1500 },
  { id: 'c5', name: 'Здоров\'я', type: TransactionType.EXPENSE, icon: 'heart', color: '#14b8a6', monthlyBudget: 1000 },
  { id: 'c6', name: 'Зарплата', type: TransactionType.INCOME, icon: 'briefcase', color: '#10b981', monthlyBudget: 30000 },
  { id: 'c7', name: 'Подарунки', type: TransactionType.INCOME, icon: 'gift', color: '#3b82f6', monthlyBudget: 0 },
  { id: 'c8', name: 'Інше', type: TransactionType.EXPENSE, icon: 'more-horizontal', color: '#6b7280', monthlyBudget: 500 },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'Готівка', currency: Currency.UAH, initialBalance: 0, color: '#10b981', icon: 'wallet', type: AccountType.CURRENT, currentRate: 1 },
  { id: 'a2', name: 'ПриватБанк', currency: Currency.UAH, initialBalance: 0, color: '#22c55e', icon: 'credit-card', type: AccountType.CURRENT, currentRate: 1 },
  { id: 'a3', name: 'Mono White', currency: Currency.UAH, initialBalance: 0, color: '#000000', icon: 'credit-card', type: AccountType.CURRENT, currentRate: 1 },
  { id: 'a4', name: 'Готівка USD', currency: Currency.USD, initialBalance: 0, color: '#16a34a', icon: 'banknote', type: AccountType.SAVINGS, currentRate: 41.5 },
];

export const INITIAL_DATA: AppData = {
  accounts: DEFAULT_ACCOUNTS,
  categories: DEFAULT_CATEGORIES,
  transactions: [],
  rates: {
      [Currency.USD]: 41.5,
      [Currency.EUR]: 44.0,
      [Currency.UAH]: 1,
  },
  settings: {
    numberFormat: 'decimal',
    theme: 'light'
  }
};
