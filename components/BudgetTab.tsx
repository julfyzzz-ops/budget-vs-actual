
import React, { useState } from 'react';
import { Category, TransactionType } from '../types';
import { Lock, LockOpen, Plus, Trash2, Pencil, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface BudgetTabProps {
  categories: Category[];
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
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
    // We assume the stored order in App.tsx doesn't strictly matter for separation, 
    // but we reconstruct it to keep them grouped nicely.
    onReorderCategories([...income, ...expense]);
  };

  const renderCategoryGroup = (type: TransactionType, title: string, Icon: React.ElementType) => {
    const group = categories.filter(c => c.type === type);
    const totalBudget = group.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);

    return (
      <div className="mb-6 animate-fade-in">
        <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Icon size={16} /> {title}
            </h3>
            <span className="text-sm font-bold text-gray-700">
                {totalBudget.toLocaleString('uk-UA')} ₴ / міс
            </span>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {group.map((category, index) => (
            <div key={category.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors relative">
               <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: category.color }}
                  >
                    <CategoryIcon iconName={category.icon} size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="text-xs text-gray-500">
                        {type === TransactionType.EXPENSE ? 'Ліміт:' : 'План:'} {category.monthlyBudget.toLocaleString()} ₴
                    </div>
                  </div>
               </div>

               {isEditMode && (
                   <div className="flex items-center gap-1">
                       {/* Reorder Controls */}
                       <div className="flex flex-col gap-1 mr-2 border-r border-gray-100 pr-2">
                           <button 
                                onClick={() => moveCategory(index, 'up', type)}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded disabled:opacity-20 disabled:hover:bg-transparent"
                           >
                               <ArrowUp size={14} />
                           </button>
                           <button 
                                onClick={() => moveCategory(index, 'down', type)}
                                disabled={index === group.length - 1}
                                className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded disabled:opacity-20 disabled:hover:bg-transparent"
                           >
                               <ArrowDown size={14} />
                           </button>
                       </div>

                       <button 
                            onClick={() => onEditCategory(category)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                        >
                            <Pencil size={16} />
                       </button>
                       <button 
                            onClick={() => {
                                if(window.confirm(`Видалити категорію "${category.name}"? Це не видалить існуючі транзакції, але вони втратять прив'язку до категорії.`)) {
                                    onDeleteCategory(category.id);
                                }
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={16} />
                       </button>
                   </div>
               )}
            </div>
          ))}
          {group.length === 0 && (
              <div className="p-4 text-center text-gray-400 text-sm">
                  Список порожній
              </div>
          )}
          {isEditMode && (
              <button 
                onClick={onAddCategory}
                className="w-full p-3 flex items-center justify-center gap-2 text-primary font-medium hover:bg-emerald-50 transition-colors"
              >
                  <Plus size={18} /> Додати статтю
              </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 pt-4 px-4 min-h-full">
       {renderCategoryGroup(TransactionType.INCOME, 'Доходи', TrendingUp)}
       {renderCategoryGroup(TransactionType.EXPENSE, 'Витрати', TrendingDown)}

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
