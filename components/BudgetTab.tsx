
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
                {totalBudget.toLocaleString('uk-UA')} UAH / міс
            </span>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {group.map((category, index) => (
            <div key={category.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors relative">
               {/* Left Side: Icon & Name */}
               <div className="flex items-center gap-3 overflow-hidden">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: category.color }}
                  >
                    <CategoryIcon iconName={category.icon} size={20} />
                  </div>
                  <div className="font-bold text-gray-800 text-base truncate pr-2">
                    {category.name}
                  </div>
               </div>

               {/* Right Side: Amount & Controls */}
               <div className="flex items-center gap-3 shrink-0">
                   <div className="text-lg font-bold text-gray-900 whitespace-nowrap">
                        {category.monthlyBudget.toLocaleString('uk-UA')} <span className="text-sm font-medium text-gray-400 ml-1">UAH</span>
                   </div>

                   {isEditMode && (
                       <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                           {/* Reorder Controls - Horizontal & Round */}
                           <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-full border border-gray-100">
                               <button 
                                    onClick={() => moveCategory(index, 'up', type)}
                                    disabled={index === 0}
                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white hover:shadow-sm rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                               >
                                   <ArrowUp size={14} strokeWidth={2.5} />
                               </button>
                               <button 
                                    onClick={() => moveCategory(index, 'down', type)}
                                    disabled={index === group.length - 1}
                                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white hover:shadow-sm rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                               >
                                   <ArrowDown size={14} strokeWidth={2.5} />
                               </button>
                           </div>

                           <button 
                                onClick={() => onEditCategory(category)}
                                className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={() => {
                                    if(window.confirm(`Видалити категорію "${category.name}"? Це не видалить існуючі транзакції, але вони втратять прив'язку до категорії.`)) {
                                        onDeleteCategory(category.id);
                                    }
                                }}
                                className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                       </div>
                   )}
               </div>
            </div>
          ))}
          {group.length === 0 && (
              <div className="p-4 text-center text-gray-400 text-sm">
                  Список порожній
              </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32 pt-4 px-4 h-full overflow-y-auto no-scrollbar">
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

       {renderCategoryGroup(TransactionType.INCOME, 'Доходи', TrendingUp)}
       {renderCategoryGroup(TransactionType.EXPENSE, 'Витрати', TrendingDown)}

       {/* Single Add Button at the bottom */}
       {isEditMode && (
          <button 
            onClick={onAddCategory}
            className="w-full py-4 mt-2 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors bg-white/50 text-lg font-medium"
          >
              <Plus size={24} className="mr-2" /> Додати статтю
          </button>
      )}
    </div>
  );
};
