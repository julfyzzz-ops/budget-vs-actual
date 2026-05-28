
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Account, Category, Currency, Transaction, TransactionType } from '../types';
import { Button } from './ui/Button';
import { X, ArrowRightLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { useTranslation } from '../i18n';

const safeEvaluate = (expr: string): string => {
  try {
      if (!expr) return '';
      let clean = expr.replace(/,/g, '.').replace(/[^0-9.\-+\/*%()]/g, '');
      if (!clean || clean.endsWith('+') || clean.endsWith('-') || clean.endsWith('*') || clean.endsWith('/') || clean.endsWith('%')) return '';
      // eslint-disable-next-line
      const result = new Function(`return ${clean}`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(2)).toString();
      }
  } catch(e) {}
  return '';
};

const AmountCalculatorInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}> = ({ value, onChange, className, placeholder, autoFocus, onFocus, onBlur, inputRef }) => {
  const preview = safeEvaluate(value);
  const showPreview = preview && preview !== value && /[+\-/*%]/.test(value);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`w-full ${className} ${showPreview ? 'pr-16 text-primary' : ''}`}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {showPreview && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
          = {preview}
        </span>
      )}
    </div>
  );
};

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
  const { t } = useTranslation();
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
  const [activeCalcField, setActiveCalcField] = useState<'amount' | 'toAmount' | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const toAmountInputRef = useRef<HTMLInputElement>(null);

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
    if (Math.abs(calculatedDest - dstAmt) > 1.0) setValidationError(t('ratesMismatch'));
    else setValidationError(null);
  }, [amount, toAmount, rate, isMultiCurrencyTransfer, sourceAccount, targetAccount]);

  const handleAmountChange = (val: string) => {
      setAmount(val);
      const finalVal = safeEvaluate(val) || val;
      if (isMultiCurrencyTransfer && rate && finalVal) {
          const s = parseFloat(finalVal);
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
      const finalToVal = safeEvaluate(val) || val;
      const finalAmountVal = safeEvaluate(amount) || amount;
      if (isMultiCurrencyTransfer && amount && finalToVal) {
          const s = parseFloat(finalAmountVal);
          const d = parseFloat(finalToVal);
          if (!isNaN(s) && !isNaN(d) && d !== 0 && s !== 0) {
              const isSell = sourceAccount?.currency !== Currency.UAH && targetAccount?.currency === Currency.UAH;
              const newRate = isSell ? d / s : s / d;
              setRate(parseFloat(newRate.toFixed(4)).toString());
          }
      }
  };

  const handleRateChange = (val: string) => {
      setRate(val);
      const finalAmountVal = safeEvaluate(amount) || amount;
      if (isMultiCurrencyTransfer && amount && val) {
          const s = parseFloat(finalAmountVal);
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
        if (!toAccountId || accountId === toAccountId) { alert(t('chooseOtherAcc')); return; }
        if (isMultiCurrencyTransfer && (!toAmount || (validationError && !confirm(t('saveAsIs'))))) return;
    }

    const finalAmount = parseFloat(safeEvaluate(amount) || amount);
    const finalToAmount = toAmount ? parseFloat(safeEvaluate(toAmount) || toAmount) : undefined;

    const transactionData = {
      date: new Date(date).toISOString(),
      amount: finalAmount,
      currency: currency,
      exchangeRate: sourceAccount?.currency !== Currency.UAH ? parseFloat(rate) : 1,
      accountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      toAmount: (type === TransactionType.TRANSFER && finalToAmount) ? finalToAmount : undefined,
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{initialData ? t('editTransaction') : t('addTransaction')}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg mb-6">
            <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-gray-800 shadow text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{t('expense')}</button>
            <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-gray-800 shadow text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>{t('income')}</button>
            <button type="button" onClick={() => handleTypeChange(TransactionType.TRANSFER)} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.TRANSFER ? 'bg-white dark:bg-gray-800 shadow text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>{t('transfer')}</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {type === TransactionType.TRANSFER ? (
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('fromAcc')}</label>
                        <select value={accountId} onChange={(e) => handleAccountChange(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary text-sm">
                            {visibleAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                        </select>
                    </div>
                    <div className="pt-5 text-gray-400"><ArrowRightLeft size={18} /></div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('toAcc')}</label>
                        <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary text-sm">
                            <option value="">{t('selectAcc')}</option>
                            {visibleAccounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('account')}</label>
                    <select value={accountId} onChange={(e) => handleAccountChange(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary">
                        {visibleAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                    </select>
                </div>
            )}

            {isMultiCurrencyTransfer ? (
                <div className={`p-4 rounded-xl space-y-3 border ${validationError ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'}`}>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('withdrawal')} ({sourceAccount?.currency})</label>
                        <AmountCalculatorInput value={amount} onChange={(val) => handleAmountChange(val)} className="p-2 rounded-lg bg-white dark:bg-gray-800 dark:text-white border-none shadow-sm" inputRef={amountInputRef} onFocus={() => setActiveCalcField('amount')} onBlur={() => setTimeout(() => setActiveCalcField(null), 150)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                        <input type="number" step="0.0001" value={rate} onChange={(e) => handleRateChange(e.target.value)} className="w-20 p-1 text-center text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white font-bold" />
                        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('deposit')} ({targetAccount?.currency})</label>
                        <AmountCalculatorInput value={toAmount} onChange={(val) => handleToAmountChange(val)} className="p-2 rounded-lg bg-white dark:bg-gray-800 dark:text-white border-none shadow-sm" inputRef={toAmountInputRef} onFocus={() => setActiveCalcField('toAmount')} onBlur={() => setTimeout(() => setActiveCalcField(null), 150)} />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('amount')}</label>
                        <AmountCalculatorInput value={amount} onChange={setAmount} className="p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary text-lg font-bold" placeholder="0.00" autoFocus inputRef={amountInputRef} onFocus={() => setActiveCalcField('amount')} onBlur={() => setTimeout(() => setActiveCalcField(null), 150)} />
                    </div>
                </div>
            )}

            {activeCalcField && (
                <div className="flex gap-2 animate-fade-in bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700 w-full mb-2">
                {['+', '-', '*', '/', '%', '='].map((op) => (
                    <button
                        key={op}
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            const val = activeCalcField === 'amount' ? amount : toAmount;
                            const setter = activeCalcField === 'amount' ? handleAmountChange : handleToAmountChange;
                            const ref = activeCalcField === 'amount' ? amountInputRef : toAmountInputRef;

                            if (op === '=') {
                                const exprPrev = safeEvaluate(val);
                                if (exprPrev) {
                                    setter(exprPrev);
                                }
                                setActiveCalcField(null);
                                ref.current?.blur();
                            } else {
                                setter(val + (op === '*' ? '*' : op));
                            }
                        }}
                        className="flex-1 h-12 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all flex items-center justify-center text-xl"
                    >
                    {op === '*' ? '×' : op === '/' ? '÷' : op}
                    </button>
                ))}
                </div>
            )}

            {type !== TransactionType.TRANSFER && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('category')}</label>
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
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('date')}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{t('note')}</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary" placeholder={t('notePlaceholder')} />
            </div>

            <Button type="submit" fullWidth className="py-4 mt-4 text-lg">{t('save')}</Button>
        </form>
      </div>
    </div>
  );
};
