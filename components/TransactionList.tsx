
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Account, Category, TransactionType } from '../types';
import { Calendar, Search, Trash2, Pencil, Lock, LockOpen, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  date?: Date; // Usually first day of the month
}

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  initialFilters?: TransactionFilters | null;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  accounts, 
  categories,
  onDelete,
  onEdit,
  initialFilters
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter States
  const [filterMonth, setFilterMonth] = useState<Date>(new Date());
  const [filterAccountId, setFilterAccountId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  // Apply initial filters when they change (navigation from other tabs)
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.date) setFilterMonth(initialFilters.date);
      if (initialFilters.accountId !== undefined) setFilterAccountId(initialFilters.accountId);
      if (initialFilters.categoryId !== undefined) setFilterCategoryId(initialFilters.categoryId);
      setShowFilters(true);
    }
  }, [initialFilters]);

  const resetFilters = () => {
    setFilterMonth(new Date());
    setFilterAccountId('');
    setFilterCategoryId('');
  };

  const prevMonth = () => {
    setFilterMonth(new Date(filterMonth.getFullYear(), filterMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setFilterMonth(new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 1));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      
      // 1. Filter by Date (Month)
      // Only apply month filter if we assume "budget view". 
      // Users might want to see "All time" for an account, but standard view is usually monthly.
      // Let's strictly follow the selected filterMonth.
      const sameMonth = tDate.getMonth() === filterMonth.getMonth() && 
                        tDate.getFullYear() === filterMonth.getFullYear();
      if (!sameMonth) return false;

      // 2. Filter by Account
      if (filterAccountId && t.accountId !== filterAccountId && t.toAccountId !== filterAccountId) {
        return false;
      }

      // 3. Filter by Category
      if (filterCategoryId && t.categoryId !== filterCategoryId) {
        return false;
      }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Сьогодні';
    return date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const monthLabel = filterMonth.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full flex flex-col">
        {/* Filters Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-20">
            {/* Month Selector */}
            <div className="flex items-center justify-between mb-3">
                 <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                    <ChevronLeft size={20} />
                 </button>
                 <span className="font-bold text-gray-800 capitalize">{monthLabel}</span>
                 <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                    <ChevronRight size={20} />
                 </button>
            </div>

            {/* Dropdowns */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <select 
                        value={filterAccountId}
                        onChange={(e) => setFilterAccountId(e.target.value)}
                        className={`w-full p-2 pl-2 pr-6 text-xs rounded-lg border appearance-none focus:ring-2 focus:ring-primary focus:outline-none ${filterAccountId ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                    >
                        <option value="">Всі рахунки</option>
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative flex-1">
                    <select 
                        value={filterCategoryId}
                        onChange={(e) => setFilterCategoryId(e.target.value)}
                         className={`w-full p-2 pl-2 pr-6 text-xs rounded-lg border appearance-none focus:ring-2 focus:ring-primary focus:outline-none ${filterCategoryId ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                    >
                        <option value="">Всі категорії</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {(filterAccountId || filterCategoryId) && (
                    <button 
                        onClick={resetFilters}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Скинути фільтри"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4 pt-2">
            {sortedTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>Транзакцій не знайдено за цими фільтрами.</p>
                    <button onClick={resetFilters} className="mt-4 text-primary text-sm font-medium hover:underline">
                        Скинути фільтри
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([date, items]: [string, Transaction[]]) => (
                        <div key={date} className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                            <Calendar size={14} className="text-gray-500" />
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {formatDate(date)}
                            </h3>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            {items.map(t => {
                            const category = categories.find(c => c.id === t.categoryId);
                            const account = accounts.find(a => a.id === t.accountId);
                            const toAccount = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
                            
                            const isExpense = t.type === TransactionType.EXPENSE;
                            const isTransfer = t.type === TransactionType.TRANSFER;

                            return (
                                <div key={t.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    {/* Icon Circle */}
                                    {isTransfer ? (
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 bg-blue-500 shadow-sm">
                                        <CategoryIcon iconName="transfer" size={20} />
                                        </div>
                                    ) : (
                                        <div 
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm`}
                                        style={{ backgroundColor: category?.color || '#ccc' }}
                                        >
                                            <CategoryIcon iconName={category?.icon || 'help-circle'} size={20} />
                                        </div>
                                    )}
                                    
                                    {/* Text Info */}
                                    <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-gray-900 truncate pr-2 text-sm">
                                        {isTransfer ? 'Переказ коштів' : (category?.name || 'Без категорії')}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        {/* Account Info */}
                                        {isTransfer ? (
                                            <span className="truncate flex items-center gap-1">
                                                {account?.name} → {toAccount?.name}
                                            </span>
                                        ) : (
                                            <span className="truncate font-medium">{account?.name}</span>
                                        )}
                                        
                                        {/* Note */}
                                        {t.note && (
                                            <>
                                                <span className="shrink-0 text-gray-300">|</span>
                                                <span className="italic truncate text-gray-400">{t.note}</span>
                                            </>
                                        )}
                                    </div>
                                    </div>
                                </div>
                                
                                {/* Amount & Actions */}
                                <div className="flex items-center gap-3 pl-2 shrink-0">
                                    <div className="text-right">
                                        {isTransfer && t.toAmount ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-red-500 font-bold text-sm">-{t.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })} {t.currency}</span>
                                                <span className="text-emerald-500 font-bold text-sm">+{t.toAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })} {toAccount?.currency}</span>
                                            </div>
                                        ) : (
                                            <div className={`font-bold text-base ${isTransfer ? 'text-blue-600' : isExpense ? 'text-gray-900' : 'text-emerald-600'}`}>
                                                {isTransfer ? '' : (isExpense ? '-' : '+')}
                                                {t.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })} 
                                                <span className="text-xs font-normal text-gray-400 ml-1">{t.currency}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {isEditMode && (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    onEdit(t);
                                                }}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if(window.confirm('Видалити цей запис?')) {
                                                        onDelete(t.id);
                                                    }
                                                }}
                                                className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
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

      {/* Lock Button - Fixed Bottom Left */}
      <div className="fixed bottom-20 left-4 z-30">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${isEditMode ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
            {isEditMode ? <LockOpen size={20} /> : <Lock size={20} />}
        </button>
      </div>
    </div>
  );
};
