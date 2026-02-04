
import React, { useMemo, useState } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
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
            {/* Header: Title Left, Totals Right */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${headerColorClass} bg-opacity-10`}>
                        <HeaderIcon size={18} className={headerColorClass.replace('bg-', 'text-')} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                    </div>
               </div>
               <div className="text-right whitespace-nowrap">
                    <span className="text-lg font-bold text-gray-900 leading-none">
                        {totalActual.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} 
                    </span>
                    {totalBudget > 0 && (
                        <>
                            <span className="text-gray-400 mx-1 text-lg font-light">/</span>
                            <span className="text-gray-900 text-lg font-bold">
                                {totalBudget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                            </span>
                        </>
                    )}
               </div>
            </div>

            <div className="divide-y divide-gray-50">
                {data.map((item) => {
                    const percent = item.budget > 0 ? (item.value / item.budget) * 100 : 0;
                    
                    return (
                        <div 
                          key={item.id} 
                          className="p-3 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                          onClick={() => onCategoryClick(item.id, currentDate)}
                        >
                            <div className="flex items-center gap-3">
                                {/* Icon */}
                                <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm shrink-0" 
                                    style={{ backgroundColor: item.color }}
                                >
                                   <CategoryIcon iconName={item.icon} size={20} />
                                </div>
                                
                                {/* Right Content Area */}
                                <div className="flex-1 min-w-0">
                                    {/* Top Row: Name and Numbers */}
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="font-bold text-gray-800 text-sm truncate pr-2">
                                            {item.name}
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            <span className="font-bold text-gray-900 text-sm">
                                                {item.value.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                                            </span>
                                            {item.budget > 0 && (
                                                <>
                                                    <span className="text-gray-400 mx-1 text-sm font-light">/</span>
                                                    <span className="text-gray-900 font-bold text-sm">
                                                        {item.budget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Row: Progress Bar */}
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ 
                                                width: item.budget > 0 ? `${Math.min(percent, 100)}%` : '0%',
                                                backgroundColor: item.color 
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {data.length === 0 && (
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
      <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm mb-2 border border-gray-100">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-800 capitalize">{periodLabel}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Main Balance Hero Card - Compact */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-4 text-center">
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
