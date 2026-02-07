
import React, { useState, useEffect } from 'react';
import { Category, TransactionType } from '../types';
import { Button } from './ui/Button';
import { X } from 'lucide-react';
import { CategoryIcon, ICON_MAP } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  initialData?: Category;
  targetDate?: Date;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#6b7280', '#000000'];

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, initialData, targetDate = new Date() }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [monthlyBudget, setMonthlyBudget] = useState('0');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('shopping-cart');

  const monthLabel = targetDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });

  const getBudgetForDate = (category: Category, date: Date): number => {
    if (!category.budgetHistory) return category.monthlyBudget || 0;
    const keys = Object.keys(category.budgetHistory).sort().reverse();
    const targetKey = date.toISOString().slice(0, 7);
    const effectiveKey = keys.find(k => k <= targetKey);
    return effectiveKey ? category.budgetHistory[effectiveKey] : 0;
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setMonthlyBudget(getBudgetForDate(initialData, targetDate).toString());
      setColor(initialData.color);
      setIcon(ICON_MAP[initialData.icon] ? initialData.icon : 'shopping-cart');
    } else {
      resetForm();
    }
  }, [initialData, isOpen, targetDate]);

  const resetForm = () => {
    setName('');
    setType(TransactionType.EXPENSE);
    setMonthlyBudget('0');
    setColor(COLORS[0]);
    setIcon('shopping-cart');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryData = { name, type, icon, color, monthlyBudget: parseFloat(monthlyBudget) || 0 };
    onSave(initialData ? { ...categoryData, id: initialData.id } : categoryData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{initialData ? 'Редагувати' : 'Нова категорія'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg mb-4">
                <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-gray-800 shadow text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>Витрати</button>
                <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-gray-800 shadow text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>Доходи</button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Назва</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary" placeholder="Назва статті" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Бюджет на {monthLabel}</label>
            <input type="number" step="0.01" value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Колір</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Іконка</label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto no-scrollbar">
              {Object.keys(ICON_MAP).filter(k => k !== 'transfer').map((key) => (
                <button key={key} type="button" onClick={() => setIcon(key)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${icon === key ? 'bg-emerald-50 dark:bg-emerald-900/20 text-primary ring-2 ring-primary' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><CategoryIcon iconName={key} size={20} /></button>
              ))}
            </div>
          </div>

          <Button type="submit" fullWidth className="py-3 mt-4">Зберегти</Button>
        </form>
      </div>
    </div>
  );
};
