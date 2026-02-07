
import React, { useState } from 'react';
import { Account, AccountType, Currency, Transaction, TransactionType, UserSettings } from '../types';
import { Lock, LockOpen, Trash2, Pencil, Plus, Banknote, ArrowUp, ArrowDown, Eye, EyeOff, Wallet, PiggyBank, CreditCard } from 'lucide-react';
import { Button } from './ui/Button';
import { CategoryIcon } from './CategoryIcon';

interface AccountsTabProps {
  accounts: Account[];
  transactions: Transaction[];
  rates: Record<string, number>;
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onSelectAccount: (accountId: string) => void;
  onReorderAccounts: (accounts: Account[]) => void;
  onToggleVisibility: (account: Account) => void;
  settings: UserSettings;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({ 
  accounts, transactions, rates, onAddAccount, onEditAccount, onDeleteAccount, onSelectAccount, onReorderAccounts, onToggleVisibility, settings
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const formatValue = (val: number) => {
    const isInteger = settings.numberFormat === 'integer';
    return val.toLocaleString('uk-UA', {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2
    });
  };

  const getBalance = (account: Account) => {
    const sourceTransactions = transactions.filter(t => t.accountId === account.id);
    const destTransactions = transactions.filter(t => t.type === TransactionType.TRANSFER && t.toAccountId === account.id);
    const totalIncome = sourceTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = sourceTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const totalTransferOut = sourceTransactions.filter(t => t.type === TransactionType.TRANSFER).reduce((sum, t) => sum + t.amount, 0);
    const totalTransferIn = destTransactions.reduce((sum, t) => {
        if (t.toAmount !== undefined) return sum + t.toAmount;
        const amountInUAH = t.amount * t.exchangeRate;
        const destRate = rates[account.currency] || 1; 
        return sum + (amountInUAH / destRate);
    }, 0);
    return account.initialBalance + totalIncome - totalExpense - totalTransferOut + totalTransferIn;
  };

  const groupAccounts = (type: AccountType) => accounts.filter(a => (a.type || AccountType.CURRENT) === type);

  const getGroupTotalInUAH = (type: AccountType) => {
    const group = groupAccounts(type);
    return group.reduce((sum, account) => {
        if (!isEditMode && account.isHidden) return sum;
        const balance = getBalance(account);
        const rate = rates[account.currency] || 1;
        return sum + (balance * rate);
    }, 0);
  };

  const moveAccount = (index: number, direction: 'up' | 'down', groupType: AccountType) => {
      const current = groupAccounts(AccountType.CURRENT);
      const savings = groupAccounts(AccountType.SAVINGS);
      const debt = groupAccounts(AccountType.DEBT);
      let targetGroup: Account[] = groupType === AccountType.CURRENT ? current : groupType === AccountType.SAVINGS ? savings : debt;

      if (direction === 'up') {
          if (index === 0) return;
          [targetGroup[index - 1], targetGroup[index]] = [targetGroup[index], targetGroup[index - 1]];
      } else {
          if (index === targetGroup.length - 1) return;
          [targetGroup[index], targetGroup[index + 1]] = [targetGroup[index + 1], targetGroup[index]];
      }
      onReorderAccounts([...current, ...savings, ...debt]);
  };

  const renderAccountGroup = (title: string, type: AccountType, Icon: React.ElementType, headerColorClass: string) => {
    let group = groupAccounts(type);
    if (!isEditMode) group = group.filter(a => !a.isHidden);
    if (group.length === 0 && !isEditMode) return null;
    const totalInUAH = getGroupTotalInUAH(type);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6 animate-fade-in transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
           <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${headerColorClass} bg-opacity-10`}><Icon size={18} className={headerColorClass.replace('bg-', 'text-')} /></div>
                <div><h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">{title}</h3></div>
           </div>
           <div className="text-right whitespace-nowrap">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{formatValue(totalInUAH)} <span className="text-xs font-medium text-gray-400 ml-1">UAH</span></span>
           </div>
        </div>
        
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {group.map((account, index) => {
            const rawBalance = getBalance(account);
            const balance = Math.abs(rawBalance) < 0.005 ? 0 : rawBalance;
            const isHidden = !!account.isHidden;
            const rate = rates[account.currency] || 1;
            const balanceInUAH = balance * rate;

            return (
              <div key={account.id} onClick={() => { if (!isEditMode) onSelectAccount(account.id); }}
                className={`p-3 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors relative ${!isEditMode ? 'cursor-pointer active:bg-gray-100 dark:active:bg-gray-700' : ''} ${isHidden ? 'opacity-60 bg-gray-50 dark:bg-gray-900' : ''}`}
              >
                 <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${isHidden ? 'bg-gray-400 dark:bg-gray-600' : ''}`} style={{ backgroundColor: isHidden ? undefined : account.color }}><CategoryIcon iconName={account.icon || 'wallet'} size={20} /></div>
                    <div className="min-w-0">
                        <div className={`font-bold text-sm truncate pr-2 ${isHidden ? 'text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{account.name} {isHidden && <span className='text-[10px] font-normal text-gray-400 dark:text-gray-500 ml-2 border border-gray-200 dark:border-gray-700 px-1 rounded'>Приховано</span>}</div>
                         <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{account.currency}</div>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 shrink-0">
                      {isEditMode ? (
                         <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                             <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
                                 <button onClick={(e) => { e.stopPropagation(); moveAccount(index, 'up', type); }} disabled={index === 0} className="w-7 h-7 flex items-center justify-center text-gray-500 disabled:opacity-30 transition-all"><ArrowUp size={14} strokeWidth={2.5} /></button>
                                 <button onClick={(e) => { e.stopPropagation(); moveAccount(index, 'down', type); }} disabled={index === group.length - 1} className="w-7 h-7 flex items-center justify-center text-gray-500 disabled:opacity-30 transition-all"><ArrowDown size={14} strokeWidth={2.5} /></button>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(account); }} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${account.isHidden ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-black dark:hover:text-white border border-gray-100 dark:border-gray-700'}`}>{account.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                             <button onClick={(e) => { e.stopPropagation(); onEditAccount(account); }} className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full"><Pencil size={14} /></button>
                             <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Видалити?')) onDeleteAccount(account.id); }} className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full"><Trash2 size={14} /></button>
                         </div>
                      ) : (
                          <div className="flex flex-col items-end">
                              <div className={`font-bold text-sm whitespace-nowrap ${balance < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{formatValue(balance)} <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">{account.currency}</span></div>
                              {account.currency !== Currency.UAH && (<div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{formatValue(balanceInUAH)} UAH</div>)}
                          </div>
                      )}
                 </div>
              </div>
            );})}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32 pt-4 px-4 relative h-full overflow-y-auto no-scrollbar bg-gray-50 dark:bg-gray-900 transition-colors">
       <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Рахунки</h2>
          <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2 rounded-full transition-all ${isEditMode ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{isEditMode ? <LockOpen size={20} /> : <Lock size={20} />}</button>
      </div>
      {renderAccountGroup('Поточні', AccountType.CURRENT, Wallet, 'bg-blue-500')}
      {renderAccountGroup('Заощадження', AccountType.SAVINGS, PiggyBank, 'bg-emerald-500')}
      {renderAccountGroup('Заборгованість', AccountType.DEBT, CreditCard, 'bg-red-500')}
      {isEditMode && (<button onClick={onAddAccount} className="w-full py-4 mt-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors bg-white/50 dark:bg-gray-800/50 text-lg font-medium"><Plus size={24} className="mr-2" /> Додати рахунок</button>)}
    </div>
  );
};
