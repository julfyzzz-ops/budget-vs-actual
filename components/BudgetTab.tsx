
import React, { useState, useMemo } from 'react';
import { Category, TransactionType, UserSettings } from '../types';
import { Lock, LockOpen, Plus, Trash2, Pencil, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface BudgetTabProps {
  categories: Category[];
  onAddCategory: (date: Date) => void;
  onEditCategory: (category: Category, date: Date) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories: (categories: Category[]) => void;
  settings: UserSettings;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({ 
  categories, onAddCategory, onEditCategory, onDeleteCategory, onReorderCategories, settings
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const periodLabel = useMemo(() => currentDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }).replace(' р.', ''), [currentDate]);
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatValue = (val: number) => {
    const isInteger = settings.numberFormat === 'integer';
    return val.toLocaleString('uk-UA', {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2
    });
  };

  const getBudgetForDate = (category: Category, date: Date): number => {
    if (!category.budgetHistory) return category.monthlyBudget || 0;
    const keys = Object.keys(category.budgetHistory).sort().reverse();
    const targetKey = date.toISOString().slice(0, 7);
    const effectiveKey = keys.find(k => k <= targetKey);
    return effectiveKey ? category.budgetHistory[effectiveKey] : 0;
  };

  const { projectedBalance } = useMemo(() => {
    const income = categories
        .filter(c => c.type === TransactionType.INCOME)
        .reduce((sum, c) => sum + getBudgetForDate(c, currentDate), 0);
    const expense = categories
        .filter(c => c.type === TransactionType.EXPENSE)
        .reduce((sum, c) => sum + getBudgetForDate(c, currentDate), 0);
    return { projectedBalance: income - expense };
  }, [categories, currentDate]);

  const moveCategory = (index: number, direction: 'up' | 'down', groupType: TransactionType) => {
    const income = categories.filter(c => c.type === TransactionType.INCOME);
    const expense = categories.filter(c => c.type === TransactionType.EXPENSE);
    const targetGroup = groupType === TransactionType.INCOME ? income : expense;
    if (direction === 'up') {
        if (index === 0) return;
        [targetGroup[index - 1], targetGroup[index]] = [targetGroup[index], targetGroup[index - 1]];
    } else {
        if (index === targetGroup.length - 1) return;
         [targetGroup[index], targetGroup[index + 1]] = [targetGroup[index + 1], targetGroup[index]];
    }
    onReorderCategories([...income, ...expense]);
  };

  const renderCategoryGroup = (type: TransactionType, title: string, Icon: React.ElementType, headerColorClass: string) => {
    const group = categories.filter(c => c.type === type);
    const totalBudget = group.reduce((sum, c) => sum + getBudgetForDate(c, currentDate), 0);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6 animate-fade-in transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
           <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${headerColorClass} bg-opacity-10`}><Icon size={18} className={headerColorClass.replace('bg-', 'text-')} /></div>
                <div><h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">{title}</h3></div>
           </div>
           <div className="text-right whitespace-nowrap">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{formatValue(totalBudget)}</span>
           </div>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {group.map((category, index) => {
            const budgetAmount = getBudgetForDate(category, currentDate);
            return (
            <div key={category.id} className="p-3 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors relative" onClick={() => isEditMode ? onEditCategory(category, currentDate) : null}>
               <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: category.color }}><CategoryIcon iconName={category.icon} size={20} /></div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate pr-2">{category.name}</div>
               </div>
               <div className="flex items-center gap-3 shrink-0">
                   {!isEditMode && <div className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatValue(budgetAmount)}</div>}
                   {isEditMode && (
                       <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                           <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                               <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'up', type); }} disabled={index === 0} className="w-7 h-7 flex items-center justify-center text-gray-500 disabled:opacity-30 transition-all"><ArrowUp size={14} strokeWidth={2.5} /></button>
                               <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'down', type); }} disabled={index === group.length - 1} className="w-7 h-7 flex items-center justify-center text-gray-500 disabled:opacity-30 transition-all"><ArrowDown size={14} strokeWidth={2.5} /></button>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); onEditCategory(category, currentDate); }} className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full"><Pencil size={14} /></button>
                           <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Видалити?')) onDeleteCategory(category.id); }} className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full"><Trash2 size={14} /></button>
                       </div>
                   )}
               </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors relative">
        {/* Fixed Header Section (Month Selector) */}
        <div className="flex-none px-4 pt-2 pb-2 bg-gray-50 dark:bg-gray-900 z-30 relative">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 transition-colors"><ChevronLeft size={24} /></button>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 capitalize">{periodLabel}</h2>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 transition-colors"><ChevronRight size={24} /></button>
            </div>
        </div>

        {/* Floating Controls */}
        <div className="absolute top-20 left-4 right-4 z-20 flex items-start justify-end pointer-events-none">
             <div className="flex items-center gap-2 pointer-events-auto shrink-0">
                 {isEditMode && (
                     <button 
                        onClick={() => onAddCategory(currentDate)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl shadow-lg backdrop-blur-md transition-all border bg-primary/90 text-white border-primary/20 animate-fade-in"
                     >
                        <Plus size={18} />
                     </button>
                 )}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-0">
           {/* Projected Balance Card */}
           <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 text-center transition-colors animate-fade-in">
               <div className={`text-4xl font-black tracking-tight ${projectedBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
                  {projectedBalance > 0 ? '+' : ''}{formatValue(projectedBalance)}
                  <span className="text-lg text-gray-400 dark:text-gray-500 font-medium ml-2">UAH</span>
               </div>
           </div>

           {renderCategoryGroup(TransactionType.EXPENSE, 'Витрати', TrendingDown, 'bg-red-500')}
           {renderCategoryGroup(TransactionType.INCOME, 'Доходи', TrendingUp, 'bg-emerald-500')}
        </div>
    </div>
  );
};
