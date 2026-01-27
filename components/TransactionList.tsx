
import React, { useMemo, useState } from 'react';
import { Transaction, Account, Category, TransactionType } from '../types';
import { Calendar, Search, Trash2, Pencil, Lock, LockOpen } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  accounts, 
  categories,
  onDelete,
  onEdit
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

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

  return (
    <div className="pb-24 pt-4 px-4 space-y-4 min-h-full relative w-full">
      {/* Header Toolbar */}
      <div className="flex justify-between items-center mb-2">
         <h2 className="text-lg font-bold text-gray-800">Історія</h2>
         <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${isEditMode ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}
        >
            {isEditMode ? <><LockOpen size={14} /> Редагування</> : <><Lock size={14} /> Тільки перегляд</>}
        </button>
      </div>

      {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
            <Search size={48} className="mb-4 opacity-20" />
            <p>Немає транзакцій. Додайте першу запис!</p>
          </div>
      )}

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="animate-fade-in">
          <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50 py-2 z-10">
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
  );
};
