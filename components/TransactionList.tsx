import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Account, Category, TransactionType, UserSettings } from '../types';
import {
  Calendar,
  Search,
  Trash2,
  Pencil,
  Lock,
  LockOpen,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { useTranslation } from '../i18n';

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  date?: Date;
}

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  initialFilters?: TransactionFilters | null;
  onResetFilters?: () => void;
  settings: UserSettings;
}

/**
 * ---------------------------
 * WebView-safe date helpers
 * ---------------------------
 */

/** One safe place for "now" */
function nowDate(): Date {
  return new Date(Date.now());
}

function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/**
 * Safe date parser:
 * - "YYYY-MM-DD" (manual parse -> local midnight)
 * - ISO strings (via Date.parse)
 * - timestamps (number / numeric string)
 * - Date
 * Returns null instead of Invalid Date
 */
function parseDateSafe(input: unknown): Date | null {
  try {
    if (input == null) return null;

    if (input instanceof Date) return isValidDate(input) ? input : null;

    if (typeof input === 'number') {
      if (!Number.isFinite(input)) return null;
      const d = new Date(input);
      return isValidDate(d) ? d : null;
    }

    if (typeof input === 'string') {
      const s = input.trim();
      if (!s) return null;

      // numeric timestamp string
      if (/^[+-]?\d+$/.test(s)) {
        const n = Number(s);
        if (!Number.isFinite(n)) return null;
        const d = new Date(n);
        return isValidDate(d) ? d : null;
      }

      // strict YYYY-MM-DD => manual (avoids WebView quirks)
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
      if (m) {
        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);

        if (
          !Number.isInteger(year) ||
          !Number.isInteger(month) ||
          !Number.isInteger(day) ||
          month < 1 ||
          month > 12 ||
          day < 1 ||
          day > 31
        ) {
          return null;
        }

        const d = new Date(year, month - 1, day);
        if (!isValidDate(d)) return null;

        // validate overflow (e.g. 2024-02-31)
        if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
          return null;
        }
        return d;
      }

      // normalize common "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
      const normalized =
        /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?/.test(s)
          ? s.replace(/\s+/, 'T')
          : s;

      const ms = Date.parse(normalized);
      if (Number.isNaN(ms)) return null;

      const d = new Date(ms);
      return isValidDate(d) ? d : null;
    }

    return null;
  } catch {
    return null;
  }
}

