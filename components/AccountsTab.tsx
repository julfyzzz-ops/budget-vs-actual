
import React, { useState } from 'react';
import { Account, AccountType, Currency, Transaction, TransactionType } from '../types';
import { Lock, LockOpen, Trash2, Pencil, Plus, Banknote, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
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
}

export const AccountsTab: React.FC<AccountsTabProps> = ({ 
  accounts, 
  transactions,
  rates,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onSelectAccount,
  onReorderAccounts,
  onToggleVisibility
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const getBalance = (account: Account) => {
    // 1. Calculate transactions where this account is the primary source (Expense, Income to self, Transfer Out)
    const sourceTransactions = transactions.filter(t => t.accountId === account.id);
    
    // 2. Calculate transactions where this account is the destination (Transfer In)
    const destTransactions = transactions.filter(t => t.type === TransactionType.TRANSFER && t.toAccountId === account.id);

    const totalIncome = sourceTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = sourceTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransferOut = sourceTransactions
      .filter(t => t.type === TransactionType.TRANSFER)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransferIn = destTransactions.reduce((sum, t) => {
        // If the transaction has a specific toAmount (manually entered multi-currency transfer), use it.
        if (t.toAmount !== undefined) {
            return sum + t.toAmount;
        }

        // Fallback: Convert Source Amount -> UAH -> Dest Amount using global rates
        // This is less accurate for past transactions if rates changed, but kept for backward compatibility
        const amountInUAH = t.amount * t.exchangeRate;
        const destRate = rates[account.currency] || 1; 
        const amountInDestCurrency = amountInUAH / destRate;
        return sum + amountInDestCurrency;
    }, 0);
    
    return account.initialBalance + totalIncome - totalExpense - totalTransferOut + totalTransferIn;
  };

  const groupAccounts = (type: AccountType) => {
    return accounts.filter(a => (a.type || AccountType.CURRENT) === type);
  };

  const getGroupTotalInUAH = (type: AccountType) => {
    const group = groupAccounts(type);
    return group.reduce((sum, account) => {
        // Skip hidden accounts in total calculation if strictly in "view" mode, 
        // BUT usually hidden accounts still count towards net worth, they are just hidden from UI.
        // However, standard behavior for "Hide" is usually "Archive/Ignore".
        // Let's keep them in total if user wants to see them in edit mode, 
        // but typically if hidden, they shouldn't clutter the total view either.
        // Let's exclude hidden accounts from total if not in edit mode to be consistent.
        if (!isEditMode && account.isHidden) return sum;

        const balance = getBalance(account);
        // Convert to UAH approximation using GLOBAL RATES from settings
        const rate = rates[account.currency] || 1;
        const balanceInUAH = balance * rate;
        return sum + balanceInUAH;
    }, 0);
  };

  const moveAccount = (index: number, direction: 'up' | 'down', groupType: AccountType) => {
      const current = groupAccounts(AccountType.CURRENT);
      const savings = groupAccounts(AccountType.SAVINGS);
      const debt = groupAccounts(AccountType.DEBT);

      // Determine which array we are modifying
      let targetGroup: Account[] = [];
      if (groupType === AccountType.CURRENT) targetGroup = current;
      if (groupType === AccountType.SAVINGS) targetGroup = savings;
      if (groupType === AccountType.DEBT) targetGroup = debt;

      if (direction === 'up') {
          if (index === 0) return;
          [targetGroup[index - 1], targetGroup[index]] = [targetGroup[index], targetGroup[index - 1]];
      } else {
          if (index === targetGroup.length - 1) return;
          [targetGroup[index], targetGroup[index + 1]] = [targetGroup[index + 1], targetGroup[index]];
      }

      // Reconstruct full list (order matters: Current -> Savings -> Debt)
      onReorderAccounts([...current, ...savings, ...debt]);
  };

  const renderAccountGroup = (title: string, type: AccountType) => {
    let group = groupAccounts(type);
    
    // Filter hidden accounts if not in edit mode
    if (!isEditMode) {
        group = group.filter(a => !a.isHidden);
    }
    
    // Don't show empty groups unless in edit mode
    if (group.length === 0 && !isEditMode) return null;

    const totalInUAH = getGroupTotalInUAH(type);

    return (
      <div className="mb-6 animate-fade-in">
        <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
            <span className="text-sm font-bold text-gray-400">
                 {totalInUAH.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} UAH
            </span>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {group.map((account, index) => {
            const rawBalance = getBalance(account);
            // Fix for -0 display. If abs(balance) is very small, treat as 0.
            const balance = Math.abs(rawBalance) < 0.005 ? 0 : rawBalance;

            // Use global rate for display calculation
            const currentRate = rates[account.currency] || 1;
            const balanceInUAH = account.currency !== Currency.UAH 
                ? balance * currentRate
                : null;
            
            // Generate a subtle background color and border color
            // If hidden in edit mode, make it look "inactive" (grayscale or faded)
            const isHidden = !!account.isHidden;
            const bgColor = isHidden ? '#f3f4f6' : (account.color + '10'); // Gray if hidden, Color if visible
            const borderColor = isHidden ? '#9ca3af' : account.color;

            return (
              <div 
                key={account.id} 
                onClick={() => {
                    if (!isEditMode) onSelectAccount(account.id);
                }}
                className={`rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group transition-all ${!isEditMode ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''} ${isHidden ? 'opacity-75' : ''}`}
                style={{ 
                    background: `linear-gradient(110deg, white 40%, ${bgColor} 100%)`,
                    borderLeft: `5px solid ${borderColor}`
                }}
              >
                 <div className="flex items-center justify-between p-4 relative z-10">
                   {/* Left Side: Icon & Name */}
                   <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${isHidden ? 'bg-gray-400' : ''}`}
                        style={{ backgroundColor: isHidden ? undefined : account.color }}
                      >
                          <CategoryIcon iconName={account.icon || 'wallet'} size={20} />
                      </div>
                      <div className="min-w-0">
                          <h3 className={`font-bold text-base truncate pr-2 ${isHidden ? 'text-gray-500' : 'text-gray-800'}`}>
                              {account.name} {isHidden && <span className='text-xs font-normal text-gray-400'>(Приховано)</span>}
                          </h3>
                          {balanceInUAH !== null && (
                            <div className="text-xs font-medium text-gray-400 mt-0.5">
                                {balanceInUAH.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} UAH
                            </div>
                           )}
                      </div>
                   </div>

                   {/* Right Side: Balances or Controls */}
                   <div className="flex items-center gap-3 text-right shrink-0">
                        {isEditMode ? (
                           <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-full border border-gray-200 shadow-sm">
                               {/* Visibility Toggle */}
                               <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(account); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white"
                               >
                                   {account.isHidden ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-black" />}
                               </button>

                               <div className="w-px h-4 bg-gray-300 mx-1"></div>

                               {/* Reorder Controls */}
                               <button 
                                    onClick={(e) => { e.stopPropagation(); moveAccount(index, 'up', type); }}
                                    disabled={index === 0}
                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                               >
                                   <ArrowUp size={16} strokeWidth={2.5} />
                               </button>
                               <button 
                                    onClick={(e) => { e.stopPropagation(); moveAccount(index, 'down', type); }}
                                    disabled={index === group.length - 1}
                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                               >
                                   <ArrowDown size={16} strokeWidth={2.5} />
                               </button>
                               
                               <div className="w-px h-4 bg-gray-300 mx-1"></div>

                               <button 
                                    onClick={(e) => { e.stopPropagation(); onEditAccount(account); }}
                                    className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(window.confirm('Видалити цей рахунок та всі його транзакції?')) {
                                            onDeleteAccount(account.id);
                                        }
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                           </div>
                        ) : (
                            /* Main Balance Display */
                            <div className={`text-lg font-bold tracking-tight whitespace-nowrap ${balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                {balance.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                <span className="text-sm font-medium text-gray-500 ml-1">{account.currency}</span>
                            </div>
                        )}
                   </div>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32 pt-4 px-4 relative h-full overflow-y-auto no-scrollbar">
       {/* Header with Title and Edit Toggle */}
       <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-2xl font-bold text-gray-800">Рахунки</h2>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-2 rounded-full transition-all ${isEditMode ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
              {isEditMode ? <LockOpen size={20} /> : <Lock size={20} />}
          </button>
      </div>

      {renderAccountGroup('Поточні', AccountType.CURRENT)}
      {renderAccountGroup('Заощадження', AccountType.SAVINGS)}
      {renderAccountGroup('Заборгованість', AccountType.DEBT)}

      {/* Single Add Button at the bottom */}
      {isEditMode && (
          <button 
            onClick={onAddAccount}
            className="w-full py-4 mt-2 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors bg-white/50 text-lg font-medium"
          >
              <Plus size={24} className="mr-2" /> Додати рахунок
          </button>
      )}

      {/* Empty State (only if no accounts and not editing) */}
      {accounts.length === 0 && !isEditMode && (
          <div className="text-center text-gray-400 mt-10">
              <Banknote size={48} className="mx-auto mb-2 opacity-20" />
              <p>Рахунків немає</p>
          </div>
      )}
    </div>
  );
};
