
import React, { useState } from 'react';
import { Account, AccountType, Currency, Transaction, TransactionType } from '../types';
import { Lock, LockOpen, Trash2, Pencil, Plus, Banknote } from 'lucide-react';
import { Button } from './ui/Button';
import { CategoryIcon } from './CategoryIcon';

interface AccountsTabProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({ 
  accounts, 
  transactions,
  onAddAccount,
  onEditAccount,
  onDeleteAccount
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
        const destRate = account.currentRate || 1; 
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
        const balance = getBalance(account);
        // Convert to UAH approximation for total display
        const balanceInUAH = balance * (account.currentRate || 1);
        return sum + balanceInUAH;
    }, 0);
  };

  const renderAccountGroup = (title: string, type: AccountType) => {
    const group = groupAccounts(type);
    
    // Don't show empty groups unless in edit mode, but if in edit mode, show even if empty so we see structure
    if (group.length === 0 && !isEditMode) return null;

    const totalInUAH = getGroupTotalInUAH(type);

    return (
      <div className="mb-6">
        <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
            <span className="text-sm font-bold text-gray-400">
                ≈ {totalInUAH.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
            </span>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {group.map(account => {
            const balance = getBalance(account);
            const balanceInUAH = account.currency !== Currency.UAH 
                ? balance * (account.currentRate || 1) 
                : null;

            return (
              <div key={account.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                 {/* Background decoration */}
                 <div 
                    className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10"
                    style={{ backgroundColor: account.color }}
                 />
                 
                 <div className="flex items-center justify-between relative z-10">
                   {/* Left Side: Icon & Name */}
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gray-50 text-gray-700 shadow-sm">
                          <CategoryIcon iconName={account.icon || 'wallet'} size={22} />
                      </div>
                      <h3 className="font-bold text-gray-800 text-base">{account.name}</h3>
                   </div>

                   {/* Right Side: Balances */}
                   <div className="flex items-center gap-3 text-right">
                        {/* Secondary Balance (UAH) - Left of main balance */}
                        {balanceInUAH !== null && (
                            <div className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                ≈ {balanceInUAH.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴
                            </div>
                        )}

                        {/* Main Balance */}
                        <div className={`text-lg font-bold tracking-tight whitespace-nowrap ${balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                            {balance.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            <span className="text-sm font-medium text-gray-500 ml-1">{account.currency}</span>
                        </div>
                   </div>
                 </div>

                 {/* Edit Overlay */}
                 {isEditMode && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center gap-4 animate-fade-in transition-all">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEditAccount(account); }}
                            className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 shadow-lg transform hover:scale-110 transition-all border border-blue-200"
                        >
                            <Pencil size={20} />
                        </button>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if(window.confirm('Видалити цей рахунок та всі його транзакції?')) {
                                    onDeleteAccount(account.id);
                                }
                            }}
                            className="w-12 h-12 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-lg transform hover:scale-110 transition-all border border-red-200"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                 )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 pt-4 px-4 relative min-h-full">
       {/* Header with Title and Edit Toggle */}
       <div className="flex items-center justify-between mb-2 px-1">
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