/** Safe locale resolver with fallback */
function safeLocale(candidate: unknown, fallback = 'uk-UA'): string {
  const loc = typeof candidate === 'string' ? candidate.trim() : '';
  if (!loc) return fallback;
  if (loc.toLowerCase() === 'locale') return fallback;

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
      new Intl.DateTimeFormat(loc);
      return loc;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function formatMonthLabelSafe(date: Date, localeCandidate: unknown): string {
  const locale = safeLocale(localeCandidate, 'uk-UA');

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
      const fmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
      return fmt.format(date).replace(' р.', '');
    }
  } catch {
    // ignore
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${mm}.${date.getFullYear()}`;
}

function startOfMonthSafe(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonthsSafe(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function monthRangeSafe(monthAnchor: Date): { start: number; endExclusive: number } {
  const start = startOfMonthSafe(monthAnchor).getTime();
  const endExclusive = addMonthsSafe(monthAnchor, 1).getTime();
  return { start, endExclusive };
}

function toDateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function transactionTimeSafe(tx: Transaction): number {
  const parsed = parseDateSafe((tx as any)?.date);
  return parsed ? parsed.getTime() : Date.now();
}

function formatDateSafe(
  input: unknown,
  localeCandidate: unknown,
  todayLabel: string
): string {
  try {
    const d = parseDateSafe(input);
    if (!d) return typeof input === 'string' ? input : '';

    const today = nowDate();
    const isSameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    if (isSameDay) return todayLabel;

    const locale = safeLocale(localeCandidate, 'uk-UA');

    try {
      if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
        const fmt = new Intl.DateTimeFormat(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        return fmt.format(d);
      }
    } catch {
      // ignore and fallback below
    }

    return d.toDateString();
  } catch {
    return typeof input === 'string' ? input : '';
  }
}

/**
 * ---------------------------
 * Component
 * ---------------------------
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  categories,
  onDelete,
  onEdit,
  initialFilters,
  onResetFilters,
  settings,
}) => {
  const { t } = useTranslation();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // month anchor always valid
  const [filterMonth, setFilterMonth] = useState<Date>(() => startOfMonthSafe(nowDate()));
  const [filterAccountId, setFilterAccountId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  useEffect(() => {
    if (!initialFilters) return;

    if (initialFilters.date && isValidDate(initialFilters.date)) {
      setFilterMonth(startOfMonthSafe(initialFilters.date));
    }
    if (initialFilters.accountId !== undefined) setFilterAccountId(initialFilters.accountId);
    if (initialFilters.categoryId !== undefined) setFilterCategoryId(initialFilters.categoryId);

    if (initialFilters.accountId || initialFilters.categoryId) setIsFilterOpen(true);

    if (onResetFilters) onResetFilters();
  }, [initialFilters, onResetFilters]);

  const resetFilters = () => {
    setFilterAccountId('');
    setFilterCategoryId('');
    if (onResetFilters) onResetFilters();
  };

  const hasActiveFilters = filterAccountId !== '' || filterCategoryId !== '';

  const prevMonth = () => setFilterMonth((m) => addMonthsSafe(m, -1));
  const nextMonth = () => setFilterMonth((m) => addMonthsSafe(m, 1));

  const localeCandidate = t('locale') as unknown;
  const resolvedLocale = safeLocale(localeCandidate, 'uk-UA');
  const todayLabel = (t('today') as string) || 'Сьогодні';

  const filteredTransactions = useMemo(() => {
    const safeTxs = Array.isArray(transactions) ? transactions : [];
    const { start, endExclusive } = monthRangeSafe(filterMonth);

    return safeTxs.filter((tx) => {
      try {
        const time = transactionTimeSafe(tx);
        if (time < start || time >= endExclusive) return false;

        if (
          filterAccountId &&
          tx.accountId !== filterAccountId &&
          tx.toAccountId !== filterAccountId
        ) {
          return false;
        }

        if (filterCategoryId && tx.categoryId !== filterCategoryId) return false;

        return true;
      } catch {
        return false;
      }
    });
  }, [transactions, filterMonth, filterAccountId, filterCategoryId]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const timeA = transactionTimeSafe(a);
      const timeB = transactionTimeSafe(b);
      return timeB - timeA;
    });
  }, [filteredTransactions]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();

    for (const tx of sortedTransactions) {
      try {
        const d = parseDateSafe((tx as any)?.date) ?? nowDate();
        const key = toDateKeyLocal(d);
        const arr = map.get(key);
        if (arr) arr.push(tx);
        else map.set(key, [tx]);
      } catch {
        const key = toDateKeyLocal(nowDate());
        const arr = map.get(key);
        if (arr) arr.push(tx);
        else map.set(key, [tx]);
      }
    }

    return map;
  }, [sortedTransactions]);

  const formatValue = (val: number) => {
    if (settings.numberFormat === 'incognito') {
      const emojis = ['🙈', '🙉', '🙊', '🤐', '🤫', '👀', '👻', '🥸', '😶‍🌫️', '😸'];
      const safeNum = Number.isFinite(val) ? val : 0;
      const strVal = Math.abs(Math.trunc(safeNum || 0)).toString();
      const emojiStr = strVal.split('').map((d) => emojis[Number(d) || 0]).join('');
      return safeNum < 0 ? '-' + emojiStr : emojiStr;
    }

    const isInteger = settings.numberFormat === 'integer';
    const safeNum = Number.isFinite(val) ? val : 0;

    try {
      return (safeNum || 0).toLocaleString('uk-UA', {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2,
      });
    } catch {
      return (safeNum || 0).toFixed(isInteger ? 0 : 2);
    }
  };

  const monthLabel = useMemo(() => {
    return formatMonthLabelSafe(filterMonth, resolvedLocale);
  }, [filterMonth, resolvedLocale]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors relative">
      {/* Fixed Header Section */}
      <div className="flex-none px-4 pt-2 pb-2 bg-gray-50 dark:bg-gray-900 z-30 relative">
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 capitalize">
            {monthLabel}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute top-20 left-4 right-4 z-20 flex items-start justify-end pointer-events-none">
        {isFilterOpen && (
          <div className="pointer-events-auto flex-1 mr-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-1.5 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in flex items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <select
                value={filterAccountId}
                onChange={(e) => setFilterAccountId(e.target.value)}
                className="w-full p-2 pl-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none truncate"
              >
                <option value="">{t('allAccounts')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-0">
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="w-full p-2 pl-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none truncate"
              >
                <option value="">{t('allCategories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pointer-events-auto shrink-0">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-lg backdrop-blur-md transition-all border ${
              isFilterOpen || hasActiveFilters
                ? 'bg-primary/90 text-white border-primary/20'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-500 border-white/20 dark:border-gray-700/50'
            }`}
          >
            <Filter size={18} />
          </button>

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-lg backdrop-blur-md transition-all border ${
              isEditMode
                ? 'bg-orange-100/90 text-orange-600 border-orange-200'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-500 border-white/20 dark:border-gray-700/50'
            }`}
          >
            {isEditMode ? <LockOpen size={18} /> : <Lock size={18} />}
          </button>
        </div>
      </div>

      {/* Scrollable Transactions List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-1">
        {sortedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600 text-center">
            <Search size={48} className="mb-4 opacity-20" />
            <p>{t('noTransactions')}</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {Array.from(grouped.entries()).map(([dateKey, items]) => (
              <div key={dateKey} className="animate-fade-in">
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur py-2 z-10 transition-colors">
                  <Calendar size={14} className="text-gray-500 dark:text-gray-600" />
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wider">
                    {formatDateSafe(dateKey, resolvedLocale, todayLabel)}
                  </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700 transition-colors">
                  {items.map((tx) => {
                    const category = categories.find((c) => c.id === tx.categoryId);
                    const account = accounts.find((a) => a.id === tx.accountId);
                    const toAccount = tx.toAccountId
                      ? accounts.find((a) => a.id === tx.toAccountId) ?? null
                      : null;

                    const isExpense = tx.type === TransactionType.EXPENSE;
                    const isTransfer = tx.type === TransactionType.TRANSFER;

                    let amountClass = 'text-gray-900 dark:text-gray-100';
                    let sign = '';

                    const safeAmount = Number.isFinite(tx.amount) ? tx.amount : 0;
                    const absAmount = Math.abs(safeAmount);

                    if (isTransfer) amountClass = 'text-blue-600 dark:text-blue-400';
                    else if (isExpense) {
                      if (safeAmount < 0) {
                        amountClass = 'text-emerald-600 dark:text-emerald-400';
                        sign = '+';
                      } else {
                        amountClass = 'text-gray-900 dark:text-gray-100';
                        sign = '-';
                      }
                    } else {
                      if (safeAmount < 0) {
                        amountClass = 'text-gray-900 dark:text-gray-100';
                        sign = '-';
                      } else {
                        amountClass = 'text-emerald-600 dark:text-emerald-400';
                        sign = '+';
                      }
                    }

                    return (
                      <div
                        key={tx.id}
                        className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          {isTransfer ? (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 bg-blue-500 shadow-sm">
                              <CategoryIcon iconName="transfer" size={20} />
                            </div>
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: category?.color || '#ccc' }}
                            >
                              <CategoryIcon iconName={category?.icon || 'help-circle'} size={20} />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2 text-sm">
                              {isTransfer ? t('fundsTransfer') : (category?.name || t('uncategorized'))}
                            </div>

                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              {isTransfer ? (
                                <span className="truncate flex items-center gap-1">
                                  {account?.name} → {toAccount?.name}
                                </span>
                              ) : (
                                <span className="truncate font-medium">{account?.name}</span>
                              )}

                              {tx.note && (
                                <>
                                  <span className="shrink-0 text-gray-300 dark:text-gray-700">•</span>
                                  <span className="italic truncate text-gray-400 dark:text-gray-500">
                                    {tx.note}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pl-2 shrink-0">
                          <div className="text-right">
                            {isTransfer && tx.toAmount != null ? (
                              <div className="flex flex-col items-end">
                                <span className="text-red-500 dark:text-red-400 font-bold text-sm">
                                  -{formatValue(absAmount)} {tx.currency}
                                </span>
                                <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">
                                  +{formatValue(tx.toAmount)} {toAccount?.currency}
                                </span>
                              </div>
                            ) : (
                              <div className={`font-bold text-base ${amountClass}`}>
                                {sign}
                                {formatValue(absAmount)}{' '}
                                <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
                                  {tx.currency}
                                </span>
                              </div>
                            )}
                          </div>

                          {isEditMode && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(tx);
                                }}
                                className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  try {
                                    if (window.confirm(t('confirmDelete'))) onDelete(tx.id);
                                  } catch {
                                    // WebView-safe: ignore if confirm is unavailable
                                  }
                                }}
                                className="p-2 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};