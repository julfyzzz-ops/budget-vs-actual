
import React, { useState, useMemo } from 'react';
import { Account, AccountType, Currency, Transaction, TransactionType, UserSettings } from '../types';
import { Lock, LockOpen, Trash2, Pencil, Plus, Banknote, ArrowUp, ArrowDown, Eye, EyeOff, Wallet, PiggyBank, CreditCard, Settings } from 'lucide-react';
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
  onOpenSettings: () => void;
  settings: UserSettings;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({ 
  accounts, transactions, rates, onAddAccount, onEditAccount, onDeleteAccount, onSelectAccount, onReorderAccounts, onToggleVisibility, onOpenSettings, settings
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

  const totalCapital = useMemo(() => {
    return accounts.reduce((sum, account) => {
        // If editing or hidden, we still count towards total unless that logic needs to change.
        // Usually total capital includes hidden accounts too, but let's stick to what's logical for user
        const balance = getBalance(account);
        const rate = rates[account.currency] || 1;
        return sum + (balance * rate);
    }, 0);
  }, [accounts, transactions, rates]);

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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors relative">
        {/* Fixed Header Section (Empty Card + Settings) */}
        <div className="flex-none px-4 pt-2 pb-2 bg-gray-50 dark:bg-gray-900 z-30 relative">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                 <div className="flex-1"></div> {/* Spacer to push settings to right */}
                 <button onClick={onOpenSettings} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 transition-colors">
                    <Settings size={24} />
                </button>
            </div>
        </div>

        {/* Floating Controls (Lock Button) */}
        <div className="absolute top-20 left-4 right-4 z-20 flex items-start justify-end pointer-events-none">
             <div className="flex items-center gap-2 pointer-events-auto shrink-0">
                 {isEditMode && (
                     <button 
                        onClick={onAddAccount}
                        className="w-10 h-10 flex items-center justify-center rounded-xl shadow-lg backdrop-blur-md transition-all border bg-primary/90 text-white border-primary/20 animate-fade-in"
                     >
                        <Plus size={18} />
                     </button>
                 )}
                 <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-lg backdrop-blur-md transition-all border ${
                        isEditMode
                        ? 'bg-orange-100/90 text-orange-600 border-orange-200' 
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-500 border-white/20 dark:border-gray-700/50'
                    }`}
                 >
                    {isEditMode ? <LockOpen size={18} /> : <Lock size={18} />}
                 </button>
             </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-0">
            {/* Total Capital Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 text-center transition-colors animate-fade-in">
                <div className={`text-4xl font-black tracking-tight ${totalCapital >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
                    {totalCapital > 0 ? '+' : ''}{formatValue(totalCapital)}
                    <span className="text-lg text-gray-400 dark:text-gray-500 font-medium ml-2">UAH</span>
                </div>
            </div>

            {renderAccountGroup('Поточні', AccountType.CURRENT, Wallet, 'bg-blue-500')}
            {renderAccountGroup('Заощадження', AccountType.SAVINGS, PiggyBank, 'bg-emerald-500')}
            {renderAccountGroup('Заборгованість', AccountType.DEBT, CreditCard, 'bg-red-500')}
        </div>
    </div>
  );
};
