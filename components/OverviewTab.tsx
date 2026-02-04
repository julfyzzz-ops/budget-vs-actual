
import React, { useMemo, useState } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface OverviewTabProps {
  transactions: Transaction[];
  categories: Category[];
  onCategoryClick: (categoryId: string, date: Date) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ transactions, categories, onCategoryClick }) => {
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

  // Helper to resolve budget from history
  const getBudgetForDate = (category: Category, date: Date): number => {
    if (!category.budgetHistory) return category.monthlyBudget || 0;
    const keys = Object.keys(category.budgetHistory).sort().reverse();
    const targetKey = date.toISOString().slice(0, 7);
    const effectiveKey = keys.find(k => k <= targetKey);
    return effectiveKey ? category.budgetHistory[effectiveKey] : 0;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const categoryTotals: { [key: string]: number } = {};

    filteredTransactions.forEach(t => {
      // Normalize to base currency (UAH) roughly using stored exchangeRate
      const amountInBase = t.amount * t.exchangeRate;

      if (t.type === TransactionType.INCOME) {
        income += amountInBase;
      } else if (t.type === TransactionType.EXPENSE) {
        expense += amountInBase;
      }
      
      if (!categoryTotals[t.categoryId]) categoryTotals[t.categoryId] = 0;
      categoryTotals[t.categoryId] += amountInBase;
    });

    // Process Expenses (Preserve order from categories prop)
    const expenseCategories = categories.filter(c => c.type === TransactionType.EXPENSE);
    
    // Calculate total budget dynamically for this month
    const totalBudgetExpense = expenseCategories.reduce((sum, c) => sum + getBudgetForDate(c, currentDate), 0);
    
    const expenseData = expenseCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        value: categoryTotals[cat.id] || 0,
        budget: getBudgetForDate(cat, currentDate),
        color: cat.color,
        icon: cat.icon
    }));

    // Process Income (Preserve order from categories prop)
    const incomeCategories = categories.filter(c => c.type === TransactionType.INCOME);
    const totalBudgetIncome = incomeCategories.reduce((sum, c) => sum + getBudgetForDate(c, currentDate), 0);

    const incomeData = incomeCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        value: categoryTotals[cat.id] || 0,
        budget: getBudgetForDate(cat, currentDate),
        color: cat.color,
        icon: cat.icon
    }));

    return { 
        income, 
        expense, 
        expenseData, 
        totalBudgetExpense,
        incomeData,
        totalBudgetIncome
    };
  }, [filteredTransactions, categories, currentDate]);

  const balance = stats.income - stats.expense;

  const renderCategoryList = (
      title: string, 
      data: typeof stats.expenseData, 
      totalActual: number, 
      totalBudget: number,
      HeaderIcon: React.ElementType,
      headerColorClass: string
  ) => {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 animate-fade-in">
            {/* Optimized Header: Title Left, Totals Right */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${headerColorClass} bg-opacity-10`}>
                        <HeaderIcon size={20} className={headerColorClass.replace('bg-', 'text-')} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                    </div>
               </div>
               <div className="text-right">
                    <div className="text-xl font-extrabold text-gray-900 leading-none">
                        {totalActual.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} 
                        <span className="text-sm text-gray-400 font-medium ml-1">₴</span>
                    </div>
                    {totalBudget > 0 && (
                        <div className="text-xs text-gray-400 font-medium mt-1">
                            з {totalBudget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
                        </div>
                    )}
               </div>
            </div>

            <div className="divide-y divide-gray-50">
                {data.map((item) => {
                    const percent = item.budget > 0 ? (item.value / item.budget) * 100 : 0;
                    
                    return (
                        <div 
                          key={item.id} 
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                          onClick={() => onCategoryClick(item.id, currentDate)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                {/* Icon & Name */}
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm shrink-0" 
                                        style={{ backgroundColor: item.color }}
                                    >
                                       <CategoryIcon iconName={item.icon} size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-base">{item.name}</div>
                                        {item.budget > 0 && (
                                            <div className="text-xs text-gray-400 font-medium">
                                                Ліміт: {item.budget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <div className="font-bold text-gray-900 text-base">
                                        {item.value.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-gray-400">₴</span>
                                    </div>
                                    <div className="text-xs font-bold text-gray-300 mt-0.5">
                                        {percent > 0 ? `${Math.round(percent)}%` : ''}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Progress Bar - Thicker and clearer */}
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                        width: `${Math.min(percent, 100)}%`,
                                        backgroundColor: item.color 
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
                 {data.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm italic">
                        Категорії відсутні
                    </div>
                )}
            </div>
            {/* Footer Removed as requested */}
        </div>
      );
  };

  return (
    <div className="pb-32 pt-4 px-4 h-full overflow-y-auto no-scrollbar bg-gray-50">
      
      {/* Date Control - Larger */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 capitalize">{periodLabel}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Main Balance Hero Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
          <div className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-2">
             <Wallet size={16} className="text-blue-500" /> Сальдо за місяць
          </div>
          <div className={`text-4xl font-black tracking-tight ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
             {balance > 0 ? '+' : ''}{balance.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
             <span className="text-lg text-gray-400 font-medium ml-2">UAH</span>
          </div>
      </div>

      {/* Lists */}
      {renderCategoryList(
          'Витрати', 
          stats.expenseData, 
          stats.expense, 
          stats.totalBudgetExpense,
          TrendingDown,
          'bg-red-500' // class for icon styling
      )}
      
      {renderCategoryList(
          'Доходи', 
          stats.incomeData, 
          stats.income, 
          stats.totalBudgetIncome,
          TrendingUp,
          'bg-emerald-500' // class for icon styling
      )}

    </div>
  );
};
