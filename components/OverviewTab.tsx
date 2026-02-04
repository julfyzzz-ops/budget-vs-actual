
import React, { useMemo, useState } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, ChevronRight as ChevronRightIcon, Wallet } from 'lucide-react';
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

  const renderCategoryList = (title: string, data: typeof stats.expenseData, totalActual: number, totalBudget: number) => {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">{title}</h3>
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
                            <div className="flex justify-between text-sm mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                                       <CategoryIcon iconName={item.icon} size={12} />
                                    </div>
                                    <span className="text-gray-700 font-medium">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-900 font-semibold text-xs sm:text-sm">
                                      {item.value.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} 
                                      <span className="text-gray-400 font-normal ml-1">
                                          / {item.budget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                                      </span>
                                  </span>
                                  <ChevronRightIcon size={14} className="text-gray-300" />
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full opacity-80"
                                    style={{ 
                                        width: `${Math.min(percent, 100)}%`,
                                        backgroundColor: item.color 
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Footer Total */}
            <div className="bg-gray-50 p-3 flex justify-between items-center text-sm border-t border-gray-100">
                <span className="font-bold text-gray-500">Всього</span>
                <span className="font-bold text-gray-800">
                     {totalActual.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} 
                     <span className="text-gray-400 font-normal ml-1">
                        / {totalBudget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
                     </span>
                </span>
            </div>
        </div>
      );
  };

  return (
    <div className="pb-32 pt-4 px-4 space-y-4 h-full overflow-y-auto no-scrollbar">
      {/* Date Control */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-800 capitalize">{periodLabel}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Expenses */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
           <span className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
             <TrendingDown size={12} className="text-red-500" /> Витрати
           </span>
           <span className="text-sm sm:text-base font-bold text-gray-900 break-all">
             {stats.expense.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
           </span>
        </div>
        
        {/* Income */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
           <span className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
             <TrendingUp size={12} className="text-emerald-500" /> Доходи
           </span>
           <span className="text-sm sm:text-base font-bold text-emerald-600 break-all">
             {stats.income.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
           </span>
        </div>

        {/* Net / Balance */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
           <span className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
             <Wallet size={12} className="text-blue-500" /> Сальдо
           </span>
           <span className={`text-sm sm:text-base font-bold break-all ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
             {balance > 0 ? '+' : ''}{balance.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
           </span>
        </div>
      </div>

      {/* Lists */}
      {renderCategoryList('Витрати', stats.expenseData, stats.expense, stats.totalBudgetExpense)}
      
      {renderCategoryList('Доходи', stats.incomeData, stats.income, stats.totalBudgetIncome)}

    </div>
  );
};
