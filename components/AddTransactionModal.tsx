
import React, { useState, useEffect, useCallback } from 'react';
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
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen, onClose, onSave, accounts, categories, initialData
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [toAmount, setToAmount] = useState(''); // New state for destination amount
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.UAH);
  const [rate, setRate] = useState('1');
  const [note, setNote] = useState('');

  // Validation State
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize form with data
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
            // Reset for new
            setType(TransactionType.EXPENSE);
            setAmount('');
            setToAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setAccountId(accounts[0]?.id || '');
            setToAccountId('');
            setCategoryId('');
            setNote('');
            setRate('1');
            setCurrency(accounts[0]?.currency || Currency.UAH);
        }
    }
  }, [isOpen, initialData, accounts]);

  const sourceAccount = accounts.find(a => a.id === accountId);
  const targetAccount = accounts.find(a => a.id === toAccountId);
  
  const isMultiCurrencyTransfer = type === TransactionType.TRANSFER && 
                                  sourceAccount && targetAccount && 
                                  sourceAccount.currency !== targetAccount.currency;

  // Real-time validation for Multi-Currency Transfers
  useEffect(() => {
    if (!isMultiCurrencyTransfer) {
        setValidationError(null);
        return;
    }

    const srcAmt = parseFloat(amount);
    const dstAmt = parseFloat(toAmount);
    const r = parseFloat(rate);

    if (!srcAmt || !dstAmt || !r) {
        setValidationError(null);
        return;
    }

    let isValid = true;
    
    // Determine expected math based on direction
    // Case 1: FX Sell (Foreign -> UAH). Rate is UAH/FX. Dst = Src * Rate.
    const isSell = sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH;
    
    // Case 2: FX Buy (UAH -> Foreign) or Cross. Rate is UAH/FX or Src/Dst. Dst = Src / Rate.
    // (Existing logic implies Rate is always "Price of Foreign in UAH" or "Src/Dst")
    
    let calculatedDest = 0;
    
    if (isSell) {
        calculatedDest = srcAmt * r;
    } else {
        calculatedDest = srcAmt / r;
    }

    // Check deviation
    const diff = Math.abs(calculatedDest - dstAmt);
    // Allow small difference (e.g. 1 unit) due to rounding
    if (diff > 1.0) {
        isValid = false;
    }

    if (!isValid) {
        setValidationError('Суми не відповідають вказаному курсу');
    } else {
        setValidationError(null);
    }

  }, [amount, toAmount, rate, isMultiCurrencyTransfer, sourceAccount, targetAccount]);

  // --- Auto-Calculation Logic ---

  const handleAmountChange = (val: string) => {
      setAmount(val);
      if (isMultiCurrencyTransfer && rate && val) {
          const s = parseFloat(val);
          const r = parseFloat(rate);
          if (!isNaN(s) && !isNaN(r) && r !== 0) {
              const isSell = sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH;
              const newTo = isSell ? s * r : s / r;
              // Format to max 2 decimals, trim trailing zeros if needed for better UX
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
              // If Sell: D = S * R => R = D / S
              // If Buy:  D = S / R => R = S / D
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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !accountId) return;
    if (type !== TransactionType.TRANSFER && !categoryId) return;
    if (type === TransactionType.TRANSFER) {
        if (!toAccountId || accountId === toAccountId) {
            alert("Будь ласка, оберіть інший рахунок для зарахування");
            return;
        }
        if (isMultiCurrencyTransfer) {
            if (!toAmount) {
                alert("Вкажіть суму зарахування");
                return;
            }
            // Allow submission with warning confirmation if strict validation fails, or just block?
            // User requested better validation, let's block if widely off.
            if (validationError) {
                if (!confirm("Суми не сходяться з курсом. Зберегти як є?")) {
                    return;
                }
            }
        }
    }

    const finalRate = parseFloat(rate);
    let statsExchangeRate = 1;
    if (sourceAccount?.currency !== Currency.UAH) {
        statsExchangeRate = finalRate;
    }

    const transactionData = {
      date: new Date(date).toISOString(),
      amount: parseFloat(amount),
      currency: currency,
      exchangeRate: statsExchangeRate,
      accountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      toAmount: (type === TransactionType.TRANSFER && toAmount) ? parseFloat(toAmount) : undefined,
      categoryId: type === TransactionType.TRANSFER ? 'transfer' : categoryId,
      note,
      type
    };

    if (initialData) {
        onSave({ ...transactionData, id: initialData.id });
    } else {
        onSave(transactionData);
    }
    
    // Reset form
    setAmount('');
    setToAmount('');
    setNote('');
    setValidationError(null);
    onClose();
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);
  
  // Auto-set currency based on account (only if not editing or explicit change)
  const handleAccountChange = (id: string) => {
    setAccountId(id);
    const acc = accounts.find(a => a.id === id);
    if (acc) {
        setCurrency(acc.currency);
        
        // Default Rate Logic
        if (acc.currency === Currency.UAH) {
            setRate('1');
        } else {
            setRate(String(acc.currentRate));
        }
        
        // If in transfer mode, ensure toAccount is not same
        if (type === TransactionType.TRANSFER && id === toAccountId) {
            setToAccountId('');
        }
    }
  };

  const handleToAccountChange = (id: string) => {
      setToAccountId(id);
      // Auto-set rate if target is foreign and source is UAH, use target's rate
      const target = accounts.find(a => a.id === id);
      const source = accounts.find(a => a.id === accountId);
      
      if (source && target && source.currency === Currency.UAH && target.currency !== Currency.UAH) {
          setRate(String(target.currentRate || 1));
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{initialData ? 'Редагувати транзакцію' : 'Нова транзакція'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
            <button 
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setType(TransactionType.EXPENSE)}
            >
                Витрата
            </button>
            <button 
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white shadow text-emerald-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setType(TransactionType.INCOME)}
            >
                Дохід
            </button>
            <button 
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.TRANSFER ? 'bg-white shadow text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setType(TransactionType.TRANSFER)}
            >
                Трансфер
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Selection */}
            {type === TransactionType.TRANSFER ? (
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">З рахунку</label>
                        <select 
                            value={accountId}
                            onChange={(e) => handleAccountChange(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-sm"
                        >
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-5 text-gray-400">
                        <ArrowRightLeft size={20} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">На рахунок</label>
                        <select 
                            value={toAccountId}
                            onChange={(e) => handleToAccountChange(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-sm"
                        >
                            <option value="">Оберіть...</option>
                            {accounts.filter(a => a.id !== accountId).map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Рахунок</label>
                    <select 
                        value={accountId}
                        onChange={(e) => handleAccountChange(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                    >
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Amounts Area */}
            {isMultiCurrencyTransfer ? (
                <div className={`p-4 rounded-xl space-y-3 border transition-colors ${validationError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex justify-between items-center text-xs font-medium">
                        <span className={validationError ? 'text-red-600' : 'text-blue-600'}>Обмін валют (Авторозрахунок)</span>
                    </div>
                    
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Списання ({sourceAccount?.currency})</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            required
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="w-full p-2 rounded-lg border border-white/50 bg-white focus:ring-2 focus:ring-primary shadow-sm"
                            placeholder="0.00"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="h-px bg-gray-300 flex-1 opacity-50"></div>
                        <div className="text-xs text-gray-500 font-mono whitespace-nowrap">
                            Курс: 1 {sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH ? sourceAccount.currency : targetAccount?.currency} =
                        </div>
                        <input 
                            type="number" 
                            step="0.0001"
                            value={rate}
                            onChange={(e) => handleRateChange(e.target.value)}
                            className="w-24 p-1 text-center text-sm rounded border border-gray-200 bg-white font-bold text-gray-700"
                        />
                         <div className="text-xs text-gray-500 font-mono">
                            {sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH ? targetAccount.currency : sourceAccount?.currency}
                        </div>
                        <div className="h-px bg-gray-300 flex-1 opacity-50"></div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Зарахування ({targetAccount?.currency})</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            required
                            value={toAmount}
                            onChange={(e) => handleToAmountChange(e.target.value)}
                             className="w-full p-2 rounded-lg border border-white/50 bg-white focus:ring-2 focus:ring-primary shadow-sm"
                            placeholder="0.00"
                        />
                    </div>
                    
                    {validationError && (
                        <div className="flex items-start gap-2 text-xs text-red-600 mt-2 bg-white/50 p-2 rounded">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span>{validationError}. Перевірте введені дані, або скоригуйте курс.</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Сума</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary text-lg font-bold"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Валюта</label>
                        <select 
                            value={currency}
                            disabled={true} 
                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary font-medium opacity-75"
                        >
                            <option value={currency}>{currency}</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Standard Exchange Rate (Non-Transfer or Same Currency logic fallback) */}
            {!isMultiCurrencyTransfer && currency !== Currency.UAH && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Курс до UAH</label>
                    <input 
                        type="number"
                        step="0.01"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                        placeholder="Курс обміну"
                    />
                </div>
            )}

            {/* Category (Hidden for Transfer) */}
            {type !== TransactionType.TRANSFER && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Категорія</label>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {filteredCategories.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCategoryId(c.id)}
                                className={`p-2 rounded-lg text-sm border transition-all flex flex-col items-center gap-1 ${categoryId === c.id ? 'border-primary bg-emerald-50 text-primary font-bold shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <div style={{ color: c.color }} className="mb-1">
                                    <CategoryIcon iconName={c.icon} size={24} />
                                </div>
                                <span className="truncate w-full text-center text-xs">{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Date */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Дата</label>
                <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Note */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Примітка (опціонально)</label>
                <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary"
                    placeholder="На що витрачено?"
                />
            </div>

            <Button type="submit" fullWidth className="py-4 mt-4 text-lg">
                Зберегти
            </Button>
        </form>
      </div>
    </div>
  );
};
