
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Account, Category, TransactionType, UserSettings } from '../types';
import { Calendar, Search, Trash2, Pencil, Lock, LockOpen, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

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

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, accounts, categories, onDelete, onEdit, initialFilters, onResetFilters, settings
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterMonth, setFilterMonth] = useState<Date>(new Date());
  const [filterAccountId, setFilterAccountId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.date) setFilterMonth(initialFilters.date);
      if (initialFilters.accountId !== undefined) setFilterAccountId(initialFilters.accountId);
      if (initialFilters.categoryId !== undefined) setFilterCategoryId(initialFilters.categoryId);
      if (onResetFilters) onResetFilters();
    }
  }, [initialFilters, onResetFilters]);

  const resetFilters = () => {
    setFilterMonth(new Date());
    setFilterAccountId('');
    setFilterCategoryId('');
    if (onResetFilters) onResetFilters();
  };

  const prevMonth = () => setFilterMonth(new Date(filterMonth.getFullYear(), filterMonth.getMonth() - 1, 1));
  const nextMonth = () => setFilterMonth(new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 1));

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const sameMonth = tDate.getMonth() === filterMonth.getMonth() && tDate.getFullYear() === filterMonth.getFullYear();
      if (!sameMonth) return false;
      if (filterAccountId && t.accountId !== filterAccountId && t.toAccountId !== filterAccountId) return false;
      if (filterCategoryId && t.categoryId !== filterCategoryId) return false;
      return true;
    });
  }, [transactions, filterMonth, filterAccountId, filterCategoryId]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  const grouped = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    sortedTransactions.forEach(t => {
      const dateKey = t.date.split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }, [sortedTransactions]);

  const formatValue = (val: number) => {
    const isInteger = settings.numberFormat === 'integer';
    return val.toLocaleString('uk-UA', {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Сьогодні';
    return date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const monthLabel = filterMonth.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm z-20 transition-colors">
            <div className="flex items-center justify-between mb-3">
                 <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><ChevronLeft size={20} /></button>
                 <span className="font-bold text-gray-800 dark:text-gray-100 capitalize">{monthLabel}</span>
                 <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><ChevronRight size={20} /></button>
            </div>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <select value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)}
                        className={`w-full p-2 pl-2 pr-6 text-xs rounded-lg border appearance-none focus:ring-2 focus:ring-primary focus:outline-none ${filterAccountId ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                    >
                        <option value="">Всі рахунки</option>
                        {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>
                </div>
                <div className="relative flex-1">
                    <select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}
                         className={`w-full p-2 pl-2 pr-6 text-xs rounded-lg border appearance-none focus:ring-2 focus:ring-primary focus:outline-none ${filterCategoryId ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                    >
                        <option value="">Всі категорії</option>
                        {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                </div>
                {(filterAccountId || filterCategoryId) && (
                    <button onClick={resetFilters} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><X size={16} /></button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4 pt-2">
            {sortedTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600 text-center">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>Транзакцій не знайдено.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Fix: Explicitly cast Object.entries(grouped) to [string, Transaction[]][] to fix "Property 'map' does not exist on type 'unknown'" */}
                    {(Object.entries(grouped) as [string, Transaction[]][]).map(([date, items]) => (
                        <div key={date} className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur py-2 z-10 transition-colors">
                            <Calendar size={14} className="text-gray-500 dark:text-gray-600" />
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wider">{formatDate(date)}</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700 transition-colors">
                            {items.map(t => {
                            const category = categories.find(c => c.id === t.categoryId);
                            const account = accounts.find(a => a.id === t.accountId);
                            const toAccount = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
                            const isExpense = t.type === TransactionType.EXPENSE;
                            const isTransfer = t.type === TransactionType.TRANSFER;
                            let amountClass = 'text-gray-900 dark:text-gray-100';
                            let sign = '';
                            const absAmount = Math.abs(t.amount);

                            if (isTransfer) amountClass = 'text-blue-600 dark:text-blue-400';
                            else if (isExpense) {
                                if (t.amount < 0) { amountClass = 'text-emerald-600 dark:text-emerald-400'; sign = '+'; }
                                else { amountClass = 'text-gray-900 dark:text-gray-100'; sign = '-'; }
                            } else {
                                if (t.amount < 0) { amountClass = 'text-gray-900 dark:text-gray-100'; sign = '-'; }
                                else { amountClass = 'text-emerald-600 dark:text-emerald-400'; sign = '+'; }
                            }

                            return (
                                <div key={t.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    {isTransfer ? (
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 bg-blue-500 shadow-sm"><CategoryIcon iconName="transfer" size={20} /></div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: category?.color || '#ccc' }}><CategoryIcon iconName={category?.icon || 'help-circle'} size={20} /></div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2 text-sm">{isTransfer ? 'Переказ коштів' : (category?.name || 'Без категорії')}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                            {isTransfer ? <span className="truncate flex items-center gap-1">{account?.name} → {toAccount?.name}</span> : <span className="truncate font-medium">{account?.name}</span>}
                                            {t.note && <><span className="shrink-0 text-gray-300 dark:text-gray-700">|</span><span className="italic truncate text-gray-400 dark:text-gray-500">{t.note}</span></>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pl-2 shrink-0">
                                    <div className="text-right">
                                        {isTransfer && t.toAmount ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-red-500 dark:text-red-400 font-bold text-sm">-{formatValue(absAmount)} {t.currency}</span>
                                                <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">+{formatValue(t.toAmount)} {toAccount?.currency}</span>
                                            </div>
                                        ) : (
                                            <div className={`font-bold text-base ${amountClass}`}>
                                                {sign}{formatValue(absAmount)} <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">{t.currency}</span>
                                            </div>
                                        )}
                                    </div>
                                    {isEditMode && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full"><Pencil size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Видалити?')) onDelete(t.id); }} className="p-2 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full"><Trash2 size={16} /></button>
                                        </div>
                                    )}
                                </div>
                                </div>
                            );})}
                        </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      <div className="fixed bottom-28 left-4 z-30">
        <button onClick={() => setIsEditMode(!isEditMode)} className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${isEditMode ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
            {isEditMode ? <LockOpen size={20} /> : <Lock size={20} />}
        </button>
      </div>
    </div>
  );
};
