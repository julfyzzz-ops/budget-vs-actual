
import React, { useMemo, useState } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface OverviewTabProps {
  transactions: Transaction[];
  categories: Category[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ transactions, categories }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const periodLabel = useMemo(() => {
    return currentDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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
        if (!categoryTotals[t.categoryId]) categoryTotals[t.categoryId] = 0;
        categoryTotals[t.categoryId] += amountInBase;
      }
    });

    // Merge with category definitions to include budget info even if 0 spent
    const expenseCategories = categories.filter(c => c.type === TransactionType.EXPENSE);
    const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);

    const chartData = expenseCategories.map(cat => {
        const spent = categoryTotals[cat.id] || 0;
        return {
            id: cat.id,
            name: cat.name,
            value: spent,
            budget: cat.monthlyBudget || 0,
            color: cat.color,
            icon: cat.icon
        };
    }).sort((a, b) => b.value - a.value);

    return { income, expense, chartData, totalBudget };
  }, [filteredTransactions, categories]);

  const balance = stats.income - stats.expense;
  const budgetProgress = stats.totalBudget > 0 ? (stats.expense / stats.totalBudget) * 100 : 0;
  
  const getProgressColor = (percent: number) => {
      if (percent < 75) return 'bg-emerald-500';
      if (percent < 100) return 'bg-yellow-500';
      return 'bg-red-500';
  };

  return (
    <div className="pb-24 pt-4 px-4 space-y-6">
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
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
           <span className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
             <TrendingDown size={14} className="text-red-500" /> Витрати
           </span>
           <span className="text-xl font-bold text-gray-900">{stats.expense.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
           <span className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
             <TrendingUp size={14} className="text-emerald-500" /> Доходи
           </span>
           <span className="text-xl font-bold text-emerald-600">+{stats.income.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</span>
        </div>
      </div>

      {/* Budget vs Actual Widget */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
         <div className="flex justify-between items-end mb-2">
             <h3 className="font-bold text-gray-800">Виконання бюджету</h3>
             <span className="text-xs text-gray-500">
                 {stats.expense.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} / {stats.totalBudget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
             </span>
         </div>
         <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
             <div 
                className={`h-full transition-all duration-500 ${getProgressColor(budgetProgress)}`}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
             />
         </div>
         <div className="mt-2 text-right">
             <span className={`text-sm font-bold ${budgetProgress > 100 ? 'text-red-500' : 'text-gray-600'}`}>
                 {budgetProgress.toFixed(1)}%
             </span>
         </div>
      </div>

      {/* Detailed Spending List with Budget Bars */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Деталі по категоріям</h3>
          <div className="space-y-4">
              {stats.chartData.map((item) => {
                  const percent = item.budget > 0 ? (item.value / item.budget) * 100 : 0;
                  // Show items if they have budget OR spending
                  if (item.budget === 0 && item.value === 0) return null;

                  return (
                      <div key={item.id}>
                          <div className="flex justify-between text-sm mb-1">
                              <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                                     <CategoryIcon iconName={item.icon} size={12} />
                                  </div>
                                  <span className="text-gray-700 font-medium">{item.name}</span>
                              </div>
                              <span className="text-gray-900">
                                  {item.value.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} 
                                  <span className="text-gray-400 text-xs ml-1">
                                      / {item.budget.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                                  </span>
                              </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                  className={`h-full rounded-full ${getProgressColor(percent)}`}
                                  style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};
