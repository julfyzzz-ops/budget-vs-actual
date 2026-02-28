
import React, { useState, useEffect } from 'react';
import { Account, AccountType, Currency } from '../types';
import { Button } from './ui/Button';
import { X } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Omit<Account, 'id'> | Account) => void;
  initialData?: Account;
}

const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#000000', '#6b7280'];
const ACCOUNT_ICONS = ['wallet', 'credit-card', 'banknote', 'landmark', 'piggy-bank', 'coins', 'vault', 'briefcase'];

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.UAH);
  const [initialBalance, setInitialBalance] = useState('0');
  const [type, setType] = useState<AccountType>(AccountType.CURRENT);
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('wallet');
  const [currentRate, setCurrentRate] = useState('1');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCurrency(initialData.currency);
      setInitialBalance(initialData.initialBalance.toString());
      setType(initialData.type || AccountType.CURRENT);
      setColor(initialData.color);
      setIcon(initialData.icon || 'wallet');
      setCurrentRate(initialData.currentRate?.toString() || '1');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setName('');
    setCurrency(Currency.UAH);
    setInitialBalance('0');
    setType(AccountType.CURRENT);
    setColor(COLORS[0]);
    setIcon('wallet');
    setCurrentRate('1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(initialData ? { ...initialData, name, currency, initialBalance: parseFloat(initialBalance), type, color, icon, currentRate: parseFloat(currentRate) } : { name, currency, initialBalance: parseFloat(initialBalance), type, color, icon, currentRate: parseFloat(currentRate) });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{initialData ? 'Редагувати' : 'Новий рахунок'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Назва</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary" placeholder="Назва рахунку" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Валюта</label>
              <select value={currency} onChange={(e) => { setCurrency(e.target.value as Currency); if (e.target.value === Currency.UAH) setCurrentRate('1'); }} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary">
                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Тип</label>
              <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary">
                <option value={AccountType.CURRENT}>Поточний</option>
                <option value={AccountType.SAVINGS}>Заощадження</option>
                <option value={AccountType.DEBT}>Заборгованість</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Поч. баланс</label>
                <input type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary" />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Курс до UAH</label>
                <input type="number" step="0.01" value={currentRate} disabled={currency === Currency.UAH} onChange={(e) => setCurrentRate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Іконка</label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_ICONS.map((iconKey) => (
                <button key={iconKey} type="button" onClick={() => setIcon(iconKey)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${icon === iconKey ? 'bg-emerald-50 dark:bg-emerald-900/20 text-primary ring-2 ring-primary' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><CategoryIcon iconName={iconKey} size={20} /></button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Колір</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <Button type="submit" fullWidth className="py-3 mt-4">Зберегти</Button>
        </form>
      </div>
    </div>
  );
};
