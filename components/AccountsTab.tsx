
import React, { useState } from 'react';
import { Account, AccountType, Currency, Transaction, TransactionType } from '../types';
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
        // Skip hidden accounts in total calculation if strictly in "view" mode
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

  const renderAccountGroup = (
      title: string, 
      type: AccountType,
      Icon: React.ElementType,
      headerColorClass: string
  ) => {
    let group = groupAccounts(type);
    
    // Filter hidden accounts if not in edit mode
    if (!isEditMode) {
        group = group.filter(a => !a.isHidden);
    }
    
    // Don't show empty groups unless in edit mode
    if (group.length === 0 && !isEditMode) return null;

    const totalInUAH = getGroupTotalInUAH(type);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 animate-fade-in">
        {/* Header: Title Left, Totals Right (Matching Overview/Budget Style) */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${headerColorClass} bg-opacity-10`}>
                    <Icon size={18} className={headerColorClass.replace('bg-', 'text-')} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                </div>
           </div>
           <div className="text-right whitespace-nowrap">
                <span className="text-lg font-bold text-gray-900 leading-none">
                    {totalInUAH.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} 
                    <span className="text-xs font-medium text-gray-400 ml-1">UAH</span>
                </span>
           </div>
        </div>
        
        <div className="divide-y divide-gray-50">
          {group.map((account, index) => {
            const rawBalance = getBalance(account);
            const balance = Math.abs(rawBalance) < 0.005 ? 0 : rawBalance;
            const isHidden = !!account.isHidden;
            
            // Calculate UAH equivalent for foreign currencies
            const rate = rates[account.currency] || 1;
            const balanceInUAH = balance * rate;

            return (
              <div 
                key={account.id} 
                onClick={() => {
                    if (!isEditMode) onSelectAccount(account.id);
                }}
                className={`p-3 flex items-center justify-between group hover:bg-gray-50 transition-colors relative ${!isEditMode ? 'cursor-pointer active:bg-gray-100' : ''} ${isHidden ? 'opacity-60 bg-gray-50' : ''}`}
              >
                 {/* Left Side: Icon & Name */}
                 <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${isHidden ? 'bg-gray-400' : ''}`}
                      style={{ backgroundColor: isHidden ? undefined : account.color }}
                    >
                        <CategoryIcon iconName={account.icon || 'wallet'} size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className={`font-bold text-sm truncate pr-2 ${isHidden ? 'text-gray-500' : 'text-gray-800'}`}>
                            {account.name} 
                            {isHidden && <span className='text-[10px] font-normal text-gray-400 ml-2 border border-gray-200 px-1 rounded'>Приховано</span>}
                        </div>
                         {/* Show currency badge */}
                         <div className="text-xs text-gray-400 font-medium">
                            {account.currency}
                         </div>
                    </div>
                 </div>

                 {/* Right Side: Balances or Controls */}
                 <div className="flex items-center gap-3 shrink-0">
                      {isEditMode ? (
                         <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                             {/* Reorder Controls */}
                             <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                 <button 
                                      onClick={(e) => { e.stopPropagation(); moveAccount(index, 'up', type); }}
                                      disabled={index === 0}
                                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white hover:shadow-sm rounded bg-transparent disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                 >
                                     <ArrowUp size={14} strokeWidth={2.5} />
                                 </button>
                                 <button 
                                      onClick={(e) => { e.stopPropagation(); moveAccount(index, 'down', type); }}
                                      disabled={index === group.length - 1}
                                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-white hover:shadow-sm rounded bg-transparent disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                 >
                                     <ArrowDown size={14} strokeWidth={2.5} />
                                 </button>
                             </div>

                             <button 
                                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(account); }}
                                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${account.isHidden ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-400 hover:text-black border border-gray-100'}`}
                             >
                                 {account.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                             </button>

                             <button 
                                  onClick={(e) => { e.stopPropagation(); onEditAccount(account); }}
                                  className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                              >
                                  <Pencil size={14} />
                              </button>
                              <button 
                                  onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if(window.confirm('Видалити цей рахунок та всі його транзакції?')) {
                                          onDeleteAccount(account.id);
                                      }
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                              >
                                  <Trash2 size={14} />
                              </button>
                         </div>
                      ) : (
                          /* Main Balance Display */
                          <div className="flex flex-col items-end">
                              <div className={`font-bold text-sm whitespace-nowrap ${balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                  {balance.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                  <span className="text-xs font-normal text-gray-400 ml-1">{account.currency}</span>
                              </div>
                              {account.currency !== Currency.UAH && (
                                   <div className="text-[10px] text-gray-400 font-medium">
                                       {balanceInUAH.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} UAH
                                   </div>
                              )}
                          </div>
                      )}
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32 pt-4 px-4 relative h-full overflow-y-auto no-scrollbar bg-gray-50">
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

      {renderAccountGroup('Поточні', AccountType.CURRENT, Wallet, 'bg-blue-500')}
      {renderAccountGroup('Заощадження', AccountType.SAVINGS, PiggyBank, 'bg-emerald-500')}
      {renderAccountGroup('Заборгованість', AccountType.DEBT, CreditCard, 'bg-red-500')}

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
