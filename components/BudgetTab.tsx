
import React, { useState, useMemo } from 'react';
import { Category, TransactionType } from '../types';
import { Lock, LockOpen, Plus, Trash2, Pencil, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface BudgetTabProps {
  categories: Category[];
  onAddCategory: (date: Date) => void;
  onEditCategory: (category: Category, date: Date) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories: (categories: Category[]) => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({ 
  categories, 
  onAddCategory, 
  onEditCategory, 
  onDeleteCategory,
  onReorderCategories
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const periodLabel = useMemo(() => {
    return currentDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }).replace(' р.', '');
  }, [currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper to resolve budget for a specific date from history
  const getBudgetForDate = (category: Category, date: Date): number => {
    if (!category.budgetHistory) return category.monthlyBudget || 0;
    
    // Sort keys (YYYY-MM) descending
    const keys = Object.keys(category.budgetHistory).sort().reverse();
    const targetKey = date.toISOString().slice(0, 7); // YYYY-MM
    
    // Find first key <= targetKey
    const effectiveKey = keys.find(k => k <= targetKey);
    
    if (effectiveKey) return category.budgetHistory[effectiveKey];
    
    return 0;
  };

  const moveCategory = (index: number, direction: 'up' | 'down', groupType: TransactionType) => {
    const income = categories.filter(c => c.type === TransactionType.INCOME);
    const expense = categories.filter(c => c.type === TransactionType.EXPENSE);
    
    // We only modify the group corresponding to the type
    const targetGroup = groupType === TransactionType.INCOME ? income : expense;
    
    if (direction === 'up') {
        if (index === 0) return;
        [targetGroup[index - 1], targetGroup[index]] = [targetGroup[index], targetGroup[index - 1]];
    } else {
        if (index === targetGroup.length - 1) return;
         [targetGroup[index], targetGroup[index + 1]] = [targetGroup[index + 1], targetGroup[index]];
    }
    
    // Combine back to form the full list (maintaining Income then Expense order, or vice versa)
    onReorderCategories([...income, ...expense]);
  };

  const renderCategoryGroup = (
      type: TransactionType, 
      title: string, 
      Icon: React.ElementType,
      headerColorClass: string
  ) => {
    const group = categories.filter(c => c.type === type);
    
    // Calculate totals based on CURRENT view month
    const totalBudget = group.reduce((sum, c) => sum + getBudgetForDate(c, currentDate), 0);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 animate-fade-in">
        {/* Header: Title Left, Totals Right (Matching Overview Style) */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${headerColorClass} bg-opacity-10`}>
                    <Icon size={18} className={headerColorClass.replace('bg-', 'text-')} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                </div>
           </div>
           <div className="text-right whitespace-nowrap">
                <span className="text-lg font-bold text-gray-900 leading-none">
                    {totalBudget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                </span>
           </div>
        </div>

        <div className="divide-y divide-gray-50">
          {group.map((category, index) => {
            const budgetAmount = getBudgetForDate(category, currentDate);
            
            return (
            <div 
                key={category.id} 
                className="p-3 flex items-center justify-between group hover:bg-gray-50 transition-colors relative"
                onClick={() => isEditMode ? onEditCategory(category, currentDate) : null}
            >
               {/* Left Side: Icon & Name */}
               <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: category.color }}
                  >
                    <CategoryIcon iconName={category.icon} size={20} />
                  </div>
                  <div className="font-bold text-gray-800 text-sm truncate pr-2">
                    {category.name}
                  </div>
               </div>

               {/* Right Side: Amount & Controls */}
               <div className="flex items-center gap-3 shrink-0">
                   {!isEditMode && (
                       <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                            {budgetAmount.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                       </div>
                   )}

                   {isEditMode ? (
                       <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                           {/* Reorder Controls */}
                           <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                               <button 
                                    onClick={(e) => { e.stopPropagation(); moveCategory(index, 'up', type); }}
                                    disabled={index === 0}
                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white hover:shadow-sm rounded bg-transparent disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                               >
                                   <ArrowUp size={14} strokeWidth={2.5} />
                               </button>
                               <button 
                                    onClick={(e) => { e.stopPropagation(); moveCategory(index, 'down', type); }}
                                    disabled={index === group.length - 1}
                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white hover:shadow-sm rounded bg-transparent disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                               >
                                   <ArrowDown size={14} strokeWidth={2.5} />
                               </button>
                           </div>

                           <button 
                                onClick={(e) => { e.stopPropagation(); onEditCategory(category, currentDate); }}
                                className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(window.confirm(`Видалити категорію "${category.name}"? Це не видалить існуючі транзакції.`)) {
                                        onDeleteCategory(category.id);
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                       </div>
                   ) : (
                       /* Show nothing extra in non-edit mode, just the amount above */
                       null
                   )}
               </div>
            </div>
            );
          })}
          {group.length === 0 && (
              <div className="p-4 text-center text-gray-400 text-xs italic">
                  Категорії відсутні
              </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32 pt-2 px-4 h-full overflow-y-auto no-scrollbar bg-gray-50">
       {/* Date Control - Compact */}
       <div className="flex items-center justify-between bg-white p-2 mb-2 rounded-xl shadow-sm border border-gray-100">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-800 capitalize">{periodLabel}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

       {/* Header with Title and Edit Toggle */}
       <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-2xl font-bold text-gray-800">Бюджет</h2>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-2 rounded-full transition-all ${isEditMode ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
              {isEditMode ? <LockOpen size={20} /> : <Lock size={20} />}
          </button>
      </div>

       {renderCategoryGroup(TransactionType.INCOME, 'Доходи', TrendingUp, 'bg-emerald-500')}
       {renderCategoryGroup(TransactionType.EXPENSE, 'Витрати', TrendingDown, 'bg-red-500')}

       {/* Single Add Button at the bottom */}
       {isEditMode && (
          <button 
            onClick={() => onAddCategory(currentDate)}
            className="w-full py-4 mt-2 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors bg-white/50 text-lg font-medium"
          >
              <Plus size={24} className="mr-2" /> Додати статтю
          </button>
      )}
    </div>
  );
};
