
import React, { useState, useEffect, useMemo } from 'react';
import { Account, Category, Currency, Transaction, TransactionType } from '../types';
import { Button } from './ui/Button';
import { X, ArrowRightLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
  accounts: Account[];
  categories: Category[];
  initialData?: Transaction;
  rates?: Record<string, number>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen, onClose, onSave, accounts, categories, initialData, rates
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [toAmount, setToAmount] = useState(''); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.UAH);
  const [rate, setRate] = useState('1');
  const [note, setNote] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  const visibleAccounts = useMemo(() => {
    return accounts.filter(a => !a.isHidden || (initialData && (a.id === initialData.accountId || (initialData.type === TransactionType.TRANSFER && a.id === initialData.toAccountId))));
  }, [accounts, initialData]);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setType(initialData.type);
            setAmount(initialData.amount.toString());
            setDate(initialData.date.split('T')[0]);
            setAccountId(initialData.accountId);
            setCurrency(initialData.currency);
            setRate(initialData.exchangeRate.toString());
            setNote(initialData.note || '');
            
            if (initialData.type === TransactionType.TRANSFER) {
                setToAccountId(initialData.toAccountId || '');
                setToAmount(initialData.toAmount ? initialData.toAmount.toString() : '');
                setCategoryId('');
            } else {
                setCategoryId(initialData.categoryId);
                setToAccountId('');
                setToAmount('');
            }
        } else {
            setType(TransactionType.EXPENSE);
            setAmount('');
            setToAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            
            const activeAccounts = accounts.filter(a => !a.isHidden);
            const defaultAcc = activeAccounts[0] || accounts[0];
            setAccountId(defaultAcc?.id || '');
            setCurrency(defaultAcc?.currency || Currency.UAH);
            
            if (rates && defaultAcc?.currency !== Currency.UAH) {
                setRate(rates[defaultAcc.currency]?.toString() || '1');
            } else {
                setRate('1');
            }

            setToAccountId('');
            const defaultCat = categories.find(c => c.type === TransactionType.EXPENSE);
            setCategoryId(defaultCat?.id || '');
            setNote('');
        }
    }
  }, [isOpen, initialData, accounts, rates, categories]);

  const sourceAccount = accounts.find(a => a.id === accountId);
  const targetAccount = accounts.find(a => a.id === toAccountId);
  const isMultiCurrencyTransfer = type === TransactionType.TRANSFER && sourceAccount && targetAccount && sourceAccount.currency !== targetAccount.currency;

  useEffect(() => {
    if (!isMultiCurrencyTransfer) {
        setValidationError(null);
        return;
    }
    const srcAmt = parseFloat(amount);
    const dstAmt = parseFloat(toAmount);
    const r = parseFloat(rate);
    if (!srcAmt || !dstAmt || !r) { setValidationError(null); return; }

    const isSell = sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH;
    let calculatedDest = isSell ? srcAmt * r : srcAmt / r;
    if (Math.abs(calculatedDest - dstAmt) > 1.0) setValidationError('Суми не відповідають вказаному курсу');
    else setValidationError(null);
  }, [amount, toAmount, rate, isMultiCurrencyTransfer, sourceAccount, targetAccount]);

  const handleAmountChange = (val: string) => {
      setAmount(val);
      if (isMultiCurrencyTransfer && rate && val) {
          const s = parseFloat(val);
          const r = parseFloat(rate);
          if (!isNaN(s) && !isNaN(r) && r !== 0) {
              const isSell = sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH;
              const newTo = isSell ? s * r : s / r;
              setToAmount(parseFloat(newTo.toFixed(2)).toString());
          }
      }
  };

  const handleToAmountChange = (val: string) => {
      setToAmount(val);
      if (isMultiCurrencyTransfer && amount && val) {
          const s = parseFloat(amount);
          const d = parseFloat(val);
          if (!isNaN(s) && !isNaN(d) && d !== 0 && s !== 0) {
              const isSell = sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH;
              const newRate = isSell ? d / s : s / d;
              setRate(parseFloat(newRate.toFixed(4)).toString());
          }
      }
  };

  const handleRateChange = (val: string) => {
      setRate(val);
      if (isMultiCurrencyTransfer && amount && val) {
          const s = parseFloat(amount);
          const r = parseFloat(val);
          if (!isNaN(s) && !isNaN(r) && r !== 0) {
              const isSell = sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH;
              const newTo = isSell ? s * r : s / r;
              setToAmount(parseFloat(newTo.toFixed(2)).toString());
          }
      }
  };

  const handleTypeChange = (newType: TransactionType) => {
      setType(newType);
      if (newType !== TransactionType.TRANSFER) {
          const firstCat = categories.find(c => c.type === newType);
          setCategoryId(firstCat?.id || '');
      } else {
          setCategoryId('');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    if (type !== TransactionType.TRANSFER && !categoryId) return;
    if (type === TransactionType.TRANSFER) {
        if (!toAccountId || accountId === toAccountId) { alert("Оберіть інший рахунок"); return; }
        if (isMultiCurrencyTransfer && (!toAmount || (validationError && !confirm("Зберегти як є?")))) return;
    }

    const transactionData = {
      date: new Date(date).toISOString(),
      amount: parseFloat(amount),
      currency: currency,
      exchangeRate: sourceAccount?.currency !== Currency.UAH ? parseFloat(rate) : 1,
      accountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      toAmount: (type === TransactionType.TRANSFER && toAmount) ? parseFloat(toAmount) : undefined,
      categoryId: type === TransactionType.TRANSFER ? 'transfer' : categoryId,
      note,
      type
    };

    onSave(initialData ? { ...transactionData, id: initialData.id } : transactionData);
    onClose();
  };

  if (!isOpen) return null;
  const filteredCategories = categories.filter(c => c.type === type);
  
  const handleAccountChange = (id: string) => {
    setAccountId(id);
    const acc = accounts.find(a => a.id === id);
    if (acc) {
        setCurrency(acc.currency);
        setRate(acc.currency === Currency.UAH ? '1' : (rates?.[acc.currency]?.toString() || String(acc.currentRate)));
        if (type === TransactionType.TRANSFER && id === toAccountId) setToAccountId('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[95vh] transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{initialData ? 'Редагувати' : 'Нова транзакція'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg mb-6">
            <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-gray-800 shadow text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>Витрата</button>
            <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-gray-800 shadow text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>Дохід</button>
            <button type="button" onClick={() => handleTypeChange(TransactionType.TRANSFER)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.TRANSFER ? 'bg-white dark:bg-gray-800 shadow text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>Трансфер</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {type === TransactionType.TRANSFER ? (
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">З рахунку</label>
                        <select value={accountId} onChange={(e) => handleAccountChange(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary text-sm">
                            {visibleAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                        </select>
                    </div>
                    <div className="pt-5 text-gray-400"><ArrowRightLeft size={18} /></div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">На рахунок</label>
                        <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary text-sm">
                            <option value="">Оберіть...</option>
                            {visibleAccounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Рахунок</label>
                    <select value={accountId} onChange={(e) => handleAccountChange(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary">
                        {visibleAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                    </select>
                </div>
            )}

            {isMultiCurrencyTransfer ? (
                <div className={`p-4 rounded-xl space-y-3 border ${validationError ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'}`}>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Списання ({sourceAccount?.currency})</label>
                        <input type="number" step="0.01" required value={amount} onChange={(e) => handleAmountChange(e.target.value)} className="w-full p-2 rounded-lg bg-white dark:bg-gray-800 dark:text-white border-none shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                        <input type="number" step="0.0001" value={rate} onChange={(e) => handleRateChange(e.target.value)} className="w-20 p-1 text-center text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold" />
                        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Зарахування ({targetAccount?.currency})</label>
                        <input type="number" step="0.01" required value={toAmount} onChange={(e) => handleToAmountChange(e.target.value)} className="w-full p-2 rounded-lg bg-white dark:bg-gray-800 dark:text-white border-none shadow-sm" />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Сума</label>
                        <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary text-lg font-bold" placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Валюта</label>
                        <div className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 font-bold">{currency}</div>
                    </div>
                </div>
            )}

            {type !== TransactionType.TRANSFER && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Категорія</label>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                        {filteredCategories.map(c => (
                            <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} className={`p-2 rounded-lg text-xs border transition-all flex flex-col items-center gap-1 ${categoryId === c.id ? 'border-primary bg-emerald-50 dark:bg-emerald-900/20 text-primary font-bold' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                <div style={{ color: c.color }}><CategoryIcon iconName={c.icon} size={24} /></div>
                                <span className="truncate w-full text-center">{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Дата</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Примітка</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary" placeholder="Додаткова інформація" />
            </div>

            <Button type="submit" fullWidth className="py-4 mt-4 text-lg">Зберегти</Button>
        </form>
      </div>
    </div>
  );
};
